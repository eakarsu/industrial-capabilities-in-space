import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Droplet, FlaskConical, Zap, RefreshCcw, Pickaxe } from 'lucide-react';

type Site = {
  id: number; name: string; body: string; region: string; feedstock: string;
  process: string; capacity_kg_per_day: number; power_required_kw: number;
  operator: string; commissioning_year: number; status: string;
  total_runs: string; total_output_kg: number; total_energy_kwh: number; avg_purity_pct: string;
};
type Prod = { output_product: string; run_count: string; total_kg: number; total_kwh: number; kwh_per_kg: number | null; avg_yield_pct: string; avg_purity_pct: string };
type Body = { body: string; site_count: string; run_count: string; total_output_kg: number; total_energy_kwh: number; installed_capacity_kg_day: number };
type Process = { process: string; feedstock: string; run_count: string; total_kg: number; total_kwh: number; kwh_per_kg: number | null; avg_yield_pct: string };

const bodyColor: Record<string, string> = {
  Moon: 'bg-slate-700 text-slate-200',
  Mars: 'bg-red-900 text-red-300',
  Asteroid: 'bg-amber-900 text-amber-300',
};

export default function IsruPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [byProd, setByProd] = useState<Prod[]>([]);
  const [byBody, setByBody] = useState<Body[]>([]);
  const [byProc, setByProc] = useState<Process[]>([]);
  const [bodyFilter, setBodyFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true); setErr('');
    try {
      const [s, p, b, pr] = await Promise.all([
        apiFetch('/isru/sites'),
        apiFetch('/isru/production-by-product'),
        apiFetch('/isru/production-by-body'),
        apiFetch('/isru/process-efficiency'),
      ]);
      setSites(s); setByProd(p); setByBody(b); setByProc(pr);
    } catch (e: any) { setErr(e.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = sites.filter(s => !bodyFilter || s.body === bodyFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pickaxe className="w-6 h-6 text-cyan-400" />In-Situ Resource Utilization
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Lunar PSR water-ice (Shackleton), molten regolith electrolysis (Blue Alchemist), Mars MOXIE successors, asteroid prospects.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />} Reload
        </button>
      </div>

      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {byBody.map(b => (
          <div key={b.body} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded ${bodyColor[b.body] || 'bg-gray-800 text-gray-400'}`}>{b.body}</span>
              <span className="text-xs text-gray-500">{b.site_count} sites</span>
            </div>
            <div className="mt-3"><div className="text-xs text-gray-400">Production-to-date</div>
              <div className="text-xl text-white font-bold mt-0.5">{Number(b.total_output_kg).toLocaleString()} kg</div></div>
            <div className="mt-2"><div className="text-xs text-gray-400">Installed capacity</div>
              <div className="text-sm text-gray-200">{Number(b.installed_capacity_kg_day).toLocaleString()} kg/day</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-400" />By output product</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4 text-right">Runs</th>
              <th className="py-2 pr-4 text-right">kg</th>
              <th className="py-2 pr-4 text-right">kWh/kg</th>
              <th className="py-2 pr-4 text-right">Purity</th>
            </tr></thead>
            <tbody>
              {byProd.map(p => (
                <tr key={p.output_product} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-blue-300 font-mono">{p.output_product}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.run_count}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(p.total_kg).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{p.kwh_per_kg ?? '—'}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.avg_purity_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Process efficiency (kWh / kg)</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Process</th><th className="py-2 pr-4">Feedstock</th>
              <th className="py-2 pr-4 text-right">kg</th><th className="py-2 pr-4 text-right">kWh/kg</th>
              <th className="py-2 pr-4 text-right">Yield</th>
            </tr></thead>
            <tbody>
              {byProc.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{p.process}</td>
                  <td className="py-2 pr-4 text-gray-300">{p.feedstock}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(p.total_kg).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{p.kwh_per_kg ?? '—'}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.avg_yield_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Sites</h2>
          <select value={bodyFilter} onChange={e => setBodyFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs ml-auto">
            <option value="">All bodies</option>
            {Array.from(new Set(sites.map(s => s.body))).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Body</th><th className="py-2 pr-4">Process</th>
            <th className="py-2 pr-4">Operator</th><th className="py-2 pr-4 text-right">Cap kg/day</th>
            <th className="py-2 pr-4 text-right">Output kg</th><th className="py-2 pr-4">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-gray-800/60">
                <td className="py-2 pr-4 text-white">{s.name}</td>
                <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${bodyColor[s.body] || 'bg-gray-800 text-gray-400'}`}>{s.body}</span></td>
                <td className="py-2 pr-4 text-gray-300">{s.process}</td>
                <td className="py-2 pr-4 text-gray-400">{s.operator}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{s.capacity_kg_per_day}</td>
                <td className="py-2 pr-4 text-right text-emerald-300">{Number(s.total_output_kg).toLocaleString()}</td>
                <td className="py-2 pr-4 text-gray-300">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
