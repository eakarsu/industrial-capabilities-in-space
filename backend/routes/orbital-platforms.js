// Orbital Manufacturing Platforms — real platforms (Varda, Made In Space ZBLAN,
// Starlab, Orbital Reef, Vast Haven-1, Axiom, Sierra LIFE) and the batches they run.
//
// Endpoints:
//   GET    /api/orbital-platforms                    — list all platforms (+ batch stats)
//   GET    /api/orbital-platforms/:id                — platform detail + batches
//   POST   /api/orbital-platforms                    — create platform
//   PUT    /api/orbital-platforms/:id                — update
//   DELETE /api/orbital-platforms/:id                — delete
//   GET    /api/orbital-platforms/:id/batches        — list batches for platform
//   POST   /api/orbital-platforms/:id/batches        — schedule batch
//   PUT    /api/orbital-platforms/batches/:batchId   — update batch
//   POST   /api/orbital-platforms/batches/:batchId/return — mark returned to Earth
//   GET    /api/orbital-platforms/stats/utilization  — per-platform utilization
//   GET    /api/orbital-platforms/stats/products     — value rolled up by product family

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT op.*,
        (SELECT COUNT(*) FROM manufacturing_batches mb WHERE mb.platform_id = op.id) AS total_batches,
        (SELECT COUNT(*) FROM manufacturing_batches mb WHERE mb.platform_id = op.id AND mb.status='processing') AS active_batches,
        (SELECT COALESCE(SUM(mb.mass_g * mb.earth_value_per_g), 0)
           FROM manufacturing_batches mb WHERE mb.platform_id = op.id AND mb.returned_to_earth=TRUE) AS returned_value_usd
      FROM orbital_platforms op
      ORDER BY op.status, op.launch_year DESC, op.name
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/utilization', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT op.id, op.name, op.operator, op.platform_type, op.power_kw,
             COUNT(mb.id) AS batches,
             COALESCE(SUM(mb.mass_g), 0) AS total_mass_g,
             COALESCE(AVG(mb.yield_pct), 0) AS avg_yield_pct,
             COUNT(*) FILTER (WHERE mb.status='processing') AS in_progress,
             COUNT(*) FILTER (WHERE mb.returned_to_earth=TRUE) AS returned_count
      FROM orbital_platforms op
      LEFT JOIN manufacturing_batches mb ON mb.platform_id = op.id
      GROUP BY op.id, op.name, op.operator, op.platform_type, op.power_kw
      ORDER BY total_mass_g DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_mass_g: Number(row.total_mass_g),
      avg_yield_pct: Number(row.avg_yield_pct).toFixed(1)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/products', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT product_family,
             COUNT(*) AS batch_count,
             COALESCE(SUM(mass_g), 0) AS total_mass_g,
             COALESCE(SUM(mass_g * earth_value_per_g), 0) AS total_earth_value_usd,
             COALESCE(AVG(yield_pct), 0) AS avg_yield_pct
      FROM manufacturing_batches
      WHERE product_family IS NOT NULL
      GROUP BY product_family
      ORDER BY total_earth_value_usd DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      total_mass_g: Number(row.total_mass_g),
      total_earth_value_usd: Number(row.total_earth_value_usd),
      avg_yield_pct: Number(row.avg_yield_pct).toFixed(1)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const p = await pool.query('SELECT * FROM orbital_platforms WHERE id=$1', [id]);
    if (!p.rows[0]) return res.status(404).json({ error: 'Platform not found' });
    const b = await pool.query(
      'SELECT * FROM manufacturing_batches WHERE platform_id=$1 ORDER BY process_start DESC NULLS LAST',
      [id]
    );
    res.json({ ...p.rows[0], batches: b.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, operator, platform_type, orbit, altitude_km, inclination_deg,
      mass_kg, power_kw, pressurized_volume_m3, microgravity_class,
      launch_year, status, notes
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      `INSERT INTO orbital_platforms
       (name, operator, platform_type, orbit, altitude_km, inclination_deg, mass_kg,
        power_kw, pressurized_volume_m3, microgravity_class, launch_year, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, operator, platform_type, orbit, altitude_km, inclination_deg, mass_kg,
       power_kw, pressurized_volume_m3, microgravity_class, launch_year, status || 'in_development', notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['name','operator','platform_type','orbit','altitude_km','inclination_deg',
                    'mass_kg','power_kw','pressurized_volume_m3','microgravity_class',
                    'launch_year','status','notes'];
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
      `UPDATE orbital_platforms SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM manufacturing_batches WHERE platform_id=$1', [req.params.id]);
    await pool.query('DELETE FROM orbital_platforms WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/batches', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM manufacturing_batches WHERE platform_id=$1 ORDER BY process_start DESC NULLS LAST',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/batches', async (req, res) => {
  try {
    const platform_id = parseInt(req.params.id, 10);
    const {
      product_name, product_family, batch_code, mass_g, yield_pct,
      earth_value_per_g, process_start, process_end, returned_to_earth,
      return_method, defects, status, notes
    } = req.body || {};
    if (!product_name) return res.status(400).json({ error: 'product_name required' });
    const r = await pool.query(
      `INSERT INTO manufacturing_batches
       (platform_id, product_name, product_family, batch_code, mass_g, yield_pct,
        earth_value_per_g, process_start, process_end, returned_to_earth,
        return_method, defects, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [platform_id, product_name, product_family, batch_code, mass_g, yield_pct,
       earth_value_per_g, process_start, process_end, returned_to_earth || false,
       return_method, defects || 0, status || 'queued', notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/batches/:batchId', async (req, res) => {
  try {
    const id = parseInt(req.params.batchId, 10);
    const fields = ['product_name','product_family','batch_code','mass_g','yield_pct',
                    'earth_value_per_g','process_start','process_end','returned_to_earth',
                    'return_method','defects','status','notes'];
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
      `UPDATE manufacturing_batches SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:batchId/return', async (req, res) => {
  try {
    const { return_method = 'Dragon' } = req.body || {};
    const r = await pool.query(
      `UPDATE manufacturing_batches
       SET returned_to_earth=TRUE, return_method=$1, status='returned', process_end=COALESCE(process_end, NOW())
       WHERE id=$2 RETURNING *`,
      [return_method, req.params.batchId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
