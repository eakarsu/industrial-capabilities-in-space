const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT r.*, b.name as base_name FROM resources r LEFT JOIN bases b ON r.base_id = b.id ORDER BY r.id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT r.*, b.name as base_name FROM resources r LEFT JOIN bases b ON r.base_id = b.id WHERE r.id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { base_id, resource_type, quantity_kg, purity_pct, extraction_date, storage_location, market_value_per_kg, status } = req.body;
  try {
    const r = await db.query('INSERT INTO resources (base_id,resource_type,quantity_kg,purity_pct,extraction_date,storage_location,market_value_per_kg,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [base_id, resource_type, quantity_kg, purity_pct, extraction_date, storage_location, market_value_per_kg, status]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { base_id, resource_type, quantity_kg, purity_pct, extraction_date, storage_location, market_value_per_kg, status } = req.body;
  try {
    const r = await db.query('UPDATE resources SET base_id=$1,resource_type=$2,quantity_kg=$3,purity_pct=$4,extraction_date=$5,storage_location=$6,market_value_per_kg=$7,status=$8 WHERE id=$9 RETURNING *',
      [base_id, resource_type, quantity_kg, purity_pct, extraction_date, storage_location, market_value_per_kg, status, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM resources WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
