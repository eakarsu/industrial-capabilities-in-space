const router = require('express').Router();
const verifyToken = require('../middleware/auth');

async function callAI(userPrompt, systemPrompt = '') {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'LunarBase' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), { role: 'user', content: userPrompt }] })
  });
  return (await r.json()).choices?.[0]?.message?.content || 'AI unavailable';
}

router.post('/extraction-plan', verifyToken, async (req, res) => {
  const { base_id, target_resource, available_equipment } = req.body;
  try {
    const result = await callAI(
      `Generate an optimized lunar resource extraction schedule.\n\nBase ID: ${base_id}\nTarget Resource: ${target_resource}\nAvailable Equipment: ${JSON.stringify(available_equipment)}\n\nProvide:\n1. **Extraction Schedule** - hourly/daily breakdown\n2. **Equipment Allocation** - which equipment for each task\n3. **Energy Budget** - power consumption plan\n4. **Expected Yield** - kg/week estimates\n5. **Risk Mitigation** - contingency plans`,
      'You are a lunar operations planner specializing in In-Situ Resource Utilization (ISRU). Provide detailed operational plans.'
    );
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/equipment-prediction', verifyToken, async (req, res) => {
  const { equipment_list } = req.body;
  try {
    const result = await callAI(
      `Analyze this lunar equipment fleet and predict maintenance needs and failure risks.\n\nEquipment: ${JSON.stringify(equipment_list)}\n\nProvide:\n1. **High-Risk Equipment** (failure probability >30% in next 6 months)\n2. **Maintenance Schedule** - priority order\n3. **Spare Parts Needed** - critical components list\n4. **Operational Recommendations** - reduce fault count, improve efficiency\n5. **Emergency Protocols** - for critical equipment failure scenarios`,
      'You are a predictive maintenance specialist for extreme environment robotics.'
    );
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/resource-valuation', verifyToken, async (req, res) => {
  const { resources } = req.body;
  try {
    const result = await callAI(
      `Estimate the value and strategic priority of these lunar resources.\n\nResources: ${JSON.stringify(resources)}\n\nProvide:\n1. **Total Portfolio Value** - estimated USD\n2. **Strategic Priority Ranking** - most valuable to least\n3. **Helium-3 Analysis** - fusion energy potential\n4. **Water Ice Value** - propellant and life support\n5. **Market Readiness** - timeline to commercial viability`,
      'You are a space resources economist specializing in lunar ISRU economics.'
    );
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mission-planning', verifyToken, async (req, res) => {
  const { objective, duration, crew } = req.body;
  try {
    const result = await callAI(
      `Generate a comprehensive lunar mission operations plan.\n\nObjective: ${objective}\nDuration: ${duration}\nCrew Size: ${crew}\n\nProvide:\n1. **Mission Phases** - timeline breakdown\n2. **Daily Operations Schedule** - crew tasks\n3. **Resource Requirements** - O2, water, power, food\n4. **Equipment Needs** - tools and vehicles\n5. **Contingency Plans** - abort scenarios and emergency protocols`,
      'You are a lunar mission operations planner with expertise in crewed surface operations.'
    );
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
