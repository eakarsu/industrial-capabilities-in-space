const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET ||= require('crypto').randomBytes(32).toString('hex');
process.env.CORS_ALLOWED_ORIGINS ||= 'http://localhost:5174';
process.env.CERTIFICATE_ALLOWED_HOSTS ||= 'certs.example.test';

const db = require('../db');
const { createApp } = require('../server');
const { verifyEventChain } = require('../lib/workflow-rules');

let server;
let origin;
let operator;
let quality;
let approver;
let baseId;
let otherBaseId;
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  return { status: response.status, body: payload };
}

async function provision(role, accessibleBaseId) {
  const email = `${role.toLowerCase()}-${suffix}@example.test`;
  const password = `Valid-password-${suffix}`;
  const hash = await bcrypt.hash(password, 4);
  const user = (await db.query(
    'INSERT INTO users(email,password,name,role,is_active) VALUES($1,$2,$3,$4,TRUE) RETURNING id',
    [email, hash, `${role} Test`, role],
  )).rows[0];
  await db.query('INSERT INTO user_base_access(user_id,base_id) VALUES($1,$2)', [user.id, accessibleBaseId]);
  const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  return { id: user.id, token: login.body.token };
}

test.before(async () => {
  const bases = await db.query('SELECT id FROM bases ORDER BY id LIMIT 2');
  assert.equal(bases.rows.length, 2, 'integration database must include baseline base records');
  baseId = Number(bases.rows[0].id); otherBaseId = Number(bases.rows[1].id);
  server = createApp().listen(Number(process.env.TEST_API_PORT || 0), '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  operator = await provision('OPERATOR', baseId);
  quality = await provision('QUALITY', baseId);
  approver = await provision('APPROVER', baseId);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
});

test('authorized material-to-approval journey is traceable and immutable', async () => {
  const material = {
    baseId, lotCode: `LOT-${suffix}`, materialType: 'regolith', quantityKg: 100, purityPct: 96,
    storageLocation: 'Bay A', sourceSystem: 'certified-lab', sourceRecordId: `CERT-${suffix}`,
    externalEventId: `lot-event-${suffix}`, certificateUrl: `https://certs.example.test/lots/${suffix}`,
    receivedAt: new Date().toISOString(),
  };
  const createdLot = await request('/api/workflow/material-lots', { token: operator.token, method: 'POST', body: material });
  assert.equal(createdLot.status, 201);
  const duplicateLot = await request('/api/workflow/material-lots', { token: operator.token, method: 'POST', body: material });
  assert.equal(duplicateLot.status, 200);
  assert.equal(duplicateLot.body.idempotent, true);
  const conflictLot = await request('/api/workflow/material-lots', { token: operator.token, method: 'POST', body: { ...material, quantityKg: 101 } });
  assert.equal(conflictLot.status, 409);

  const inaccessible = await request(`/api/workflow/material-lots?baseId=${otherBaseId}`, { token: operator.token });
  assert.equal(inaccessible.status, 404);
  const createdOrder = await request('/api/workflow/work-orders', { token: operator.token, method: 'POST', body: {
    baseId, workOrderCode: `WO-${suffix}`, partNumber: `PART-${suffix}`, revision: 'A', description: 'Pressure-rated regolith test panel',
    requiredMaterialType: 'regolith', materialRequiredKg: 40, minPurityPct: 95, expectedMassKg: 38,
    massTolerancePct: 5, temperatureMinC: 100, temperatureMaxC: 300, maxVibrationMms: 8,
  } });
  assert.equal(createdOrder.status, 201);
  const id = Number(createdOrder.body.id);

  let response = await request(`/api/workflow/work-orders/${id}/actions/release`, { token: operator.token, method: 'POST', body: { expectedVersion: 1, attestation: 'wrong' } });
  assert.equal(response.status, 422);
  response = await request(`/api/workflow/work-orders/${id}/actions/release`, { token: operator.token, method: 'POST', body: { expectedVersion: 1, attestation: 'I verified the part revision and process limits' } });
  assert.equal(response.status, 200); assert.equal(response.body.version, 2);

  response = await request(`/api/workflow/work-orders/${id}/actions/reserve`, { token: operator.token, method: 'POST', body: { expectedVersion: 2, allocations: [{ lotId: createdLot.body.lot.id, quantityKg: 90 }] } });
  assert.equal(response.status, 422);
  const lotAfterFailure = await db.query('SELECT quantity_available_kg FROM material_lots WHERE id=$1', [createdLot.body.lot.id]);
  assert.equal(Number(lotAfterFailure.rows[0].quantity_available_kg), 100);
  response = await request(`/api/workflow/work-orders/${id}/actions/reserve`, { token: operator.token, method: 'POST', body: { expectedVersion: 2, allocations: [{ lotId: createdLot.body.lot.id, quantityKg: 40 }] } });
  assert.equal(response.status, 200); assert.equal(response.body.status, 'MATERIAL_RESERVED');
  response = await request(`/api/workflow/work-orders/${id}/actions/start`, { token: operator.token, method: 'POST', body: { expectedVersion: 3 } });
  assert.equal(response.status, 200); assert.equal(response.body.status, 'IN_PROGRESS');

  const capturedAt = new Date().toISOString();
  const invalidTelemetry = await request(`/api/workflow/work-orders/${id}/telemetry`, { token: operator.token, method: 'POST', body: { events: [{ externalEventId: `bad-unit-${suffix}`, sourceSystem: 'printer-1', metric: 'vibration_mm_s', value: 3, unit: 'in/s', capturedAt }] } });
  assert.equal(invalidTelemetry.status, 422);
  const events = [
    { externalEventId: `temp-${suffix}`, sourceSystem: 'printer-1', metric: 'extruder_temperature_c', value: 200, unit: 'C', capturedAt },
    { externalEventId: `vib-${suffix}`, sourceSystem: 'printer-1', metric: 'vibration_mm_s', value: 3, unit: 'mm/s', capturedAt },
    { externalEventId: `mass-${suffix}`, sourceSystem: 'printer-1', metric: 'produced_mass_kg', value: 38, unit: 'kg', capturedAt },
  ];
  response = await request(`/api/workflow/work-orders/${id}/telemetry`, { token: operator.token, method: 'POST', body: { events } });
  assert.equal(response.status, 201); assert.equal(response.body.inserted.length, 3);
  response = await request(`/api/workflow/work-orders/${id}/telemetry`, { token: operator.token, method: 'POST', body: { events } });
  assert.equal(response.status, 200); assert.equal(response.body.duplicates.length, 3);
  response = await request(`/api/workflow/work-orders/${id}/actions/finish`, { token: operator.token, method: 'POST', body: { expectedVersion: 4 } });
  assert.equal(response.status, 200); assert.equal(response.body.status, 'AWAITING_INSPECTION');

  const late = await request(`/api/workflow/work-orders/${id}/telemetry`, { token: operator.token, method: 'POST', body: { events: [{ externalEventId: `late-${suffix}`, sourceSystem: 'delayed-printer-buffer', metric: 'layer_height_mm', value: 2, unit: 'mm', capturedAt: new Date(Date.now() - 60000).toISOString() }] } });
  assert.equal(late.status, 201); assert.equal(late.body.inserted[0].is_late, true);
  const forbiddenInspection = await request(`/api/workflow/work-orders/${id}/inspection`, { token: operator.token, method: 'POST', body: {} });
  assert.equal(forbiddenInspection.status, 403);
  response = await request(`/api/workflow/work-orders/${id}/inspection`, { token: quality.token, method: 'POST', body: {
    expectedVersion: 5, qualityScore: 96, measuredMassKg: 38, dimensionalVariancePct: 1, defectCount: 0,
    findings: 'Independent dimensional and surface inspection passed.', evidenceUrl: `https://certs.example.test/inspections/${suffix}`,
    attestation: 'I inspected the produced article and verified the recorded measurements',
  } });
  assert.equal(response.status, 201); assert.deepEqual(response.body.inspection.blockers, []);
  const selfDecision = await request(`/api/workflow/work-orders/${id}/inspection/decision`, { token: quality.token, method: 'POST', body: { expectedVersion: 6, decision: 'APPROVE', attestation: 'I approve this article for operational use' } });
  assert.equal(selfDecision.status, 403);
  response = await request(`/api/workflow/work-orders/${id}/inspection/decision`, { token: approver.token, method: 'POST', body: { expectedVersion: 6, decision: 'APPROVE', attestation: 'I approve this article for operational use' } });
  assert.equal(response.status, 200); assert.equal(response.body.workOrder.status, 'APPROVED');

  const audit = (await db.query('SELECT * FROM manufacturing_events WHERE base_id=$1 ORDER BY id', [baseId])).rows;
  assert.equal(verifyEventChain(audit), true);
  await assert.rejects(() => db.query("UPDATE manufacturing_events SET action='TAMPERED' WHERE id=$1", [audit[0].id]), /append-only/);
  const version = (await db.query('SELECT id FROM manufacturing_work_order_versions WHERE work_order_id=$1 ORDER BY id LIMIT 1', [id])).rows[0];
  await assert.rejects(() => db.query('DELETE FROM manufacturing_work_order_versions WHERE id=$1', [version.id]), /append-only/);
  const telemetry = (await db.query('SELECT id FROM manufacturing_telemetry_events WHERE work_order_id=$1 ORDER BY id LIMIT 1', [id])).rows[0];
  await assert.rejects(() => db.query('UPDATE manufacturing_telemetry_events SET numeric_value=999 WHERE id=$1', [telemetry.id]), /append-only/);
  await assert.rejects(() => db.query('DELETE FROM material_lots WHERE id=$1', [createdLot.body.lot.id]), /material lots are retained/);
  await assert.rejects(() => db.query('DELETE FROM manufacturing_work_orders WHERE id=$1', [id]), /retention or legal hold/);
});

test('deterministic blockers require documented override and change orders support replanning', async () => {
  const lot = await request('/api/workflow/material-lots', { token: operator.token, method: 'POST', body: {
    baseId, lotCode: `LOT-B-${suffix}`, materialType: 'regolith', quantityKg: 20, purityPct: 97,
    storageLocation: 'Bay B', sourceSystem: 'certified-lab', sourceRecordId: `CERT-B-${suffix}`,
    externalEventId: `lot-event-b-${suffix}`, certificateUrl: `https://certs.example.test/lots/b-${suffix}`, receivedAt: new Date().toISOString(),
  } });
  const order = await request('/api/workflow/work-orders', { token: operator.token, method: 'POST', body: {
    baseId, workOrderCode: `WO-B-${suffix}`, partNumber: `PART-B-${suffix}`, revision: 'A', description: 'Thermal deviation validation article',
    requiredMaterialType: 'regolith', materialRequiredKg: 10, minPurityPct: 95, expectedMassKg: 9.5,
    massTolerancePct: 5, temperatureMinC: 100, temperatureMaxC: 300, maxVibrationMms: 8,
  } });
  const id = Number(order.body.id);
  await request(`/api/workflow/work-orders/${id}/actions/release`, { token: operator.token, method: 'POST', body: { expectedVersion: 1, attestation: 'I verified the part revision and process limits' } });
  let lotDecision = await request(`/api/workflow/material-lots/${lot.body.lot.id}/actions/quarantine`, { token: quality.token, method: 'POST', body: { expectedVersion: 1, reason: 'Supplier telemetry checksum requires independent review.' } });
  assert.equal(lotDecision.status, 200); assert.equal(lotDecision.body.status, 'QUARANTINED');
  const blockedReservation = await request(`/api/workflow/work-orders/${id}/actions/reserve`, { token: operator.token, method: 'POST', body: { expectedVersion: 2, allocations: [{ lotId: lot.body.lot.id, quantityKg: 10 }] } });
  assert.equal(blockedReservation.status, 422);
  lotDecision = await request(`/api/workflow/material-lots/${lot.body.lot.id}/actions/release`, { token: quality.token, method: 'POST', body: { expectedVersion: 2, reason: 'Independent source checksum and certificate review completed.', attestation: 'I verified the lot disposition and supporting evidence' } });
  assert.equal(lotDecision.status, 200); assert.equal(lotDecision.body.status, 'AVAILABLE');
  await request(`/api/workflow/work-orders/${id}/actions/reserve`, { token: operator.token, method: 'POST', body: { expectedVersion: 2, allocations: [{ lotId: lot.body.lot.id, quantityKg: 10 }] } });
  await request(`/api/workflow/work-orders/${id}/actions/start`, { token: operator.token, method: 'POST', body: { expectedVersion: 3 } });
  const capturedAt = new Date().toISOString();
  await request(`/api/workflow/work-orders/${id}/telemetry`, { token: operator.token, method: 'POST', body: { events: [
    { externalEventId: `temp-b-${suffix}`, sourceSystem: 'printer-2', metric: 'extruder_temperature_c', value: 450, unit: 'C', capturedAt },
    { externalEventId: `vib-b-${suffix}`, sourceSystem: 'printer-2', metric: 'vibration_mm_s', value: 3, unit: 'mm/s', capturedAt },
    { externalEventId: `mass-b-${suffix}`, sourceSystem: 'printer-2', metric: 'produced_mass_kg', value: 9.5, unit: 'kg', capturedAt },
  ] } });
  await request(`/api/workflow/work-orders/${id}/actions/finish`, { token: operator.token, method: 'POST', body: { expectedVersion: 4 } });
  const inspection = await request(`/api/workflow/work-orders/${id}/inspection`, { token: quality.token, method: 'POST', body: {
    expectedVersion: 5, qualityScore: 95, measuredMassKg: 9.5, dimensionalVariancePct: 1, defectCount: 0,
    findings: 'Article is dimensionally acceptable but exceeded thermal limit.', evidenceUrl: `https://certs.example.test/inspections/b-${suffix}`,
    attestation: 'I inspected the produced article and verified the recorded measurements',
  } });
  assert.deepEqual(inspection.body.inspection.blockers, ['temperature_within_limits']);
  let decision = await request(`/api/workflow/work-orders/${id}/inspection/decision`, { token: approver.token, method: 'POST', body: { expectedVersion: 6, decision: 'APPROVE', attestation: 'I approve this article for operational use' } });
  assert.equal(decision.status, 422);
  decision = await request(`/api/workflow/work-orders/${id}/inspection/decision`, { token: approver.token, method: 'POST', body: { expectedVersion: 6, decision: 'OVERRIDE', attestation: 'I accept the documented mission risk for this deviation', reason: 'Mission engineering accepted the thermal excursion after coupon analysis and documented restricted non-pressure use.' } });
  assert.equal(decision.status, 200); assert.equal(decision.body.workOrder.status, 'APPROVED');

  const draft = await request('/api/workflow/work-orders', { token: operator.token, method: 'POST', body: {
    baseId, workOrderCode: `WO-C-${suffix}`, partNumber: `PART-C-${suffix}`, revision: 'A', description: 'Change-controlled design validation article',
    requiredMaterialType: 'regolith', materialRequiredKg: 5, minPurityPct: 90, expectedMassKg: 4.8,
    massTolerancePct: 5, temperatureMinC: 100, temperatureMaxC: 300, maxVibrationMms: 8,
  } });
  const change = await request(`/api/workflow/work-orders/${draft.body.id}/change-orders`, { token: operator.token, method: 'POST', body: {
    expectedVersion: 1, reason: 'Engineering drawing revision superseded the original release.',
    impactAssessment: 'Material quantity is unchanged; thermal qualification limit increases by twenty degrees.', patch: { revision: 'B', temperatureMaxC: 320 },
  } });
  assert.equal(change.status, 201);
  const approvedChange = await request(`/api/workflow/work-orders/${draft.body.id}/change-orders/${change.body.id}/decision`, { token: approver.token, method: 'POST', body: { expectedVersion: 1, decision: 'APPROVE', reason: 'Independent engineering review complete.' } });
  assert.equal(approvedChange.status, 200); assert.equal(approvedChange.body.workOrder.revision, 'B'); assert.equal(approvedChange.body.workOrder.version, 2);
});
