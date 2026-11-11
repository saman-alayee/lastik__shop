/**
 * Seed demo catalog for tire shop.
 * Run: npx tsx prisma/seed-tire-demo.ts
 */
import { PrismaClient } from '@prisma/client';
import { formatTireSizeLabel, slugifyTireSize } from '../src/utils/tire';

const prisma = new PrismaClient();

const SIZES = [
  [185, 65, 15],
  [195, 60, 15],
  [205, 60, 14],
  [205, 55, 16],
  [215, 55, 17],
  [215, 50, 17],
  [225, 65, 17],
  [235, 65, 17],
] as const;

const BRANDS = [
  { name: 'کویر تایر', slug: 'kavir' },
  { name: 'بارز', slug: 'barez' },
  { name: 'ایران تایر', slug: 'iran-tire' },
  { name: 'جی تی رادیال', slug: 'gt-radial' },
  { name: 'ترازانو', slug: 'trazano' },
];

async function main() {
  console.log('Seeding tire demo data...');

  const sizeRows = [];
  for (const [width, aspect, rim] of SIZES) {
    const label = formatTireSizeLabel(width, aspect, rim);
    const row = await prisma.tireSize.upsert({
      where: { label },
      create: { width, aspect, rim, label, slug: slugifyTireSize(label) },
      update: { width, aspect, rim, slug: slugifyTireSize(label), isActive: true },
    });
    sizeRows.push(row);
  }

  const categories = [];
  for (const [i, brand] of BRANDS.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: brand.slug },
      create: {
        name: brand.name,
        slug: brand.slug,
        sortOrder: i,
        isActive: true,
        showOnHome: true,
      },
      update: { name: brand.name, isActive: true, showOnHome: true, sortOrder: i },
    });
    categories.push(cat);
  }

  const peugeot = await prisma.vehicleMake.upsert({
    where: { slug: 'peugeot' },
    create: { name: 'پژو', slug: 'peugeot', nameEn: 'Peugeot', sortOrder: 1 },
    update: { name: 'پژو', isActive: true },
  });
  const saipa = await prisma.vehicleMake.upsert({
    where: { slug: 'saipa' },
    create: { name: 'سایپا', slug: 'saipa', nameEn: 'Saipa', sortOrder: 2 },
    update: { name: 'سایپا', isActive: true },
  });
  const iranKhodro = await prisma.vehicleMake.upsert({
    where: { slug: 'iran-khodro' },
    create: { name: 'ایران‌خودرو', slug: 'iran-khodro', nameEn: 'Iran Khodro', sortOrder: 3 },
    update: { name: 'ایران‌خودرو', isActive: true },
  });

  await prisma.vehicleMake.update({
    where: { id: peugeot.id },
    data: { logo: '/images/cars/peugeot-make.jpg' },
  });
  await prisma.vehicleMake.update({
    where: { id: saipa.id },
    data: { logo: '/images/cars/pride-131.jpg' },
  });
  await prisma.vehicleMake.update({
    where: { id: iranKhodro.id },
    data: { logo: '/images/cars/samand-lx.jpg' },
  });

  const m206 = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: peugeot.id, slug: '206' } },
    create: {
      makeId: peugeot.id,
      name: '۲۰۶',
      slug: '206',
      nameEn: '206',
      image: '/images/cars/peugeot-206.jpg',
    },
    update: { name: '۲۰۶', isActive: true, image: '/images/cars/peugeot-206.jpg' },
  });
  const m405 = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: peugeot.id, slug: '405' } },
    create: {
      makeId: peugeot.id,
      name: '۴۰۵',
      slug: '405',
      nameEn: '405',
      image: '/images/cars/peugeot-405.jpg',
    },
    update: { name: '۴۰۵', isActive: true, image: '/images/cars/peugeot-405.jpg' },
  });
  const pride = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: saipa.id, slug: 'pride-131' } },
    create: {
      makeId: saipa.id,
      name: 'پراید ۱۳۱',
      slug: 'pride-131',
      nameEn: 'Pride 131',
      image: '/images/cars/pride-131.jpg',
    },
    update: { name: 'پراید ۱۳۱', isActive: true, image: '/images/cars/pride-131.jpg' },
  });
  const samand = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: iranKhodro.id, slug: 'samand-lx' } },
    create: {
      makeId: iranKhodro.id,
      name: 'سمند LX',
      slug: 'samand-lx',
      nameEn: 'Samand LX',
      image: '/images/cars/samand-lx.jpg',
    },
    update: { name: 'سمند LX', isActive: true, image: '/images/cars/samand-lx.jpg' },
  });

  for (const [name, slug] of [
    ['تیپ ۱', 'tip-1'],
    ['تیپ ۲', 'tip-2'],
    ['تیپ ۵', 'tip-5'],
  ] as const) {
    await prisma.vehicleTrim.upsert({
      where: { modelId_slug: { modelId: m206.id, slug } },
      create: { modelId: m206.id, name, slug },
      update: { name, isActive: true },
    });
  }

  // هر مدل می‌تواند چند سایز استاندارد (OEM / جایگزین کارخانه) داشته باشد.
  const fitmentPairs: Array<{ modelId: string; sizeLabel: string; standard?: boolean }> = [
    { modelId: m206.id, sizeLabel: '185/65R15', standard: true },
    { modelId: m206.id, sizeLabel: '195/60R15', standard: true },
    { modelId: m206.id, sizeLabel: '205/55R16', standard: false },
    { modelId: m405.id, sizeLabel: '185/65R15', standard: true },
    { modelId: m405.id, sizeLabel: '195/60R15', standard: true },
    { modelId: pride.id, sizeLabel: '165/65R13', standard: true },
    { modelId: pride.id, sizeLabel: '175/70R13', standard: true },
    { modelId: samand.id, sizeLabel: '185/65R15', standard: true },
    { modelId: samand.id, sizeLabel: '205/60R14', standard: true },
  ];

  for (const [width, aspect, rim, label, slug] of [
    [165, 65, 13, '165/65R13', '165-65r13'],
    [175, 70, 13, '175/70R13', '175-70r13'],
  ] as const) {
    const row = await prisma.tireSize.upsert({
      where: { label },
      create: { width, aspect, rim, label, slug },
      update: {},
    });
    if (!sizeRows.some((s) => s.id === row.id)) sizeRows.push(row);
  }

  for (const pair of fitmentPairs) {
    const size = await prisma.tireSize.findUnique({ where: { label: pair.sizeLabel } });
    if (!size) continue;
    const existing = await prisma.vehicleFitment.findFirst({
      where: { modelId: pair.modelId, tireSizeId: size.id, trimId: null },
    });
    if (existing) {
      await prisma.vehicleFitment.update({
        where: { id: existing.id },
        data: { isStandard: pair.standard ?? true },
      });
    } else {
      await prisma.vehicleFitment.create({
        data: {
          modelId: pair.modelId,
          tireSizeId: size.id,
          isStandard: pair.standard ?? true,
          yearFrom: 2010,
          yearTo: 2024,
        },
      });
    }
  }

  const patterns = ['Comfort T20', 'Hurricane KB200', 'WONDERFULL KB700', 'SAVERO HT-S', 'CF510'];
  const countries = ['ایران', 'چین', 'اندونزی'];
  const demoImages = [
    '/images/products/tires/tire-01.jpg',
    '/images/products/tires/tire-02.jpg',
    '/images/products/tires/tire-03.jpg',
    '/images/products/tires/tire-04.jpg',
    '/images/products/tires/tire-05.jpg',
    '/images/products/tires/tire-06.jpg',
    '/images/products/tires/tire-07.jpg',
    '/images/products/tires/tire-08.jpg',
  ];
  let created = 0;

  for (const [bi, brand] of BRANDS.entries()) {
    const cat = categories[bi];
    for (const [si, size] of sizeRows.slice(0, 6).entries()) {
      const pattern = patterns[(bi + si) % patterns.length];
      const label = size.label;
      const name = `لاستیک ${brand.name} سایز ${label} گل ${pattern}`;
      const slug = `${brand.slug}-${label.toLowerCase().replace(/\//g, '-')}-${si}`.replace(/\s+/g, '-');
      const price = 4_500_000 + bi * 400_000 + si * 250_000;
      const discountPrice = si % 3 === 0 ? Math.round(price * 0.92) : null;
      const year = 2023 + (si % 3);
      const image = demoImages[(bi * 3 + si) % demoImages.length];

      const existing = await prisma.product.findUnique({ where: { slug } });
      const data = {
        name,
        description: `${name} — مناسب سواری، تیوبلس، شاخص بار ۸۸ و سرعت H.`,
        price,
        discountPrice,
        stock: 4 + ((bi + si) % 8),
        unit: 'حلقه',
        image,
        categoryId: cat.id,
        isActive: true,
        isFeatured: si < 2,
        isNew: year >= 2025,
        isHomeDeal: Boolean(discountPrice),
        isHomeFeatured: si === 0,
        tireWidth: size.width,
        tireAspect: size.aspect,
        tireRim: size.rim,
        tireSizeLabel: label,
        tireBrand: brand.name,
        tireCountry: countries[bi % countries.length],
        tireSeason: si % 2 === 0 ? 'all-season' : 'summer',
        tirePattern: pattern,
        tireLoadIndex: '88',
        tireSpeedIndex: 'H',
        tireYear: year,
        tireTubeless: true,
        tireRunFlat: si === 4,
        tireUsageType: si > 4 ? 'suv' : 'passenger',
        tireSizeId: size.id,
        tireMeta: {
          sizeLabel: label,
          width: size.width,
          aspect: size.aspect,
          rim: size.rim,
          brand: brand.name,
          country: countries[bi % countries.length],
          season: si % 2 === 0 ? 'all-season' : 'summer',
          pattern,
          loadIndex: '88',
          speedIndex: 'H',
          year,
          tubeless: true,
          runFlat: si === 4,
          usageType: si > 4 ? 'suv' : 'passenger',
          pairDiscountPercent: 0,
          setDiscountPercent: 3,
        },
        seoTitle: `خرید ${name}`,
        seoDescription: `قیمت و مشخصات ${name} با ارسال سریع.`,
      };

      let productId = existing?.id;
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        const createdProduct = await prisma.product.create({ data: { ...data, slug } });
        productId = createdProduct.id;
        created += 1;
      }

      if (productId) {
        await prisma.productImage.deleteMany({ where: { productId } });
        await prisma.productImage.create({
          data: { productId, url: image, sortOrder: 0 },
        });
      }
    }
  }

  console.log(`Tire sizes: ${sizeRows.length}, brands/categories: ${categories.length}, new products: ${created}`);
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
