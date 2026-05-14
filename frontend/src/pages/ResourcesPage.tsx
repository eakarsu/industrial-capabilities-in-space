import { useEffect, useState } from 'react';
import { api } from '../api';
import { Resource, Base } from '../types';
import { Plus, Search, Layers, X, Edit2, Trash2 } from 'lucide-react';

const typeColors: Record<string, string> = {
  silicon: 'bg-blue-900 text-blue-300', aluminum: 'bg-gray-700 text-gray-300',
  iron: 'bg-orange-900 text-orange-300', titanium: 'bg-purple-900 text-purple-300',
  oxygen: 'bg-cyan-900 text-cyan-300', water_ice: 'bg-sky-900 text-sky-300',
  helium3: 'bg-yellow-900 text-yellow-300', regolith: 'bg-stone-800 text-stone-300',
};

function ResourceForm({ res, bases, onSave, onClose }: { res?: Resource | null; bases: Base[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    base_id: res?.base_id || '', resource_type: res?.resource_type || 'silicon',
    quantity_kg: res?.quantity_kg || '', purity_pct: res?.purity_pct || '',
    extraction_date: res?.extraction_date?.split('T')[0] || '',
    storage_location: res?.storage_location || '',
    market_value_per_kg: res?.market_value_per_kg || '', status: res?.status || 'available',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (res) await api.updateResource(res.id, form); else await api.createResource(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{res ? 'Edit Resource' : 'New Resource'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Base *</label>
              <select required value={form.base_id} onChange={e => setForm({...form,base_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select base...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Resource Type</label>
              <select value={form.resource_type} onChange={e => setForm({...form,resource_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['silicon','aluminum','iron','titanium','oxygen','water_ice','helium3','regolith'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['available','processing','reserved','depleted'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Quantity (kg)</label>
              <input type="number" step="0.001" value={form.quantity_kg} onChange={e => setForm({...form,quantity_kg:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Purity (%)</label>
              <input type="number" step="0.1" value={form.purity_pct} onChange={e => setForm({...form,purity_pct:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Market Value ($/kg)</label>
              <input type="number" value={form.market_value_per_kg} onChange={e => setForm({...form,market_value_per_kg:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Extraction Date</label>
              <input type="date" value={form.extraction_date} onChange={e => setForm({...form,extraction_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Storage Location</label>
              <input value={form.storage_location} onChange={e => setForm({...form,storage_location:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
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

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editRes, setEditRes] = useState<Resource | null>(null);

  const load = async () => { const [r, b] = await Promise.all([api.getResources(), api.getBases()]); setResources(r); setBases(b); };
  useEffect(() => { load(); }, []);

  const filtered = resources.filter(r => r.resource_type?.toLowerCase().includes(search.toLowerCase()) || r.base_name?.toLowerCase().includes(search.toLowerCase()));
  const totalValue = resources.reduce((a, r) => a + Number(r.quantity_kg) * Number(r.market_value_per_kg), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resource Inventory</h1>
          <p className="text-gray-400 text-sm mt-1">{resources.length} resource caches | Est. value ${(totalValue/1e6).toFixed(1)}M</p>
        </div>
        <button onClick={() => { setEditRes(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <div key={r.id} onClick={() => setSelected(r)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[r.resource_type] || 'bg-gray-700 text-gray-300'}`}>{r.resource_type}</span>
              </div>
              <span className="text-xs text-gray-500">{r.status}</span>
            </div>
            <p className="text-gray-400 text-xs mb-2">{r.base_name}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-white font-bold text-sm">{Number(r.quantity_kg).toFixed(1)}</p><p className="text-gray-500 text-xs">kg</p></div>
              <div className="bg-gray-800 rounded-lg p-2"><p className="text-white font-bold text-sm">{r.purity_pct}%</p><p className="text-gray-500 text-xs">Purity</p></div>
            </div>
            <div className="mt-2 bg-gray-800 rounded-lg p-2">
              <p className="text-green-400 font-bold text-sm">${(Number(r.quantity_kg) * Number(r.market_value_per_kg)).toLocaleString()}</p>
              <p className="text-gray-500 text-xs">Est. Value (${Number(r.market_value_per_kg).toLocaleString()}/kg)</p>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg capitalize">{selected.resource_type}</h2><p className="text-gray-400 text-sm">{selected.base_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditRes(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteResource(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Quantity', `${Number(selected.quantity_kg).toFixed(3)} kg`],['Purity', `${selected.purity_pct}%`],['Market Value', `$${Number(selected.market_value_per_kg).toLocaleString()}/kg`],['Total Value', `$${(Number(selected.quantity_kg)*Number(selected.market_value_per_kg)).toLocaleString()}`],['Status', selected.status],['Extracted', selected.extraction_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v || '—'}</p></div>
              ))}
            </div>
            {selected.storage_location && <div><p className="text-gray-500 text-xs mb-1">Storage</p><p className="text-gray-300 text-sm">{selected.storage_location}</p></div>}
          </div>
        </div>
      )}
      {showForm && <ResourceForm res={editRes} bases={bases} onClose={() => { setShowForm(false); setEditRes(null); }} onSave={() => { setShowForm(false); setEditRes(null); setSelected(null); load(); }} />}
    </div>
  );
}
