import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imgs = [
  '/images/products/tires/tire-01.jpg',
  '/images/products/tires/tire-02.jpg',
  '/images/products/tires/tire-03.jpg',
  '/images/products/tires/tire-04.jpg',
  '/images/products/tires/tire-05.jpg',
  '/images/products/tires/tire-06.jpg',
  '/images/products/tires/tire-07.jpg',
  '/images/products/tires/tire-08.jpg',
];

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, image: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const image = imgs[i % imgs.length];
    const product = products[i];
    await prisma.product.update({
      where: { id: product.id },
      data: { image },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: image, sortOrder: 0 },
    });
    updated += 1;
  }

  console.log(`Assigned tire demo images to ${updated} products`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
