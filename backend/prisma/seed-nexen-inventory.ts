/**
 * Replace catalog with Nexen inventory from «موجودی نکسن حمیداوی.pdf»
 * Run: npx tsx prisma/seed-nexen-inventory.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { formatTireSizeLabel, parseTireSizeLabel, slugifyTireSize } from '../src/utils/tire';

const prisma = new PrismaClient();

type InventoryRow = {
  sku: string;
  size: string;
  pattern: string;
  loadSpeed?: string;
  ean: string;
  stock: number;
};

const BRAND_FA = 'نکسن';
const BRAND_EN = 'Nexen';
const COUNTRY = 'کره جنوبی';
const LOGO = '/images/brands/nexen-transparent.png';

const PATTERN_IMAGES: Record<string, string> = {
  'NBLUE HD PLUS': '/images/products/nexen/dk-nblue-3.jpg',
  'NPRIZ AH8': '/images/products/nexen/dk-npriz-ah8.jpg',
  'NPRIZ RH7': '/images/products/nexen/dk-npriz-ah5.jpg',
  'NFERA AU7': '/images/products/nexen/dk-nfera-au7.jpg',
  'NFERA SU1': '/images/products/nexen/dk-nfera-su1.jpg',
  'NFERA SUPREME': '/images/products/nexen/dk-nfera-au7.jpg',
  'NFERA RU1': '/images/products/nexen/dk-nfera-su1.jpg',
  NFERA: '/images/products/nexen/dk-nfera-su1.jpg',
  'ROHTX RH5': '/images/products/nexen/dk-nfera-su1.jpg',
  RO542: '/images/products/nexen/dk-nfera-au7.jpg',
  CP671: '/images/products/nexen/dk-npriz-ah5.jpg',
  CP672: '/images/products/nexen/dk-npriz-ah8.jpg',
};

const FALLBACK_IMAGES = [
  '/images/products/nexen/dk-nblue-1.jpg',
  '/images/products/nexen/dk-nblue-2.jpg',
  '/images/products/nexen/dk-nblue-3.jpg',
  '/images/products/nexen/dk-nblue-5.jpg',
  '/images/products/nexen/dk-nblue-6.jpg',
  '/images/products/nexen/dk-npriz-ah8.jpg',
  '/images/products/nexen/dk-nfera-au7.jpg',
  '/images/products/nexen/dk-nfera-su1.jpg',
];

function normalizePattern(raw: string) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/N[’']?BLUE/g, 'NBLUE')
    .replace(/N[-\s]?BLUE/g, 'NBLUE')
    .replace(/NF\s*SUPREME/g, 'NFERA SUPREME')
    .replace(/NFERA-?/g, 'NFERA ')
    .replace(/\s+/g, ' ')
    .trim();
}

function prettyPattern(raw: string) {
  const key = normalizePattern(raw);
  const map: Record<string, string> = {
    'NBLUE HD PLUS': "N'Blue HD Plus",
    'NPRIZ AH8': "N'Priz AH8",
    'NPRIZ RH7': "N'Priz RH7",
    'NFERA AU7': "N'Fera AU7",
    'NFERA SU1': "N'Fera SU1",
    'NFERA SUPREME': "N'Fera Supreme",
    'NFERA RU1': "N'Fera RU1",
    NFERA: "N'Fera",
    'ROHTX RH5': 'Roadian HTX RH5',
    RO542: 'Roadian 542',
    CP671: 'CP671',
    CP672: 'CP672',
  };
  return map[key] || raw.trim();
}

function imageForPattern(raw: string, index: number) {
  const key = normalizePattern(raw);
  return PATTERN_IMAGES[key] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function parseLoadSpeed(value?: string) {
  if (!value) return { load: null as string | null, speed: null as string | null };
  const m = String(value).trim().toUpperCase().match(/^(\d{2,3})([A-Z])$/);
  if (!m) return { load: null, speed: null };
  return { load: m[1], speed: m[2] };
}

function estimatePrice(width: number, aspect: number, rim: number) {
  const rimBase: Record<number, number> = {
    13: 4_800_000,
    14: 5_500_000,
    15: 6_800_000,
    16: 8_800_000,
    17: 11_200_000,
    18: 13_800_000,
    19: 16_500_000,
    20: 18_800_000,
  };
  const base = rimBase[rim] ?? 9_000_000;
  return base + Math.round((width - 195) * 12_000) + Math.round((60 - aspect) * 8_000);
}

function usageType(width: number, aspect: number, rim: number, pattern: string) {
  const p = normalizePattern(pattern);
  if (p.includes('ROHTX') || p.includes('RO542') || (width >= 265 && aspect >= 60)) return 'suv';
  if (p.includes('AU7') || p.includes('SU1') || aspect <= 40) return 'performance';
  if (rim >= 18 && aspect <= 50) return 'performance';
  return 'passenger';
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function clearOldProducts() {
  console.log('Clearing old catalog...');
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.categoryFeedProduct.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.discount.deleteMany();

  const linked = await prisma.product.findMany({
    where: { orderItems: { some: {} } },
    select: { id: true, slug: true },
  });
  for (const p of linked) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        isActive: false,
        slug: `archived-${p.slug}-${p.id.slice(-6)}`.slice(0, 100),
        name: `[بایگانی] ${p.slug}`,
      },
    });
  }

  const deleted = await prisma.product.deleteMany({
    where: { orderItems: { none: {} } },
  });
  console.log(`Deleted ${deleted.count} products; archived ${linked.length} with order history`);
}

async function main() {
  const inventoryPath = path.join(__dirname, 'data', 'nexen-hamidavi-inventory.json');
  const rows = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')) as InventoryRow[];
  console.log(`Inventory rows: ${rows.length}`);

  await clearOldProducts();

  const category = await prisma.category.upsert({
    where: { slug: 'nexen' },
    create: {
      name: BRAND_FA,
      slug: 'nexen',
      image: LOGO,
      sortOrder: 0,
      isActive: true,
      showOnHome: true,
    },
    update: {
      name: BRAND_FA,
      image: LOGO,
      isActive: true,
      showOnHome: true,
      sortOrder: 0,
    },
  });

  // hide older demo brand categories
  await prisma.category.updateMany({
    where: { slug: { not: 'nexen' } },
    data: { showOnHome: false, isActive: false },
  });

  let created = 0;
  for (const [index, row] of rows.entries()) {
    const parsed = parseTireSizeLabel(row.size);
    if (!parsed) {
      console.warn('Skip bad size', row);
      continue;
    }
    const label = formatTireSizeLabel(parsed.width, parsed.aspect, parsed.rim);
    const size = await prisma.tireSize.upsert({
      where: { label },
      create: {
        width: parsed.width,
        aspect: parsed.aspect,
        rim: parsed.rim,
        label,
        slug: slugifyTireSize(label),
        isActive: true,
      },
      update: { isActive: true },
    });

    const patternKey = normalizePattern(row.pattern);
    const patternLabel = prettyPattern(row.pattern);
    const { load, speed } = parseLoadSpeed(row.loadSpeed);
    const price = estimatePrice(parsed.width, parsed.aspect, parsed.rim);
    const image = imageForPattern(row.pattern, index);
    const usage = usageType(parsed.width, parsed.aspect, parsed.rim, row.pattern);
    const name = `لاستیک ${BRAND_FA} ${patternLabel} سایز ${label}`;
    const slug = slugify(`nexen-${label}-${patternKey}-${row.sku}`);

    const tireMeta = {
      sizeLabel: label,
      width: parsed.width,
      aspect: parsed.aspect,
      rim: parsed.rim,
      brand: BRAND_FA,
      brandEn: BRAND_EN,
      country: COUNTRY,
      season: 'all-season',
      pattern: patternLabel,
      loadIndex: load,
      speedIndex: speed,
      year: 2025,
      tubeless: true,
      runFlat: false,
      usageType: usage,
      sku: row.sku,
      ean: row.ean,
      source: 'موجودی نکسن حمیداوی',
      pairDiscountPercent: 0,
      setDiscountPercent: 0,
    };

    const data = {
      name,
      description: `${name} — ساخت ${COUNTRY}، تیوبلس، موجودی انبار حمیداوی. کد کالا ${row.sku}.`,
      barcode: row.ean || row.sku,
      price,
      discountPrice: null as number | null,
      stock: row.stock,
      unit: 'حلقه',
      image,
      categoryId: category.id,
      isActive: true,
      isFeatured: index < 8,
      isNew: true,
      isHomeDeal: false,
      isHomeFeatured: index < 6,
      homeFeaturedSort: index,
      tireWidth: parsed.width,
      tireAspect: parsed.aspect,
      tireRim: parsed.rim,
      tireSizeLabel: label,
      tireBrand: BRAND_FA,
      tireCountry: COUNTRY,
      tireSeason: 'all-season',
      tirePattern: patternLabel,
      tireLoadIndex: load,
      tireSpeedIndex: speed,
      tireYear: 2025,
      tireTubeless: true,
      tireRunFlat: false,
      tireUsageType: usage,
      tireSizeId: size.id,
      tireMeta,
      seoTitle: `خرید ${name}`,
      seoDescription: `قیمت و موجودی ${name} (${row.stock} حلقه) در ${BRAND_FA} شاپ.`,
    };

    const existing = await prisma.product.findUnique({ where: { slug } });
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
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId, categoryId: category.id } },
        create: { productId, categoryId: category.id },
        update: {},
      });
    }
  }

  console.log(`Created/updated Nexen products. New rows: ${created}`);
  console.log('Category logo:', LOGO);
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
