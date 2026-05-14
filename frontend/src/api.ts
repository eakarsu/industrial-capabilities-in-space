const BASE = '/api';
function getToken() { return localStorage.getItem('token'); }

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || res.statusText); }
  return res.json();
}

// Audit-implementation helpers (2026-05-14)
export const industrial = {
  orbitalPlatforms: {
    list: () => apiFetch('/orbital-platforms'),
    get: (id: number) => apiFetch(`/orbital-platforms/${id}`),
    utilization: () => apiFetch('/orbital-platforms/stats/utilization'),
    products: () => apiFetch('/orbital-platforms/stats/products'),
    batches: (id: number) => apiFetch(`/orbital-platforms/${id}/batches`),
  },
  isru: {
    sites: () => apiFetch('/isru/sites'),
    site: (id: number) => apiFetch(`/isru/sites/${id}`),
    byProduct: () => apiFetch('/isru/production-by-product'),
    byBody: () => apiFetch('/isru/production-by-body'),
    efficiency: () => apiFetch('/isru/process-efficiency'),
  },
  launch: {
    vehicles: () => apiFetch('/launch-economics/vehicles'),
    costCurve: () => apiFetch('/launch-economics/stats/cost-curve'),
    manifests: () => apiFetch('/launch-economics/manifests'),
    recommend: (payload_mass_kg: number, destination = 'LEO', reuse_preferred = false) =>
      apiFetch('/launch-economics/recommend', { method: 'POST', body: JSON.stringify({ payload_mass_kg, destination, reuse_preferred }) }),
  },
  products: {
    list: (filters: { category?: string; min_trl?: number } = {}) => {
      const qs = new URLSearchParams();
      if (filters.category) qs.set('category', filters.category);
      if (filters.min_trl) qs.set('min_trl', String(filters.min_trl));
      return apiFetch('/microgravity-products' + (qs.toString() ? '?' + qs.toString() : ''));
    },
    roi: (id: number, batch_mass_g: number, opts: { launch_cost_per_kg_usd?: number; return_cost_per_kg_usd?: number; overhead_pct?: number } = {}) =>
      apiFetch(`/microgravity-products/${id}/roi`, { method: 'POST', body: JSON.stringify({ batch_mass_g, ...opts }) }),
  },
  servicing: {
    missions: () => apiFetch('/servicing/missions'),
    mission: (id: number) => apiFetch(`/servicing/missions/${id}`),
    byType: () => apiFetch('/servicing/stats/by-service-type'),
    byOperator: () => apiFetch('/servicing/stats/by-operator'),
    timeline: () => apiFetch('/servicing/stats/timeline'),
    advance: (id: number, to: string) => apiFetch(`/servicing/missions/${id}/advance-status`, { method: 'POST', body: JSON.stringify({ to }) }),
  },
};

export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getBases: () => apiFetch('/bases'), getBase: (id: number) => apiFetch(`/bases/${id}`),
  createBase: (d: unknown) => apiFetch('/bases', { method: 'POST', body: JSON.stringify(d) }),
  updateBase: (id: number, d: unknown) => apiFetch(`/bases/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteBase: (id: number) => apiFetch(`/bases/${id}`, { method: 'DELETE' }),
  getMining: () => apiFetch('/mining'), getMiningOp: (id: number) => apiFetch(`/mining/${id}`),
  createMining: (d: unknown) => apiFetch('/mining', { method: 'POST', body: JSON.stringify(d) }),
  updateMining: (id: number, d: unknown) => apiFetch(`/mining/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMining: (id: number) => apiFetch(`/mining/${id}`, { method: 'DELETE' }),
  getResources: () => apiFetch('/resources'), getResource: (id: number) => apiFetch(`/resources/${id}`),
  createResource: (d: unknown) => apiFetch('/resources', { method: 'POST', body: JSON.stringify(d) }),
  updateResource: (id: number, d: unknown) => apiFetch(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteResource: (id: number) => apiFetch(`/resources/${id}`, { method: 'DELETE' }),
  getPrintJobs: () => apiFetch('/print_jobs'), getPrintJob: (id: number) => apiFetch(`/print_jobs/${id}`),
  createPrintJob: (d: unknown) => apiFetch('/print_jobs', { method: 'POST', body: JSON.stringify(d) }),
  updatePrintJob: (id: number, d: unknown) => apiFetch(`/print_jobs/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deletePrintJob: (id: number) => apiFetch(`/print_jobs/${id}`, { method: 'DELETE' }),
  getEquipment: () => apiFetch('/equipment'), getEquipmentItem: (id: number) => apiFetch(`/equipment/${id}`),
  createEquipment: (d: unknown) => apiFetch('/equipment', { method: 'POST', body: JSON.stringify(d) }),
  updateEquipment: (id: number, d: unknown) => apiFetch(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteEquipment: (id: number) => apiFetch(`/equipment/${id}`, { method: 'DELETE' }),
  getMissions: () => apiFetch('/missions'), getMission: (id: number) => apiFetch(`/missions/${id}`),
  createMission: (d: unknown) => apiFetch('/missions', { method: 'POST', body: JSON.stringify(d) }),
  updateMission: (id: number, d: unknown) => apiFetch(`/missions/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMission: (id: number) => apiFetch(`/missions/${id}`, { method: 'DELETE' }),
  aiExtractionPlan: (d: unknown) => apiFetch('/ai/extraction-plan', { method: 'POST', body: JSON.stringify(d) }),
  aiEquipmentPrediction: (d: unknown) => apiFetch('/ai/equipment-prediction', { method: 'POST', body: JSON.stringify(d) }),
  aiResourceValuation: (d: unknown) => apiFetch('/ai/resource-valuation', { method: 'POST', body: JSON.stringify(d) }),
  aiMissionPlanning: (d: unknown) => apiFetch('/ai/mission-planning', { method: 'POST', body: JSON.stringify(d) }),
  aiMiningYield: (d: unknown) => apiFetch('/ai/mining-yield', { method: 'POST', body: JSON.stringify(d) }),
  aiRegolithClassifier: (d: unknown) => apiFetch('/ai/regolith-classifier', { method: 'POST', body: JSON.stringify(d) }),
  aiEvaRisk: (d: unknown) => apiFetch('/ai/eva-risk', { method: 'POST', body: JSON.stringify(d) }),
  aiTelemetryAnomaly: (d: unknown) => apiFetch('/ai/telemetry-anomaly', { method: 'POST', body: JSON.stringify(d) }),
  aiSupplyPrioritizer: (d: unknown) => apiFetch('/ai/supply-prioritizer', { method: 'POST', body: JSON.stringify(d) }),
  exportCsvUrl: (entity: string) => `/api/util/export/${entity}`,
  search: (params: { q?: string; entity?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.entity) qs.set('entity', params.entity);
    if (params.status) qs.set('status', params.status);
    return apiFetch(`/util/search?${qs.toString()}`);
  },
  getAuditLog: (params: { limit?: number; action?: string; entity_type?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.action) qs.set('action', params.action);
    if (params.entity_type) qs.set('entity_type', params.entity_type);
    return apiFetch(`/util/audit${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  postAudit: (d: unknown) => apiFetch('/util/audit', { method: 'POST', body: JSON.stringify(d) }),
  seedSampleData: (entity: string) => apiFetch(`/admin/sample-data/${entity}`, { method: 'POST' }),
  getDashboardStats: () => apiFetch('/dashboard/stats'),
};
