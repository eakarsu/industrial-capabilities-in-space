const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

// TODO: configure credentials (OPENROUTER_API_KEY) in .env
// Feature: Lunar Night Power Planner (gap-ai) — auto-scaffolded from audit gap.
// Project: industrial-capabilities-in-space

router.use(verifyToken);

async function ensureTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      feature_slug TEXT NOT NULL,
      user_id INTEGER,
      input JSONB,
      output TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Lunar Night Power Planner'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ]
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || 'AI unavailable';
  } catch (e) {
    return `AI error: ${e.message}`;
  }
}

function planLunarNightPower(body) {
  const site = body.site || body.base || 'lunar outpost';
  const nightHours = Number(body.night_hours || body.eclipse_hours || 336);
  const criticalLoadKw = Number(body.critical_load_kw || body.load_kw || 12);
  const batteryKwh = Number(body.battery_kwh || body.storage_kwh || 2800);
  const rtgKw = Number(body.rtg_kw || body.nuclear_kw || 0);
  const reservePct = Number(body.reserve_pct || 20);
  const requiredKwh = criticalLoadKw * nightHours;
  const availableKwh = batteryKwh * (1 - reservePct / 100) + rtgKw * nightHours;
  const marginKwh = availableKwh - requiredKwh;
  const status = marginKwh >= requiredKwh * 0.15 ? 'green' : marginKwh >= 0 ? 'watch' : 'red';

  return [
    `Lunar night power plan for ${site}: ${requiredKwh.toFixed(0)} kWh required for ${nightHours}h at ${criticalLoadKw} kW critical load.`,
    `Available usable energy is ${availableKwh.toFixed(0)} kWh after ${reservePct}% reserve and ${rtgKw} kW continuous generation.`,
    `Status: ${status}; margin ${marginKwh.toFixed(0)} kWh.`,
    `Recommended sequence: shed non-critical ISRU loads first, hibernate printers/rovers, keep thermal survival heaters and comms relay on protected bus.`,
    marginKwh < 0
      ? 'Mitigation: add storage, shorten active duty cycle, pre-heat assets before sunset, or add continuous nuclear/regenerative fuel-cell generation.'
      : 'Mitigation: validate battery cold derating and run a 14-day eclipse rehearsal before crewed operations.',
  ].join('\n');
}

router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const body = req.body || {};
    const systemPrompt = `You are an expert assistant for the "Lunar Night Power Planner" feature in the industrial-capabilities-in-space platform. Provide actionable, specific, structured output.`;
    const userPrompt = `Feature: Lunar Night Power Planner
Kind: gap-ai
Context:
${JSON.stringify(body, null, 2)}

Please produce:
1. Summary of what this feature should do given the input.
2. Specific recommendations or computed outputs (3-7 bullets).
3. Suggested next steps or data the operator should collect.
4. Risk / caveat callouts.`;
    const result = await callAI(userPrompt, systemPrompt) || planLunarNightPower(body);
    try {
      await pool.query(
        'INSERT INTO gap_features (feature_slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
        ['lunar-night-power', req.user?.id || null, body, result]
      );
    } catch (e) { /* persistence optional */ }
    res.json({ feature: 'Lunar Night Power Planner', kind: 'gap-ai', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(
      'SELECT id, input, output, created_at FROM gap_features WHERE feature_slug=$1 ORDER BY created_at DESC LIMIT 25',
      ['lunar-night-power']
    );
    res.json({ history: r.rows });
  } catch (err) {
    res.json({ history: [] });
  }
});

module.exports = router;
