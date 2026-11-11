/** Curated brands shown even before inventory exists for them. */
export const FEATURED_BRANDS: { name: string; logo: string }[] = [
  { name: 'نکسن', logo: '/images/brands/nexen-transparent.png' },
  { name: 'یزد تایر', logo: '/images/brands/yazd-transparent.png' },
  { name: 'کومهو', logo: '/images/brands/kumho-transparent.png' },
  { name: 'ایران تایر', logo: '/images/brands/iran-tire-transparent.png' },
  { name: 'کویر تایر', logo: '/images/brands/kavir-transparent.png' },
  { name: 'هنکوک', logo: '/images/brands/hankook-transparent.png' },
];

/** Local brand logo map — keys are normalized (lowercase, no spaces/diacritics-ish). */
export const BRAND_LOGOS: Record<string, string> = {
  nexen: '/images/brands/nexen-transparent.png',
  نکسن: '/images/brands/nexen-transparent.png',
  'نکسن تایر': '/images/brands/nexen-transparent.png',
  'nexen tire': '/images/brands/nexen-transparent.png',

  yazd: '/images/brands/yazd-transparent.png',
  'yazd tire': '/images/brands/yazd-transparent.png',
  یزد: '/images/brands/yazd-transparent.png',
  'یزد تایر': '/images/brands/yazd-transparent.png',
  یزدتایر: '/images/brands/yazd-transparent.png',

  kumho: '/images/brands/kumho-transparent.png',
  'kumho tire': '/images/brands/kumho-transparent.png',
  کومهو: '/images/brands/kumho-transparent.png',
  'کومهو تایر': '/images/brands/kumho-transparent.png',
  کامهو: '/images/brands/kumho-transparent.png',

  'iran tire': '/images/brands/iran-tire-transparent.png',
  irantire: '/images/brands/iran-tire-transparent.png',
  'ایران تایر': '/images/brands/iran-tire-transparent.png',
  ایرانتایر: '/images/brands/iran-tire-transparent.png',

  kavir: '/images/brands/kavir-transparent.png',
  'kavir tire': '/images/brands/kavir-transparent.png',
  کویر: '/images/brands/kavir-transparent.png',
  'کویر تایر': '/images/brands/kavir-transparent.png',
  کویرتایر: '/images/brands/kavir-transparent.png',

  hankook: '/images/brands/hankook-transparent.png',
  'hankook tire': '/images/brands/hankook-transparent.png',
  هنکوک: '/images/brands/hankook-transparent.png',
  هنکاک: '/images/brands/hankook-transparent.png',
  'هنکوک تایر': '/images/brands/hankook-transparent.png',
  'هنکاک تایر': '/images/brands/hankook-transparent.png',
};

export function normalizeBrandKey(name: string) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200c\s_-]+/g, ' ')
    .trim();
}

export function brandLogoPath(name: string, categoryImage?: string | null) {
  if (categoryImage) return categoryImage;
  const key = normalizeBrandKey(name);
  if (BRAND_LOGOS[key]) return BRAND_LOGOS[key];
  // slug-like: nexen from "Nexen" / latin only
  const latin = key.replace(/[^a-z0-9]+/g, '');
  if (latin && BRAND_LOGOS[latin]) return BRAND_LOGOS[latin];
  return null;
}
