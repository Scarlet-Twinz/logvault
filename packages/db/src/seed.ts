import { prisma } from './index';

async function main() {
  console.log('Seeding database...');
  // Add seed data here if needed
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
