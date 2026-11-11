/**
 * Point vehicle make/model images to studio PNG cutouts.
 * Run: npx tsx scripts/update-car-images.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAKE_LOGOS: Record<string, string> = {
  peugeot: '/images/cars/peugeot-make.png',
  saipa: '/images/cars/saipa-make.png',
  'iran-khodro': '/images/cars/ikco-make.png',
};

const MODEL_IMAGES: Array<{ make: string; slug: string; name: string; nameEn: string; image: string; sortOrder: number }> = [
  { make: 'peugeot', slug: '206', name: 'پژو ۲۰۶', nameEn: '206', image: '/images/cars/peugeot-206.png', sortOrder: 1 },
  { make: 'peugeot', slug: '206-sd', name: '۲۰۶ SD', nameEn: '206 SD', image: '/images/cars/peugeot-206-sd.png', sortOrder: 2 },
  { make: 'peugeot', slug: '207', name: 'پژو ۲۰۷', nameEn: '207', image: '/images/cars/peugeot-207.png', sortOrder: 3 },
  { make: 'peugeot', slug: '405', name: 'پژو ۴۰۵', nameEn: '405', image: '/images/cars/peugeot-405.png', sortOrder: 4 },
  { make: 'peugeot', slug: 'pars', name: 'پژو پارس', nameEn: 'Pars', image: '/images/cars/peugeot-pars.png', sortOrder: 5 },
  { make: 'saipa', slug: 'pride-131', name: 'پراید ۱۳۱', nameEn: 'Pride 131', image: '/images/cars/pride-131.png', sortOrder: 1 },
  { make: 'saipa', slug: 'pride', name: 'پراید همه مدل‌ها', nameEn: 'Pride', image: '/images/cars/pride-all.png', sortOrder: 2 },
  { make: 'saipa', slug: 'pride-111-131', name: 'پراید ۱۱۱ / ۱۳۱', nameEn: 'Pride 111/131', image: '/images/cars/pride.png', sortOrder: 3 },
  { make: 'saipa', slug: 'tiba-hatch', name: 'تیبا هاچبک', nameEn: 'Tiba Hatch', image: '/images/cars/tiba-hatch.png', sortOrder: 4 },
  { make: 'saipa', slug: 'tiba-sedan', name: 'تیبا صندوقدار', nameEn: 'Tiba Sedan', image: '/images/cars/tiba-sedan.png', sortOrder: 5 },
  { make: 'iran-khodro', slug: 'samand-lx', name: 'سمند LX', nameEn: 'Samand LX', image: '/images/cars/samand-lx.png', sortOrder: 1 },
  { make: 'iran-khodro', slug: 'tondar-90', name: 'تندر ۹۰', nameEn: 'Tondar 90', image: '/images/cars/tondar-90.png', sortOrder: 2 },
];

async function main() {
  for (const [slug, logo] of Object.entries(MAKE_LOGOS)) {
    await prisma.vehicleMake.updateMany({ where: { slug }, data: { logo } });
  }

  for (const row of MODEL_IMAGES) {
    const make = await prisma.vehicleMake.findUnique({ where: { slug: row.make } });
    if (!make) {
      console.warn('missing make', row.make);
      continue;
    }
    await prisma.vehicleModel.upsert({
      where: { makeId_slug: { makeId: make.id, slug: row.slug } },
      create: {
        makeId: make.id,
        slug: row.slug,
        name: row.name,
        nameEn: row.nameEn,
        image: row.image,
        sortOrder: row.sortOrder,
        isActive: true,
      },
      update: {
        name: row.name,
        nameEn: row.nameEn,
        image: row.image,
        sortOrder: row.sortOrder,
        isActive: true,
      },
    });
    console.log('ok', row.make, row.slug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
