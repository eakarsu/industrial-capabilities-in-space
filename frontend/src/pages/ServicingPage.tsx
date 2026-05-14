import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Wrench, Satellite, RefreshCcw, Calendar, AlertTriangle } from 'lucide-react';

type Mission = {
  id: number; mission_name: string; servicer_spacecraft: string; client_spacecraft: string;
  operator: string; service_type: string; orbit: string; rendezvous_date: string;
  service_end_date: string; contract_value_millions: number; status: string;
  client_value_extended_years: number; notes?: string; event_count: string;
};
type EventRow = {
  id: number; mission_id: number; mission_name: string; operator: string;
  event_time: string; event_type: string; range_m: number; relative_velocity_mps: number; delta_v_mps: number;
};
type TypeStat = { service_type: string; mission_count: string; completed_count: string; in_progress_count: string; total_contract_m: string; total_years_extended: string };
type OpStat = { operator: string; mission_count: string; completed: string; active_or_planned: string; total_contract_m: string };

const statusColor: Record<string, string> = {
  planned: 'bg-blue-900 text-blue-300',
  in_progress: 'bg-amber-900 text-amber-300',
  completed: 'bg-green-900 text-green-300',
  failed: 'bg-red-900 text-red-300',
};
const eventColor: Record<string, string> = {
  approach: 'text-blue-400', capture: 'text-green-400',
  undock: 'text-gray-400', maneuver: 'text-amber-400', anomaly: 'text-red-400',
};

export default function ServicingPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [types, setTypes] = useState<TypeStat[]>([]);
  const [ops, setOps] = useState<OpStat[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<Mission | null>(null);

  async function load() {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      if (typeFilter) qs.set('service_type', typeFilter);
      const [m, t, o, e] = await Promise.all([
        apiFetch('/servicing/missions' + (qs.toString() ? '?' + qs.toString() : '')),
        apiFetch('/servicing/stats/by-service-type'),
        apiFetch('/servicing/stats/by-operator'),
        apiFetch('/servicing/stats/timeline'),
      ]);
      setMissions(m); setTypes(t); setOps(o); setEvents(e);
    } catch (ex: any) { setErr(ex.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  async function advance(id: number, to: string) {
    try {
      await apiFetch(`/servicing/missions/${id}/advance-status`, {
        method: 'POST', body: JSON.stringify({ to }),
      });
      await load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Satellite className="w-6 h-6 text-emerald-400" />On-Orbit Servicing</h1>
          <p className="text-gray-400 text-sm mt-1">
            Northrop MEV-1/2 life extension · Astroscale ELSA-d/ELSA-M debris removal · Maxar OSAM-1 · Redwire Archinaut · ClearSpace-1 · Orbit Fab refueling.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />} Reload
        </button>
      </div>

      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-400" />By service type</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Type</th><th className="py-2 pr-4 text-right">Missions</th>
              <th className="py-2 pr-4 text-right">Done</th><th className="py-2 pr-4 text-right">In-progress</th>
              <th className="py-2 pr-4 text-right">Contract $M</th><th className="py-2 pr-4 text-right">Yrs ext</th>
            </tr></thead>
            <tbody>
              {types.map(t => (
                <tr key={t.service_type} className="border-b border-gray-800/60 cursor-pointer hover:bg-gray-800/30" onClick={() => setTypeFilter(t.service_type === typeFilter ? '' : t.service_type)}>
                  <td className="py-2 pr-4 text-emerald-300 font-mono text-xs">{t.service_type}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">{t.mission_count}</td>
                  <td className="py-2 pr-4 text-right text-green-300">{t.completed_count}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{t.in_progress_count}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${Number(t.total_contract_m).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{t.total_years_extended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">By operator</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Operator</th><th className="py-2 pr-4 text-right">Missions</th>
              <th className="py-2 pr-4 text-right">Active</th><th className="py-2 pr-4 text-right">$M</th>
            </tr></thead>
            <tbody>
              {ops.map(o => (
                <tr key={o.operator} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{o.operator}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{o.mission_count}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{o.active_or_planned}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${Number(o.total_contract_m).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Missions</h2>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs">
            <option value="">All statuses</option>
            {['planned', 'in_progress', 'completed', 'failed'].map(s => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-gray-500 ml-auto">{missions.length} missions</span>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-2 pr-4">Mission</th><th className="py-2 pr-4">Operator</th>
            <th className="py-2 pr-4">Servicer → Client</th><th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Rendezvous</th><th className="py-2 pr-4 text-right">$M</th>
            <th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Action</th>
          </tr></thead>
          <tbody>
            {missions.map(m => (
              <tr key={m.id} className="border-b border-gray-800/60 cursor-pointer hover:bg-gray-800/30" onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                <td className="py-2 pr-4 text-white">{m.mission_name}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{m.operator}</td>
                <td className="py-2 pr-4 text-gray-300 text-xs">{m.servicer_spacecraft} → {m.client_spacecraft}</td>
                <td className="py-2 pr-4 text-emerald-300 text-xs">{m.service_type}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{m.rendezvous_date?.slice(0, 10)}</td>
                <td className="py-2 pr-4 text-right text-gray-300">${m.contract_value_millions}</td>
                <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[m.status] || 'bg-gray-800 text-gray-400'}`}>{m.status}</span></td>
                <td className="py-2 pr-4">
                  {m.status === 'planned' && <button onClick={e => { e.stopPropagation(); advance(m.id, 'in_progress'); }} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded">Start</button>}
                  {m.status === 'in_progress' && <button onClick={e => { e.stopPropagation(); advance(m.id, 'completed'); }} className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded">Complete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-gray-900 border border-emerald-700/40 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">{selected.mission_name}</h3>
          <p className="text-xs text-gray-400 mb-2">{selected.notes}</p>
          <div className="text-xs text-gray-400">
            Orbit: <span className="text-gray-200">{selected.orbit}</span> · End:{' '}
            <span className="text-gray-200">{selected.service_end_date?.slice(0, 10) || '—'}</span> · Life ext:{' '}
            <span className="text-amber-300">{selected.client_value_extended_years} yr</span> · Events: {selected.event_count}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />Rendezvous timeline</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Mission</th><th className="py-2 pr-4">Event</th>
              <th className="py-2 pr-4 text-right">Range m</th><th className="py-2 pr-4 text-right">Rel vel m/s</th>
              <th className="py-2 pr-4 text-right">Δv m/s</th>
            </tr></thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-gray-400 text-xs">{ev.event_time?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 pr-4 text-gray-300 text-xs">{ev.mission_name}</td>
                  <td className={`py-2 pr-4 font-mono text-xs ${eventColor[ev.event_type] || 'text-gray-400'}`}>
                    {ev.event_type === 'anomaly' && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                    {ev.event_type}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-300">{ev.range_m}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{ev.relative_velocity_mps}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{ev.delta_v_mps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
