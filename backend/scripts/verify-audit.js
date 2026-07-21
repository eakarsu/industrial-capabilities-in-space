const db = require('../db');
const { verifyEventChain } = require('../lib/workflow-rules');

async function main() {
  const baseId = Number(process.env.BASE_ID);
  if (!Number.isInteger(baseId) || baseId < 1) throw new Error('BASE_ID must be a positive integer');
  const result = await db.query('SELECT * FROM manufacturing_events WHERE base_id=$1 ORDER BY id', [baseId]);
  if (!verifyEventChain(result.rows)) throw new Error(`Manufacturing audit chain failed for base ${baseId}`);
  console.log(`verified ${result.rows.length} manufacturing events for base ${baseId}`);
  await db.end();
}

main().catch(async (error) => {
  console.error(error.message);
  await db.end().catch(() => {});
  process.exitCode = 1;
});
