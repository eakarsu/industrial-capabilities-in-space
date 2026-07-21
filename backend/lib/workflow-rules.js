const crypto = require('crypto');

const STATUS_TRANSITIONS = Object.freeze({
  DRAFT: ['RELEASED', 'CANCELLED'],
  RELEASED: ['MATERIAL_RESERVED', 'CANCELLED'],
  MATERIAL_RESERVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_INSPECTION'],
  AWAITING_INSPECTION: ['AWAITING_APPROVAL'],
  AWAITING_APPROVAL: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
});

const TELEMETRY_METRICS = Object.freeze({
  extruder_temperature_c: { unit: 'C', min: -200, max: 2000 },
  vibration_mm_s: { unit: 'mm/s', min: 0, max: 100 },
  produced_mass_kg: { unit: 'kg', min: 0.001, max: 100000 },
  chamber_pressure_kpa: { unit: 'kPa', min: 0, max: 5000 },
  layer_height_mm: { unit: 'mm', min: 0.01, max: 100 },
});

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function canTransition(from, to) {
  return Boolean(STATUS_TRANSITIONS[from]?.includes(to));
}

function validateCertificateUrl(value, allowedHosts) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname.toLowerCase())) {
      return 'certificateUrl must be HTTPS and use an authoritative allowlisted host';
    }
    return null;
  } catch {
    return 'certificateUrl must be a valid HTTPS URL';
  }
}

function validateTelemetryEvent(event) {
  const rule = TELEMETRY_METRICS[event.metric];
  const value = Number(event.value);
  if (!rule) return `Unsupported telemetry metric: ${event.metric}`;
  if (event.unit !== rule.unit) return `${event.metric} must use ${rule.unit}`;
  if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
    return `${event.metric} must be between ${rule.min} and ${rule.max} ${rule.unit}`;
  }
  const capturedAt = new Date(event.capturedAt);
  if (Number.isNaN(capturedAt.getTime())) return 'capturedAt must be a valid timestamp';
  if (capturedAt.getTime() > Date.now() + 5 * 60 * 1000) return 'capturedAt cannot be more than five minutes in the future';
  return null;
}

function latestMetric(telemetry, metric) {
  return telemetry
    .filter((item) => item.metric === metric)
    .sort((a, b) => new Date(b.captured_at || b.capturedAt) - new Date(a.captured_at || a.capturedAt))[0];
}

function evaluateInspection({ workOrder, allocations, telemetry, inspection }) {
  const rules = [];
  const add = (rule, passed, actual, limit) => rules.push({ rule, passed: Boolean(passed), actual, limit });
  const allocated = allocations
    .filter((item) => item.disposition !== 'RELEASED')
    .reduce((sum, item) => sum + Number(item.reserved_kg || item.reservedKg || 0), 0);
  const impure = allocations.filter((item) => Number(item.purity_pct || item.purityPct) < Number(workOrder.min_purity_pct || workOrder.minPurityPct));
  const temperature = telemetry.filter((item) => item.metric === 'extruder_temperature_c').map((item) => Number(item.numeric_value ?? item.value));
  const vibration = telemetry.filter((item) => item.metric === 'vibration_mm_s').map((item) => Number(item.numeric_value ?? item.value));
  const producedMassEvent = latestMetric(telemetry, 'produced_mass_kg');
  const producedMass = producedMassEvent ? Number(producedMassEvent.numeric_value ?? producedMassEvent.value) : null;
  const expectedMass = Number(workOrder.expected_mass_kg || workOrder.expectedMassKg);
  const tolerance = Number(workOrder.mass_tolerance_pct || workOrder.massTolerancePct);
  const measuredMass = Number(inspection.measuredMassKg);
  const measuredDeviation = expectedMass ? Math.abs(measuredMass - expectedMass) / expectedMass * 100 : Infinity;
  const telemetryMassDeviation = producedMass === null || !expectedMass ? Infinity : Math.abs(producedMass - expectedMass) / expectedMass * 100;

  add('material_quantity', allocated + 0.000001 >= Number(workOrder.material_required_kg || workOrder.materialRequiredKg), allocated, `>= ${workOrder.material_required_kg || workOrder.materialRequiredKg} kg`);
  add('material_purity', impure.length === 0 && allocations.length > 0, impure.map((item) => item.lot_code || item.lotCode), `all lots >= ${workOrder.min_purity_pct || workOrder.minPurityPct}%`);
  add('temperature_telemetry_present', temperature.length > 0, temperature.length, '>= 1 sample');
  add('temperature_within_limits', temperature.length > 0 && Math.min(...temperature) >= Number(workOrder.temperature_min_c || workOrder.temperatureMinC) && Math.max(...temperature) <= Number(workOrder.temperature_max_c || workOrder.temperatureMaxC), temperature.length ? [Math.min(...temperature), Math.max(...temperature)] : null, `${workOrder.temperature_min_c || workOrder.temperatureMinC}..${workOrder.temperature_max_c || workOrder.temperatureMaxC} C`);
  add('vibration_telemetry_present', vibration.length > 0, vibration.length, '>= 1 sample');
  add('vibration_within_limit', vibration.length > 0 && Math.max(...vibration) <= Number(workOrder.max_vibration_mm_s || workOrder.maxVibrationMms), vibration.length ? Math.max(...vibration) : null, `<= ${workOrder.max_vibration_mm_s || workOrder.maxVibrationMms} mm/s`);
  add('produced_mass_telemetry', producedMass !== null && telemetryMassDeviation <= tolerance, producedMass, `${expectedMass} kg +/- ${tolerance}%`);
  add('inspection_quality_score', Number(inspection.qualityScore) >= 90, Number(inspection.qualityScore), '>= 90');
  add('inspection_defects', Number(inspection.defectCount) === 0, Number(inspection.defectCount), '0');
  add('inspection_dimensions', Number(inspection.dimensionalVariancePct) <= 2, Number(inspection.dimensionalVariancePct), '<= 2%');
  add('inspection_mass', Number.isFinite(measuredDeviation) && measuredDeviation <= tolerance, measuredMass, `${expectedMass} kg +/- ${tolerance}%`);
  return { rules, blockers: rules.filter((rule) => !rule.passed).map((rule) => rule.rule) };
}

function verifyEventChain(events) {
  let previous = null;
  for (const event of events) {
    const content = {
      baseId: Number(event.base_id ?? event.baseId),
      workOrderId: event.work_order_id == null ? null : Number(event.work_order_id),
      actorId: event.actor_id == null ? null : Number(event.actor_id),
      action: event.action,
      fromStatus: event.from_status ?? null,
      toStatus: event.to_status ?? null,
      payload: event.payload,
      createdAt: new Date(event.created_at ?? event.createdAt).toISOString(),
    };
    const expected = sha256(`${previous || ''}:${stableStringify(content)}`);
    if ((event.previous_hash || null) !== previous || event.event_hash !== expected) return false;
    previous = event.event_hash;
  }
  return true;
}

module.exports = {
  STATUS_TRANSITIONS,
  TELEMETRY_METRICS,
  stableStringify,
  sha256,
  canTransition,
  validateCertificateUrl,
  validateTelemetryEvent,
  evaluateInspection,
  verifyEventChain,
};
