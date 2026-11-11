/**
 * @deprecated فروشگاه الان لاستیک است.
 * به‌جای این فایل از seed لاستیک استفاده کنید:
 *   npx tsx prisma/seed-tire-demo.ts
 * یا: npm run db:seed:tire-demo
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tireSeed = path.join(here, 'seed-tire-demo.ts');

console.warn(
  '[deprecated] seed-clothing-demo حذف شده است. در حال اجرای seed-tire-demo...'
);

const result = spawnSync('npx', ['tsx', tireSeed], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(here, '..'),
});

process.exit(result.status ?? 1);
