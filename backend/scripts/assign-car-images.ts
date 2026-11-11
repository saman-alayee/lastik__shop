import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODEL_IMAGES: Record<string, string> = {
  'peugeot/206': '/images/cars/peugeot-206.jpg',
  'peugeot/405': '/images/cars/peugeot-405.jpg',
  'saipa/pride-131': '/images/cars/pride-131.jpg',
  'iran-khodro/samand-lx': '/images/cars/samand-lx.jpg',
};

const MAKE_LOGOS: Record<string, string> = {
  peugeot: '/images/cars/peugeot-make.jpg',
  saipa: '/images/cars/pride-131.jpg',
  'iran-khodro': '/images/cars/samand-lx.jpg',
};

async function main() {
  const makes = await prisma.vehicleMake.findMany({ include: { models: true } });
  let updated = 0;

  for (const make of makes) {
    const logo = MAKE_LOGOS[make.slug];
    if (logo) {
      await prisma.vehicleMake.update({ where: { id: make.id }, data: { logo } });
      updated += 1;
    }
    for (const model of make.models) {
      const key = `${make.slug}/${model.slug}`;
      const image = MODEL_IMAGES[key];
      if (image) {
        await prisma.vehicleModel.update({ where: { id: model.id }, data: { image } });
        updated += 1;
      }
    }
  }

  console.log(`Assigned car images to ${updated} make/model records`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
