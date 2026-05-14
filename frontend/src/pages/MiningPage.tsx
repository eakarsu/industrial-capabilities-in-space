import { useEffect, useState } from 'react';
import { api } from '../api';
import { MiningOperation, Base } from '../types';
import { Plus, Search, Pickaxe, X, Edit2, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-green-900 text-green-300',
  paused: 'bg-yellow-900 text-yellow-300',
  completed: 'bg-gray-700 text-gray-400',
  failed: 'bg-red-900 text-red-300',
};

function MiningForm({ op, bases, onSave, onClose }: { op?: MiningOperation | null; bases: Base[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    base_id: op?.base_id || '', site_name: op?.site_name || '',
    method: op?.method || 'surface_scoop', regolith_kg_per_hour: op?.regolith_kg_per_hour || '',
    depth_cm: op?.depth_cm || '', started_at: op?.started_at?.slice(0,16) || '',
    ended_at: op?.ended_at?.slice(0,16) || '', status: op?.status || 'active',
    total_extracted_kg: op?.total_extracted_kg || 0, energy_kw_consumed: op?.energy_kw_consumed || 0,
    notes: op?.notes || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, ended_at: form.ended_at || null };
    try {
      if (op) await api.updateMining(op.id, data); else await api.createMining(data);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{op ? 'Edit Operation' : 'New Mining Operation'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Base *</label>
              <select required value={form.base_id} onChange={e => setForm({...form,base_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select base...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Site Name *</label>
              <input required value={form.site_name} onChange={e => setForm({...form,site_name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Method</label>
              <select value={form.method} onChange={e => setForm({...form,method:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['surface_scoop','subsurface_drill','electrostatic','thermal'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Rate (kg/hr)</label>
              <input type="number" value={form.regolith_kg_per_hour} onChange={e => setForm({...form,regolith_kg_per_hour:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Depth (cm)</label>
              <input type="number" value={form.depth_cm} onChange={e => setForm({...form,depth_cm:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['active','paused','completed','failed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Energy (kW)</label>
              <input type="number" value={form.energy_kw_consumed} onChange={e => setForm({...form,energy_kw_consumed:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Started At</label>
              <input type="datetime-local" value={form.started_at} onChange={e => setForm({...form,started_at:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Ended At</label>
              <input type="datetime-local" value={form.ended_at} onChange={e => setForm({...form,ended_at:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MiningPage() {
  const [ops, setOps] = useState<MiningOperation[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MiningOperation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editOp, setEditOp] = useState<MiningOperation | null>(null);

  const load = async () => { const [o, b] = await Promise.all([api.getMining(), api.getBases()]); setOps(o); setBases(b); };
  useEffect(() => { load(); }, []);

  const filtered = ops.filter(o => o.site_name?.toLowerCase().includes(search.toLowerCase()) || o.base_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mining Operations</h1>
          <p className="text-gray-400 text-sm mt-1">{ops.filter(o => o.status === 'active').length} active operations | {ops.reduce((a,o) => a + Number(o.total_extracted_kg), 0).toLocaleString()} kg extracted</p>
        </div>
        <button onClick={() => { setEditOp(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Operation
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search operations..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Site','Base','Method','Rate','Extracted','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} onClick={() => setSelected(o)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Pickaxe className="w-4 h-4 text-blue-400" /><p className="text-white text-sm">{o.site_name}</p></div></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{o.base_name}</td>
                <td className="px-4 py-3 text-gray-300 text-sm capitalize">{o.method?.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{o.regolith_kg_per_hour} kg/h</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{Number(o.total_extracted_kg).toLocaleString()} kg</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[o.status] || 'bg-gray-700 text-gray-300'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No operations found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.site_name}</h2><p className="text-gray-400 text-sm">{selected.base_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditOp(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteMining(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Method', selected.method?.replace('_',' ')],['Rate', `${selected.regolith_kg_per_hour} kg/hr`],['Depth', `${selected.depth_cm} cm`],['Extracted', `${Number(selected.total_extracted_kg).toLocaleString()} kg`],['Energy', `${selected.energy_kw_consumed} kW`],['Started', selected.started_at?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v || '—'}</p></div>
              ))}
            </div>
            {selected.notes && <div><p className="text-gray-500 text-xs mb-1">Notes</p><p className="text-gray-300 text-sm">{selected.notes}</p></div>}
          </div>
        </div>
      )}
      {showForm && <MiningForm op={editOp} bases={bases} onClose={() => { setShowForm(false); setEditOp(null); }} onSave={() => { setShowForm(false); setEditOp(null); setSelected(null); load(); }} />}
    </div>
  );
}
