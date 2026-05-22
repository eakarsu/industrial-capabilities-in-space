import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Activity, TrendingUp } from 'lucide-react';

type CapRow = {
  id: string; name: string; category: string; owner: string;
  current_trl: number; target_trl: number; gap: number; maturity_score: number;
};
type MatResp = {
  generated_at: string; total: number; avg_maturity: number;
  by_category: Record<string, { count: number; avg_trl: number }>;
  capabilities: CapRow[];
};

export default function CapabilityMaturityChart() {
  const [data, setData] = useState<MatResp | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    apiFetch('/custom-views/capability-maturity').then(setData).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">Failed: {err}</div>;
  if (!data) return <div className="p-4 text-gray-500 text-sm">Loading maturity chart...</div>;

  const max = 100;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5" data-testid="capability-maturity-chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-white font-semibold">Capability Maturity</h2>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Avg score <span className="text-white font-bold ml-1">{data.avg_maturity}</span>/100
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {Object.entries(data.by_category).map(([cat, info]) => (
          <div key={cat} className="bg-gray-800 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 uppercase">{cat}</div>
            <div className="text-white text-sm font-semibold">{info.count} caps · TRL {info.avg_trl}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {data.capabilities.map(c => {
          const pct = Math.round((c.maturity_score / max) * 100);
          const colour = c.maturity_score >= 70 ? 'bg-emerald-500' : c.maturity_score >= 45 ? 'bg-amber-500' : 'bg-rose-500';
          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-44 text-sm text-gray-300 truncate" title={c.name}>{c.name}</div>
              <div className="flex-1 h-4 bg-gray-800 rounded relative overflow-hidden">
                <div className={`absolute inset-y-0 left-0 ${colour}`} style={{ width: pct + '%' }} />
                <div className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white font-mono">
                  TRL {c.current_trl}/{c.target_trl}
                </div>
              </div>
              <div className="w-12 text-right text-sm font-mono text-white">{c.maturity_score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
