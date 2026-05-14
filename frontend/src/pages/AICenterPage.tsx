import { useState, useEffect } from 'react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';
import { Sparkles, Pickaxe, Wrench, Layers, Rocket, TrendingUp, FlaskConical, ShieldAlert, Activity, PackageSearch } from 'lucide-react';
import { Base, MiningOperation, Equipment, Resource, Mission } from '../types';

type TabId = 'extraction' | 'equipment' | 'valuation' | 'mission' | 'mining_yield' | 'regolith' | 'eva' | 'telemetry' | 'supply';

export default function AICenterPage() {
  const [bases, setBases] = useState<Base[]>([]);
  const [mining, setMining] = useState<MiningOperation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  const [activeTab, setActiveTab] = useState<TabId>('extraction');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [timestamp, setTimestamp] = useState('');

  // Extraction form
  const [exBaseId, setExBaseId] = useState('');
  const [exResource, setExResource] = useState('water_ice');

  // Mission form
  const [missionObjective, setMissionObjective] = useState('Establish water ice extraction operation and begin oxygen production');
  const [missionDuration, setMissionDuration] = useState('90 days');
  const [missionCrew, setMissionCrew] = useState('4');

  // Mining yield form
  const [miningOpId, setMiningOpId] = useState('');

  // Regolith form
  const [regLoc, setRegLoc] = useState('Mare Tranquillitatis');
  const [regDepth, setRegDepth] = useState('30');
  const [regSampleNotes, setRegSampleNotes] = useState('Gray fine-grained, low albedo, magnetic fines present');

  // EVA form
  const [evaName, setEvaName] = useState('Ice Survey EVA-12');
  const [evaDuration, setEvaDuration] = useState('5h');
  const [evaCrew, setEvaCrew] = useState('2');
  const [evaEnv, setEvaEnv] = useState('PSR, -180C, low solar angle, dust risk medium');

  useEffect(() => {
    Promise.all([api.getBases(), api.getMining(), api.getEquipment(), api.getResources(), api.getMissions()])
      .then(([b, m, e, r, mi]) => { setBases(b); setMining(m); setEquipment(e); setResources(r); setMissions(mi); })
      .catch(() => {});
  }, []);

  const run = async (fn: () => Promise<{ result: string }>) => {
    setLoading(true); setResult('');
    try {
      const r = await fn();
      setResult(r.result);
      setTimestamp(new Date().toLocaleTimeString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (msg.toLowerCase().includes('not configured') || msg.includes('503')) {
        setResult('AI service is not configured (503). Set OPENROUTER_API_KEY in your .env to enable AI analysis.');
      } else {
        setResult('Error: ' + msg);
      }
    } finally { setLoading(false); }
  };

  const tools: { id: TabId; label: string; icon: typeof Pickaxe; color: string }[] = [
    { id: 'extraction', label: 'Extraction Plan', icon: Pickaxe, color: 'text-orange-400' },
    { id: 'equipment', label: 'Equipment Prediction', icon: Wrench, color: 'text-blue-400' },
    { id: 'valuation', label: 'Resource Valuation', icon: Layers, color: 'text-green-400' },
    { id: 'mission', label: 'Mission Planning', icon: Rocket, color: 'text-purple-400' },
    { id: 'mining_yield', label: 'Mining Yield', icon: TrendingUp, color: 'text-orange-400' },
    { id: 'regolith', label: 'Regolith Classifier', icon: FlaskConical, color: 'text-yellow-400' },
    { id: 'eva', label: 'EVA Risk', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'telemetry', label: 'Telemetry Anomaly', icon: Activity, color: 'text-cyan-400' },
    { id: 'supply', label: 'Supply Prioritizer', icon: PackageSearch, color: 'text-emerald-400' },
  ];

  const selectedOp = mining.find(m => String(m.id) === miningOpId);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">AI Center</h1>
          <p className="text-gray-400 text-sm">Lunar operations AI: planning, geology, EVA, telemetry, logistics</p>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
        {tools.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(''); }}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-violet-900 border-violet-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}>
            <t.icon className={`w-4 h-4 ${t.color}`} />
            <span className="text-xs">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {activeTab === 'extraction' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Extraction Plan Generator</h2>
              <p className="text-gray-400 text-sm">Optimize resource extraction schedule for maximum yield.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { if (bases[0]) setExBaseId(String(bases[0].id)); setExResource('water_ice'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Shackleton Ice</button>
                <button type="button" onClick={() => { if (bases[0]) setExBaseId(String(bases[0].id)); setExResource('helium3'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Mare He-3</button>
                <button type="button" onClick={() => { if (bases[0]) setExBaseId(String(bases[0].id)); setExResource('titanium'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Ilmenite Ti</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Base</label>
                <select value={exBaseId} onChange={e => setExBaseId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                  <option value="">Select base...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Resource</label>
                <select value={exResource} onChange={e => setExResource(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                  {['water_ice','silicon','aluminum','iron','titanium','oxygen','helium3','regolith'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={() => run(() => api.aiExtractionPlan({ base_id: exBaseId, target_resource: exResource, available_equipment: equipment.filter(e => String(e.id) === exBaseId || true).slice(0,5) }))} disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Generate Extraction Plan
              </button>
            </div>
          )}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Equipment Failure Prediction</h2>
              <p className="text-gray-400 text-sm">Predict maintenance needs and failure risks for the entire equipment fleet.</p>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Analyzing {equipment.length} equipment units</p>
                <p className="text-gray-500 text-xs mt-1">{equipment.filter(e => e.status === 'maintenance_required' || e.fault_count > 5).length} units flagged as high risk</p>
              </div>
              <button onClick={() => run(() => api.aiEquipmentPrediction({ equipment_list: equipment }))} disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Predict Failures
              </button>
            </div>
          )}
          {activeTab === 'valuation' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Resource Portfolio Valuation</h2>
              <p className="text-gray-400 text-sm">Estimate the strategic value of all lunar resources, including Helium-3 fusion potential.</p>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{resources.length} resource caches totaling ${(resources.reduce((a,r) => a + Number(r.quantity_kg)*Number(r.market_value_per_kg), 0)/1e6).toFixed(1)}M estimated value</p>
              </div>
              <button onClick={() => run(() => api.aiResourceValuation({ resources }))} disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Valuate Resources
              </button>
            </div>
          )}
          {activeTab === 'mission' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Mission Operations Planner</h2>
              <p className="text-gray-400 text-sm">Generate a comprehensive operations plan for a lunar mission.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setMissionObjective('Establish Shackleton Crater PSR water-ice extraction operation; deploy bucket-wheel excavator and ISRU electrolysis plant to begin 200 kg/day O2 production for ascent vehicle propellant'); setMissionDuration('90 days'); setMissionCrew('4'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Shackleton Ice ISRU</button>
                <button type="button" onClick={() => { setMissionObjective('Mare Tranquillitatis He-3 prospecting campaign: deploy LIDAR mast survey, characterize ilmenite-rich regolith, return 50 kg core samples for fusion-fuel feasibility study'); setMissionDuration('45 days'); setMissionCrew('3'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">He-3 Prospect</button>
                <button type="button" onClick={() => { setMissionObjective('Aitken South Pole Basin sintered-regolith habitat construction: stand up sintered-regolith printer, fabricate 4 modular shielding bricks/day, complete 60 m2 radiation-shielded shelter shell'); setMissionDuration('180 days'); setMissionCrew('6'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Aitken Habitat</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mission Objective</label>
                <textarea rows={3} value={missionObjective} onChange={e => setMissionObjective(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Duration</label>
                  <input value={missionDuration} onChange={e => setMissionDuration(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Crew Size</label>
                  <input type="number" value={missionCrew} onChange={e => setMissionCrew(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <button onClick={() => run(() => api.aiMissionPlanning({ objective: missionObjective, duration: missionDuration, crew: missionCrew }))} disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Generate Mission Plan
              </button>
            </div>
          )}
          {activeTab === 'mining_yield' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Mining Yield Predictor</h2>
              <p className="text-gray-400 text-sm">Forecast 30-day yield for an active mining op using current rates and energy data.</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mining Operation</label>
                <select value={miningOpId} onChange={e => setMiningOpId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500">
                  <option value="">Select op...</option>
                  {mining.map(m => <option key={m.id} value={m.id}>{m.site_name} ({m.method})</option>)}
                </select>
              </div>
              {selectedOp && (
                <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                  <p>Rate: {selectedOp.regolith_kg_per_hour} kg/hr | Energy: {selectedOp.energy_kw_consumed} kW | Status: {selectedOp.status}</p>
                </div>
              )}
              <button disabled={loading || !selectedOp} onClick={() => run(() => api.aiMiningYield({ mining_op: selectedOp, base_context: bases.find(b => b.id === selectedOp?.base_id) }))}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Predict Yield
              </button>
            </div>
          )}
          {activeTab === 'regolith' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Regolith Composition Classifier</h2>
              <p className="text-gray-400 text-sm">Classify a sample by mare/highland, volatiles, and best ISRU use.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setRegLoc('Shackleton Crater PSR'); setRegDepth('45'); setRegSampleNotes('PSR floor fines, water-ice frost veneer, ilmenite-poor highlands ejecta, hydrogen anomaly +12% per LCROSS'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Shackleton PSR</button>
                <button type="button" onClick={() => { setRegLoc('Mare Tranquillitatis'); setRegDepth('30'); setRegSampleNotes('Mare basalt regolith, high ilmenite (FeTiO3), TiO2 ~7%, He-3 enriched mature soil, magnetic fines'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Tranquillitatis</button>
                <button type="button" onClick={() => { setRegLoc('Mons Hadley (Apollo 15 vicinity)'); setRegDepth('20'); setRegSampleNotes('Highland anorthositic regolith, low TiO2, plagioclase-rich, suitable for sintered-regolith printing and oxygen extraction via FFC reduction'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Hadley Highland</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Location</label>
                <input value={regLoc} onChange={e => setRegLoc(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Depth (cm)</label>
                <input type="number" value={regDepth} onChange={e => setRegDepth(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sample Notes</label>
                <textarea rows={3} value={regSampleNotes} onChange={e => setRegSampleNotes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <button disabled={loading} onClick={() => run(() => api.aiRegolithClassifier({ sample: { notes: regSampleNotes }, location: regLoc, depth_cm: Number(regDepth) }))}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Classify Sample
              </button>
            </div>
          )}
          {activeTab === 'eva' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">EVA Risk Scorer</h2>
              <p className="text-gray-400 text-sm">Score risk and produce go/no-go for a planned EVA.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setEvaName('Shackleton Rim Ice Survey EVA-12'); setEvaDuration('5h'); setEvaCrew('2'); setEvaEnv('Shackleton Crater rim, PSR margin, surface T -180C, 1.5 deg solar elevation, dust risk medium, LIDAR mast deployed'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Shackleton Ice</button>
                <button type="button" onClick={() => { setEvaName('Aitken South Pole Excavator Repair'); setEvaDuration('7h'); setEvaCrew('3'); setEvaEnv('Aitken South Pole basin, surface T -150C, intermittent comms via LRO relay, bucket-wheel excavator drive-motor swap, secondary radiation shielding required'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Aitken Repair</button>
                <button type="button" onClick={() => { setEvaName('Peary Rim Ilmenite Sample EVA'); setEvaDuration('4h'); setEvaCrew('2'); setEvaEnv('Peary Crater rim, near-continuous sunlight, T +60C/-50C swing, regolith sampling for ISRU electrolysis feedstock, low dust, GCR exposure nominal'); }}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-300">Peary Ilmenite</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">EVA Name</label>
                <input value={evaName} onChange={e => setEvaName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Duration</label>
                  <input value={evaDuration} onChange={e => setEvaDuration(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Crew Size</label>
                  <input type="number" value={evaCrew} onChange={e => setEvaCrew(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Environmental Conditions</label>
                <textarea rows={3} value={evaEnv} onChange={e => setEvaEnv(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <button disabled={loading} onClick={() => run(() => api.aiEvaRisk({ eva_plan: { name: evaName, duration: evaDuration }, crew: { size: Number(evaCrew) }, environmental: { description: evaEnv } }))}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Score EVA Risk
              </button>
            </div>
          )}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Telemetry Anomaly Detector</h2>
              <p className="text-gray-400 text-sm">Scan equipment fleet snapshot for anomalies and root causes.</p>
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                <p>Inputs: {equipment.length} units</p>
                <p className="mt-1">High fault count: {equipment.filter(e => (e.fault_count || 0) >= 5).length} | Degraded/offline: {equipment.filter(e => e.status === 'degraded' || e.status === 'offline').length}</p>
              </div>
              <button disabled={loading} onClick={() => run(() => api.aiTelemetryAnomaly({ equipment_list: equipment, telemetry: { snapshot_at: new Date().toISOString(), units: equipment.length } }))}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Detect Anomalies
              </button>
            </div>
          )}
          {activeTab === 'supply' && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Supply Run Prioritizer</h2>
              <p className="text-gray-400 text-sm">Rank Earth-to-Moon cargo based on inventory + mission needs.</p>
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                <p>Inputs: {resources.length} resource records | {missions.length} missions | {bases.length} bases</p>
              </div>
              <button disabled={loading} onClick={() => run(() => api.aiSupplyPrioritizer({ resources, missions, bases }))}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Build Prioritized Manifest
              </button>
            </div>
          )}
        </div>
        <div>
          <AIResponse content={result} loading={loading} timestamp={timestamp} />
          {!result && !loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Sparkles className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Select an AI tool to analyze lunar operations data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
