import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Rocket, Calculator, TrendingDown, RefreshCcw } from 'lucide-react';

type Vehicle = {
  id: number; name: string; operator: string; payload_leo_kg: number;
  payload_gto_kg: number; payload_tli_kg: number; cost_per_launch_millions: number;
  cost_per_kg_leo: number; reusable: boolean; status: string; first_flight_year: number;
  total_flights: string; success_count: string; contracted_revenue_m: string;
};
type Manifest = { id: number; vehicle_name: string; flight_number: string; launch_date: string; payload_name: string; customer: string; payload_mass_kg: number; destination: string; contract_value_millions: number; status: string };
type Cand = { id: number; name: string; operator: string; capacity_kg: number; cost_per_launch_millions: number; cost_per_kg_leo: number; reusable: boolean; utilization_pct: number; estimated_dedicated_cost_m: number };

const statusColor: Record<string, string> = {
  success: 'bg-green-900 text-green-300',
  scheduled: 'bg-blue-900 text-blue-300',
  failure: 'bg-red-900 text-red-300',
  partial: 'bg-yellow-900 text-yellow-300',
};

export default function LaunchEconomicsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [costCurve, setCostCurve] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Recommend form
  const [payloadKg, setPayloadKg] = useState(11000);
  const [destination, setDestination] = useState('LEO');
  const [reuseOnly, setReuseOnly] = useState(false);
  const [candidates, setCandidates] = useState<Cand[]>([]);
  const [recOpen, setRecOpen] = useState(false);

  async function load() {
    setLoading(true); setErr('');
    try {
      const [v, m, c] = await Promise.all([
        apiFetch('/launch-economics/vehicles'),
        apiFetch('/launch-economics/manifests'),
        apiFetch('/launch-economics/stats/cost-curve'),
      ]);
      setVehicles(v); setManifests(m); setCostCurve(c);
    } catch (e: any) { setErr(e.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function runRecommend() {
    try {
      const r = await apiFetch('/launch-economics/recommend', {
        method: 'POST',
        body: JSON.stringify({ payload_mass_kg: Number(payloadKg), destination, reuse_preferred: reuseOnly }),
      });
      setCandidates(r.candidates || []);
      setRecOpen(true);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Rocket className="w-6 h-6 text-orange-400" />Launch Economics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Falcon 9 $2,720/kg · Starship $670/kg target · Vulcan $4,040/kg · SLS $21,000/kg · payload-to-vehicle matching.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />} Reload
        </button>
      </div>

      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Calculator className="w-4 h-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Payload → vehicle matcher</h2>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Payload mass (kg)</label>
            <input type="number" value={payloadKg} onChange={e => setPayloadKg(parseInt(e.target.value || '0', 10))} className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm w-32" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Destination</label>
            <select value={destination} onChange={e => setDestination(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm">
              {['LEO', 'SSO', 'GTO', 'GEO', 'TLI', 'lunar_surface'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={reuseOnly} onChange={e => setReuseOnly(e.target.checked)} /> Prefer reusable
          </label>
          <button onClick={runRecommend} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Compute</button>
        </div>
        {recOpen && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Vehicle</th><th className="py-2 pr-4">Operator</th>
                <th className="py-2 pr-4 text-right">Capacity kg</th>
                <th className="py-2 pr-4 text-right">Utilization</th>
                <th className="py-2 pr-4 text-right">$/kg LEO</th>
                <th className="py-2 pr-4 text-right">Dedicated $M</th>
              </tr></thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-800/60 ${i === 0 ? 'bg-green-900/10' : ''}`}>
                    <td className="py-2 pr-4 text-white">{c.name} {i === 0 && <span className="ml-1 text-xs text-green-400">cheapest</span>}</td>
                    <td className="py-2 pr-4 text-gray-300">{c.operator}</td>
                    <td className="py-2 pr-4 text-right text-gray-300">{Number(c.capacity_kg).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-amber-300">{c.utilization_pct}%</td>
                    <td className="py-2 pr-4 text-right text-gray-200">${c.cost_per_kg_leo?.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-gray-300">${c.estimated_dedicated_cost_m}M</td>
                  </tr>
                ))}
                {!candidates.length && <tr><td colSpan={6} className="py-3 text-center text-gray-500 text-sm">No active vehicle can lift this payload to {destination}.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingDown className="w-4 h-4 text-green-400" />
          <h2 className="text-lg font-semibold text-white">$/kg cost curve (LEO)</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-2 pr-4">Vehicle</th><th className="py-2 pr-4 text-right">$/kg</th>
            <th className="py-2 pr-4 text-right">LEO kg</th><th className="py-2 pr-4 text-right">$/launch</th>
            <th className="py-2 pr-4">Reuse</th><th className="py-2 pr-4">Status</th>
          </tr></thead>
          <tbody>
            {costCurve.map(v => (
              <tr key={v.id} className="border-b border-gray-800/60">
                <td className="py-2 pr-4 text-white">{v.name}</td>
                <td className="py-2 pr-4 text-right text-green-300 font-mono">${Number(v.cost_per_kg_leo).toLocaleString()}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{Number(v.payload_leo_kg).toLocaleString()}</td>
                <td className="py-2 pr-4 text-right text-gray-300">${v.cost_per_launch_millions}M</td>
                <td className="py-2 pr-4 text-amber-300">{v.reusable ? 'Yes' : '—'}</td>
                <td className="py-2 pr-4 text-gray-300">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Recent manifests ({manifests.length})</h2>
        <div className="overflow-x-auto max-h-[55vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Vehicle</th>
              <th className="py-2 pr-4">Payload</th><th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4 text-right">Mass kg</th><th className="py-2 pr-4">Dest</th>
              <th className="py-2 pr-4 text-right">$M</th><th className="py-2 pr-4">Status</th>
            </tr></thead>
            <tbody>
              {manifests.slice(0, 60).map(m => (
                <tr key={m.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-gray-400 text-xs">{m.launch_date?.slice(0, 10)}</td>
                  <td className="py-2 pr-4 text-gray-200">{m.vehicle_name}</td>
                  <td className="py-2 pr-4 text-white">{m.payload_name}</td>
                  <td className="py-2 pr-4 text-gray-300">{m.customer}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(m.payload_mass_kg).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-amber-300 font-mono text-xs">{m.destination}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${m.contract_value_millions}</td>
                  <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[m.status] || 'bg-gray-800 text-gray-400'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
