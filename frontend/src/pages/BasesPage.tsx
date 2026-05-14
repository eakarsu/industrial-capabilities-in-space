import { useEffect, useState } from 'react';
import { api } from '../api';
import { Base, Mission } from '../types';
import { Plus, Search, Map, X, Edit2, Trash2, Zap, Users } from 'lucide-react';

const statusColors: Record<string, string> = {
  operational: 'bg-green-900 text-green-300',
  construction: 'bg-yellow-900 text-yellow-300',
  maintenance: 'bg-blue-900 text-blue-300',
  emergency: 'bg-red-900 text-red-300',
  standby: 'bg-gray-700 text-gray-400',
};

function BaseForm({ base, missions, onSave, onClose }: { base?: Base | null; missions: Mission[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: base?.name || '', location: base?.location || '',
    established_date: base?.established_date?.split('T')[0] || '',
    power_kw: base?.power_kw || '', crew_count: base?.crew_count || 0,
    status: base?.status || 'operational', coordinates: base?.coordinates || '',
    altitude_m: base?.altitude_m || '', total_regolith_kg: base?.total_regolith_kg || 0,
    mission_id: base?.mission_id || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (base) await api.updateBase(base.id, form);
      else await api.createBase(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{base ? 'Edit Base' : 'New Lunar Base'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Base Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm({...form,location:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['operational','construction','maintenance','emergency','standby'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Power (kW)</label>
              <input type="number" value={form.power_kw} onChange={e => setForm({...form,power_kw:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Crew Count</label>
              <input type="number" value={form.crew_count} onChange={e => setForm({...form,crew_count:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Coordinates</label>
              <input value={form.coordinates} onChange={e => setForm({...form,coordinates:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Altitude (m)</label>
              <input type="number" value={form.altitude_m} onChange={e => setForm({...form,altitude_m:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Established</label>
              <input type="date" value={form.established_date} onChange={e => setForm({...form,established_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Associated Mission</label>
              <select value={form.mission_id} onChange={e => setForm({...form,mission_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">None</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
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

export default function BasesPage() {
  const [bases, setBases] = useState<Base[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Base | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editBase, setEditBase] = useState<Base | null>(null);

  const load = async () => {
    const [b, m] = await Promise.all([api.getBases(), api.getMissions()]);
    setBases(b); setMissions(m);
  };
  useEffect(() => { load(); }, []);

  const filtered = bases.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lunar Bases</h1>
          <p className="text-gray-400 text-sm mt-1">{bases.length} bases | {bases.filter(b => b.status === 'operational').length} operational</p>
        </div>
        <button onClick={() => { setEditBase(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Base
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bases..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(b => (
          <div key={b.id} onClick={() => setSelected(b)} className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-blue-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center"><Map className="w-5 h-5 text-blue-400" /></div>
                <div>
                  <p className="text-white font-semibold">{b.name}</p>
                  <p className="text-gray-500 text-xs">{b.location}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[b.status] || 'bg-gray-700 text-gray-300'}`}>{b.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /></div>
                <p className="text-white font-bold text-sm">{b.power_kw}kW</p>
                <p className="text-gray-500 text-xs">Power</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1"><Users className="w-3 h-3 text-blue-400" /></div>
                <p className="text-white font-bold text-sm">{b.crew_count}</p>
                <p className="text-gray-500 text-xs">Crew</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <p className="text-white font-bold text-sm">{(Number(b.total_regolith_kg)/1000).toFixed(1)}t</p>
                <p className="text-gray-500 text-xs">Regolith</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.location}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditBase(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteBase(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Power', `${selected.power_kw} kW`],['Crew', selected.crew_count],['Altitude', `${selected.altitude_m}m`],['Established', selected.established_date?.split('T')[0]],['Regolith', `${(Number(selected.total_regolith_kg)/1000).toFixed(1)}t`],['Mission', selected.mission_name || '—']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.coordinates && <div><p className="text-gray-500 text-xs mb-1">Coordinates</p><p className="text-gray-300 font-mono text-sm">{selected.coordinates}</p></div>}
          </div>
        </div>
      )}
      {showForm && <BaseForm base={editBase} missions={missions} onClose={() => { setShowForm(false); setEditBase(null); }} onSave={() => { setShowForm(false); setEditBase(null); setSelected(null); load(); }} />}
    </div>
  );
}
