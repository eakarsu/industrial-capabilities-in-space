import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Base, ManufacturingInspection, ManufacturingWorkOrder, MaterialLot, User } from '../types';
import { CheckCircle, ClipboardCheck, Factory, FlaskConical, Plus, RefreshCw, ShieldAlert, X } from 'lucide-react';

const RELEASE_ATTESTATION = 'I verified the part revision and process limits';
const INSPECTION_ATTESTATION = 'I inspected the produced article and verified the recorded measurements';
const APPROVAL_ATTESTATION = 'I approve this article for operational use';
const OVERRIDE_ATTESTATION = 'I accept the documented mission risk for this deviation';

const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-800 text-gray-300', RELEASED: 'bg-blue-950 text-blue-300', MATERIAL_RESERVED: 'bg-indigo-950 text-indigo-300',
  IN_PROGRESS: 'bg-cyan-950 text-cyan-300', AWAITING_INSPECTION: 'bg-amber-950 text-amber-300', AWAITING_APPROVAL: 'bg-orange-950 text-orange-300',
  APPROVED: 'bg-emerald-950 text-emerald-300', REJECTED: 'bg-red-950 text-red-300', CANCELLED: 'bg-gray-900 text-gray-500',
};

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <div className="p-5 border-b border-gray-800 flex justify-between"><h2 className="text-white font-semibold">{title}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
      {children}
    </div>
  </div>;
}

const field = 'w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm';
const button = 'px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40';

