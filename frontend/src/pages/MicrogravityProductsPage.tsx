import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Beaker, RefreshCcw, Calculator, TrendingUp } from 'lucide-react';

type Product = {
  id: number; product_name: string; category: string; microgravity_advantage: string;
  earth_market_size_millions: number; unit_price_usd: number; unit: string; trl: number;
  primary_developer: string; earth_equivalent_quality_pct: number;
  microgravity_quality_pct: number; notes?: string;
};
type CatStat = { category: string; product_count: string; market_size_m: number; avg_trl: number; avg_quality_uplift_pct: number };
type TrlStat = { trl: number; product_count: string; market_size_m: number; sample_products: string[] };

type Roi = {
  product_name: string; sellable_g: number; revenue_usd: number;
  launch_cost_usd: number; return_cost_usd: number; overhead_usd: number;
  total_cost_usd: number; profit_usd: number; roi_pct: number | null;
  breakeven_mass_g: number | null; inputs: any;
};

const catColor: Record<string, string> = {
  protein_crystal: 'bg-purple-900 text-purple-300',
  pharma: 'bg-pink-900 text-pink-300',
  optical_fiber: 'bg-cyan-900 text-cyan-300',
  retina_chip: 'bg-violet-900 text-violet-300',
  semiconductor_crystal: 'bg-amber-900 text-amber-300',
  alloy: 'bg-gray-700 text-gray-300',
  biotech: 'bg-emerald-900 text-emerald-300',
};

function fmt$(n: number) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(n);
}

