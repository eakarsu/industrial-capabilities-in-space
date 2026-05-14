// Launch Economics — real launch vehicles (Falcon 9 @ $2,720/kg LEO, Starship
// @ $670/kg target, Vulcan, New Glenn, SLS, Ariane 6, Long March) and manifests.
// Pricing endpoint computes payload->vehicle recommendations using real published costs.
//
// Endpoints:
//   GET    /api/launch-economics/vehicles                — list vehicles
//   GET    /api/launch-economics/vehicles/:id            — vehicle detail + manifests
//   POST   /api/launch-economics/vehicles                — create vehicle
//   PUT    /api/launch-economics/vehicles/:id            — update
//   DELETE /api/launch-economics/vehicles/:id            — delete
//   GET    /api/launch-economics/manifests               — all manifests (optionally filtered)
//   POST   /api/launch-economics/manifests               — book manifest
//   POST   /api/launch-economics/recommend               — body: { payload_mass_kg, destination, reuse_preferred }
//   GET    /api/launch-economics/stats/cost-curve        — $/kg curve sorted
//   GET    /api/launch-economics/stats/by-operator       — flights+revenue per operator
//   GET    /api/launch-economics/stats/by-destination    — destination summary

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

// Mapping destination -> which payload field is the relevant capacity
function capacityField(dest) {
  if (!dest) return 'payload_leo_kg';
  const d = String(dest).toUpperCase();
  if (d === 'TLI' || d === 'LUNAR_SURFACE' || d === 'LUNAR') return 'payload_tli_kg';
  if (d === 'GTO' || d === 'MEO' || d === 'GEO') return 'payload_gto_kg';
  return 'payload_leo_kg';
}

