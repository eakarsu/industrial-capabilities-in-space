const bcrypt = require('bcrypt');
const db = require('../db');

async function main() {
  const email = String(process.env.PROVISION_EMAIL || process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_NAME || process.env.PROVISION_ADMIN_NAME || process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
  const role = String(process.env.PROVISION_ROLE || (process.env.ALLOW_DISPOSABLE_SEED === 'YES' ? 'ADMIN' : '')).trim().toUpperCase();
  const baseIds = String(process.env.PROVISION_BASE_IDS || '').split(',').map(Number).filter(Number.isInteger);
  if (!email.includes('@') || password.length < 12 || !name || !['OPERATOR','QUALITY','APPROVER','ADMIN'].includes(role)) {
    throw new Error('PROVISION_EMAIL, PROVISION_PASSWORD (12+ chars), PROVISION_NAME, and a valid PROVISION_ROLE are required');
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      `INSERT INTO users(email,password,name,role,is_active) VALUES($1,$2,$3,$4,TRUE)
       ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role=EXCLUDED.role,is_active=TRUE,token_version=users.token_version+1,updated_at=NOW()
       RETURNING id,email,role`,
      [email, hash, name, role],
    );
    await client.query('DELETE FROM user_base_access WHERE user_id=$1', [result.rows[0].id]);
    if (role !== 'ADMIN') {
      for (const baseId of [...new Set(baseIds)]) {
        await client.query('INSERT INTO user_base_access(user_id,base_id) VALUES($1,$2)', [result.rows[0].id, baseId]);
      }
      if (!baseIds.length) throw new Error('Non-admin users require PROVISION_BASE_IDS');
    }
    await client.query('COMMIT');
    console.log(`provisioned ${result.rows[0].email} as ${result.rows[0].role}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
