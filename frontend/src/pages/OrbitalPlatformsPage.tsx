import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Rocket, RefreshCcw, PackageCheck, Factory } from 'lucide-react';

type Platform = {
  id: number; name: string; operator: string; platform_type: string; orbit: string;
  altitude_km: number; power_kw: number; pressurized_volume_m3: number;
  microgravity_class: string; launch_year: number; status: string; notes?: string;
  total_batches: string; active_batches: string; returned_value_usd: string;
};
type Util = { id: number; name: string; operator: string; platform_type: string; power_kw: number; batches: string; total_mass_g: number; avg_yield_pct: string; in_progress: string; returned_count: string };
type ProdStat = { product_family: string; batch_count: string; total_mass_g: number; total_earth_value_usd: number; avg_yield_pct: string };

const statusColor: Record<string, string> = {
  operational: 'bg-green-900 text-green-300',
  in_development: 'bg-yellow-900 text-yellow-300',
  completed: 'bg-blue-900 text-blue-300',
  planned: 'bg-gray-700 text-gray-300',
  retired: 'bg-red-900 text-red-300',
};

function fmt$(n: number) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(n);
}

export default function OrbitalPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [util, setUtil] = useState<Util[]>([]);
  const [products, setProducts] = useState<ProdStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true); setErr('');
    try {
      const [p, u, pr] = await Promise.all([
        apiFetch('/orbital-platforms'),
        apiFetch('/orbital-platforms/stats/utilization'),
        apiFetch('/orbital-platforms/stats/products'),
      ]);
      setPlatforms(p); setUtil(u); setProducts(pr);
    } catch (e: any) { setErr(e.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = platforms.filter(p => !statusFilter || p.status === statusFilter);
  const totalReturned = platforms.reduce((s, p) => s + Number(p.returned_value_usd || 0), 0);
  const totalActive = platforms.reduce((s, p) => s + Number(p.active_batches || 0), 0);
  const totalBatches = platforms.reduce((s, p) => s + Number(p.total_batches || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-400" />Orbital Manufacturing Platforms
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Varda hypersonic capsules, Made In Space ZBLAN, Redwire ICF, Starlab, Orbital Reef, Vast Haven-1, Axiom, Sierra LIFE.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />} Reload
        </button>
      </div>

      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Platforms</div>
          <div className="text-2xl text-white font-bold mt-1">{platforms.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Total batches</div>
          <div className="text-2xl text-white font-bold mt-1">{totalBatches}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Active batches</div>
          <div className="text-2xl text-amber-300 font-bold mt-1">{totalActive}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Returned product value</div>
          <div className="text-2xl text-green-300 font-bold mt-1">{fmt$(totalReturned)}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Factory className="w-4 h-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Value by product family</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Family</th><th className="py-2 pr-4 text-right">Batches</th>
              <th className="py-2 pr-4 text-right">Mass (g)</th><th className="py-2 pr-4 text-right">Avg yield</th>
              <th className="py-2 pr-4 text-right">Earth value</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.product_family} className="border-b border-gray-800/60">
                <td className="py-2 pr-4 text-white">{p.product_family}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{p.batch_count}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{Number(p.total_mass_g).toLocaleString()}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{p.avg_yield_pct}%</td>
                <td className="py-2 pr-4 text-right text-green-300">{fmt$(Number(p.total_earth_value_usd))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <PackageCheck className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Platforms</h2>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs ml-auto">
            <option value="">All statuses</option>
            {Array.from(new Set(platforms.map(p => p.status))).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Operator</th>
                <th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Orbit</th>
                <th className="py-2 pr-4 text-right">Power kW</th><th className="py-2 pr-4">µg</th>
                <th className="py-2 pr-4 text-right">Batches</th>
                <th className="py-2 pr-4 text-right">Active</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{p.name}</td>
                  <td className="py-2 pr-4 text-gray-300">{p.operator}</td>
                  <td className="py-2 pr-4 text-gray-400">{p.platform_type}</td>
                  <td className="py-2 pr-4 text-gray-300">{p.orbit} {p.altitude_km ? `@${p.altitude_km}km` : ''}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.power_kw}</td>
                  <td className="py-2 pr-4 text-amber-300 font-mono text-xs">{p.microgravity_class}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.total_batches}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{p.active_batches}</td>
                  <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[p.status] || 'bg-gray-800 text-gray-400'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-3">
          Utilization snapshot: {util.length} platforms · {util.reduce((s, x) => s + Number(x.total_mass_g || 0), 0).toLocaleString()} g manufactured total
        </div>
      </div>
    </div>
  );
}