router.get('/vehicles', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT v.*,
        (SELECT COUNT(*) FROM launch_manifests m WHERE m.vehicle_id=v.id) AS total_flights,
        (SELECT COUNT(*) FROM launch_manifests m WHERE m.vehicle_id=v.id AND m.status='success') AS success_count,
        (SELECT COALESCE(SUM(m.contract_value_millions),0) FROM launch_manifests m WHERE m.vehicle_id=v.id) AS contracted_revenue_m
      FROM launch_vehicles v
      ORDER BY v.status, v.cost_per_kg_leo NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/cost-curve', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, name, operator, payload_leo_kg, cost_per_launch_millions, cost_per_kg_leo,
             reusable, status, first_flight_year
      FROM launch_vehicles
      WHERE cost_per_kg_leo IS NOT NULL AND cost_per_kg_leo > 0
      ORDER BY cost_per_kg_leo ASC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-operator', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT v.operator,
             COUNT(DISTINCT v.id) AS vehicle_count,
             COUNT(m.id) AS manifest_count,
             COUNT(*) FILTER (WHERE m.status='success') AS success_count,
             COALESCE(SUM(m.contract_value_millions),0) AS contracted_revenue_m,
             COALESCE(SUM(m.payload_mass_kg),0) AS payload_total_kg
      FROM launch_vehicles v
      LEFT JOIN launch_manifests m ON m.vehicle_id = v.id
      GROUP BY v.operator
      ORDER BY contracted_revenue_m DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-destination', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT destination,
             COUNT(*) AS manifest_count,
             COALESCE(SUM(payload_mass_kg),0) AS payload_kg,
             COALESCE(SUM(contract_value_millions),0) AS revenue_m
      FROM launch_manifests
      WHERE destination IS NOT NULL
      GROUP BY destination
      ORDER BY payload_kg DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const v = await pool.query('SELECT * FROM launch_vehicles WHERE id=$1', [id]);
    if (!v.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    const m = await pool.query(
      'SELECT * FROM launch_manifests WHERE vehicle_id=$1 ORDER BY launch_date DESC',
      [id]
    );
    res.json({ ...v.rows[0], manifests: m.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const {
      name, operator, payload_leo_kg, payload_gto_kg, payload_tli_kg,
      cost_per_launch_millions, cost_per_kg_leo, reusable, status,
      first_flight_year, fairing_diameter_m, notes
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      `INSERT INTO launch_vehicles
       (name, operator, payload_leo_kg, payload_gto_kg, payload_tli_kg,
        cost_per_launch_millions, cost_per_kg_leo, reusable, status,
        first_flight_year, fairing_diameter_m, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, operator, payload_leo_kg, payload_gto_kg, payload_tli_kg,
       cost_per_launch_millions, cost_per_kg_leo, reusable, status || 'in_development',
       first_flight_year, fairing_diameter_m, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['name','operator','payload_leo_kg','payload_gto_kg','payload_tli_kg',
                    'cost_per_launch_millions','cost_per_kg_leo','reusable','status',
                    'first_flight_year','fairing_diameter_m','notes'];
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
      `UPDATE launch_vehicles SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM launch_manifests WHERE vehicle_id=$1', [req.params.id]);
    await pool.query('DELETE FROM launch_vehicles WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/manifests', async (req, res) => {
  try {
    const { vehicle_id, customer, destination, status } = req.query;
    const params = [];
    const where = [];
    if (vehicle_id)  { params.push(vehicle_id);             where.push(`vehicle_id=$${params.length}`); }
    if (customer)    { params.push(`%${customer}%`);        where.push(`customer ILIKE $${params.length}`); }
    if (destination) { params.push(destination);            where.push(`destination=$${params.length}`); }
    if (status)      { params.push(status);                 where.push(`status=$${params.length}`); }
    const r = await pool.query(
      `SELECT m.*, v.name AS vehicle_name, v.operator AS vehicle_operator
       FROM launch_manifests m JOIN launch_vehicles v ON v.id=m.vehicle_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY m.launch_date DESC`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/manifests', async (req, res) => {
  try {
    const {
      vehicle_id, flight_number, launch_date, payload_name, customer,
      payload_mass_kg, destination, contract_value_millions, status
    } = req.body || {};
    if (!vehicle_id || !payload_name) {
      return res.status(400).json({ error: 'vehicle_id and payload_name required' });
    }
    // Capacity check against the relevant payload field
    const v = await pool.query('SELECT * FROM launch_vehicles WHERE id=$1', [vehicle_id]);
    if (!v.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    const cap = Number(v.rows[0][capacityField(destination)] || 0);
    if (cap > 0 && Number(payload_mass_kg || 0) > cap) {
      return res.status(409).json({
        error: 'Over-capacity',
        message: `${v.rows[0].name} can carry ${cap} kg to ${destination}; payload is ${payload_mass_kg} kg.`
      });
    }
    const r = await pool.query(
      `INSERT INTO launch_manifests
       (vehicle_id, flight_number, launch_date, payload_name, customer,
        payload_mass_kg, destination, contract_value_millions, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [vehicle_id, flight_number, launch_date, payload_name, customer,
       payload_mass_kg, destination, contract_value_millions, status || 'scheduled']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommend', async (req, res) => {
  try {
    const {
      payload_mass_kg, destination = 'LEO', reuse_preferred = false
    } = req.body || {};
    if (!payload_mass_kg) return res.status(400).json({ error: 'payload_mass_kg required' });
    const field = capacityField(destination);
    const r = await pool.query(
      `SELECT id, name, operator, ${field} AS capacity_kg, cost_per_launch_millions,
              cost_per_kg_leo, reusable, status
       FROM launch_vehicles
       WHERE status='active' AND ${field} >= $1
       ORDER BY ${reuse_preferred ? 'reusable DESC, ' : ''}cost_per_kg_leo ASC NULLS LAST`,
      [payload_mass_kg]
    );
    res.json({
      payload_mass_kg: Number(payload_mass_kg),
      destination,
      candidates: r.rows.map(row => ({
        ...row,
        utilization_pct: Number(row.capacity_kg) > 0
          ? +(100 * Number(payload_mass_kg) / Number(row.capacity_kg)).toFixed(1)
          : null,
        estimated_dedicated_cost_m: Number(row.cost_per_launch_millions)
      })),
      cheapest: r.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
