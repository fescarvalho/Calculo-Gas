const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const buildings = [
    {
      name: 'Residencial Dias',
      units: [
        '101', '102', '103', '104',
        '201', '202', '203', '204',
        '301', '302', '303', '304',
        '401', '402', '403', '404',
        '501', '502', '503', '504',
        '601', '602', '603', '604',
        '701'
      ]
    },
    {
      name: 'Barão Real',
      units: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110']
    },
  ];

  for (const b of buildings) {
    const building = await prisma.building.upsert({
      where: { name: b.name },
      update: {},
      create: { name: b.name },
    });

    console.log(`Building ${building.name} created/updated.`);

    for (const unitNumber of b.units) {
      await prisma.unit.upsert({
        where: {
          number_buildingId: {
            number: unitNumber,
            buildingId: building.id,
          },
        },
        update: {},
        create: {
          number: unitNumber,
          buildingId: building.id,
        },
      });
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
