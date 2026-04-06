const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const building = await prisma.building.findUnique({
        where: { name: 'Residencial Dias' }
    });

    if (building) {
        const validUnits = [
            '101', '102', '103', '104',
            '201', '202', '203', '204',
            '301', '302', '303', '304',
            '401', '402', '403', '404',
            '501', '502', '503', '504'
        ];

        const deleted = await prisma.unit.deleteMany({
            where: {
                buildingId: building.id,
                number: { notIn: validUnits }
            }
        });

        console.log(`Deleted ${deleted.count} extra units from Residencial Dias (kept up to 504).`);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
