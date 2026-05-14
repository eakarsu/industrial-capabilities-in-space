import { useState } from 'react';
import { api } from '../api';
import { Database, Map, Pickaxe, Layers, Printer, Wrench, Rocket, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type EntityKey = 'missions' | 'bases' | 'mining' | 'resources' | 'print_jobs' | 'equipment';

const entities: { key: EntityKey; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: 'missions',    label: 'Missions',     desc: 'Lunar mission profiles (Shackleton-Crater Survey-7, Artemis-Aitken Forward-3, ...)', icon: Rocket,  color: 'bg-blue-600 hover:bg-blue-700' },
  { key: 'bases',       label: 'Lunar Bases',  desc: 'Aitken-South-Pole-1, Shackleton Rim Outpost, Tranquillitatis Forward Camp, ...',     icon: Map,     color: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'mining',      label: 'Mining Ops',   desc: 'He-3, water-ice and bulk regolith extraction sites with method + yield',             icon: Pickaxe, color: 'bg-amber-600 hover:bg-amber-700' },
  { key: 'resources',   label: 'Resources',    desc: 'Water-ice, He-3, ilmenite, LOX/LH2, rare-earth concentrates inventory',                icon: Layers,  color: 'bg-cyan-600 hover:bg-cyan-700' },
  { key: 'print_jobs',  label: '3D Print Jobs',desc: 'Habitat shells, airlock frames, shielding panels — sintered regolith builds',          icon: Printer, color: 'bg-violet-600 hover:bg-violet-700' },
  { key: 'equipment',   label: 'Equipment',    desc: 'LIDAR mast, drilling rigs, bucket-wheel excavator, ISRU electrolysis stack, ...',      icon: Wrench,  color: 'bg-rose-600 hover:bg-rose-700' },
];

type Toast = { kind: 'ok' | 'err'; msg: string } | null;

export default function SampleDataPage() {
  const [busy, setBusy] = useState<EntityKey | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast>(null);

  async function seed(entity: EntityKey) {
    setBusy(entity);
    setToast(null);
    try {
      const r = await api.seedSampleData(entity);
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + r.inserted }));
      setToast({ kind: 'ok', msg: `Inserted ${r.inserted} rows into ${entity}.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setToast({ kind: 'err', msg: `Failed: ${msg}` });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-400" /> Sample Data
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Insert 5–10 domain-realistic rows per entity. Useful for demos and smoke tests.
          </p>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border ${
          toast.kind === 'ok'
            ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200'
            : 'bg-red-900/40 border-red-700 text-red-200'
        }`}>
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map(({ key, label, desc, icon: Icon, color }) => {
          const inserted = counts[key] || 0;
          const isBusy = busy === key;
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{label}</p>
                  <p className="text-gray-500 text-xs">POST /api/admin/sample-data/{key}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">{desc}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => seed(key)}
                  disabled={isBusy}
                  className={`flex items-center gap-2 ${color} disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium`}
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  {isBusy ? 'Seeding…' : `Seed ${label}`}
                </button>
                <span className="text-xs text-gray-500">
                  Total inserted this session: <span className="text-white font-semibold">{inserted}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-gray-600 text-xs mt-6">
        Tip: seed Missions and Lunar Bases first — Mining/Resources/Print Jobs/Equipment reference an existing base.
      </p>
    </div>
  );
}
