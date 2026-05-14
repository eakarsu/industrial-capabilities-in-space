// On-Orbit Servicing — Northrop MEV-1/2, Astroscale ELSA-d/ELSA-M/ADRAS-J,
// Maxar OSAM-1, Redwire Archinaut, ClearSpace-1, Orbit Fab refueling.
//
// Endpoints:
//   GET    /api/servicing/missions                      — list (filters: ?status=&service_type=)
//   GET    /api/servicing/missions/:id                  — detail + rendezvous events
//   POST   /api/servicing/missions                      — create mission
//   PUT    /api/servicing/missions/:id                  — update
//   DELETE /api/servicing/missions/:id                  — delete (cascade events)
//   GET    /api/servicing/missions/:id/events           — events for mission
//   POST   /api/servicing/missions/:id/events           — log rendezvous event
//   GET    /api/servicing/stats/by-service-type         — pie data by service_type
//   GET    /api/servicing/stats/by-operator             — operator totals
//   GET    /api/servicing/stats/timeline                — events timeline
//   POST   /api/servicing/missions/:id/advance-status   — body: { to } legal transition

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

const STATUS_FLOW = {
  planned: ['in_progress', 'failed'],
  in_progress: ['completed', 'failed'],
  completed: [],
  failed: []
};

router.get('/missions', async (req, res) => {
  try {
    const { status, service_type, operator } = req.query;
    const params = [];
    const where = [];
    if (status)       { params.push(status);       where.push(`status=$${params.length}`); }
    if (service_type) { params.push(service_type); where.push(`service_type=$${params.length}`); }
    if (operator)     { params.push(`%${operator}%`); where.push(`operator ILIKE $${params.length}`); }
    const r = await pool.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM rendezvous_events e WHERE e.mission_id = m.id) AS event_count,
              (SELECT MIN(e.event_time) FROM rendezvous_events e WHERE e.mission_id = m.id) AS first_event,
              (SELECT MAX(e.event_time) FROM rendezvous_events e WHERE e.mission_id = m.id) AS last_event
       FROM servicing_missions m
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY m.rendezvous_date DESC NULLS LAST`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-service-type', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT service_type,
             COUNT(*) AS mission_count,
             COUNT(*) FILTER (WHERE status='completed') AS completed_count,
             COUNT(*) FILTER (WHERE status='in_progress') AS in_progress_count,
             COALESCE(SUM(contract_value_millions),0) AS total_contract_m,
             COALESCE(SUM(client_value_extended_years),0) AS total_years_extended
      FROM servicing_missions
      GROUP BY service_type
      ORDER BY mission_count DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-operator', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT operator,
             COUNT(*) AS mission_count,
             COUNT(*) FILTER (WHERE status='completed') AS completed,
             COUNT(*) FILTER (WHERE status IN ('in_progress','planned')) AS active_or_planned,
             COALESCE(SUM(contract_value_millions),0) AS total_contract_m
      FROM servicing_missions
      GROUP BY operator
      ORDER BY total_contract_m DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/timeline', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT e.id, e.mission_id, e.event_time, e.event_type, e.range_m,
             e.relative_velocity_mps, e.delta_v_mps, m.mission_name, m.operator
      FROM rendezvous_events e
      JOIN servicing_missions m ON m.id = e.mission_id
      ORDER BY e.event_time DESC
      LIMIT 200
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/missions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const m = await pool.query('SELECT * FROM servicing_missions WHERE id=$1', [id]);
    if (!m.rows[0]) return res.status(404).json({ error: 'Mission not found' });
    const e = await pool.query(
      'SELECT * FROM rendezvous_events WHERE mission_id=$1 ORDER BY event_time ASC',
      [id]
    );
    res.json({ ...m.rows[0], events: e.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/missions', async (req, res) => {
  try {
    const {
      mission_name, servicer_spacecraft, client_spacecraft, operator,
      service_type, orbit, rendezvous_date, service_end_date,
      contract_value_millions, status, client_value_extended_years, notes
    } = req.body || {};
    if (!mission_name) return res.status(400).json({ error: 'mission_name required' });
    const r = await pool.query(
      `INSERT INTO servicing_missions
       (mission_name, servicer_spacecraft, client_spacecraft, operator,
        service_type, orbit, rendezvous_date, service_end_date,
        contract_value_millions, status, client_value_extended_years, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [mission_name, servicer_spacecraft, client_spacecraft, operator,
       service_type, orbit, rendezvous_date, service_end_date,
       contract_value_millions, status || 'planned', client_value_extended_years, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/missions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['mission_name','servicer_spacecraft','client_spacecraft','operator',
                    'service_type','orbit','rendezvous_date','service_end_date',
                    'contract_value_millions','status','client_value_extended_years','notes'];
    const sets = [];
    const vals = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        vals.push(req.body[f]);
        sets.push(`${f}=$${vals.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(id);
    const r = await pool.query(
      `UPDATE servicing_missions SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/missions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rendezvous_events WHERE mission_id=$1', [req.params.id]);
    await pool.query('DELETE FROM servicing_missions WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/missions/:id/events', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM rendezvous_events WHERE mission_id=$1 ORDER BY event_time ASC',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/missions/:id/events', async (req, res) => {
  try {
    const mission_id = parseInt(req.params.id, 10);
    const {
      event_time, event_type, range_m, relative_velocity_mps, delta_v_mps, notes
    } = req.body || {};
    if (!event_type) return res.status(400).json({ error: 'event_type required' });
    const r = await pool.query(
      `INSERT INTO rendezvous_events
       (mission_id, event_time, event_type, range_m, relative_velocity_mps, delta_v_mps, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [mission_id, event_time || new Date().toISOString(), event_type,
       range_m, relative_velocity_mps, delta_v_mps, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/missions/:id/advance-status', async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'to required' });
    const cur = await pool.query('SELECT status FROM servicing_missions WHERE id=$1', [req.params.id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
    const allowed = STATUS_FLOW[cur.rows[0].status] || [];
    if (!allowed.includes(to)) {
      return res.status(409).json({
        error: 'Illegal transition',
        message: `Cannot go from ${cur.rows[0].status} to ${to}. Allowed: ${allowed.join(',') || 'none'}`
      });
    }
    const r = await pool.query(
      'UPDATE servicing_missions SET status=$1 WHERE id=$2 RETURNING *',
      [to, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
