// Microgravity Products Catalog — real microgravity-advantage products
// (ZBLAN fluoride fiber, ritonavir/insulin crystals, InP/InGaP semiconductors,
// retina chips, single-crystal turbine blades) with market data and ROI estimates.
//
// Endpoints:
//   GET    /api/microgravity-products                 — list (filters: ?category=&min_trl=)
//   GET    /api/microgravity-products/:id             — detail + linked manufacturing batches
//   POST   /api/microgravity-products                 — create
//   PUT    /api/microgravity-products/:id             — update
//   DELETE /api/microgravity-products/:id             — delete
//   GET    /api/microgravity-products/stats/by-category — category rollups
//   GET    /api/microgravity-products/stats/by-trl    — TRL maturity breakdown
//   POST   /api/microgravity-products/:id/roi         — body: { batch_mass_g, launch_cost_per_kg_usd, return_cost_per_kg_usd }

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { category, min_trl } = req.query;
    const params = [];
    const where = [];
    if (category) { params.push(category); where.push(`category=$${params.length}`); }
    if (min_trl)  { params.push(parseInt(min_trl, 10)); where.push(`trl >= $${params.length}`); }
    const r = await pool.query(
      `SELECT * FROM microgravity_products
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY trl DESC, earth_market_size_millions DESC`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-category', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT category,
             COUNT(*) AS product_count,
             COALESCE(SUM(earth_market_size_millions),0) AS market_size_m,
             COALESCE(AVG(trl),0) AS avg_trl,
             COALESCE(AVG(microgravity_quality_pct - earth_equivalent_quality_pct),0) AS avg_quality_uplift_pct
      FROM microgravity_products
      GROUP BY category
      ORDER BY market_size_m DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      market_size_m: Number(row.market_size_m),
      avg_trl: Number(Number(row.avg_trl).toFixed(1)),
      avg_quality_uplift_pct: Number(Number(row.avg_quality_uplift_pct).toFixed(1))
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/by-trl', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT trl,
             COUNT(*) AS product_count,
             COALESCE(SUM(earth_market_size_millions),0) AS market_size_m,
             ARRAY_AGG(product_name ORDER BY earth_market_size_millions DESC) AS sample_products
      FROM microgravity_products
      WHERE trl IS NOT NULL
      GROUP BY trl
      ORDER BY trl DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      market_size_m: Number(row.market_size_m)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const p = await pool.query('SELECT * FROM microgravity_products WHERE id=$1', [id]);
    if (!p.rows[0]) return res.status(404).json({ error: 'Product not found' });
    // Find linked manufacturing batches by family/name overlap
    const fam = p.rows[0].category;
    const name = p.rows[0].product_name;
    const b = await pool.query(
      `SELECT mb.*, op.name AS platform_name
       FROM manufacturing_batches mb
       LEFT JOIN orbital_platforms op ON op.id = mb.platform_id
       WHERE mb.product_family = $1 OR mb.product_name ILIKE $2
       ORDER BY mb.process_start DESC NULLS LAST
       LIMIT 50`,
      [fam, `%${(name || '').split(' ')[0]}%`]
    );
    res.json({ ...p.rows[0], linked_batches: b.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      product_name, category, microgravity_advantage, earth_market_size_millions,
      unit_price_usd, unit, trl, primary_developer,
      earth_equivalent_quality_pct, microgravity_quality_pct, notes
    } = req.body || {};
    if (!product_name) return res.status(400).json({ error: 'product_name required' });
    const r = await pool.query(
      `INSERT INTO microgravity_products
       (product_name, category, microgravity_advantage, earth_market_size_millions,
        unit_price_usd, unit, trl, primary_developer,
        earth_equivalent_quality_pct, microgravity_quality_pct, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [product_name, category, microgravity_advantage, earth_market_size_millions,
       unit_price_usd, unit, trl, primary_developer,
       earth_equivalent_quality_pct, microgravity_quality_pct, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fields = ['product_name','category','microgravity_advantage','earth_market_size_millions',
                    'unit_price_usd','unit','trl','primary_developer',
                    'earth_equivalent_quality_pct','microgravity_quality_pct','notes'];
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
      `UPDATE microgravity_products SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING *`,
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
    await pool.query('DELETE FROM microgravity_products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROI calc: revenue from selling produced batch vs full launch+return logistics cost.
router.post('/:id/roi', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      batch_mass_g,
      launch_cost_per_kg_usd = 2720,     // Falcon 9 published rideshare
      return_cost_per_kg_usd = 40000,    // Dragon downmass typical
      overhead_pct = 25,                 // ops/operations overhead
      yield_pct = null                   // override if not stored
    } = req.body || {};
    if (!batch_mass_g) return res.status(400).json({ error: 'batch_mass_g required' });
    const p = await pool.query('SELECT * FROM microgravity_products WHERE id=$1', [id]);
    if (!p.rows[0]) return res.status(404).json({ error: 'Product not found' });
    const prod = p.rows[0];
    const mass_g = Number(batch_mass_g);
    const effectiveYield = (yield_pct ?? (Number(prod.microgravity_quality_pct) || 80)) / 100;
    const sellable_g = mass_g * effectiveYield;
    const revenue = sellable_g * Number(prod.unit_price_usd || 0);
    const mass_kg = mass_g / 1000;
    const launch_cost = mass_kg * Number(launch_cost_per_kg_usd);
    const return_cost = mass_kg * Number(return_cost_per_kg_usd);
    const overhead = (launch_cost + return_cost) * (Number(overhead_pct) / 100);
    const total_cost = launch_cost + return_cost + overhead;
    const profit = revenue - total_cost;
    const roi_pct = total_cost > 0 ? +(100 * profit / total_cost).toFixed(1) : null;
    res.json({
      product_id: id, product_name: prod.product_name, category: prod.category,
      inputs: { batch_mass_g: mass_g, launch_cost_per_kg_usd, return_cost_per_kg_usd, overhead_pct, yield_pct: effectiveYield * 100 },
      sellable_g, revenue_usd: Math.round(revenue),
      launch_cost_usd: Math.round(launch_cost),
      return_cost_usd: Math.round(return_cost),
      overhead_usd: Math.round(overhead),
      total_cost_usd: Math.round(total_cost),
      profit_usd: Math.round(profit),
      roi_pct,
      breakeven_mass_g: Number(prod.unit_price_usd) > 0
        ? +(((launch_cost_per_kg_usd + return_cost_per_kg_usd) * (1 + overhead_pct/100)) / (Number(prod.unit_price_usd) * effectiveYield * 1000)).toFixed(4)
        : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
