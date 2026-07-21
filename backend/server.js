require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { getRuntimeConfig } = require('./lib/runtime-config');

function createApp() {
  const config = getRuntimeConfig();
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(cors({
    credentials: false,
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: '256kb', strict: true }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'lunarbase-governed-manufacturing' }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/workflow', require('./routes/manufacturing'));
  app.use('/api', (_req, res) => res.status(410).json({
    error: 'This prototype or generated surface is disabled. Use the governed /api/workflow manufacturing journey.',
    code: 'UNSUPPORTED_SURFACE',
  }));

  const frontend = process.env.FRONTEND_DIST || path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontend)) {
    app.use(express.static(frontend, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(frontend, 'index.html')));
  }
  app.use((error, _req, res, _next) => {
    if (error.message === 'Origin is not allowed') return res.status(403).json({ error: 'Origin is not allowed' });
    console.error('Unhandled request error', error);
    return res.status(500).json({ error: 'Service unavailable' });
  });
  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3010);
  const server = app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`LunarBase governed manufacturing API listening on ${port}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { createApp };
