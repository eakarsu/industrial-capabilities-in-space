import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  LayoutDashboard, Rocket, Map, Pickaxe, Layers, Printer, Wrench,
  Sparkles, Database, ScrollText, Loader2, AlertTriangle, RefreshCw, ArrowRight
} from 'lucide-react';

interface KPIBlock { total: number; active?: number; running?: number; operational?: number; }
interface Stats {
  kpis: {
    missions: KPIBlock; bases: KPIBlock; mining: KPIBlock;
    resources: KPIBlock; print_jobs: KPIBlock; equipment: KPIBlock;
  };
  recent_activity: Array<{
    id: number; user_email: string | null; action: string;
    entity_type: string | null; entity_id: string | null;
    details: string | null; created_at: string;
  }>;
  generated_at: string;
}

const KPI_DEFS = [
  { key: 'missions',   label: 'Active Missions',     icon: Rocket,  accent: 'text-blue-400',     ring: 'border-blue-700/40',     subKey: 'active'      as const, subLabel: 'active' },
  { key: 'bases',      label: 'Lunar Bases',         icon: Map,     accent: 'text-emerald-400',  ring: 'border-emerald-700/40',  subKey: 'active'      as const, subLabel: 'occupied' },
  { key: 'mining',     label: 'Mining Operations',   icon: Pickaxe, accent: 'text-amber-400',    ring: 'border-amber-700/40',    subKey: 'active'      as const, subLabel: 'running' },
  { key: 'resources',  label: 'Resources Catalogued',icon: Layers,  accent: 'text-cyan-400',     ring: 'border-cyan-700/40',     subKey: undefined,            subLabel: '' },
  { key: 'print_jobs', label: 'Print Jobs',          icon: Printer, accent: 'text-violet-400',   ring: 'border-violet-700/40',   subKey: 'running'     as const, subLabel: 'running' },
  { key: 'equipment',  label: 'Equipment',           icon: Wrench,  accent: 'text-rose-400',     ring: 'border-rose-700/40',     subKey: 'operational' as const, subLabel: 'operational' },
] as const;

const QUICK_ACTIONS = [
  { to: '/ai',          label: 'AI Center',   desc: 'Mission intel, extraction plans, valuations',           icon: Sparkles, color: 'bg-violet-600 hover:bg-violet-700' },
  { to: '/missions',    label: 'Missions',    desc: 'Mission roster, phases, agencies, budgets',             icon: Rocket,   color: 'bg-blue-600 hover:bg-blue-700' },
  { to: '/bases',       label: 'Lunar Bases', desc: 'Surface installations and crew assignments',            icon: Map,      color: 'bg-emerald-600 hover:bg-emerald-700' },
  { to: '/sample_data', label: 'Sample Data', desc: 'Seed domain-realistic rows for demos and smoke tests',  icon: Database, color: 'bg-slate-600 hover:bg-slate-700' },
];

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await api.getDashboardStats();
      setStats(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-400" /> Lunar Operations Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Live overview of the lunar industrial base — missions, bases, mining, resources, printing, and equipment.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border bg-red-900/40 border-red-700 text-red-200">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Failed to load dashboard: {error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {KPI_DEFS.map(({ key, label, icon: Icon, accent, ring, subKey, subLabel }) => {
          const block = stats?.kpis[key as keyof Stats['kpis']];
          const main = block?.total ?? (loading ? null : 0);
          const sub = subKey && block ? (block as KPIBlock)[subKey] : undefined;
          return (
            <div key={key} className={`bg-gray-900 border ${ring} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${accent}`} />
              </div>
              <div className="text-2xl font-bold text-white">
                {main === null ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : main}
              </div>
              {subKey && (
                <div className="text-xs text-gray-500 mt-1">
                  <span className={accent}>{sub ?? 0}</span> {subLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-blue-400" /> Recent Activity
            </h2>
            <Link to="/utilities" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Full audit log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading && !stats ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
            </div>
          ) : stats?.recent_activity?.length ? (
            <ul className="divide-y divide-gray-800">
              {stats.recent_activity.map(row => (
                <li key={row.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      <span className="font-medium text-white">{row.action}</span>
                      {row.entity_type && <span className="text-gray-500"> · {row.entity_type}</span>}
                      {row.entity_id && <span className="text-gray-600"> #{row.entity_id}</span>}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {row.user_email || 'system'}
                      {row.details ? ` — ${row.details}` : ''}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(row.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm py-6">No activity yet. Actions across the app will appear here.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${color} text-white transition-colors`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-white/70 truncate">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {stats?.generated_at && (
        <p className="text-gray-600 text-xs mt-6">
          Generated at {new Date(stats.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
