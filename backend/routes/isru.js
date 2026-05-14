// In-Situ Resource Utilization — track lunar water-ice plants, Mars MOXIE-style
// CO2->O2, regolith electrolysis (Blue Alchemist) and the production runs they execute.
//
// Endpoints:
//   GET    /api/isru/sites                          — list sites + run aggregates
//   GET    /api/isru/sites/:id                      — site detail + production runs
//   POST   /api/isru/sites                          — create site
//   PUT    /api/isru/sites/:id                      — update
//   DELETE /api/isru/sites/:id                      — delete
//   GET    /api/isru/sites/:id/runs                 — production runs for site
//   POST   /api/isru/sites/:id/runs                 — record production run
//   GET    /api/isru/production-by-product          — kg + energy per output product
//   GET    /api/isru/production-by-body             — Moon vs Mars vs Asteroid totals
//   GET    /api/isru/process-efficiency             — kWh per kg by process

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/sites', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM isru_production_runs r WHERE r.site_id=s.id) AS total_runs,
        (SELECT COALESCE(SUM(r.output_kg), 0) FROM isru_production_runs r WHERE r.site_id=s.id) AS total_output_kg,
        (SELECT COALESCE(SUM(r.energy_kwh), 0) FROM isru_production_runs r WHERE r.site_id=s.id) AS total_energy_kwh,
        (SELECT COALESCE(AVG(r.purity_pct), 0) FROM isru_production_runs r WHERE r.site_id=s.id) AS avg_purity_pct
      FROM isru_sites s
      ORDER BY s.body, s.status, s.commissioning_year, s.name
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_output_kg: Number(row.total_output_kg),
      total_energy_kwh: Number(row.total_energy_kwh),
      avg_purity_pct: Number(row.avg_purity_pct).toFixed(2)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/production-by-product', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT output_product,
             COUNT(*) AS run_count,
             COALESCE(SUM(output_kg), 0) AS total_kg,
             COALESCE(SUM(energy_kwh), 0) AS total_kwh,
             COALESCE(AVG(yield_pct), 0) AS avg_yield_pct,
             COALESCE(AVG(purity_pct), 0) AS avg_purity_pct
      FROM isru_production_runs
      GROUP BY output_product
      ORDER BY total_kg DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_kg: Number(row.total_kg),
      total_kwh: Number(row.total_kwh),
      kwh_per_kg: Number(row.total_kg) > 0
        ? +(Number(row.total_kwh) / Number(row.total_kg)).toFixed(2)
        : null,
      avg_yield_pct: Number(row.avg_yield_pct).toFixed(1),
      avg_purity_pct: Number(row.avg_purity_pct).toFixed(2)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/production-by-body', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.body,
             COUNT(DISTINCT s.id) AS site_count,
             COUNT(r.id) AS run_count,
             COALESCE(SUM(r.output_kg), 0) AS total_output_kg,
             COALESCE(SUM(r.energy_kwh), 0) AS total_energy_kwh,
             COALESCE(SUM(s.capacity_kg_per_day), 0) AS installed_capacity_kg_day
      FROM isru_sites s
      LEFT JOIN isru_production_runs r ON r.site_id = s.id
      GROUP BY s.body
      ORDER BY total_output_kg DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_output_kg: Number(row.total_output_kg),
      total_energy_kwh: Number(row.total_energy_kwh),
      installed_capacity_kg_day: Number(row.installed_capacity_kg_day)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/process-efficiency', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.process,
             s.feedstock,
             COUNT(r.id) AS run_count,
             COALESCE(SUM(r.output_kg), 0) AS total_kg,
             COALESCE(SUM(r.energy_kwh), 0) AS total_kwh,
             COALESCE(AVG(r.yield_pct), 0) AS avg_yield_pct
      FROM isru_sites s
      LEFT JOIN isru_production_runs r ON r.site_id = s.id
      GROUP BY s.process, s.feedstock
      ORDER BY total_kg DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_kg: Number(row.total_kg),
      total_kwh: Number(row.total_kwh),
      kwh_per_kg: Number(row.total_kg) > 0
        ? +(Number(row.total_kwh) / Number(row.total_kg)).toFixed(2)
        : null,
      avg_yield_pct: Number(row.avg_yield_pct).toFixed(1)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sites/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const s = await pool.query('SELECT * FROM isru_sites WHERE id=$1', [id]);
    if (!s.rows[0]) return res.status(404).json({ error: 'Site not found' });
    const r = await pool.query(
      'SELECT * FROM isru_production_runs WHERE site_id=$1 ORDER BY start_time DESC',
      [id]
    );
    res.json({ ...s.rows[0], runs: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sites', async (req, res) => {
  try {
    const {
      name, body, region, feedstock, process, capacity_kg_per_day,
      power_required_kw, operator, commissioning_year, status
    } = req.body || {};
    if (!name || !body) return res.status(400).json({ error: 'name and body required' });
    const r = await pool.query(
      `INSERT INTO isru_sites
       (name, body, region, feedstock, process, capacity_kg_per_day,
        power_required_kw, operator, commissioning_year, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, body, region, feedstock, process, capacity_kg_per_day,
       power_required_kw, operator, commissioning_year, status || 'planned']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sites/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['name','body','region','feedstock','process','capacity_kg_per_day',
                    'power_required_kw','operator','commissioning_year','status'];
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
      `UPDATE isru_sites SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sites/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM isru_production_runs WHERE site_id=$1', [req.params.id]);
    await pool.query('DELETE FROM isru_sites WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sites/:id/runs', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM isru_production_runs WHERE site_id=$1 ORDER BY start_time DESC',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sites/:id/runs', async (req, res) => {
  try {
    const site_id = parseInt(req.params.id, 10);
    const {
      output_product, output_kg, start_time, end_time, energy_kwh,
      purity_pct, yield_pct, notes
    } = req.body || {};
    if (!output_product || output_kg == null) {
      return res.status(400).json({ error: 'output_product and output_kg required' });
    }
    const r = await pool.query(
      `INSERT INTO isru_production_runs
       (site_id, output_product, output_kg, start_time, end_time, energy_kwh,
        purity_pct, yield_pct, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [site_id, output_product, output_kg, start_time, end_time, energy_kwh,
       purity_pct, yield_pct, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
