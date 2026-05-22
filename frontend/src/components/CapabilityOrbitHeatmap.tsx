import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Grid3x3 } from 'lucide-react';

type Cell = { capability_id: string; capability_name: string; orbit: string; deployment_score: number; maturity_band: string };
type Resp = { generated_at: string; orbits: string[]; capabilities: { id: string; name: string }[]; cells: Cell[] };

function colourFor(score: number) {
  // viridis-like 5-stop palette
  if (score < 0.2) return 'bg-slate-800 text-slate-400';
  if (score < 0.4) return 'bg-indigo-900 text-indigo-100';
  if (score < 0.6) return 'bg-blue-700 text-blue-50';
  if (score < 0.8) return 'bg-cyan-500 text-slate-900';
  return 'bg-emerald-400 text-emerald-950';
}

export default function CapabilityOrbitHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch('/custom-views/capability-orbit-heatmap').then(setData).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">Failed: {err}</div>;
  if (!data) return <div className="p-4 text-gray-500 text-sm">Loading heatmap...</div>;

  const byKey: Record<string, Cell> = {};
  data.cells.forEach(c => { byKey[c.capability_id + '|' + c.orbit] = c; });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5" data-testid="capability-orbit-heatmap">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-white font-semibold">Capability x Orbit Heatmap</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-gray-500 font-medium">Capability \ Orbit</th>
              {data.orbits.map(o => <th key={o} className="p-2 text-center text-gray-400 font-medium">{o}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.capabilities.map(cap => (
              <tr key={cap.id}>
                <td className="p-2 text-gray-300 whitespace-nowrap">{cap.name}</td>
                {data.orbits.map(o => {
                  const c = byKey[cap.id + '|' + o];
                  const cls = c ? colourFor(c.deployment_score) : 'bg-gray-800 text-gray-500';
                  return (
                    <td key={o} className="p-1">
                      <div className={`rounded ${cls} h-9 flex flex-col items-center justify-center font-mono`} title={c ? `${cap.name} on ${o}: ${c.deployment_score} (${c.maturity_band})` : '—'}>
                        <div className="font-bold leading-none">{c ? c.deployment_score.toFixed(2) : '—'}</div>
                        <div className="text-[9px] opacity-80 leading-none">{c?.maturity_band || ''}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="text-gray-500">Legend:</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
          <span key={v} className={`px-2 py-0.5 rounded ${colourFor(v)}`}>{v.toFixed(1)}</span>
        ))}
      </div>
    </div>
  );
}
