const { sha256, stableStringify } = require('./workflow-rules');

async function appendManufacturingEvent(client, event) {
  await client.query('SELECT pg_advisory_xact_lock($1)', [Number(event.baseId)]);
  const prior = await client.query(
    'SELECT event_hash FROM manufacturing_events WHERE base_id=$1 ORDER BY id DESC LIMIT 1',
    [event.baseId],
  );
  const previousHash = prior.rows[0]?.event_hash || null;
  const createdAt = new Date();
  const content = {
    baseId: Number(event.baseId),
    workOrderId: event.workOrderId == null ? null : Number(event.workOrderId),
    actorId: event.actorId == null ? null : Number(event.actorId),
    action: event.action,
    fromStatus: event.fromStatus || null,
    toStatus: event.toStatus || null,
    payload: event.payload || {},
    createdAt: createdAt.toISOString(),
  };
  const eventHash = sha256(`${previousHash || ''}:${stableStringify(content)}`);
  const result = await client.query(
    `INSERT INTO manufacturing_events
      (base_id, work_order_id, actor_id, action, from_status, to_status, payload, previous_hash, event_hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) RETURNING *`,
    [event.baseId, event.workOrderId || null, event.actorId || null, event.action, event.fromStatus || null,
      event.toStatus || null, JSON.stringify(event.payload || {}), previousHash, eventHash, createdAt],
  );
  return result.rows[0];
}

async function snapshotWorkOrder(client, workOrder, actorId, provenance) {
  const snapshot = await client.query(
    `SELECT jsonb_build_object(
      'workOrder', to_jsonb(wo),
      'allocations', COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM work_order_material_allocations a WHERE a.work_order_id=wo.id), '[]'::jsonb),
      'inspection', (SELECT to_jsonb(i) FROM work_order_inspections i WHERE i.work_order_id=wo.id ORDER BY i.id DESC LIMIT 1)
    ) AS value FROM manufacturing_work_orders wo WHERE wo.id=$1`,
    [workOrder.id],
  );
  await client.query(
    `INSERT INTO manufacturing_work_order_versions (work_order_id, version, snapshot, provenance, created_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [workOrder.id, workOrder.version, snapshot.rows[0].value, provenance || {}, actorId],
  );
}

module.exports = { appendManufacturingEvent, snapshotWorkOrder };
