import type { Product, TireMeta } from '~/types';

export function parseTireMeta(product: Product | null | undefined): TireMeta | null {
  if (!product) return null;
  const raw = product.tireMeta;
  const base: TireMeta = {
    sizeLabel: product.tireSizeLabel ?? undefined,
    width: product.tireWidth ?? undefined,
    aspect: product.tireAspect ?? undefined,
    rim: product.tireRim ?? undefined,
    brand: product.tireBrand ?? undefined,
    country: product.tireCountry ?? undefined,
    season: product.tireSeason ?? undefined,
    pattern: product.tirePattern ?? undefined,
    loadIndex: product.tireLoadIndex ?? undefined,
    speedIndex: product.tireSpeedIndex ?? undefined,
    year: product.tireYear ?? undefined,
    tubeless: product.tireTubeless ?? undefined,
    runFlat: product.tireRunFlat ?? undefined,
    usageType: product.tireUsageType ?? undefined,
  };

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...base, ...(raw as TireMeta) };
  }
  return Object.values(base).some((v) => v !== undefined && v !== null) ? base : null;
}

export function formatTireSizeLabel(width?: number | null, aspect?: number | null, rim?: number | null) {
  if (!width || !aspect || !rim) return '';
  return `${width}/${aspect}R${rim}`;
}

export function pairPrice(unit: number, meta?: TireMeta | null) {
  const discount = Number(meta?.pairDiscountPercent ?? 0);
  return Math.round(unit * 2 * (1 - Math.min(Math.max(discount, 0), 50) / 100));
}

export function setPrice(unit: number, meta?: TireMeta | null) {
  const discount = Number(meta?.setDiscountPercent ?? 0);
  return Math.round(unit * 4 * (1 - Math.min(Math.max(discount, 0), 50) / 100));
}

/** Pack label for tire quantity: تکی / جفت / دو جفت / … */
export function tirePackLabel(quantity: number): string {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty === 1) return 'تکی';
  if (qty === 2) return 'جفت';
  if (qty === 4) return 'دو جفت';
  if (qty > 0 && qty % 4 === 0) return `${qty / 4}× دو جفت`;
  if (qty > 0 && qty % 2 === 0) return `${qty / 2} جفت`;
  if (qty > 0) return `${qty} حلقه`;
  return '—';
}

/** Human detail e.g. «۴ حلقه · دو جفت» */
export function tirePackDetail(quantity: number): string {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (!qty) return '—';
  const rings = qty === 1 ? '۱ حلقه' : `${qty} حلقه`;
  const pack = tirePackLabel(qty);
  if (pack === `${qty} حلقه`) return rings;
  return `${rings} · ${pack}`;
}

export const TIRE_SEASON_OPTIONS = [
  { value: 'all-season', label: 'چهارفصل' },
  { value: 'summer', label: 'تابستان' },
  { value: 'winter', label: 'زمستان' },
];

export const TIRE_USAGE_OPTIONS = [
  { value: 'passenger', label: 'سواری' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'وانت' },
  { value: 'light-truck', label: 'بارداری سبک' },
];

export function seasonLabel(value?: string | null) {
  return TIRE_SEASON_OPTIONS.find((o) => o.value === value)?.label || value || '—';
}

export function usageLabel(value?: string | null) {
  return TIRE_USAGE_OPTIONS.find((o) => o.value === value)?.label || value || '—';
}
