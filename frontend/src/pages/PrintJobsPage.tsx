import { useEffect, useState } from 'react';
import { api } from '../api';
import { PrintJob, Base } from '../types';
import { Plus, Search, Printer, X, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  queued: 'bg-gray-700 text-gray-300', printing: 'bg-blue-900 text-blue-300',
  cooling: 'bg-cyan-900 text-cyan-300', inspection: 'bg-yellow-900 text-yellow-300',
  completed: 'bg-green-900 text-green-300', failed: 'bg-red-900 text-red-300',
};

function PrintJobForm({ job, bases, onSave, onClose }: { job?: PrintJob | null; bases: Base[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    base_id: job?.base_id || '', structure_name: job?.structure_name || '',
    structure_type: job?.structure_type || 'habitat_panel', material_used_kg: job?.material_used_kg || '',
    dimensions: job?.dimensions || '', mass_kg: job?.mass_kg || '',
    status: job?.status || 'queued', started_at: job?.started_at?.slice(0,16) || '',
    quality_score: job?.quality_score || '', notes: job?.notes || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (job) await api.updatePrintJob(job.id, form); else await api.createPrintJob(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{job ? 'Edit Print Job' : 'New Print Job'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Base *</label>
              <select required value={form.base_id} onChange={e => setForm({...form,base_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select base...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Structure Name *</label>
              <input required value={form.structure_name} onChange={e => setForm({...form,structure_name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.structure_type} onChange={e => setForm({...form,structure_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['habitat_panel','solar_mount','antenna_bracket','pressure_vessel','landing_pad','tool','connector'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                {['queued','printing','cooling','inspection','completed','failed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Material (kg)</label>
              <input type="number" value={form.material_used_kg} onChange={e => setForm({...form,material_used_kg:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Mass (kg)</label>
              <input type="number" value={form.mass_kg} onChange={e => setForm({...form,mass_kg:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Dimensions</label>
              <input value={form.dimensions} onChange={e => setForm({...form,dimensions:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Started At</label>
              <input type="datetime-local" value={form.started_at} onChange={e => setForm({...form,started_at:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Quality Score (0-100)</label>
              <input type="number" min="0" max="100" value={form.quality_score} onChange={e => setForm({...form,quality_score:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
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

export default function PrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PrintJob | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState<PrintJob | null>(null);

  const load = async () => { const [j, b] = await Promise.all([api.getPrintJobs(), api.getBases()]); setJobs(j); setBases(b); };
  useEffect(() => { load(); }, []);

  const filtered = jobs.filter(j => j.structure_name?.toLowerCase().includes(search.toLowerCase()) || j.base_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">3D Print Jobs</h1>
          <p className="text-gray-400 text-sm mt-1">{jobs.length} jobs | {jobs.filter(j => j.status === 'printing').length} printing</p>
        </div>
        <button onClick={() => { setEditJob(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Print Job
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print jobs..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Structure','Base','Type','Material','Quality','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(j => (
              <tr key={j.id} onClick={() => setSelected(j)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Printer className="w-4 h-4 text-blue-400" /><p className="text-white text-sm">{j.structure_name}</p></div></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{j.base_name}</td>
                <td className="px-4 py-3 text-gray-300 text-sm capitalize">{j.structure_type?.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{j.material_used_kg} kg</td>
                <td className="px-4 py-3">
                  {j.quality_score !== null && j.quality_score !== undefined ? (
                    <span className={`text-sm font-medium ${j.quality_score >= 90 ? 'text-green-400' : j.quality_score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{j.quality_score}/100</span>
                  ) : <span className="text-gray-600 text-sm">—</span>}
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[j.status] || 'bg-gray-700 text-gray-300'}`}>{j.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No print jobs found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.structure_name}</h2><p className="text-gray-400 text-sm">{selected.base_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditJob(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deletePrintJob(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
              {selected.success === true && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="w-4 h-4" />Success</span>}
              {selected.success === false && <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle className="w-4 h-4" />Failed</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Type', selected.structure_type?.replace('_',' ')],['Material', `${selected.material_used_kg} kg`],['Mass', `${selected.mass_kg} kg`],['Quality', selected.quality_score !== null ? `${selected.quality_score}/100` : '—'],['Started', selected.started_at?.split('T')[0]],['Completed', selected.completed_at?.split('T')[0] || 'In Progress']].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm capitalize">{v || '—'}</p></div>
              ))}
            </div>
            {selected.dimensions && <div><p className="text-gray-500 text-xs mb-1">Dimensions</p><p className="text-gray-300 text-sm font-mono">{selected.dimensions}</p></div>}
            {selected.notes && <div><p className="text-gray-500 text-xs mb-1">Notes</p><p className="text-gray-300 text-sm">{selected.notes}</p></div>}
          </div>
        </div>
      )}
      {showForm && <PrintJobForm job={editJob} bases={bases} onClose={() => { setShowForm(false); setEditJob(null); }} onSave={() => { setShowForm(false); setEditJob(null); setSelected(null); load(); }} />}
    </div>
  );
}
