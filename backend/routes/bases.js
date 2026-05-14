const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT b.*, m.name as mission_name FROM bases b LEFT JOIN missions m ON b.mission_id = m.id ORDER BY b.id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT b.*, m.name as mission_name FROM bases b LEFT JOIN missions m ON b.mission_id = m.id WHERE b.id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { name, location, established_date, power_kw, crew_count, status, coordinates, altitude_m, total_regolith_kg, mission_id } = req.body;
  try {
    const r = await db.query('INSERT INTO bases (name,location,established_date,power_kw,crew_count,status,coordinates,altitude_m,total_regolith_kg,mission_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, location, established_date, power_kw, crew_count, status, coordinates, altitude_m, total_regolith_kg || 0, mission_id || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { name, location, established_date, power_kw, crew_count, status, coordinates, altitude_m, total_regolith_kg, mission_id } = req.body;
  try {
    const r = await db.query('UPDATE bases SET name=$1,location=$2,established_date=$3,power_kw=$4,crew_count=$5,status=$6,coordinates=$7,altitude_m=$8,total_regolith_kg=$9,mission_id=$10 WHERE id=$11 RETURNING *',
      [name, location, established_date, power_kw, crew_count, status, coordinates, altitude_m, total_regolith_kg, mission_id || null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM bases WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
