import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Settings, Plus, Trash2, Save, X } from 'lucide-react';

type Rule = {
  id: number;
  capability: string;
  metric: string;
  operator: string;
  threshold: number | null;
  severity: string;
  action: string;
  enabled: boolean;
  created_at: string;
};

const OPERATORS = ['>=', '>', '<=', '<', '==', '!='];
const SEVERITIES = ['minor', 'major', 'critical'];

const blank: Omit<Rule, 'id' | 'created_at'> = {
  capability: '', metric: '', operator: '>=', threshold: 0, severity: 'minor', action: '', enabled: true,
};

export default function CapabilityRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<typeof blank>(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<typeof blank>(blank);

  const load = async () => {
    try {
      const r = await apiFetch('/custom-views/capability-rules');
      setRules(r.rules || []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await apiFetch('/custom-views/capability-rules', { method: 'POST', body: JSON.stringify(draft) });
      setDraft(blank); setShowNew(false); load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const update = async (id: number) => {
    try {
      await apiFetch('/custom-views/capability-rules/' + id, { method: 'PUT', body: JSON.stringify(editDraft) });
      setEditingId(null); load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete rule?')) return;
    try {
      await apiFetch('/custom-views/capability-rules/' + id, { method: 'DELETE' });
      load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const startEdit = (r: Rule) => {
    setEditingId(r.id);
    setEditDraft({
      capability: r.capability, metric: r.metric, operator: r.operator,
      threshold: r.threshold ?? 0, severity: r.severity, action: r.action, enabled: r.enabled,
    });
  };

  const sevColor: Record<string, string> = {
    minor: 'bg-blue-900 text-blue-300', major: 'bg-amber-900 text-amber-300', critical: 'bg-rose-900 text-rose-300',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5" data-testid="capability-rules-editor">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" />
          <h2 className="text-white font-semibold">Capability Rules</h2>
          <span className="text-xs text-gray-500 ml-2">{rules.length} total · {rules.filter(r => r.enabled).length} enabled</span>
        </div>
        <button onClick={() => { setShowNew(s => !s); setDraft(blank); }}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg">
          {showNew ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showNew ? 'Cancel' : 'New Rule'}
        </button>
      </div>

      {err && <p className="text-red-400 text-xs mb-2">{err}</p>}

      {showNew && (
        <RuleForm draft={draft} setDraft={setDraft} onSave={save} />
      )}

      <div className="space-y-2 mt-3">
        {rules.map(r => (
          <div key={r.id} className="bg-gray-800/60 border border-gray-800 rounded-lg p-3">
            {editingId === r.id ? (
              <RuleForm draft={editDraft} setDraft={setEditDraft} onSave={() => update(r.id)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${sevColor[r.severity] || 'bg-gray-700'}`}>{r.severity}</span>
                    <span className="text-white font-medium text-sm truncate">{r.capability}</span>
                    {!r.enabled && <span className="text-[10px] text-gray-500">(disabled)</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {r.metric} {r.operator} {r.threshold} → {r.action || '(no action)'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800">Edit</button>
                  <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-800"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {rules.length === 0 && <p className="text-gray-500 text-sm">No rules yet.</p>}
      </div>
    </div>
  );
}

function RuleForm({ draft, setDraft, onSave, onCancel }: {
  draft: Omit<Rule, 'id' | 'created_at'>;
  setDraft: (d: Omit<Rule, 'id' | 'created_at'>) => void;
  onSave: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs items-end mb-2">
      <label className="col-span-2"><span className="block text-gray-500">Capability</span>
        <input value={draft.capability} onChange={e => setDraft({ ...draft, capability: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" /></label>
      <label><span className="block text-gray-500">Metric</span>
        <input value={draft.metric} onChange={e => setDraft({ ...draft, metric: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" /></label>
      <label><span className="block text-gray-500">Op</span>
        <select value={draft.operator} onChange={e => setDraft({ ...draft, operator: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white">
          {OPERATORS.map(o => <option key={o}>{o}</option>)}
        </select></label>
      <label><span className="block text-gray-500">Threshold</span>
        <input type="number" value={draft.threshold ?? 0} onChange={e => setDraft({ ...draft, threshold: parseFloat(e.target.value) })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" /></label>
      <label><span className="block text-gray-500">Severity</span>
        <select value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white">
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select></label>
      <label className="col-span-4"><span className="block text-gray-500">Action</span>
        <input value={draft.action} onChange={e => setDraft({ ...draft, action: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} />
        <span className="text-gray-400">Enabled</span></label>
      <div className="flex gap-2 col-span-1">
        <button onClick={onSave} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded"><Save className="w-3 h-3" />Save</button>
        {onCancel && <button onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">Cancel</button>}
      </div>
    </div>
  );
}
