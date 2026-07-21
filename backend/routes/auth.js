const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { getRuntimeConfig } = require('../lib/runtime-config');
const authenticate = require('../middleware/auth');

const attempts = new Map();
function loginRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const record = attempts.get(key);
  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  record.count += 1;
  if (record.count > 20) {
    res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Too many login attempts' });
  }
  return next();
}

router.post('/login', loginRateLimit, async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 255 || password.length > 200) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const config = getRuntimeConfig();
    const r = await db.query('SELECT id,email,password,name,role,token_version FROM users WHERE lower(email)=lower($1) AND is_active=TRUE', [email.trim()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { tokenVersion: user.token_version },
      config.jwtSecret,
      { algorithm: 'HS256', subject: String(user.id), issuer: config.jwtIssuer, audience: config.jwtAudience, expiresIn: '12h' },
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