export default function MicrogravityProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<CatStat[]>([]);
  const [trls, setTrls] = useState<TrlStat[]>([]);
  const [catFilter, setCatFilter] = useState('');
  const [minTrl, setMinTrl] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // ROI
  const [roiId, setRoiId] = useState<number | null>(null);
  const [batchMassG, setBatchMassG] = useState(10);
  const [launchCostPerKg, setLaunchCostPerKg] = useState(2720);
  const [roi, setRoi] = useState<Roi | null>(null);

  async function load() {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams();
      if (catFilter) qs.set('category', catFilter);
      if (minTrl > 1) qs.set('min_trl', String(minTrl));
      const [p, c, t] = await Promise.all([
        apiFetch('/microgravity-products' + (qs.toString() ? '?' + qs.toString() : '')),
        apiFetch('/microgravity-products/stats/by-category'),
        apiFetch('/microgravity-products/stats/by-trl'),
      ]);
      setProducts(p); setCats(c); setTrls(t);
    } catch (e: any) { setErr(e.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [catFilter, minTrl]);

  async function computeRoi(id: number) {
    setRoiId(id); setRoi(null);
    try {
      const r = await apiFetch(`/microgravity-products/${id}/roi`, {
        method: 'POST',
        body: JSON.stringify({ batch_mass_g: batchMassG, launch_cost_per_kg_usd: launchCostPerKg }),
      });
      setRoi(r);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Beaker className="w-6 h-6 text-pink-400" />Microgravity Products Catalog</h1>
          <p className="text-gray-400 text-sm mt-1">
            ZBLAN fluoride fiber, ritonavir HIV crystals, retina chips, InP photonic crystals, single-crystal turbine blades — with ROI calculator.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />} Reload
        </button>
      </div>

      {err && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Categories</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Category</th><th className="py-2 pr-4 text-right">Products</th>
              <th className="py-2 pr-4 text-right">Market</th><th className="py-2 pr-4 text-right">Avg TRL</th>
              <th className="py-2 pr-4 text-right">Quality uplift</th>
            </tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.category} className="border-b border-gray-800/60 cursor-pointer hover:bg-gray-800/30" onClick={() => setCatFilter(c.category === catFilter ? '' : c.category)}>
                  <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${catColor[c.category] || 'bg-gray-800 text-gray-300'}`}>{c.category}</span></td>
                  <td className="py-2 pr-4 text-right text-gray-300">{c.product_count}</td>
                  <td className="py-2 pr-4 text-right text-green-300">{fmt$(c.market_size_m * 1e6)}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{c.avg_trl}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">+{c.avg_quality_uplift_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" />TRL maturity</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">TRL</th><th className="py-2 pr-4 text-right">Products</th>
              <th className="py-2 pr-4 text-right">Market</th><th className="py-2 pr-4">Sample</th>
            </tr></thead>
            <tbody>
              {trls.map(t => (
                <tr key={t.trl} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white font-mono">{t.trl}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{t.product_count}</td>
                  <td className="py-2 pr-4 text-right text-green-300">{fmt$(t.market_size_m * 1e6)}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{(t.sample_products || []).slice(0, 2).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Catalog</h2>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs">
            <option value="">All categories</option>
            {Array.from(new Set(products.map(p => p.category))).map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="text-xs text-gray-400 ml-2">Min TRL
            <input type="number" min={1} max={9} value={minTrl} onChange={e => setMinTrl(parseInt(e.target.value || '1', 10))} className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-white w-12" />
          </label>
          <span className="text-xs text-gray-500 ml-auto">{products.length} products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Product</th><th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Developer</th><th className="py-2 pr-4 text-right">$/unit</th>
              <th className="py-2 pr-4 text-right">TRL</th><th className="py-2 pr-4 text-right">µg quality</th>
              <th className="py-2 pr-4"></th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{p.product_name}</td>
                  <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${catColor[p.category] || 'bg-gray-800 text-gray-300'}`}>{p.category}</span></td>
                  <td className="py-2 pr-4 text-gray-300 text-xs">{p.primary_developer}</td>
                  <td className="py-2 pr-4 text-right text-gray-200">${Number(p.unit_price_usd).toLocaleString()}/{p.unit}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{p.trl}</td>
                  <td className="py-2 pr-4 text-right text-amber-300">{p.microgravity_quality_pct}% <span className="text-xs text-gray-500">vs {p.earth_equivalent_quality_pct}%</span></td>
                  <td className="py-2 pr-4">
                    <button onClick={() => computeRoi(p.id)} className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded flex items-center gap-1">
                      <Calculator className="w-3 h-3" />ROI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {roiId && (
        <div className="bg-gray-900 border border-violet-700/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-violet-400" />ROI: {roi?.product_name || '…'}</h2>
            <button onClick={() => { setRoiId(null); setRoi(null); }} className="text-xs text-gray-400 hover:text-white">Close</button>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div><label className="text-xs text-gray-400 block">Batch mass (g)</label>
              <input type="number" value={batchMassG} onChange={e => setBatchMassG(parseFloat(e.target.value || '0'))} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-24" /></div>
            <div><label className="text-xs text-gray-400 block">Launch $/kg</label>
              <input type="number" value={launchCostPerKg} onChange={e => setLaunchCostPerKg(parseFloat(e.target.value || '0'))} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-28" /></div>
            <button onClick={() => computeRoi(roiId)} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg self-end">Recompute</button>
          </div>
          {roi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-800/60 rounded p-3"><div className="text-xs text-gray-400">Revenue</div><div className="text-green-300 font-bold">{fmt$(roi.revenue_usd)}</div></div>
              <div className="bg-gray-800/60 rounded p-3"><div className="text-xs text-gray-400">Total cost</div><div className="text-red-300 font-bold">{fmt$(roi.total_cost_usd)}</div></div>
              <div className="bg-gray-800/60 rounded p-3"><div className="text-xs text-gray-400">Profit</div><div className={`font-bold ${roi.profit_usd >= 0 ? 'text-green-300' : 'text-red-300'}`}>{fmt$(roi.profit_usd)}</div></div>
              <div className="bg-gray-800/60 rounded p-3"><div className="text-xs text-gray-400">ROI</div><div className={`font-bold ${(roi.roi_pct ?? 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>{roi.roi_pct}%</div></div>
              <div className="bg-gray-800/60 rounded p-3 col-span-2"><div className="text-xs text-gray-400">Breakeven mass (g)</div><div className="text-amber-300">{roi.breakeven_mass_g ?? '—'}</div></div>
              <div className="bg-gray-800/60 rounded p-3 col-span-2 text-xs text-gray-400">Launch {fmt$(roi.launch_cost_usd)} · Return {fmt$(roi.return_cost_usd)} · Overhead {fmt$(roi.overhead_usd)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
