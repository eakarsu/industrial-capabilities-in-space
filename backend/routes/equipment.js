const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT e.*, b.name as base_name FROM equipment e LEFT JOIN bases b ON e.base_id = b.id ORDER BY e.id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const r = await db.query('SELECT e.*, b.name as base_name FROM equipment e LEFT JOIN bases b ON e.base_id = b.id WHERE e.id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { base_id, name, equipment_type, status, last_maintenance, efficiency_pct, operating_hours, fault_count, next_service_at } = req.body;
  try {
    const r = await db.query('INSERT INTO equipment (base_id,name,equipment_type,status,last_maintenance,efficiency_pct,operating_hours,fault_count,next_service_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [base_id, name, equipment_type, status||'operational', last_maintenance||null, efficiency_pct||100, operating_hours||0, fault_count||0, next_service_at||null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { base_id, name, equipment_type, status, last_maintenance, efficiency_pct, operating_hours, fault_count, next_service_at } = req.body;
  try {
    const r = await db.query('UPDATE equipment SET base_id=$1,name=$2,equipment_type=$3,status=$4,last_maintenance=$5,efficiency_pct=$6,operating_hours=$7,fault_count=$8,next_service_at=$9 WHERE id=$10 RETURNING *',
      [base_id, name, equipment_type, status, last_maintenance||null, efficiency_pct, operating_hours, fault_count, next_service_at||null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM equipment WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
