/**
 * Sync product_images rows after compose-tire-card-images.py
 * Run: npx tsx scripts/sync-tire-card-images.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const manifestPath = path.join(
  __dirname,
  '../frontend/public/images/products/nexen/cards/manifest.json'
);

async function main() {
  // manifest lives under frontend/public... relative to repo root
  const alt = path.join(process.cwd(), '../frontend/public/images/products/nexen/cards/manifest.json');
  const file = fs.existsSync(manifestPath)
    ? manifestPath
    : path.join(process.cwd(), 'frontend/public/images/products/nexen/cards/manifest.json');
  const resolved = fs.existsSync(file) ? file : alt;
  if (!fs.existsSync(resolved)) {
    // fall back: sync from products.image
    const products = await prisma.product.findMany({
      where: { isActive: true, image: { contains: '/nexen/cards/' } },
      select: { id: true, image: true },
    });
    for (const p of products) {
      if (!p.image) continue;
      await prisma.productImage.deleteMany({ where: { productId: p.id } });
      await prisma.productImage.create({
        data: { productId: p.id, url: p.image, sortOrder: 0 },
      });
    }
    console.log(`Synced ${products.length} product images from DB paths`);
    return;
  }

  const mapping = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Array<[string, string]>;
  for (const [url, productId] of mapping) {
    await prisma.product.update({ where: { id: productId }, data: { image: url } });
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productImage.create({
      data: { productId, url, sortOrder: 0 },
    });
  }
  console.log(`Synced ${mapping.length} composed card images`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
