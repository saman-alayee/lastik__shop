import type { Category } from '~/types';

/** ترتیب ریشه‌های منو (برند / دسته لاستیک در صورت وجود در API) */
export const NAV_ROOT_SLUG_ORDER = [
  'nexen',
  'hankook',
  'kumho',
  'iran-tire',
  'kavir',
  'barez',
  'gt-radial',
  'trazano',
];

const NAV_LABELS: Record<string, string> = {};

export function navCategoryLabel(category: Pick<Category, 'slug' | 'name'>): string {
  return NAV_LABELS[category.slug] ?? category.name;
}

export function sortNavRoots(roots: Category[]): Category[] {
  return [...roots].sort((a, b) => {
    const ia = NAV_ROOT_SLUG_ORDER.indexOf(a.slug);
    const ib = NAV_ROOT_SLUG_ORDER.indexOf(b.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.sortOrder - b.sortOrder;
  });
}
