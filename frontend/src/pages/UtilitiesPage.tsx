import { useEffect, useState } from 'react';
import { api } from '../api';
import { Download, Search, ScrollText, Filter } from 'lucide-react';

const ENTITIES = ['bases', 'missions', 'mining', 'resources', 'print_jobs', 'equipment'];

interface AuditRow {
  id: number; user_email: string | null; action: string;
  entity_type: string | null; entity_id: string | null;
  details: string | null; created_at: string;
}
interface SearchHit { entity: string; row: Record<string, unknown>; }

export default function UtilitiesPage() {
  const [tab, setTab] = useState<'export' | 'search' | 'audit'>('export');

  // Export
  const [exportEntity, setExportEntity] = useState('bases');
  const downloadCsv = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(api.exportCsvUrl(exportEntity), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert('Export failed: ' + res.status); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${exportEntity}_export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Search
  const [q, setQ] = useState('');
  const [searchEntity, setSearchEntity] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const runSearch = async () => {
    setSearching(true);
    try {
      const r = await api.search({ q, entity: searchEntity, status: searchStatus });
      setHits(r.results || []);
    } catch (e) { alert('Search error: ' + (e instanceof Error ? e.message : 'unknown')); }
    finally { setSearching(false); }
  };

  // Audit
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const loadAudit = async () => {
    try { setAudit(await api.getAuditLog({ limit: 200, action: actionFilter || undefined })); }
    catch (e) { alert('Audit load error: ' + (e instanceof Error ? e.message : 'unknown')); }
  };
  useEffect(() => { if (tab === 'audit') loadAudit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const tabs: { id: typeof tab; label: string; icon: typeof Download }[] = [
    { id: 'export', label: 'CSV Export', icon: Download },
    { id: 'search', label: 'Search & Filter', icon: Search },
    { id: 'audit', label: 'Audit Log', icon: ScrollText },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Utilities</h1>
          <p className="text-gray-400 text-sm">Export, cross-entity search, and audit log</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-900 border-blue-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}>
            <t.icon className="w-4 h-4" />
            <span className="text-xs">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-xl space-y-4">
          <h2 className="text-white font-semibold">Export Entity to CSV</h2>
          <p className="text-gray-400 text-sm">Download a CSV of all rows for the selected entity.</p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Entity</label>
            <select value={exportEntity} onChange={e => setExportEntity(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button onClick={downloadCsv} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Query</label>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search across all entities..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Entity</label>
              <select value={searchEntity} onChange={e => setSearchEntity(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">All</option>
                {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={searchStatus} onChange={e => setSearchStatus(e.target.value)} placeholder="status filter"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <button onClick={runSearch} disabled={searching} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {searching ? '...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-gray-500 text-xs">{hits.length} result(s)</div>
            <div className="divide-y divide-gray-800 max-h-[60vh] overflow-y-auto">
              {hits.map((h, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-800/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300">{h.entity}</span>
                    <span className="text-white text-sm">#{String((h.row as { id?: number }).id ?? '')}</span>
                  </div>
                  <pre className="text-gray-400 text-xs whitespace-pre-wrap">{JSON.stringify(h.row, null, 2).slice(0, 800)}</pre>
                </div>
              ))}
              {hits.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">No results yet</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <input value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="Filter by action (e.g. ai., export, search)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={loadAudit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Refresh</button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-gray-800">{['When', 'User', 'Action', 'Entity', 'Details'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody>
                {audit.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-300 text-xs">{r.user_email || '—'}</td>
                    <td className="px-4 py-2 text-white text-xs font-mono">{r.action}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{r.entity_type || '—'}{r.entity_id ? ` #${r.entity_id}` : ''}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{r.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audit.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">No audit entries</div>}
          </div>
        </div>
      )}
    </div>
  );
}
