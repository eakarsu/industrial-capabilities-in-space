import { useState } from 'react';
import { apiFetch } from '../api';
import { FileText, Download, ExternalLink } from 'lucide-react';

type AssessmentJson = {
  generated_at: string; summary: string;
  rows: { id: string; name: string; category: string; owner: string; trl: number; target_trl: number; score: number }[];
  active_rules: number;
};

export default function CapabilityAssessmentPDF() {
  const [data, setData] = useState<AssessmentJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const refresh = async () => {
    setLoading(true); setErr('');
    try {
      const j = await apiFetch('/custom-views/capability-assessment-pdf?format=json');
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  };

  const openHtml = () => {
    // open the printable HTML directly via the API. token is required so we
    // attach it as a query param fallback if needed, but most browsers will
    // proxy through Vite to localhost backend, which has auth. To keep this
    // simple we open in same origin via the proxy and inline the bearer using
    // a fetch+blob approach.
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/custom-views/capability-assessment-pdf', {
          headers: token ? { Authorization: 'Bearer ' + token } : {},
        });
        if (!res.ok) throw new Error(res.statusText);
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5" data-testid="capability-assessment-pdf">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Capability Assessment PDF</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg">
            <Download className="w-3 h-3" /> {loading ? 'Generating…' : 'Generate Preview'}
          </button>
          <button onClick={openHtml}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg">
            <ExternalLink className="w-3 h-3" /> Open Printable
          </button>
        </div>
      </div>

      {err && <p className="text-red-400 text-xs mb-2">{err}</p>}

      {!data && !err && (
        <p className="text-gray-500 text-sm">Click "Generate Preview" to render the assessment summary, then "Open Printable" to save as PDF.</p>
      )}

      {data && (
        <div className="space-y-3 text-sm">
          <div className="bg-gray-800 rounded-lg p-3 text-gray-200">{data.summary}</div>
          <div className="text-gray-500 text-xs">Generated: {data.generated_at} · Active rules: {data.active_rules}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left p-1">Capability</th>
                  <th className="text-left p-1">Category</th>
                  <th className="text-left p-1">Owner</th>
                  <th className="text-right p-1">TRL</th>
                  <th className="text-right p-1">Target</th>
                  <th className="text-right p-1">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => (
                  <tr key={r.id} className="border-t border-gray-800 text-gray-300">
                    <td className="p-1">{r.name}</td>
                    <td className="p-1">{r.category}</td>
                    <td className="p-1">{r.owner}</td>
                    <td className="p-1 text-right font-mono">{r.trl}</td>
                    <td className="p-1 text-right font-mono">{r.target_trl}</td>
                    <td className="p-1 text-right font-mono text-white">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
