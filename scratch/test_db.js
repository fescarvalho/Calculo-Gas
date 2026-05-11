
const { Pool } = require('pg');

async function testConnection() {
  const connectionString = "postgresql://postgres:tabelagaspredios@db.xrdrlvzyqnxbdrmxovkh.supabase.co:5432/postgres";
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing connection to Supavisor...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
