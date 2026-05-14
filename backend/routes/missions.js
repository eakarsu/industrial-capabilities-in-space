const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM missions ORDER BY launch_date DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM missions WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { name, objective, crew_size, launch_date, landing_date, return_date, status, agency, budget_billions, current_phase } = req.body;
  try {
    const r = await db.query('INSERT INTO missions (name,objective,crew_size,launch_date,landing_date,return_date,status,agency,budget_billions,current_phase) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, objective, crew_size||0, launch_date||null, landing_date||null, return_date||null, status||'planning', agency, budget_billions, current_phase]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { name, objective, crew_size, launch_date, landing_date, return_date, status, agency, budget_billions, current_phase } = req.body;
  try {
    const r = await db.query('UPDATE missions SET name=$1,objective=$2,crew_size=$3,launch_date=$4,landing_date=$5,return_date=$6,status=$7,agency=$8,budget_billions=$9,current_phase=$10 WHERE id=$11 RETURNING *',
      [name, objective, crew_size, launch_date||null, landing_date||null, return_date||null, status, agency, budget_billions, current_phase, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM missions WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
