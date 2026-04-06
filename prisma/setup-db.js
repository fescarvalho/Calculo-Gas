const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const sql = `
CREATE TABLE IF NOT EXISTS "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Building_name_key" ON "Building"("name");

CREATE TABLE IF NOT EXISTS "Unit" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Unit_number_buildingId_key" ON "Unit"("number", "buildingId");

CREATE TABLE IF NOT EXISTS "Reading" (
    "id" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "leitura_anterior" DOUBLE PRECISION NOT NULL,
    "leitura_atual" DOUBLE PRECISION NOT NULL,
    "valor_calculado" DOUBLE PRECISION NOT NULL,
    "mes_referencia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Reading_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Reading_unidade_id_mes_referencia_key" ON "Reading"("unidade_id", "mes_referencia");
`;

async function main() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
        console.log('Executing SQL...');
        await client.query(sql);
        console.log('Tables created successfully or already exist.');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
