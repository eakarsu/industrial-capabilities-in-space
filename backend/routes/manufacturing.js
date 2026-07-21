const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const { requireRole, canAccessBase } = require('../middleware/auth');
const { getRuntimeConfig } = require('../lib/runtime-config');
const {
  stableStringify, sha256, canTransition, validateCertificateUrl, validateTelemetryEvent, evaluateInspection,
} = require('../lib/workflow-rules');
const { appendManufacturingEvent, snapshotWorkOrder } = require('../lib/manufacturing-audit');

const RELEASE_ATTESTATION = 'I verified the part revision and process limits';
const INSPECTION_ATTESTATION = 'I inspected the produced article and verified the recorded measurements';
const APPROVAL_ATTESTATION = 'I approve this article for operational use';
const OVERRIDE_ATTESTATION = 'I accept the documented mission risk for this deviation';

class WorkflowError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function text(value, name, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new WorkflowError(422, 'INVALID_INPUT', `${name} must be ${min}-${max} characters`);
  }
  return value.trim();
}

function number(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new WorkflowError(422, 'INVALID_INPUT', `${name} must be between ${min} and ${max}`);
  }
  return parsed;
}

function integer(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new WorkflowError(422, 'INVALID_INPUT', `${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function assertBaseAccess(user, baseId) {
  if (!canAccessBase(user, baseId)) throw new WorkflowError(404, 'NOT_FOUND', 'Base or work order not found');
}

function workOrderInput(body) {
  const input = {
    baseId: integer(body.baseId, 'baseId', 1, 2147483647),
    workOrderCode: text(body.workOrderCode, 'workOrderCode', 3, 80).toUpperCase(),
    partNumber: text(body.partNumber, 'partNumber', 2, 100).toUpperCase(),
    revision: text(body.revision, 'revision', 1, 30).toUpperCase(),
    description: text(body.description, 'description', 10, 2000),
    requiredMaterialType: text(body.requiredMaterialType, 'requiredMaterialType', 2, 60).toLowerCase(),
    materialRequiredKg: number(body.materialRequiredKg, 'materialRequiredKg', 0.001, 100000),
    minPurityPct: number(body.minPurityPct, 'minPurityPct', 0, 100),
    expectedMassKg: number(body.expectedMassKg, 'expectedMassKg', 0.001, 100000),
    massTolerancePct: number(body.massTolerancePct, 'massTolerancePct', 0.01, 10),
    temperatureMinC: number(body.temperatureMinC, 'temperatureMinC', -200, 2000),
    temperatureMaxC: number(body.temperatureMaxC, 'temperatureMaxC', -200, 2000),
    maxVibrationMms: number(body.maxVibrationMms, 'maxVibrationMms', 0.001, 100),
  };
  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(input.workOrderCode) || !/^[A-Z0-9][A-Z0-9._-]*$/.test(input.partNumber)) {
    throw new WorkflowError(422, 'INVALID_INPUT', 'Work-order and part identifiers contain unsupported characters');
  }
  if (input.temperatureMinC >= input.temperatureMaxC) {
    throw new WorkflowError(422, 'INVALID_INPUT', 'temperatureMinC must be below temperatureMaxC');
  }
  if (input.expectedMassKg > input.materialRequiredKg) {
    throw new WorkflowError(422, 'INVALID_INPUT', 'expectedMassKg cannot exceed materialRequiredKg');
  }
  return input;
}

async function transaction(callback) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const value = await callback(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function lockedWorkOrder(client, id, user) {
  const result = await client.query('SELECT * FROM manufacturing_work_orders WHERE id=$1 FOR UPDATE', [id]);
  const workOrder = result.rows[0];
  if (!workOrder || !canAccessBase(user, workOrder.base_id)) throw new WorkflowError(404, 'NOT_FOUND', 'Work order not found');
  return workOrder;
}

function checkVersion(workOrder, expectedVersion) {
  if (!Number.isInteger(Number(expectedVersion)) || Number(expectedVersion) !== Number(workOrder.version)) {
    throw new WorkflowError(409, 'VERSION_CONFLICT', 'Work order changed; reload the current version');
  }
}

async function detail(client, id) {
  const workOrder = (await client.query(
    `SELECT wo.*, b.name AS base_name, u.name AS created_by_name
     FROM manufacturing_work_orders wo JOIN bases b ON b.id=wo.base_id JOIN users u ON u.id=wo.created_by
     WHERE wo.id=$1`, [id],
  )).rows[0];
  if (!workOrder) return null;
  const [allocations, telemetry, inspections, changes, events] = await Promise.all([
    client.query(`SELECT a.*, l.lot_code,l.material_type,l.purity_pct,l.source_system,l.source_record_id
      FROM work_order_material_allocations a JOIN material_lots l ON l.id=a.material_lot_id
      WHERE a.work_order_id=$1 ORDER BY a.id`, [id]),
    client.query('SELECT * FROM manufacturing_telemetry_events WHERE work_order_id=$1 ORDER BY captured_at,id', [id]),
    client.query('SELECT * FROM work_order_inspections WHERE work_order_id=$1 ORDER BY id', [id]),
    client.query('SELECT * FROM manufacturing_change_orders WHERE work_order_id=$1 ORDER BY id', [id]),
    client.query('SELECT * FROM manufacturing_events WHERE work_order_id=$1 ORDER BY id', [id]),
  ]);
  return { ...workOrder, allocations: allocations.rows, telemetry: telemetry.rows, inspections: inspections.rows, changeOrders: changes.rows, events: events.rows };
}

router.use(verifyToken);

router.get('/bases', async (req, res, next) => {
  try {
    const result = req.user.role === 'ADMIN'
      ? await db.query('SELECT id,name,location,status FROM bases ORDER BY name')
      : await db.query(`SELECT b.id,b.name,b.location,b.status FROM bases b
          JOIN user_base_access a ON a.base_id=b.id WHERE a.user_id=$1 ORDER BY b.name`, [req.user.id]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.get('/material-lots', async (req, res, next) => {
  try {
    const baseId = integer(req.query.baseId, 'baseId', 1, 2147483647);
    assertBaseAccess(req.user, baseId);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const cursor = Math.max(0, Number(req.query.cursor) || 0);
    const result = await db.query(
      `SELECT * FROM material_lots WHERE base_id=$1 AND ($2::bigint=0 OR id<$2) ORDER BY id DESC LIMIT $3`,
      [baseId, cursor, limit],
    );
    res.json({ items: result.rows, nextCursor: result.rows.length === limit ? result.rows[result.rows.length - 1].id : null });
  } catch (error) { next(error); }
});

router.post('/material-lots', requireRole('OPERATOR', 'QUALITY', 'ADMIN'), async (req, res, next) => {
  try {
    const config = getRuntimeConfig();
    const input = {
      baseId: integer(req.body.baseId, 'baseId', 1, 2147483647),
      lotCode: text(req.body.lotCode, 'lotCode', 3, 80).toUpperCase(),
      materialType: text(req.body.materialType, 'materialType', 2, 60).toLowerCase(),
      quantityKg: number(req.body.quantityKg, 'quantityKg', 0.001, 1000000),
      purityPct: number(req.body.purityPct, 'purityPct', 0, 100),
      storageLocation: text(req.body.storageLocation, 'storageLocation', 2, 120),
      sourceSystem: text(req.body.sourceSystem, 'sourceSystem', 2, 80),
      sourceRecordId: text(req.body.sourceRecordId, 'sourceRecordId', 2, 120),
      externalEventId: text(req.body.externalEventId, 'externalEventId', 8, 128),
      certificateUrl: text(req.body.certificateUrl, 'certificateUrl', 10, 2000),
      receivedAt: new Date(req.body.receivedAt),
    };
    assertBaseAccess(req.user, input.baseId);
    if (Number.isNaN(input.receivedAt.getTime()) || input.receivedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new WorkflowError(422, 'INVALID_INPUT', 'receivedAt must be a valid non-future timestamp');
    }
    const urlError = validateCertificateUrl(input.certificateUrl, config.certificateHosts);
    if (urlError) throw new WorkflowError(422, 'UNTRUSTED_PROVENANCE', urlError);
    const ingestHash = sha256(stableStringify({ ...input, receivedAt: input.receivedAt.toISOString() }));
    const result = await transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.externalEventId]);
      const existing = await client.query('SELECT * FROM material_lots WHERE external_event_id=$1', [input.externalEventId]);
      if (existing.rows[0]) {
        if (existing.rows[0].ingest_hash !== ingestHash) throw new WorkflowError(409, 'IDEMPOTENCY_CONFLICT', 'externalEventId was already used with different content');
        return { lot: existing.rows[0], idempotent: true };
      }
      const inserted = await client.query(
        `INSERT INTO material_lots
          (base_id,lot_code,material_type,quantity_received_kg,quantity_available_kg,purity_pct,storage_location,source_system,source_record_id,external_event_id,certificate_url,ingest_hash,received_at,created_by)
         VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [input.baseId, input.lotCode, input.materialType, input.quantityKg, input.purityPct, input.storageLocation,
          input.sourceSystem, input.sourceRecordId, input.externalEventId, input.certificateUrl, ingestHash, input.receivedAt, req.user.id],
      );
      await appendManufacturingEvent(client, {
        baseId: input.baseId, actorId: req.user.id, action: 'MATERIAL_LOT_INGESTED',
        payload: { lotId: inserted.rows[0].id, lotCode: input.lotCode, sourceSystem: input.sourceSystem, sourceRecordId: input.sourceRecordId, ingestHash },
      });
      return { lot: inserted.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) { next(error); }
});

