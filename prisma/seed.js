const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const fullUnitList = [
    '101', '102', '103', '104',
    '201', '202', '203', '204',
    '301', '302', '303', '304',
    '401', '402', '403', '404',
    '501', '502', '503', '504',
    '601', '602', '603', '604',
    '701'
  ];

  const buildings = [
    {
      name: 'Residencial Dias',
      units: fullUnitList.slice(0, 20) // Up to 504
    },
    {
      name: 'Barão Real',
      units: fullUnitList // Full list up to 701
    },
  ];

  for (const b of buildings) {
    const building = await prisma.building.upsert({
      where: { name: b.name },
      update: {},
      create: { name: b.name },
    });

    console.log(`Building ${building.name} created/updated.`);

    // Create/Update units
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

    // Cleanup units that shouldn't be there
    const deleted = await prisma.unit.deleteMany({
      where: {
        buildingId: building.id,
        number: { notIn: b.units }
      }
    });
    if (deleted.count > 0) {
      console.log(`Deleted ${deleted.count} extra units from ${building.name}.`);
    }
  }

  console.log('Seed and cleanup completed successfully');
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
