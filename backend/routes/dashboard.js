const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/dashboard/stats — KPI counts + recent audit activity
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const safeCount = async (sql, params = []) => {
      try {
        const r = await db.query(sql, params);
        return parseInt(r.rows[0]?.count, 10) || 0;
      } catch (_) { return 0; }
    };
    const safeRows = async (sql, params = []) => {
      try {
        const r = await db.query(sql, params);
        return r.rows;
      } catch (_) { return []; }
    };

    const [
      missionsTotal, missionsActive,
      basesTotal, basesActive,
      miningTotal, miningActive,
      resourcesTotal,
      printJobsTotal, printJobsRunning,
      equipmentTotal, equipmentOperational,
      recentActivity
    ] = await Promise.all([
      safeCount('SELECT COUNT(*)::int AS count FROM missions'),
      safeCount("SELECT COUNT(*)::int AS count FROM missions WHERE status IN ('active','in_progress','launched','en_route','on_surface')"),
      safeCount('SELECT COUNT(*)::int AS count FROM bases'),
      safeCount("SELECT COUNT(*)::int AS count FROM bases WHERE status IN ('active','operational','occupied')"),
      safeCount('SELECT COUNT(*)::int AS count FROM mining_operations'),
      safeCount("SELECT COUNT(*)::int AS count FROM mining_operations WHERE status IN ('active','running','in_progress')"),
      safeCount('SELECT COUNT(*)::int AS count FROM resources'),
      safeCount('SELECT COUNT(*)::int AS count FROM print_jobs'),
      safeCount("SELECT COUNT(*)::int AS count FROM print_jobs WHERE status IN ('printing','in_progress','running','queued')"),
      safeCount('SELECT COUNT(*)::int AS count FROM equipment'),
      safeCount("SELECT COUNT(*)::int AS count FROM equipment WHERE status IN ('operational','active','online','running')"),
      safeRows('SELECT id, user_email, action, entity_type, entity_id, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10')
    ]);

    res.json({
      kpis: {
        missions:   { total: missionsTotal,   active: missionsActive },
        bases:      { total: basesTotal,      active: basesActive },
        mining:     { total: miningTotal,     active: miningActive },
        resources:  { total: resourcesTotal },
        print_jobs: { total: printJobsTotal,  running: printJobsRunning },
        equipment:  { total: equipmentTotal,  operational: equipmentOperational }
      },
      recent_activity: recentActivity,
      generated_at: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
