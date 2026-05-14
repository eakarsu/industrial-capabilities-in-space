import { useEffect, useState } from 'react';
import { api } from '../api';
import { Equipment, Base } from '../types';
import { Plus, Search, Wrench, AlertTriangle, X, Edit2, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  operational: 'bg-green-900 text-green-300',
  degraded: 'bg-yellow-900 text-yellow-300',
  maintenance_required: 'bg-orange-900 text-orange-300',
  offline: 'bg-red-900 text-red-300',
  decommissioned: 'bg-gray-700 text-gray-400',
};

function EquipmentForm({ eq, bases, onSave, onClose }: { eq?: Equipment | null; bases: Base[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    base_id: eq?.base_id || '', name: eq?.name || '',
    equipment_type: eq?.equipment_type || 'excavator', status: eq?.status || 'operational',
    efficiency_pct: eq?.efficiency_pct || 100, operating_hours: eq?.operating_hours || 0,
    fault_count: eq?.fault_count || 0,
    last_maintenance: eq?.last_maintenance?.slice(0,16) || '',
    next_service_at: eq?.next_service_at?.slice(0,16) || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, last_maintenance: form.last_maintenance || null, next_service_at: form.next_service_at || null };
    try {
      if (eq) await api.updateEquipment(eq.id, data); else await api.createEquipment(data);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{eq ? 'Edit Equipment' : 'New Equipment'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Base *</label>
              <select required value={form.base_id} onChange={e => setForm({...form,base_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select base...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Equipment Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.equipment_type} onChange={e => setForm({...form,equipment_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['excavator','printer','refinery','solar_array','power_storage','rover','comms'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['operational','degraded','maintenance_required','offline','decommissioned'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Efficiency (%)</label>
              <input type="number" min="0" max="100" value={form.efficiency_pct} onChange={e => setForm({...form,efficiency_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Operating Hours</label>
              <input type="number" value={form.operating_hours} onChange={e => setForm({...form,operating_hours:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Fault Count</label>
              <input type="number" value={form.fault_count} onChange={e => setForm({...form,fault_count:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Last Maintenance</label>
              <input type="datetime-local" value={form.last_maintenance} onChange={e => setForm({...form,last_maintenance:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Next Service</label>
              <input type="datetime-local" value={form.next_service_at} onChange={e => setForm({...form,next_service_at:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
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

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editEq, setEditEq] = useState<Equipment | null>(null);

  const load = async () => { const [e, b] = await Promise.all([api.getEquipment(), api.getBases()]); setEquipment(e); setBases(b); };
  useEffect(() => { load(); }, []);

  const filtered = equipment.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()) || e.base_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Fleet</h1>
          <p className="text-gray-400 text-sm mt-1">{equipment.length} units | {equipment.filter(e => e.status === 'operational').length} operational | {equipment.filter(e => e.status === 'maintenance_required' || e.status === 'offline').length} need attention</p>
        </div>
        <button onClick={() => { setEditEq(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Equipment
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Equipment','Base','Type','Efficiency','Hours','Faults','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} onClick={() => setSelected(e)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-400" /><p className="text-white text-sm">{e.name}</p></div></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{e.base_name}</td>
                <td className="px-4 py-3 text-gray-300 text-sm capitalize">{e.equipment_type}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${e.efficiency_pct >= 90 ? 'text-green-400' : e.efficiency_pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{e.efficiency_pct}%</span>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">{e.operating_hours?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {e.fault_count > 0 ? (
                    <span className="flex items-center gap-1 text-orange-400 text-sm"><AlertTriangle className="w-3 h-3" />{e.fault_count}</span>
                  ) : <span className="text-gray-400 text-sm">0</span>}
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.status] || 'bg-gray-700 text-gray-300'}`}>{e.status?.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No equipment found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm">{selected.base_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditEq(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteEquipment(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status?.replace('_', ' ')}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Type', selected.equipment_type],['Efficiency', `${selected.efficiency_pct}%`],['Operating Hours', selected.operating_hours?.toLocaleString()],['Fault Count', selected.fault_count],['Last Maint.', selected.last_maintenance?.split('T')[0]],['Next Service', selected.next_service_at?.split('T')[0] || '—']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm capitalize">{v !== null && v !== undefined ? String(v) : '—'}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showForm && <EquipmentForm eq={editEq} bases={bases} onClose={() => { setShowForm(false); setEditEq(null); }} onSave={() => { setShowForm(false); setEditEq(null); setSelected(null); load(); }} />}
    </div>
  );
}
