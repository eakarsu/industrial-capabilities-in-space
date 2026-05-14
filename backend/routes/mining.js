const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT m.*, b.name as base_name FROM mining_operations m LEFT JOIN bases b ON m.base_id = b.id ORDER BY m.started_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT m.*, b.name as base_name FROM mining_operations m LEFT JOIN bases b ON m.base_id = b.id WHERE m.id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { base_id, site_name, method, regolith_kg_per_hour, depth_cm, started_at, ended_at, status, total_extracted_kg, energy_kw_consumed, notes } = req.body;
  try {
    const r = await db.query('INSERT INTO mining_operations (base_id,site_name,method,regolith_kg_per_hour,depth_cm,started_at,ended_at,status,total_extracted_kg,energy_kw_consumed,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [base_id, site_name, method, regolith_kg_per_hour, depth_cm, started_at, ended_at||null, status, total_extracted_kg||0, energy_kw_consumed||0, notes]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { base_id, site_name, method, regolith_kg_per_hour, depth_cm, started_at, ended_at, status, total_extracted_kg, energy_kw_consumed, notes } = req.body;
  try {
    const r = await db.query('UPDATE mining_operations SET base_id=$1,site_name=$2,method=$3,regolith_kg_per_hour=$4,depth_cm=$5,started_at=$6,ended_at=$7,status=$8,total_extracted_kg=$9,energy_kw_consumed=$10,notes=$11 WHERE id=$12 RETURNING *',
      [base_id, site_name, method, regolith_kg_per_hour, depth_cm, started_at, ended_at||null, status, total_extracted_kg, energy_kw_consumed, notes, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM mining_operations WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
