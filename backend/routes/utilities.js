const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

const ENTITIES = {
  bases: { table: 'bases', searchCols: ['name', 'location', 'status', 'coordinates'] },
  missions: { table: 'missions', searchCols: ['name', 'objective', 'agency', 'status', 'current_phase'] },
  mining: { table: 'mining_operations', searchCols: ['site_name', 'method', 'status', 'notes'] },
  resources: { table: 'resources', searchCols: ['resource_type', 'storage_location', 'status'] },
  print_jobs: { table: 'print_jobs', searchCols: ['structure_name', 'structure_type', 'status', 'notes'] },
  equipment: { table: 'equipment', searchCols: ['name', 'equipment_type', 'status'] }
};

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = (v instanceof Date) ? v.toISOString() : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function rowsToCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = cols.map(csvEscape).join(',');
  const body = rows.map(r => cols.map(c => csvEscape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

async function logAudit(req, action, entity_type, entity_id, details) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user?.id || null, req.user?.email || null, action, entity_type, entity_id, details]
    );
  } catch (_) { /* swallow */ }
}

// 6. CSV export
router.get('/export/:entity', verifyToken, async (req, res) => {
  const { entity } = req.params;
  const cfg = ENTITIES[entity];
  if (!cfg) return res.status(400).json({ error: 'Unknown entity' });
  try {
    const r = await db.query(`SELECT * FROM ${cfg.table} ORDER BY id`);
    const csv = rowsToCsv(r.rows);
    await logAudit(req, 'export.csv', entity, null, `${r.rows.length} rows`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_export.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Search + filter (cross-entity)
router.get('/search', verifyToken, async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const entity = (req.query.entity || '').toString();
  const status = (req.query.status || '').toString();
  if (!q && !status) return res.json({ results: [] });
  try {
    const targets = entity && ENTITIES[entity] ? [entity] : Object.keys(ENTITIES);
    const out = [];
    for (const key of targets) {
      const cfg = ENTITIES[key];
      const where = [];
      const params = [];
      if (q) {
        const ors = cfg.searchCols.map((c) => {
          params.push('%' + q + '%');
          return `${c} ILIKE $${params.length}`;
        });
        where.push('(' + ors.join(' OR ') + ')');
      }
      if (status && cfg.searchCols.includes('status')) {
        params.push(status);
        where.push(`status = $${params.length}`);
      }
      const sql = `SELECT * FROM ${cfg.table}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 50`;
      try {
        const r = await db.query(sql, params);
        for (const row of r.rows) out.push({ entity: key, row });
      } catch (_) { /* skip entity if column missing */ }
    }
    await logAudit(req, 'search', entity || 'all', null, `q="${q}" status="${status}" hits=${out.length}`);
    res.json({ results: out, count: out.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. Audit log
router.get('/audit', verifyToken, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const action = (req.query.action || '').toString();
  const entity_type = (req.query.entity_type || '').toString();
  try {
    const where = [];
    const params = [];
    if (action) { params.push('%' + action + '%'); where.push(`action ILIKE $${params.length}`); }
    if (entity_type) { params.push(entity_type); where.push(`entity_type = $${params.length}`); }
    params.push(limit);
    const sql = `SELECT * FROM audit_log${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT $${params.length}`;
    const r = await db.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/audit', verifyToken, async (req, res) => {
  const { action, entity_type, entity_id, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  try {
    const r = await db.query(
      'INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user?.id || null, req.user?.email || null, action, entity_type || null, entity_id || null, details || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