router.post('/material-lots/:id/actions/:action', requireRole('QUALITY', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const action = req.params.action;
    const reason = text(req.body.reason, 'reason', 20, 5000);
    const result = await transaction(async (client) => {
      const lot = (await client.query('SELECT * FROM material_lots WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!lot || !canAccessBase(req.user, lot.base_id)) throw new WorkflowError(404, 'NOT_FOUND', 'Material lot not found');
      if (Number(req.body.expectedVersion) !== Number(lot.version)) throw new WorkflowError(409, 'VERSION_CONFLICT', 'Material lot changed; reload the current version');
      let status;
      if (action === 'quarantine' && lot.status === 'AVAILABLE') status = 'QUARANTINED';
      else if (action === 'release' && lot.status === 'QUARANTINED') {
        if (req.body.attestation !== 'I verified the lot disposition and supporting evidence') {
          throw new WorkflowError(422, 'ATTESTATION_REQUIRED', 'Exact lot-release attestation is required');
        }
        status = Number(lot.quantity_available_kg) === 0 ? 'DEPLETED' : 'AVAILABLE';
      } else if (action === 'reject' && lot.status === 'QUARANTINED') status = 'REJECTED';
      else throw new WorkflowError(409, 'INVALID_TRANSITION', `Cannot ${action} a ${lot.status} material lot`);
      const updated = (await client.query('UPDATE material_lots SET status=$1,version=version+1 WHERE id=$2 RETURNING *', [status, id])).rows[0];
      await appendManufacturingEvent(client, {
        baseId: lot.base_id, actorId: req.user.id, action: `MATERIAL_LOT_${action.toUpperCase()}`,
        payload: { lotId: lot.id, lotCode: lot.lot_code, fromStatus: lot.status, toStatus: status, reason, version: updated.version, attestation: req.body.attestation || null },
      });
      return updated;
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/work-orders', async (req, res, next) => {
  try {
    const baseId = integer(req.query.baseId, 'baseId', 1, 2147483647);
    assertBaseAccess(req.user, baseId);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const cursor = Math.max(0, Number(req.query.cursor) || 0);
    const result = await db.query(
      `SELECT wo.*, b.name AS base_name,
        COALESCE((SELECT SUM(a.reserved_kg) FROM work_order_material_allocations a WHERE a.work_order_id=wo.id AND a.disposition<>'RELEASED'),0) AS allocated_kg,
        (SELECT blockers FROM work_order_inspections i WHERE i.work_order_id=wo.id ORDER BY i.id DESC LIMIT 1) AS latest_blockers
       FROM manufacturing_work_orders wo JOIN bases b ON b.id=wo.base_id
       WHERE wo.base_id=$1 AND ($2::bigint=0 OR wo.id<$2) ORDER BY wo.id DESC LIMIT $3`,
      [baseId, cursor, limit],
    );
    res.json({ items: result.rows, nextCursor: result.rows.length === limit ? result.rows[result.rows.length - 1].id : null });
  } catch (error) { next(error); }
});

router.post('/work-orders', requireRole('OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = workOrderInput(req.body);
    assertBaseAccess(req.user, input.baseId);
    const created = await transaction(async (client) => {
      const base = await client.query('SELECT id FROM bases WHERE id=$1', [input.baseId]);
      if (!base.rows[0]) throw new WorkflowError(404, 'NOT_FOUND', 'Base not found');
      const result = await client.query(
        `INSERT INTO manufacturing_work_orders
          (base_id,work_order_code,part_number,revision,description,required_material_type,material_required_kg,min_purity_pct,expected_mass_kg,mass_tolerance_pct,temperature_min_c,temperature_max_c,max_vibration_mm_s,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [input.baseId, input.workOrderCode, input.partNumber, input.revision, input.description, input.requiredMaterialType,
          input.materialRequiredKg, input.minPurityPct, input.expectedMassKg, input.massTolerancePct,
          input.temperatureMinC, input.temperatureMaxC, input.maxVibrationMms, req.user.id],
      );
      await snapshotWorkOrder(client, result.rows[0], req.user.id, { source: 'operator-authored', inputHash: sha256(stableStringify(input)) });
      await appendManufacturingEvent(client, {
        baseId: input.baseId, workOrderId: result.rows[0].id, actorId: req.user.id, action: 'WORK_ORDER_CREATED', toStatus: 'DRAFT',
        payload: { version: 1, partNumber: input.partNumber, revision: input.revision },
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  } catch (error) { next(error); }
});

router.get('/work-orders/:id', async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const result = await detail(db, id);
    if (!result || !canAccessBase(req.user, result.base_id)) throw new WorkflowError(404, 'NOT_FOUND', 'Work order not found');
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/actions/:action', requireRole('OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const action = req.params.action;
    const actionConfig = {
      release: { from: 'DRAFT', to: 'RELEASED' }, reserve: { from: 'RELEASED', to: 'MATERIAL_RESERVED' },
      start: { from: 'MATERIAL_RESERVED', to: 'IN_PROGRESS' }, finish: { from: 'IN_PROGRESS', to: 'AWAITING_INSPECTION' },
      cancel: { from: null, to: 'CANCELLED' },
    }[action];
    if (!actionConfig) throw new WorkflowError(404, 'NOT_FOUND', 'Unknown work-order action');

    const updatedId = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      checkVersion(workOrder, req.body.expectedVersion);
      if (action === 'cancel') {
        if (!['DRAFT','RELEASED','MATERIAL_RESERVED'].includes(workOrder.status)) {
          throw new WorkflowError(409, 'INVALID_TRANSITION', `Cannot cancel from ${workOrder.status}`);
        }
      } else if (workOrder.status !== actionConfig.from || !canTransition(workOrder.status, actionConfig.to)) {
        throw new WorkflowError(409, 'INVALID_TRANSITION', `Cannot ${action} from ${workOrder.status}`);
      }
      if (['release','cancel'].includes(action)) {
        const pendingChange = await client.query("SELECT id FROM manufacturing_change_orders WHERE work_order_id=$1 AND status='PENDING'", [id]);
        if (pendingChange.rows[0]) throw new WorkflowError(409, 'PENDING_CHANGE_ORDER', 'Decide the pending change order before transitioning this work order');
      }
      if (action === 'release' && req.body.attestation !== RELEASE_ATTESTATION) {
        throw new WorkflowError(422, 'ATTESTATION_REQUIRED', 'Exact release attestation is required');
      }
      if (action === 'reserve') {
        if (!Array.isArray(req.body.allocations) || !req.body.allocations.length || req.body.allocations.length > 20) {
          throw new WorkflowError(422, 'INVALID_INPUT', 'allocations must contain 1-20 material lots');
        }
        const normalized = req.body.allocations.map((allocation) => ({
          lotId: integer(allocation.lotId, 'lotId', 1, Number.MAX_SAFE_INTEGER),
          quantityKg: number(allocation.quantityKg, 'quantityKg', 0.001, 1000000),
        }));
        if (new Set(normalized.map((item) => item.lotId)).size !== normalized.length) {
          throw new WorkflowError(422, 'INVALID_INPUT', 'Each material lot may appear once');
        }
        const total = normalized.reduce((sum, item) => sum + item.quantityKg, 0);
        if (Math.abs(total - Number(workOrder.material_required_kg)) > 0.001) {
          throw new WorkflowError(422, 'MATERIAL_CONSTRAINT', `Allocations must total exactly ${workOrder.material_required_kg} kg`);
        }
        const lots = await client.query('SELECT * FROM material_lots WHERE id=ANY($1::bigint[]) ORDER BY id FOR UPDATE', [normalized.map((item) => item.lotId)]);
        if (lots.rows.length !== normalized.length) throw new WorkflowError(422, 'MATERIAL_CONSTRAINT', 'One or more material lots do not exist');
        for (const allocation of normalized) {
          const lot = lots.rows.find((item) => Number(item.id) === allocation.lotId);
          if (Number(lot.base_id) !== Number(workOrder.base_id) || lot.material_type !== workOrder.required_material_type
            || !['AVAILABLE','DEPLETED'].includes(lot.status) || Number(lot.purity_pct) < Number(workOrder.min_purity_pct)
            || Number(lot.quantity_available_kg) < allocation.quantityKg) {
            throw new WorkflowError(422, 'MATERIAL_CONSTRAINT', `Lot ${lot.lot_code} does not satisfy base, type, purity, status, or available-quantity constraints`);
          }
          await client.query(
            `UPDATE material_lots SET quantity_available_kg=quantity_available_kg-$1,version=version+1,
             status=CASE WHEN quantity_available_kg-$1=0 THEN 'DEPLETED' ELSE 'AVAILABLE' END WHERE id=$2`,
            [allocation.quantityKg, lot.id],
          );
          await client.query(
            `INSERT INTO work_order_material_allocations(work_order_id,material_lot_id,reserved_kg,reserved_by)
             VALUES($1,$2,$3,$4)`, [workOrder.id, lot.id, allocation.quantityKg, req.user.id],
          );
        }
      }
      if (action === 'start') {
        const count = await client.query("SELECT COUNT(*)::int AS count FROM work_order_material_allocations WHERE work_order_id=$1 AND disposition='RESERVED'", [id]);
        if (!count.rows[0].count) throw new WorkflowError(409, 'MATERIAL_CONSTRAINT', 'Material reservation evidence is missing');
      }
      if (action === 'finish') {
        const telemetry = await client.query('SELECT DISTINCT metric FROM manufacturing_telemetry_events WHERE work_order_id=$1', [id]);
        const metrics = new Set(telemetry.rows.map((row) => row.metric));
        const missing = ['extruder_temperature_c','vibration_mm_s','produced_mass_kg'].filter((metric) => !metrics.has(metric));
        if (missing.length) throw new WorkflowError(422, 'TELEMETRY_REQUIRED', 'Required telemetry is missing', { missing });
        await client.query("UPDATE work_order_material_allocations SET consumed_kg=reserved_kg,disposition='CONSUMED' WHERE work_order_id=$1 AND disposition='RESERVED'", [id]);
      }
      if (action === 'cancel' && workOrder.status === 'MATERIAL_RESERVED') {
        const allocations = await client.query("SELECT * FROM work_order_material_allocations WHERE work_order_id=$1 AND disposition='RESERVED' FOR UPDATE", [id]);
        for (const allocation of allocations.rows) {
          await client.query("UPDATE material_lots SET quantity_available_kg=quantity_available_kg+$1,status='AVAILABLE',version=version+1 WHERE id=$2", [allocation.reserved_kg, allocation.material_lot_id]);
        }
        await client.query("UPDATE work_order_material_allocations SET disposition='RELEASED' WHERE work_order_id=$1 AND disposition='RESERVED'", [id]);
      }
      const fromStatus = workOrder.status;
      const toStatus = actionConfig.to;
      const dates = action === 'start' ? ',started_at=NOW()' : action === 'finish' ? ',completed_at=NOW()' : '';
      const result = await client.query(
        `UPDATE manufacturing_work_orders SET status=$1,version=version+1${dates} WHERE id=$2 RETURNING *`,
        [toStatus, id],
      );
      await snapshotWorkOrder(client, result.rows[0], req.user.id, { source: 'state-transition', action, attestation: req.body.attestation || null });
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: `WORK_ORDER_${action.toUpperCase()}`,
        fromStatus, toStatus, payload: { version: result.rows[0].version },
      });
      return id;
    });
    res.json(await detail(db, updatedId));
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/telemetry', requireRole('OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    if (!Array.isArray(req.body.events) || !req.body.events.length || req.body.events.length > 100) {
      throw new WorkflowError(422, 'INVALID_INPUT', 'events must contain 1-100 telemetry readings');
    }
    const result = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      if (!['IN_PROGRESS','AWAITING_INSPECTION'].includes(workOrder.status)) {
        throw new WorkflowError(409, 'INVALID_TRANSITION', 'Telemetry is accepted only during printing or before inspection submission');
      }
      const inserted = [];
      const duplicates = [];
      for (const raw of req.body.events) {
        const event = {
          externalEventId: text(raw.externalEventId, 'externalEventId', 8, 128),
          sourceSystem: text(raw.sourceSystem, 'sourceSystem', 2, 80),
          metric: text(raw.metric, 'metric', 2, 60), value: raw.value, unit: text(raw.unit, 'unit', 1, 20),
          capturedAt: new Date(raw.capturedAt),
        };
        const validation = validateTelemetryEvent(event);
        if (validation) throw new WorkflowError(422, 'TELEMETRY_INVALID', validation);
        const payloadHash = sha256(stableStringify({ workOrderId: id, ...event, capturedAt: event.capturedAt.toISOString(), value: Number(event.value) }));
        const existing = await client.query('SELECT * FROM manufacturing_telemetry_events WHERE external_event_id=$1', [event.externalEventId]);
        if (existing.rows[0]) {
          if (existing.rows[0].payload_hash !== payloadHash) throw new WorkflowError(409, 'IDEMPOTENCY_CONFLICT', `Telemetry event ${event.externalEventId} has conflicting content`);
          duplicates.push(existing.rows[0].id);
          continue;
        }
        const created = await client.query(
          `INSERT INTO manufacturing_telemetry_events
            (work_order_id,external_event_id,source_system,metric,numeric_value,unit,captured_at,is_late,payload_hash,recorded_by)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [id, event.externalEventId, event.sourceSystem, event.metric, Number(event.value), event.unit, event.capturedAt,
            workOrder.status === 'AWAITING_INSPECTION', payloadHash, req.user.id],
        );
        inserted.push(created.rows[0]);
      }
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: 'TELEMETRY_INGESTED',
        fromStatus: workOrder.status, toStatus: workOrder.status,
        payload: { insertedEventIds: inserted.map((item) => item.id), duplicateEventIds: duplicates, lateCount: inserted.filter((item) => item.is_late).length },
      });
      return { inserted, duplicates };
    });
    res.status(result.inserted.length ? 201 : 200).json(result);
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/inspection', requireRole('QUALITY', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const config = getRuntimeConfig();
    const inspection = {
      qualityScore: integer(req.body.qualityScore, 'qualityScore', 0, 100),
      measuredMassKg: number(req.body.measuredMassKg, 'measuredMassKg', 0.001, 100000),
      dimensionalVariancePct: number(req.body.dimensionalVariancePct, 'dimensionalVariancePct', 0, 100),
      defectCount: integer(req.body.defectCount, 'defectCount', 0, 100000),
      findings: text(req.body.findings, 'findings', 20, 5000),
      evidenceUrl: text(req.body.evidenceUrl, 'evidenceUrl', 10, 2000),
    };
    if (req.body.attestation !== INSPECTION_ATTESTATION) throw new WorkflowError(422, 'ATTESTATION_REQUIRED', 'Exact inspection attestation is required');
    const urlError = validateCertificateUrl(inspection.evidenceUrl, config.certificateHosts);
    if (urlError) throw new WorkflowError(422, 'UNTRUSTED_PROVENANCE', urlError.replace('certificateUrl', 'evidenceUrl'));
    const result = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      checkVersion(workOrder, req.body.expectedVersion);
      if (workOrder.status !== 'AWAITING_INSPECTION') throw new WorkflowError(409, 'INVALID_TRANSITION', `Cannot inspect from ${workOrder.status}`);
      if (Number(workOrder.created_by) === Number(req.user.id)) throw new WorkflowError(409, 'SEPARATION_OF_DUTIES', 'The work-order author cannot submit its inspection');
      const allocations = await client.query(`SELECT a.*,l.lot_code,l.purity_pct FROM work_order_material_allocations a
        JOIN material_lots l ON l.id=a.material_lot_id WHERE a.work_order_id=$1`, [id]);
      const telemetry = await client.query('SELECT * FROM manufacturing_telemetry_events WHERE work_order_id=$1 ORDER BY captured_at,id', [id]);
      const evaluation = evaluateInspection({ workOrder, allocations: allocations.rows, telemetry: telemetry.rows, inspection });
      const record = await client.query(
        `INSERT INTO work_order_inspections
          (work_order_id,work_order_version,quality_score,measured_mass_kg,dimensional_variance_pct,defect_count,findings,evidence_url,rules,blockers,submitted_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) RETURNING *`,
        [id, workOrder.version, inspection.qualityScore, inspection.measuredMassKg, inspection.dimensionalVariancePct,
          inspection.defectCount, inspection.findings, inspection.evidenceUrl, JSON.stringify(evaluation.rules), evaluation.blockers, req.user.id],
      );
      const updated = (await client.query("UPDATE manufacturing_work_orders SET status='AWAITING_APPROVAL',version=version+1 WHERE id=$1 RETURNING *", [id])).rows[0];
      await snapshotWorkOrder(client, updated, req.user.id, { source: 'quality-inspection', inspectionId: record.rows[0].id, attestation: INSPECTION_ATTESTATION });
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: 'INSPECTION_SUBMITTED',
        fromStatus: workOrder.status, toStatus: updated.status,
        payload: { inspectionId: record.rows[0].id, blockers: evaluation.blockers, rulesHash: sha256(stableStringify(evaluation.rules)), version: updated.version },
      });
      return { inspection: record.rows[0], workOrder: updated };
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/inspection/decision', requireRole('APPROVER', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const decision = text(req.body.decision, 'decision', 6, 8).toUpperCase();
    if (!['APPROVE','REJECT','OVERRIDE'].includes(decision)) throw new WorkflowError(422, 'INVALID_INPUT', 'decision must be APPROVE, REJECT, or OVERRIDE');
    const result = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      checkVersion(workOrder, req.body.expectedVersion);
      if (workOrder.status !== 'AWAITING_APPROVAL') throw new WorkflowError(409, 'INVALID_TRANSITION', `Cannot decide inspection from ${workOrder.status}`);
      const inspection = (await client.query('SELECT * FROM work_order_inspections WHERE work_order_id=$1 AND decided_at IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE', [id])).rows[0];
      if (!inspection) throw new WorkflowError(409, 'INSPECTION_REQUIRED', 'Pending inspection not found');
      if (Number(inspection.submitted_by) === Number(req.user.id) || Number(workOrder.created_by) === Number(req.user.id)) {
        throw new WorkflowError(409, 'SEPARATION_OF_DUTIES', 'The work-order author and inspector cannot approve the inspection');
      }
      const blockers = inspection.blockers || [];
      let reason = null;
      if (decision === 'APPROVE') {
        if (blockers.length) throw new WorkflowError(422, 'RULE_BLOCKERS', 'Failed deterministic rules require rejection or an explicit override', { blockers });
        if (req.body.attestation !== APPROVAL_ATTESTATION) throw new WorkflowError(422, 'ATTESTATION_REQUIRED', 'Exact approval attestation is required');
      } else if (decision === 'OVERRIDE') {
        if (!blockers.length) throw new WorkflowError(422, 'INVALID_OVERRIDE', 'An override is only valid when deterministic blockers exist');
        if (req.body.attestation !== OVERRIDE_ATTESTATION) throw new WorkflowError(422, 'ATTESTATION_REQUIRED', 'Exact risk-acceptance attestation is required');
        reason = text(req.body.reason, 'reason', 40, 5000);
      } else {
        reason = text(req.body.reason, 'reason', 20, 5000);
      }
      const toStatus = decision === 'REJECT' ? 'REJECTED' : 'APPROVED';
      await client.query(
        'UPDATE work_order_inspections SET decision=$1,decision_reason=$2,decided_by=$3,decided_at=NOW() WHERE id=$4',
        [decision, reason, req.user.id, inspection.id],
      );
      const updated = (await client.query(
        'UPDATE manufacturing_work_orders SET status=$1,version=version+1,approved_by=$2,approved_at=$3 WHERE id=$4 RETURNING *',
        [toStatus, decision === 'REJECT' ? null : req.user.id, decision === 'REJECT' ? null : new Date(), id],
      )).rows[0];
      await snapshotWorkOrder(client, updated, req.user.id, { source: 'inspection-decision', inspectionId: inspection.id, decision, reason, attestation: req.body.attestation || null });
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: `INSPECTION_${decision}`,
        fromStatus: workOrder.status, toStatus,
        payload: { inspectionId: inspection.id, blockers, reason, attestation: req.body.attestation || null, version: updated.version },
      });
      return { workOrder: updated, decision, blockers };
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/change-orders', requireRole('OPERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const reason = text(req.body.reason, 'reason', 20, 5000);
    const impact = text(req.body.impactAssessment, 'impactAssessment', 30, 5000);
    const allowed = ['revision','description','requiredMaterialType','materialRequiredKg','minPurityPct','expectedMassKg','massTolerancePct','temperatureMinC','temperatureMaxC','maxVibrationMms'];
    if (!req.body.patch || typeof req.body.patch !== 'object' || Array.isArray(req.body.patch) || !Object.keys(req.body.patch).length
      || Object.keys(req.body.patch).some((key) => !allowed.includes(key))) {
      throw new WorkflowError(422, 'INVALID_INPUT', `patch may contain only: ${allowed.join(', ')}`);
    }
    const created = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      checkVersion(workOrder, req.body.expectedVersion);
      if (!['DRAFT','RELEASED','REJECTED'].includes(workOrder.status)) throw new WorkflowError(409, 'INVALID_TRANSITION', `Change orders are not accepted from ${workOrder.status}`);
      const current = {
        baseId: workOrder.base_id, workOrderCode: workOrder.work_order_code, partNumber: workOrder.part_number,
        revision: workOrder.revision, description: workOrder.description, requiredMaterialType: workOrder.required_material_type,
        materialRequiredKg: workOrder.material_required_kg, minPurityPct: workOrder.min_purity_pct,
        expectedMassKg: workOrder.expected_mass_kg, massTolerancePct: workOrder.mass_tolerance_pct,
        temperatureMinC: workOrder.temperature_min_c, temperatureMaxC: workOrder.temperature_max_c,
        maxVibrationMms: workOrder.max_vibration_mm_s,
      };
      const normalized = workOrderInput({ ...current, ...req.body.patch });
      const patch = Object.fromEntries(Object.keys(req.body.patch).map((key) => [key, normalized[key]]));
      const result = await client.query(
        `INSERT INTO manufacturing_change_orders(work_order_id,base_version,reason,impact_assessment,requested_patch,requested_by)
         VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id, workOrder.version, reason, impact, patch, req.user.id],
      );
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: 'CHANGE_ORDER_REQUESTED',
        fromStatus: workOrder.status, toStatus: workOrder.status,
        payload: { changeOrderId: result.rows[0].id, baseVersion: workOrder.version, patch, reason, impactAssessment: impact },
      });
      return result.rows[0];
    });
    res.status(201).json(created);
  } catch (error) { next(error); }
});

router.post('/work-orders/:id/change-orders/:changeId/decision', requireRole('APPROVER', 'ADMIN'), async (req, res, next) => {
  try {
    const id = integer(req.params.id, 'id', 1, Number.MAX_SAFE_INTEGER);
    const changeId = integer(req.params.changeId, 'changeId', 1, Number.MAX_SAFE_INTEGER);
    const decision = text(req.body.decision, 'decision', 6, 7).toUpperCase();
    if (!['APPROVE','REJECT'].includes(decision)) throw new WorkflowError(422, 'INVALID_INPUT', 'decision must be APPROVE or REJECT');
    const reason = decision === 'REJECT' ? text(req.body.reason, 'reason', 20, 5000) : text(req.body.reason, 'reason', 10, 5000);
    const result = await transaction(async (client) => {
      const workOrder = await lockedWorkOrder(client, id, req.user);
      checkVersion(workOrder, req.body.expectedVersion);
      const change = (await client.query('SELECT * FROM manufacturing_change_orders WHERE id=$1 AND work_order_id=$2 FOR UPDATE', [changeId, id])).rows[0];
      if (!change || change.status !== 'PENDING') throw new WorkflowError(404, 'NOT_FOUND', 'Pending change order not found');
      if (Number(change.requested_by) === Number(req.user.id)) throw new WorkflowError(409, 'SEPARATION_OF_DUTIES', 'The requester cannot decide their own change order');
      if (Number(change.base_version) !== Number(workOrder.version)) throw new WorkflowError(409, 'VERSION_CONFLICT', 'Change order is based on a stale work-order version');
      let updated = workOrder;
      if (decision === 'APPROVE') {
        const patch = change.requested_patch;
        const columns = {
          revision: 'revision', description: 'description', requiredMaterialType: 'required_material_type', materialRequiredKg: 'material_required_kg',
          minPurityPct: 'min_purity_pct', expectedMassKg: 'expected_mass_kg', massTolerancePct: 'mass_tolerance_pct',
          temperatureMinC: 'temperature_min_c', temperatureMaxC: 'temperature_max_c', maxVibrationMms: 'max_vibration_mm_s',
        };
        const entries = Object.entries(patch);
        const assignments = entries.map(([key], index) => `${columns[key]}=$${index + 1}`);
        const values = entries.map(([, value]) => value);
        values.push(id);
        updated = (await client.query(
          `UPDATE manufacturing_work_orders SET ${assignments.join(',')},status='DRAFT',version=version+1,approved_by=NULL,approved_at=NULL WHERE id=$${values.length} RETURNING *`, values,
        )).rows[0];
        await snapshotWorkOrder(client, updated, req.user.id, { source: 'approved-change-order', changeOrderId: change.id, patch, reason });
      }
      await client.query('UPDATE manufacturing_change_orders SET status=$1,decision_reason=$2,decided_by=$3,decided_at=NOW() WHERE id=$4', [decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reason, req.user.id, change.id]);
      await appendManufacturingEvent(client, {
        baseId: workOrder.base_id, workOrderId: id, actorId: req.user.id, action: `CHANGE_ORDER_${decision}`,
        fromStatus: workOrder.status, toStatus: updated.status,
        payload: { changeOrderId: change.id, patch: change.requested_patch, reason, version: updated.version },
      });
      return { changeOrderId: change.id, decision, workOrder: updated };
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/audit', async (req, res, next) => {
  try {
    const baseId = integer(req.query.baseId, 'baseId', 1, 2147483647);
    assertBaseAccess(req.user, baseId);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const after = Math.max(0, Number(req.query.after) || 0);
    const result = await db.query('SELECT * FROM manufacturing_events WHERE base_id=$1 AND id>$2 ORDER BY id LIMIT $3', [baseId, after, limit]);
    res.json({ items: result.rows, nextAfter: result.rows.length === limit ? result.rows[result.rows.length - 1].id : null });
  } catch (error) { next(error); }
});

router.use((error, req, res, _next) => {
  if (error instanceof WorkflowError) return res.status(error.status).json({ error: error.message, code: error.code, details: error.details });
  if (error.code === '23505') return res.status(409).json({ error: 'Record conflicts with an existing identifier', code: 'CONFLICT' });
  if (error.code === '23514' || error.code === '22P02') return res.status(422).json({ error: 'Input violates a stored data constraint', code: 'CONSTRAINT' });
  console.error('Manufacturing workflow error', error);
  return res.status(500).json({ error: 'Manufacturing workflow service unavailable', code: 'INTERNAL' });
});

module.exports = router;
