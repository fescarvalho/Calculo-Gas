const { Pool } = require('pg');

async function checkIsento() {
  const connectionString = "postgresql://postgres:tabelagaspredios@db.xrdrlvzyqnxbdrmxovkh.supabase.co:5432/postgres";
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Check if isento column exists
    const colCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Unit' AND column_name = 'isento'
    `);
    console.log('Column "isento" (case-sensitive "Unit"):', colCheck.rows);

    // Try lowercase too (Prisma often uses lowercase)
    const colCheck2 = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'unit' AND column_name = 'isento'
    `);
    console.log('Column "isento" (lowercase "unit"):', colCheck2.rows);

    // List all columns in Unit table
    const allCols = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('Unit', 'unit')
      ORDER BY table_name, ordinal_position
    `);
    console.log('\nAll columns in Unit/unit table:', allCols.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkIsento();
