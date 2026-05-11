const { Pool } = require('pg');

async function addIsentoColumn() {
  const connectionString = "postgresql://postgres:tabelagaspredios@db.xrdrlvzyqnxbdrmxovkh.supabase.co:5432/postgres";
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    console.log('Adding "isento" column to "Unit" table...');
    await client.query(`
      ALTER TABLE "Unit"
      ADD COLUMN IF NOT EXISTS "isento" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('Column added successfully!');

    // Verify
    const verify = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Unit' AND column_name = 'isento'
    `);
    console.log('Verification:', verify.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

addIsentoColumn();
