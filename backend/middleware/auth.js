const jwt = require('jsonwebtoken');
const db = require('../db');
const { getRuntimeConfig } = require('../lib/runtime-config');

async function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Bearer token required' });
  const token = auth.slice(7);
  try {
    const config = getRuntimeConfig();
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'], issuer: config.jwtIssuer, audience: config.jwtAudience,
    });
    const userResult = await db.query(
      'SELECT id,email,name,role,token_version FROM users WHERE id=$1 AND is_active=TRUE',
      [decoded.sub],
    );
    const user = userResult.rows[0];
    if (!user || Number(decoded.tokenVersion) !== Number(user.token_version)) {
      return res.status(401).json({ error: 'Session is no longer active' });
    }
    const access = user.role === 'ADMIN'
      ? await db.query('SELECT id AS base_id FROM bases ORDER BY id')
      : await db.query('SELECT base_id FROM user_base_access WHERE user_id=$1 ORDER BY base_id', [user.id]);
    req.user = { ...user, baseIds: access.rows.map((row) => Number(row.base_id)) };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: 'Role is not permitted for this action' });
}

function canAccessBase(user, baseId) {
  return user?.role === 'ADMIN' || user?.baseIds?.includes(Number(baseId));
}

module.exports = verifyToken;
module.exports.requireRole = requireRole;
module.exports.canAccessBase = canAccessBase;
