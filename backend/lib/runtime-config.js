const PLACEHOLDER_SECRET = /^(secret|changeme|change-me|demo|development|dev|password|jwt[_-]?secret)$/i;

function parseList(value, name) {
  const entries = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!entries.length || entries.includes('*')) throw new Error(`${name} must contain an explicit allowlist`);
  return entries;
}

function getRuntimeConfig() {
  const jwtSecret = String(process.env.JWT_SECRET || '');
  if (jwtSecret.length < 32 || PLACEHOLDER_SECRET.test(jwtSecret)) {
    throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const corsOrigins = parseList(process.env.CORS_ALLOWED_ORIGINS, 'CORS_ALLOWED_ORIGINS');
  const certificateHosts = parseList(process.env.CERTIFICATE_ALLOWED_HOSTS, 'CERTIFICATE_ALLOWED_HOSTS')
    .map((host) => host.toLowerCase());
  if (process.env.NODE_ENV === 'production' && corsOrigins.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('Production CORS origins must use HTTPS');
  }
  return {
    jwtSecret,
    corsOrigins,
    certificateHosts,
    jwtIssuer: 'lunarbase',
    jwtAudience: 'lunarbase-api',
  };
}

module.exports = { getRuntimeConfig };
