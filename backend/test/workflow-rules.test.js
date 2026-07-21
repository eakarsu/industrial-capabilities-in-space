const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canTransition, validateCertificateUrl, validateTelemetryEvent, evaluateInspection,
  sha256, stableStringify, verifyEventChain,
} = require('../lib/workflow-rules');

test('work-order state machine rejects skipped and terminal transitions', () => {
  assert.equal(canTransition('DRAFT', 'RELEASED'), true);
  assert.equal(canTransition('DRAFT', 'APPROVED'), false);
  assert.equal(canTransition('IN_PROGRESS', 'AWAITING_INSPECTION'), true);
  assert.equal(canTransition('APPROVED', 'DRAFT'), false);
});

test('authoritative evidence requires HTTPS and an allowlisted host', () => {
  assert.equal(validateCertificateUrl('https://certs.example.test/lot/1', ['certs.example.test']), null);
  assert.match(validateCertificateUrl('http://certs.example.test/lot/1', ['certs.example.test']), /HTTPS/);
  assert.match(validateCertificateUrl('https://attacker.test/lot/1', ['certs.example.test']), /allowlisted/);
});

test('telemetry enforces canonical units and physical bounds', () => {
  const valid = { metric: 'vibration_mm_s', value: 5, unit: 'mm/s', capturedAt: new Date().toISOString() };
  assert.equal(validateTelemetryEvent(valid), null);
  assert.match(validateTelemetryEvent({ ...valid, unit: 'in/s' }), /must use mm\/s/);
  assert.match(validateTelemetryEvent({ ...valid, value: 1000 }), /between/);
});

test('inspection reports deterministic material, telemetry, and quality blockers', () => {
  const workOrder = {
    material_required_kg: 10, min_purity_pct: 90, expected_mass_kg: 9.5, mass_tolerance_pct: 5,
    temperature_min_c: 100, temperature_max_c: 300, max_vibration_mm_s: 8,
  };
  const allocations = [{ reserved_kg: 10, purity_pct: 95, lot_code: 'LOT-1', disposition: 'CONSUMED' }];
  const telemetry = [
    { metric: 'extruder_temperature_c', numeric_value: 450, captured_at: '2026-07-20T10:00:00Z' },
    { metric: 'vibration_mm_s', numeric_value: 4, captured_at: '2026-07-20T10:00:01Z' },
    { metric: 'produced_mass_kg', numeric_value: 9.5, captured_at: '2026-07-20T10:00:02Z' },
  ];
  const result = evaluateInspection({ workOrder, allocations, telemetry, inspection: { qualityScore: 95, measuredMassKg: 9.5, dimensionalVariancePct: 1, defectCount: 0 } });
  assert.deepEqual(result.blockers, ['temperature_within_limits']);
});

test('tamper-evident event verification detects payload changes', () => {
  const createdAt = '2026-07-20T10:00:00.000Z';
  const content = { baseId: 1, workOrderId: 2, actorId: 3, action: 'WORK_ORDER_CREATED', fromStatus: null, toStatus: 'DRAFT', payload: { version: 1 }, createdAt };
  const event = { base_id: 1, work_order_id: 2, actor_id: 3, action: content.action, from_status: null, to_status: 'DRAFT', payload: content.payload, previous_hash: null, event_hash: sha256(`:${stableStringify(content)}`), created_at: createdAt };
  assert.equal(verifyEventChain([event]), true);
  assert.equal(verifyEventChain([{ ...event, payload: { version: 9 } }]), false);
});