export default function PrintJobsPage() {
  const user: User = JSON.parse(localStorage.getItem('user') || '{}');
  const [bases, setBases] = useState<Base[]>([]);
  const [baseId, setBaseId] = useState<number>(0);
  const [orders, setOrders] = useState<ManufacturingWorkOrder[]>([]);
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [selected, setSelected] = useState<ManufacturingWorkOrder | null>(null);
  const [modal, setModal] = useState<'lot' | 'order' | 'telemetry' | 'inspection' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canOperate = user.role === 'OPERATOR' || user.role === 'ADMIN';
  const canInspect = user.role === 'QUALITY' || user.role === 'ADMIN';
  const canApprove = user.role === 'APPROVER' || user.role === 'ADMIN';

  const reload = useCallback(async () => {
    if (!baseId) return;
    try {
      setError('');
      const [workOrders, materialLots] = await Promise.all([api.workflow.getWorkOrders(baseId), api.workflow.getLots(baseId)]);
      setOrders(workOrders.items); setLots(materialLots.items);
      if (selected) setSelected(await api.workflow.getWorkOrder(selected.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load workflow'); }
  }, [baseId, selected?.id]);

  useEffect(() => { api.workflow.getBases().then((items: Base[]) => { setBases(items); if (items[0]) setBaseId(items[0].id); }).catch((caught: Error) => setError(caught.message)); }, []);
  useEffect(() => { reload(); }, [baseId]);

  const activeLots = useMemo(() => lots.filter((lot) => lot.status === 'AVAILABLE' && Number(lot.quantity_available_kg) > 0), [lots]);
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await task(); await reload(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action failed'); }
    finally { setBusy(false); }
  };
  const action = (name: string, data: Record<string, unknown> = {}) => selected && run(() => api.workflow.action(selected.id, name, { expectedVersion: selected.version, ...data }));
  const latestInspection: ManufacturingInspection | undefined = selected?.inspections?.[selected.inspections.length - 1];

  return <div className="p-6 max-w-[1500px] mx-auto">
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-white">Traceable print work orders</h1><p className="text-gray-400 text-sm mt-1">Material lot → controlled print → telemetry → independent inspection → approval</p></div>
      <div className="flex gap-2 items-center">
        <select aria-label="Base" value={baseId} onChange={(event) => { setSelected(null); setBaseId(Number(event.target.value)); }} className={field}>{bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}</select>
        <button onClick={() => reload()} className={`${button} bg-gray-800 text-gray-200`}><RefreshCw className="w-4 h-4" /></button>
        {canOperate && <><button onClick={() => setModal('lot')} className={`${button} bg-indigo-700 text-white flex gap-2`}><FlaskConical className="w-4 h-4" />Receive lot</button><button onClick={() => setModal('order')} className={`${button} bg-blue-600 text-white flex gap-2`}><Plus className="w-4 h-4" />Work order</button></>}
      </div>
    </div>
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950/50 text-red-300 p-3 text-sm">{error}</div>}

    <div className="grid grid-cols-12 gap-5">
      <section className="col-span-7 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between"><span className="text-white font-medium">Work orders</span><span className="text-xs text-gray-500">{orders.length} records</span></div>
        <table className="w-full"><thead><tr className="text-left text-xs text-gray-500 border-b border-gray-800">{['Order / part','Revision','Material','Version','Status'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id} onClick={() => api.workflow.getWorkOrder(order.id).then(setSelected).catch((caught: Error) => setError(caught.message))} className="border-b border-gray-800 hover:bg-gray-800/60 cursor-pointer">
            <td className="px-4 py-3"><div className="text-white text-sm font-medium">{order.work_order_code}</div><div className="text-gray-500 text-xs">{order.part_number}</div></td>
            <td className="px-4 py-3 text-gray-300 text-sm">{order.revision}</td><td className="px-4 py-3 text-gray-300 text-sm">{order.material_required_kg} kg {order.required_material_type}</td>
            <td className="px-4 py-3 text-gray-400 text-sm">v{order.version}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${statusColor[order.status]}`}>{order.status.split('_').join(' ')}</span></td>
          </tr>)}</tbody></table>
        {!orders.length && <div className="py-16 text-center text-gray-600">No governed work orders for this base.</div>}
      </section>

      <section className="col-span-5 bg-gray-900 border border-gray-800 rounded-xl min-h-[520px]">
        {!selected ? <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center"><Factory className="w-10 h-10 mb-3" /><p>Select a work order to view its evidence and available controlled actions.</p></div> : <>
          <div className="p-4 border-b border-gray-800"><div className="flex justify-between gap-3"><div><h2 className="text-white font-semibold">{selected.work_order_code}</h2><p className="text-gray-500 text-xs">{selected.part_number} rev {selected.revision} · v{selected.version}</p></div><span className={`h-fit px-2 py-1 rounded text-xs ${statusColor[selected.status]}`}>{selected.status.split('_').join(' ')}</span></div></div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-xs">{[
              ['Material', `${selected.material_required_kg} kg`], ['Purity', `≥ ${selected.min_purity_pct}%`], ['Mass', `${selected.expected_mass_kg} kg ±${selected.mass_tolerance_pct}%`],
              ['Temperature', `${selected.temperature_min_c}–${selected.temperature_max_c} C`], ['Vibration', `≤ ${selected.max_vibration_mm_s} mm/s`], ['Telemetry', `${selected.telemetry?.length || 0} events`],
            ].map(([label, value]) => <div key={label} className="bg-gray-950 rounded p-2"><div className="text-gray-600">{label}</div><div className="text-gray-200 mt-1">{value}</div></div>)}</div>

            <div><h3 className="text-xs uppercase text-gray-500 mb-2">Controlled action</h3><div className="flex flex-wrap gap-2">
              {canOperate && selected.status === 'DRAFT' && <button disabled={busy} onClick={() => action('release', { attestation: RELEASE_ATTESTATION })} className={`${button} bg-blue-700 text-white`}>Release</button>}
              {canOperate && selected.status === 'RELEASED' && <button disabled={busy || !activeLots.length} onClick={() => { const eligible = activeLots.find((lot) => lot.material_type === selected.required_material_type && Number(lot.purity_pct) >= Number(selected.min_purity_pct) && Number(lot.quantity_available_kg) >= Number(selected.material_required_kg)); if (!eligible) return setError('No single available lot satisfies this work order'); action('reserve', { allocations: [{ lotId: eligible.id, quantityKg: Number(selected.material_required_kg) }] }); }} className={`${button} bg-indigo-700 text-white`}>Reserve eligible lot</button>}
              {canOperate && selected.status === 'MATERIAL_RESERVED' && <button disabled={busy} onClick={() => action('start')} className={`${button} bg-cyan-700 text-white`}>Start print</button>}
              {canOperate && selected.status === 'IN_PROGRESS' && <button disabled={busy} onClick={() => setModal('telemetry')} className={`${button} bg-cyan-700 text-white`}>Record telemetry</button>}
              {canOperate && selected.status === 'IN_PROGRESS' && <button disabled={busy} onClick={() => action('finish')} className={`${button} bg-amber-700 text-white`}>Finish print</button>}
              {canInspect && selected.status === 'AWAITING_INSPECTION' && <button disabled={busy} onClick={() => setModal('inspection')} className={`${button} bg-amber-700 text-white`}>Submit inspection</button>}
              {canApprove && selected.status === 'AWAITING_APPROVAL' && latestInspection && !latestInspection.blockers.length && <button disabled={busy} onClick={() => run(() => api.workflow.decideInspection(selected.id, { expectedVersion: selected.version, decision: 'APPROVE', attestation: APPROVAL_ATTESTATION }))} className={`${button} bg-emerald-700 text-white`}>Approve</button>}
              {canApprove && selected.status === 'AWAITING_APPROVAL' && latestInspection?.blockers.length ? <button disabled={busy} onClick={() => { const reason = window.prompt('Document the mission-risk rationale (40+ characters)'); if (reason) run(() => api.workflow.decideInspection(selected.id, { expectedVersion: selected.version, decision: 'OVERRIDE', attestation: OVERRIDE_ATTESTATION, reason })); }} className={`${button} bg-orange-700 text-white`}>Approve override</button> : null}
              {canApprove && selected.status === 'AWAITING_APPROVAL' && <button disabled={busy} onClick={() => { const reason = window.prompt('Document the rejection reason (20+ characters)'); if (reason) run(() => api.workflow.decideInspection(selected.id, { expectedVersion: selected.version, decision: 'REJECT', reason })); }} className={`${button} bg-red-800 text-white`}>Reject</button>}
              {canOperate && ['DRAFT','RELEASED','MATERIAL_RESERVED'].includes(selected.status) && <button disabled={busy} onClick={() => action('cancel')} className={`${button} bg-gray-800 text-gray-300`}>Cancel</button>}
            </div></div>

            {latestInspection && <div className="border border-gray-800 rounded-lg p-3"><div className="flex items-center gap-2 mb-2"><ClipboardCheck className="w-4 h-4 text-amber-400" /><span className="text-white text-sm font-medium">Inspection rules</span></div>
              <div className="space-y-1">{latestInspection.rules.map((rule) => <div key={rule.rule} className="flex justify-between text-xs"><span className={rule.passed ? 'text-gray-400' : 'text-red-300'}>{rule.rule.split('_').join(' ')}</span><span className={rule.passed ? 'text-emerald-400' : 'text-red-400'}>{rule.passed ? 'PASS' : 'BLOCK'}</span></div>)}</div>
              {latestInspection.decision && <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300">Decision: <strong>{latestInspection.decision}</strong></div>}
            </div>}
            <div className="border border-gray-800 rounded-lg p-3"><div className="flex gap-2 items-center mb-2"><ShieldAlert className="w-4 h-4 text-blue-400" /><span className="text-white text-sm">Evidence timeline</span></div>
              <div className="space-y-2 max-h-40 overflow-auto">{selected.events?.map((event) => <div key={String(event.id)} className="text-xs"><div className="text-gray-300">{String(event.action).split('_').join(' ')}</div><div className="text-gray-600">{new Date(String(event.created_at)).toLocaleString()} · hash {String(event.event_hash).slice(0,12)}…</div></div>)}</div>
            </div>
          </div>
        </>}
      </section>
    </div>

    {modal === 'lot' && <LotForm baseId={baseId} onClose={() => setModal(null)} onSubmit={(data) => run(async () => { await api.workflow.createLot(data); setModal(null); })} />}
    {modal === 'order' && <OrderForm baseId={baseId} onClose={() => setModal(null)} onSubmit={(data) => run(async () => { await api.workflow.createWorkOrder(data); setModal(null); })} />}
    {modal === 'telemetry' && selected && <TelemetryForm onClose={() => setModal(null)} onSubmit={(events) => run(async () => { await api.workflow.telemetry(selected.id, events); setModal(null); })} />}
    {modal === 'inspection' && selected && <InspectionForm workOrder={selected} onClose={() => setModal(null)} onSubmit={(data) => run(async () => { await api.workflow.inspect(selected.id, data); setModal(null); })} />}
  </div>;
}

function LotForm({ baseId, onClose, onSubmit }: { baseId: number; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ lotCode: '', materialType: 'regolith', quantityKg: '100', purityPct: '95', storageLocation: '', sourceSystem: '', sourceRecordId: '', certificateUrl: '', receivedAt: new Date().toISOString().slice(0,16) });
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ baseId, ...form, quantityKg: Number(form.quantityKg), purityPct: Number(form.purityPct), receivedAt: new Date(form.receivedAt).toISOString(), externalEventId: crypto.randomUUID() }); };
  return <Modal title="Receive authoritative material lot" onClose={onClose}><form onSubmit={submit} className="p-5 grid grid-cols-2 gap-3">
    {[['lotCode','Lot code'],['materialType','Material type'],['quantityKg','Quantity kg'],['purityPct','Purity %'],['storageLocation','Storage location'],['sourceSystem','Source system'],['sourceRecordId','Source record ID'],['certificateUrl','Certificate HTTPS URL']].map(([key,label]) => <label key={key} className={key === 'certificateUrl' ? 'col-span-2 text-xs text-gray-400' : 'text-xs text-gray-400'}>{label}<input required type={key.includes('Kg') || key.includes('Pct') ? 'number' : 'text'} step="any" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={`${field} mt-1`} /></label>)}
    <label className="col-span-2 text-xs text-gray-400">Received at<input required type="datetime-local" value={form.receivedAt} onChange={(event) => setForm({ ...form, receivedAt: event.target.value })} className={`${field} mt-1`} /></label>
    <button className="col-span-2 bg-indigo-700 text-white rounded-lg py-2">Record material provenance</button>
  </form></Modal>;
}

function OrderForm({ baseId, onClose, onSubmit }: { baseId: number; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ workOrderCode: '', partNumber: '', revision: 'A', description: '', requiredMaterialType: 'regolith', materialRequiredKg: '100', minPurityPct: '90', expectedMassKg: '95', massTolerancePct: '5', temperatureMinC: '100', temperatureMaxC: '300', maxVibrationMms: '8' });
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(Object.fromEntries(Object.entries({ baseId, ...form }).map(([key,value]) => [key, ['baseId','workOrderCode','partNumber','revision','description','requiredMaterialType'].includes(key) ? value : Number(value)]))); };
  return <Modal title="Create controlled work order" onClose={onClose}><form onSubmit={submit} className="p-5 grid grid-cols-2 gap-3">
    {Object.entries({ workOrderCode: 'Work order code', partNumber: 'Part number', revision: 'Revision', description: 'Description', requiredMaterialType: 'Material type', materialRequiredKg: 'Required kg', minPurityPct: 'Minimum purity %', expectedMassKg: 'Expected mass kg', massTolerancePct: 'Mass tolerance %', temperatureMinC: 'Minimum temperature C', temperatureMaxC: 'Maximum temperature C', maxVibrationMms: 'Maximum vibration mm/s' }).map(([key,label]) => <label key={key} className={key === 'description' ? 'col-span-2 text-xs text-gray-400' : 'text-xs text-gray-400'}>{label}<input required type={['workOrderCode','partNumber','revision','description','requiredMaterialType'].includes(key) ? 'text' : 'number'} step="any" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={`${field} mt-1`} /></label>)}
    <button className="col-span-2 bg-blue-600 text-white rounded-lg py-2">Create immutable version 1</button>
  </form></Modal>;
}

function TelemetryForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (events: unknown[]) => void }) {
  const [values, setValues] = useState({ temperature: '200', vibration: '3', mass: '95' });
  const submit = (event: FormEvent) => { event.preventDefault(); const capturedAt = new Date().toISOString(); onSubmit([
    { externalEventId: crypto.randomUUID(), sourceSystem: 'operator-console', metric: 'extruder_temperature_c', value: Number(values.temperature), unit: 'C', capturedAt },
    { externalEventId: crypto.randomUUID(), sourceSystem: 'operator-console', metric: 'vibration_mm_s', value: Number(values.vibration), unit: 'mm/s', capturedAt },
    { externalEventId: crypto.randomUUID(), sourceSystem: 'operator-console', metric: 'produced_mass_kg', value: Number(values.mass), unit: 'kg', capturedAt },
  ]); };
  return <Modal title="Record typed telemetry" onClose={onClose}><form onSubmit={submit} className="p-5 space-y-3">{[['temperature','Extruder temperature (C)'],['vibration','Vibration (mm/s)'],['mass','Produced mass (kg)']].map(([key,label]) => <label key={key} className="block text-xs text-gray-400">{label}<input required type="number" step="any" value={values[key as keyof typeof values]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} className={`${field} mt-1`} /></label>)}<button className="w-full bg-cyan-700 text-white rounded-lg py-2">Append telemetry events</button></form></Modal>;
}

function InspectionForm({ workOrder, onClose, onSubmit }: { workOrder: ManufacturingWorkOrder; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ qualityScore: '95', measuredMassKg: String(workOrder.expected_mass_kg), dimensionalVariancePct: '1', defectCount: '0', findings: '', evidenceUrl: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ expectedVersion: workOrder.version, qualityScore: Number(form.qualityScore), measuredMassKg: Number(form.measuredMassKg), dimensionalVariancePct: Number(form.dimensionalVariancePct), defectCount: Number(form.defectCount), findings: form.findings, evidenceUrl: form.evidenceUrl, attestation: INSPECTION_ATTESTATION }); };
  return <Modal title="Independent quality inspection" onClose={onClose}><form onSubmit={submit} className="p-5 grid grid-cols-2 gap-3">{Object.entries({ qualityScore: 'Quality score', measuredMassKg: 'Measured mass kg', dimensionalVariancePct: 'Dimensional variance %', defectCount: 'Defect count', findings: 'Findings (20+ chars)', evidenceUrl: 'Evidence HTTPS URL' }).map(([key,label]) => <label key={key} className={['findings','evidenceUrl'].includes(key) ? 'col-span-2 text-xs text-gray-400' : 'text-xs text-gray-400'}>{label}<input required type={['findings','evidenceUrl'].includes(key) ? 'text' : 'number'} step="any" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={`${field} mt-1`} /></label>)}<div className="col-span-2 text-xs text-gray-500 flex gap-2"><CheckCircle className="w-4 h-4" />Submitting records the exact inspection attestation and deterministic rule results.</div><button className="col-span-2 bg-amber-700 text-white rounded-lg py-2">Submit inspection</button></form></Modal>;
}
