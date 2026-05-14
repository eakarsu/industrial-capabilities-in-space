const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT pj.*, b.name as base_name FROM print_jobs pj LEFT JOIN bases b ON pj.base_id = b.id ORDER BY pj.id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT pj.*, b.name as base_name FROM print_jobs pj LEFT JOIN bases b ON pj.base_id = b.id WHERE pj.id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { base_id, structure_name, structure_type, material_used_kg, dimensions, mass_kg, status, started_at, completed_at, success, quality_score, notes } = req.body;
  try {
    const r = await db.query('INSERT INTO print_jobs (base_id,structure_name,structure_type,material_used_kg,dimensions,mass_kg,status,started_at,completed_at,success,quality_score,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [base_id, structure_name, structure_type, material_used_kg, dimensions, mass_kg, status||'queued', started_at||null, completed_at||null, success, quality_score, notes]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { base_id, structure_name, structure_type, material_used_kg, dimensions, mass_kg, status, started_at, completed_at, success, quality_score, notes } = req.body;
  try {
    const r = await db.query('UPDATE print_jobs SET base_id=$1,structure_name=$2,structure_type=$3,material_used_kg=$4,dimensions=$5,mass_kg=$6,status=$7,started_at=$8,completed_at=$9,success=$10,quality_score=$11,notes=$12 WHERE id=$13 RETURNING *',
      [base_id, structure_name, structure_type, material_used_kg, dimensions, mass_kg, status, started_at||null, completed_at||null, success, quality_score, notes, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM print_jobs WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
