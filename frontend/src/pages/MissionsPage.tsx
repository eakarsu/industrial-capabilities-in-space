import { useEffect, useState } from 'react';
import { api } from '../api';
import { Mission } from '../types';
import { Plus, Search, Rocket, X, Edit2, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  planning: 'bg-gray-700 text-gray-300', launched: 'bg-blue-900 text-blue-300',
  transit: 'bg-purple-900 text-purple-300', landed: 'bg-yellow-900 text-yellow-300',
  surface_ops: 'bg-green-900 text-green-300', return: 'bg-orange-900 text-orange-300',
  completed: 'bg-green-800 text-green-200', aborted: 'bg-red-900 text-red-300',
};

function MissionForm({ mission, onSave, onClose }: { mission?: Mission | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: mission?.name || '', objective: mission?.objective || '',
    crew_size: mission?.crew_size || 0, launch_date: mission?.launch_date?.split('T')[0] || '',
    landing_date: mission?.landing_date?.split('T')[0] || '', return_date: mission?.return_date?.split('T')[0] || '',
    status: mission?.status || 'planning', agency: mission?.agency || '',
    budget_billions: mission?.budget_billions || '', current_phase: mission?.current_phase || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, launch_date: form.launch_date || null, landing_date: form.landing_date || null, return_date: form.return_date || null };
    try {
      if (mission) await api.updateMission(mission.id, data); else await api.createMission(data);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{mission ? 'Edit Mission' : 'New Mission'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Mission Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Agency</label>
              <input value={form.agency} onChange={e => setForm({...form,agency:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['planning','launched','transit','landed','surface_ops','return','completed','aborted'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Crew Size</label>
              <input type="number" value={form.crew_size} onChange={e => setForm({...form,crew_size:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Budget ($B)</label>
              <input type="number" step="0.1" value={form.budget_billions} onChange={e => setForm({...form,budget_billions:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Launch Date</label>
              <input type="date" value={form.launch_date} onChange={e => setForm({...form,launch_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Landing Date</label>
              <input type="date" value={form.landing_date} onChange={e => setForm({...form,landing_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Current Phase</label>
              <input value={form.current_phase} onChange={e => setForm({...form,current_phase:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Objective</label>
              <textarea rows={3} value={form.objective} onChange={e => setForm({...form,objective:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
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

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Mission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);

  const load = async () => { setMissions(await api.getMissions()); };
  useEffect(() => { load(); }, []);

  const filtered = missions.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.agency?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Missions</h1>
          <p className="text-gray-400 text-sm mt-1">{missions.length} missions | ${missions.reduce((a,m) => a + Number(m.budget_billions), 0).toFixed(1)}B total budget</p>
        </div>
        <button onClick={() => { setEditMission(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Mission
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search missions..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(m => (
          <div key={m.id} onClick={() => setSelected(m)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><Rocket className="w-4 h-4 text-blue-400" /></div>
                <div>
                  <p className="text-white font-medium">{m.name}</p>
                  <p className="text-gray-500 text-xs">{m.agency} · {m.current_phase}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[m.status] || 'bg-gray-700 text-gray-300'}`}>{m.status}</span>
                <p className="text-gray-400 text-xs mt-1">${m.budget_billions}B</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.agency}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditMission(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteMission(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Agency', selected.agency],['Crew Size', selected.crew_size || 'Uncrewed'],['Budget', `$${selected.budget_billions}B`],['Phase', selected.current_phase],['Launch', selected.launch_date?.split('T')[0]],['Landing', selected.landing_date?.split('T')[0] || '—']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v || '—'}</p></div>
              ))}
            </div>
            {selected.objective && <div><p className="text-gray-500 text-xs mb-1">Objective</p><p className="text-gray-300 text-sm">{selected.objective}</p></div>}
          </div>
        </div>
      )}
      {showForm && <MissionForm mission={editMission} onClose={() => { setShowForm(false); setEditMission(null); }} onSave={() => { setShowForm(false); setEditMission(null); setSelected(null); load(); }} />}
    </div>
  );
}
