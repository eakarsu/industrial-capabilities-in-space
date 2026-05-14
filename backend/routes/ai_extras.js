const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const db = require('../db');

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service not configured (OPENROUTER_API_KEY missing)');
    err.status = 503;
    throw err;
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'LunarBase'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!r.ok) {
    const err = new Error(`AI upstream error: ${r.status}`);
    err.status = 503;
    throw err;
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

async function logAudit(req, action, entity_type, entity_id, details) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user?.id || null, req.user?.email || null, action, entity_type, entity_id, details]
    );
  } catch (_) { /* never block AI on audit failures */ }
}

function handleErr(res, e) {
  if (e.status === 503) return res.status(503).json({ error: e.message });
  res.status(500).json({ error: e.message });
}

// 1. Mining Yield Predictor
router.post('/mining-yield', verifyToken, async (req, res) => {
  const { mining_op, base_context } = req.body;
  try {
    const result = await callAI(
      `Predict regolith and resource yield for this lunar mining operation over the next 30 days.\n\nMining Op: ${JSON.stringify(mining_op)}\nBase Context: ${JSON.stringify(base_context || {})}\n\nProvide:\n1. **Projected Yield (kg)** - daily, weekly, 30-day estimates\n2. **Confidence Range** - low/expected/high scenarios\n3. **Key Bottlenecks** - what limits throughput\n4. **Optimization Levers** - specific changes to boost yield\n5. **Energy Cost per kg** - efficiency analysis`,
      'You are a lunar ISRU mining yield analyst. Be quantitative and grounded in the input data.'
    );
    await logAudit(req, 'ai.mining_yield', 'mining_op', mining_op?.id, 'predicted yield');
    res.json({ result });
  } catch (e) { handleErr(res, e); }
});

// 2. Regolith Composition Classifier
router.post('/regolith-classifier', verifyToken, async (req, res) => {
  const { sample, location, depth_cm } = req.body;
  try {
    const result = await callAI(
      `Classify the likely composition and ISRU value of a lunar regolith sample.\n\nSample: ${JSON.stringify(sample || {})}\nLocation: ${location || 'unspecified'}\nDepth: ${depth_cm || 'unknown'} cm\n\nProvide:\n1. **Composition Profile** - estimated % of silicates, metals, volatiles\n2. **Mare vs Highland** classification + confidence\n3. **Volatile Likelihood** - water ice, hydrogen, helium-3 probability\n4. **Best Use Case** - 3D printing, refining, propellant, sintering\n5. **Recommended Processing Path**`,
      'You are a lunar geologist and ISRU materials scientist.'
    );
    await logAudit(req, 'ai.regolith_classify', 'regolith_sample', null, location || '');
    res.json({ result });
  } catch (e) { handleErr(res, e); }
});

// 3. EVA Risk Scorer
router.post('/eva-risk', verifyToken, async (req, res) => {
  const { eva_plan, crew, environmental } = req.body;
  try {
    const result = await callAI(
      `Score the risk of this planned lunar EVA (extra-vehicular activity).\n\nEVA Plan: ${JSON.stringify(eva_plan)}\nCrew: ${JSON.stringify(crew || {})}\nEnvironmental: ${JSON.stringify(environmental || {})}\n\nProvide:\n1. **Overall Risk Score** (0-100, with category Low/Medium/High/Critical)\n2. **Top 3 Risk Drivers** - radiation, thermal, terrain, comms, suit life-support\n3. **Go/No-Go Recommendation** with rationale\n4. **Mitigations** - concrete preflight + in-flight actions\n5. **Abort Triggers** - measurable thresholds`,
      'You are a lunar EVA safety officer with deep Apollo + Artemis surface ops experience.'
    );
    await logAudit(req, 'ai.eva_risk', 'eva', null, eva_plan?.name || '');
    res.json({ result });
  } catch (e) { handleErr(res, e); }
});

// 4. Telemetry Anomaly Detector
router.post('/telemetry-anomaly', verifyToken, async (req, res) => {
  const { equipment_list, telemetry } = req.body;
  try {
    const result = await callAI(
      `Detect anomalies in this lunar base telemetry stream.\n\nEquipment: ${JSON.stringify(equipment_list || [])}\nTelemetry sample: ${JSON.stringify(telemetry || {})}\n\nProvide:\n1. **Detected Anomalies** - unit, signal, severity\n2. **Likely Root Cause** for each\n3. **Recommended Actions** - immediate + within 24h\n4. **Cross-correlation** - related signals to monitor\n5. **False-Positive Risk** rating`,
      'You are an autonomous telemetry analyst for off-world industrial bases.'
    );
    await logAudit(req, 'ai.telemetry_anomaly', 'telemetry', null, '');
    res.json({ result });
  } catch (e) { handleErr(res, e); }
});

// 5. Supply Run Prioritizer
router.post('/supply-prioritizer', verifyToken, async (req, res) => {
  const { resources, missions, bases } = req.body;
  try {
    const result = await callAI(
      `Prioritize upcoming Earth-to-Moon supply runs based on current lunar inventory and mission needs.\n\nResources on-base: ${JSON.stringify(resources || [])}\nMissions: ${JSON.stringify(missions || [])}\nBases: ${JSON.stringify(bases || [])}\n\nProvide:\n1. **Critical Items** (rank top 10) with quantity + destination base\n2. **Risk if Delayed** per item\n3. **Cargo Mass Budget** - estimated kg per run\n4. **Suggested Manifest** for next 2 supply launches\n5. **Substitutions** - what can be made via lunar ISRU instead`,
      'You are a logistics planner for cislunar supply chain operations.'
    );
    await logAudit(req, 'ai.supply_prioritize', 'supply', null, '');
    res.json({ result });
  } catch (e) { handleErr(res, e); }
});

module.exports = router;
