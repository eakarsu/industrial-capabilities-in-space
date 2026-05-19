// Custom Views — Space Industrial Capabilities aggregations
//
// Endpoints:
//   GET    /api/custom-views/capability-maturity   — maturity timeline (TRL by capability)
//   GET    /api/custom-views/capability-orbit-heatmap — capability x orbit/body heatmap
//   GET    /api/custom-views/capability-assessment-pdf — assessment as text/html (printable)
//   GET    /api/custom-views/capability-rules      — list rules
//   POST   /api/custom-views/capability-rules      — create rule
//   PUT    /api/custom-views/capability-rules/:id  — update rule
//   DELETE /api/custom-views/capability-rules/:id  — delete rule

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

// --- In-memory rules store (no schema change required) -----------------------
let RULES_SEQ = 4;
const RULES = [
  { id: 1, capability: 'Regolith Electrolysis', metric: 'yield_pct', operator: '>=', threshold: 78, severity: 'critical', action: 'auto-throttle reactor', enabled: true, created_at: '2026-04-01T10:00:00Z' },
  { id: 2, capability: '3D Printing (Molten Regolith)', metric: 'porosity_pct', operator: '<', threshold: 4.0, severity: 'major', action: 'rerun layer scan', enabled: true, created_at: '2026-04-08T09:30:00Z' },
  { id: 3, capability: 'Cryogenic Propellant Storage', metric: 'boiloff_pct_per_day', operator: '<=', threshold: 0.6, severity: 'minor', action: 'rebalance MLI panels', enabled: false, created_at: '2026-04-18T14:12:00Z' },
];

// --- Static capability inventory (industrial capabilities in space) ----------
const CAPABILITIES = [
  { id: 'cap-ele',  name: 'Regolith Electrolysis',          category: 'ISRU',       trl: 5, owner: 'Helios Mining',    target_trl: 8 },
  { id: 'cap-3dp',  name: '3D Printing (Molten Regolith)',  category: 'Manufacturing', trl: 6, owner: 'OrbitForge',     target_trl: 9 },
  { id: 'cap-cry',  name: 'Cryogenic Propellant Storage',   category: 'Logistics',  trl: 7, owner: 'Pioneer Cryo',     target_trl: 9 },
  { id: 'cap-rob',  name: 'Tele-Robotic Assembly',          category: 'Operations', trl: 5, owner: 'Lunar Robotics',   target_trl: 8 },
  { id: 'cap-sol',  name: 'Lunar Solar Megastructures',     category: 'Power',      trl: 4, owner: 'SunBelt Lunar',    target_trl: 7 },
  { id: 'cap-hab',  name: 'Sintered Habitats',              category: 'Habitat',    trl: 3, owner: 'RegoBuild',        target_trl: 7 },
  { id: 'cap-mfg',  name: 'µg Pharma Crystallization',      category: 'Manufacturing', trl: 6, owner: 'Varda-class',   target_trl: 9 },
  { id: 'cap-min',  name: 'Asteroid Volatile Extraction',   category: 'ISRU',       trl: 3, owner: 'AstroResource',    target_trl: 7 },
];

const ORBITS = ['LEO', 'MEO', 'GEO', 'Cislunar', 'Lunar Surface', 'NEA'];

function maturityScore(cap) {
  // composite score 0-100 from TRL & gap
  const trlPct = (cap.trl / 9) * 70;
  const gap = Math.max(0, cap.target_trl - cap.trl);
  const gapPenalty = gap * 4;
  return Math.max(0, Math.min(100, Math.round(trlPct + 30 - gapPenalty)));
}

