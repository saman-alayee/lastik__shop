import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.appSetting.upsert({
    where: { key: 'announcement' },
    create: {
      key: 'announcement',
      value: { text: 'ارسال سریع به سراسر کشور | گارانتی اصالت کالا' },
    },
    update: {
      value: { text: 'ارسال سریع به سراسر کشور | گارانتی اصالت کالا' },
    },
  });

  await prisma.appSetting.upsert({
    where: { key: 'theme' },
    create: {
      key: 'theme',
      value: {
        primary: '#334155',
        onPrimary: '#ffffff',
        accent: '#dc2626',
        pageBg: '#f8fafc',
        adminPageBg: '#f1f5f9',
        surface: '#ffffff',
        header: '#0f172a',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
    },
    update: {
      value: {
        primary: '#334155',
        onPrimary: '#ffffff',
        accent: '#dc2626',
        pageBg: '#f8fafc',
        adminPageBg: '#f1f5f9',
        surface: '#ffffff',
        header: '#0f172a',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
    },
  });

  console.log('Tire branding settings updated');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