function hashish(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// 1) VIZ: Capability maturity chart -------------------------------------------
router.get('/capability-maturity', (_req, res) => {
  try {
    const rows = CAPABILITIES.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      owner: c.owner,
      current_trl: c.trl,
      target_trl: c.target_trl,
      gap: c.target_trl - c.trl,
      maturity_score: maturityScore(c),
    })).sort((a, b) => b.maturity_score - a.maturity_score);

    const by_category = {};
    rows.forEach(r => {
      if (!by_category[r.category]) by_category[r.category] = { count: 0, avg_trl: 0 };
      by_category[r.category].count += 1;
      by_category[r.category].avg_trl += r.current_trl;
    });
    Object.keys(by_category).forEach(k => {
      by_category[k].avg_trl = +(by_category[k].avg_trl / by_category[k].count).toFixed(2);
    });

    res.json({
      generated_at: new Date().toISOString(),
      total: rows.length,
      avg_maturity: +(rows.reduce((s, r) => s + r.maturity_score, 0) / rows.length).toFixed(1),
      by_category,
      capabilities: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2) VIZ: Capability x Orbit heatmap ------------------------------------------
router.get('/capability-orbit-heatmap', (_req, res) => {
  try {
    const cells = [];
    CAPABILITIES.forEach(c => {
      ORBITS.forEach(o => {
        const h = hashish(c.id + '|' + o);
        // Bias score by capability TRL & orbit familiarity
        const orbitBias = { 'LEO': 0.9, 'MEO': 0.6, 'GEO': 0.7, 'Cislunar': 0.55, 'Lunar Surface': 0.45, 'NEA': 0.3 }[o];
        const raw = ((h % 1000) / 1000) * 0.6 + (c.trl / 9) * 0.4;
        const score = +Math.max(0, Math.min(1, raw * orbitBias)).toFixed(3);
        cells.push({
          capability_id: c.id,
          capability_name: c.name,
          orbit: o,
          deployment_score: score,
          maturity_band: score > 0.7 ? 'deployed' : score > 0.45 ? 'pilot' : score > 0.2 ? 'concept' : 'gap',
        });
      });
    });
    res.json({
      generated_at: new Date().toISOString(),
      orbits: ORBITS,
      capabilities: CAPABILITIES.map(c => ({ id: c.id, name: c.name })),
      cells,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3) NON-VIZ: Capability Assessment PDF (HTML printable doc) ------------------
router.get('/capability-assessment-pdf', (req, res) => {
  try {
    const fmt = (req.query.format || 'html').toString();
    const rows = CAPABILITIES.map(c => ({ ...c, score: maturityScore(c) }))
      .sort((a, b) => b.score - a.score);
    const generated = new Date().toISOString();
    const summary = `Assessment covering ${rows.length} space industrial capabilities. ` +
      `Average composite maturity score: ${(rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1)}/100. ` +
      `Top capability: ${rows[0].name} (TRL ${rows[0].current_trl ?? rows[0].trl}). ` +
      `Lowest: ${rows[rows.length - 1].name}.`;

    if (fmt === 'json') {
      return res.json({ generated_at: generated, summary, rows, active_rules: RULES.filter(r => r.enabled).length });
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Space Industrial Capability Assessment</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1020;color:#e5e7eb;margin:0;padding:32px;}
  h1{color:#60a5fa;margin:0 0 4px;}
  .meta{color:#94a3b8;font-size:12px;margin-bottom:24px;}
  .summary{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;margin-bottom:24px;}
  table{width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #1f2937;font-size:13px;}
  th{background:#1e293b;color:#cbd5e1;text-transform:uppercase;font-size:11px;letter-spacing:.05em;}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;}
  .ok{background:#064e3b;color:#34d399;} .warn{background:#78350f;color:#fbbf24;} .bad{background:#7f1d1d;color:#fca5a5;}
  .printbtn{background:#2563eb;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;}
  footer{margin-top:32px;color:#64748b;font-size:11px;}
</style></head>
<body>
  <h1>Space Industrial Capability Assessment</h1>
  <div class="meta">Generated ${generated}  ·  <button class="printbtn" onclick="window.print()">Print / Save as PDF</button></div>
  <div class="summary">${summary}</div>
  <table>
    <thead><tr><th>#</th><th>Capability</th><th>Category</th><th>Owner</th><th>TRL</th><th>Target</th><th>Score</th><th>Status</th></tr></thead>
    <tbody>
      ${rows.map((r, i) => {
        const pill = r.score >= 70 ? 'ok' : r.score >= 45 ? 'warn' : 'bad';
        const label = r.score >= 70 ? 'mature' : r.score >= 45 ? 'developing' : 'nascent';
        return `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.category}</td><td>${r.owner}</td><td>${r.trl}</td><td>${r.target_trl}</td><td>${r.score}</td><td><span class="pill ${pill}">${label}</span></td></tr>`;
      }).join('')}
    </tbody>
  </table>
  <footer>Active capability rules: ${RULES.filter(r => r.enabled).length} / ${RULES.length} total.  Document type: ASSESSMENT-PDF.</footer>
</body></html>`;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4) NON-VIZ: Capability rules editor (CRUD) ----------------------------------
router.get('/capability-rules', (_req, res) => {
  res.json({ total: RULES.length, enabled: RULES.filter(r => r.enabled).length, rules: RULES });
});

router.post('/capability-rules', (req, res) => {
  try {
    const { capability, metric, operator, threshold, severity, action, enabled } = req.body || {};
    if (!capability || !metric || !operator) {
      return res.status(400).json({ error: 'capability, metric, and operator are required' });
    }
    const rule = {
      id: ++RULES_SEQ,
      capability: String(capability),
      metric: String(metric),
      operator: String(operator),
      threshold: threshold === undefined ? null : Number(threshold),
      severity: severity || 'minor',
      action: action || '',
      enabled: enabled !== false,
      created_at: new Date().toISOString(),
    };
    RULES.push(rule);
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/capability-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = RULES.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const cur = RULES[idx];
  const upd = req.body || {};
  RULES[idx] = {
    ...cur,
    ...upd,
    id: cur.id,
    threshold: upd.threshold === undefined ? cur.threshold : Number(upd.threshold),
    enabled: upd.enabled === undefined ? cur.enabled : !!upd.enabled,
  };
  res.json(RULES[idx]);
});

router.delete('/capability-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = RULES.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const [removed] = RULES.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

module.exports = router;
