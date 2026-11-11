export type TireMetaInput = {
  sizeLabel?: string;
  width?: number;
  aspect?: number;
  rim?: number;
  brand?: string;
  country?: string;
  season?: string;
  pattern?: string;
  loadIndex?: string;
  speedIndex?: string;
  year?: number;
  tubeless?: boolean;
  runFlat?: boolean;
  usageType?: string;
  pairDiscountPercent?: number;
  setDiscountPercent?: number;
  [key: string]: unknown;
};

export function formatTireSizeLabel(width: number, aspect: number, rim: number) {
  return `${width}/${aspect}R${rim}`;
}

export function parseTireSizeLabel(label: string): { width: number; aspect: number; rim: number } | null {
  const cleaned = String(label || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const match = cleaned.match(/^(\d{3})\/(\d{2,3})R(\d{2})$/);
  if (!match) return null;
  return {
    width: Number(match[1]),
    aspect: Number(match[2]),
    rim: Number(match[3]),
  };
}

export function slugifyTireSize(label: string) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Flatten tireMeta + explicit columns for DB write */
export function resolveTireFields(input: {
  tireMeta?: TireMetaInput | null;
  tireWidth?: number | null;
  tireAspect?: number | null;
  tireRim?: number | null;
  tireSizeLabel?: string | null;
  tireBrand?: string | null;
  tireCountry?: string | null;
  tireSeason?: string | null;
  tirePattern?: string | null;
  tireLoadIndex?: string | null;
  tireSpeedIndex?: string | null;
  tireYear?: number | null;
  tireTubeless?: boolean | null;
  tireRunFlat?: boolean | null;
  tireUsageType?: string | null;
  tireSizeId?: string | null;
}) {
  const meta = (input.tireMeta && typeof input.tireMeta === 'object' ? input.tireMeta : {}) as TireMetaInput;
  const fromLabel = input.tireSizeLabel
    ? parseTireSizeLabel(input.tireSizeLabel)
    : meta.sizeLabel
      ? parseTireSizeLabel(String(meta.sizeLabel))
      : null;

  const width = input.tireWidth ?? meta.width ?? fromLabel?.width ?? null;
  const aspect = input.tireAspect ?? meta.aspect ?? fromLabel?.aspect ?? null;
  const rim = input.tireRim ?? meta.rim ?? fromLabel?.rim ?? null;
  const sizeLabel =
    (input.tireSizeLabel || meta.sizeLabel || (width && aspect && rim ? formatTireSizeLabel(width, aspect, rim) : null)) ??
    null;

  const nextMeta: TireMetaInput = {
    ...meta,
    ...(sizeLabel ? { sizeLabel } : {}),
    ...(width != null ? { width } : {}),
    ...(aspect != null ? { aspect } : {}),
    ...(rim != null ? { rim } : {}),
  };

  return {
    tireMeta: Object.keys(nextMeta).length ? nextMeta : null,
    tireWidth: width,
    tireAspect: aspect,
    tireRim: rim,
    tireSizeLabel: sizeLabel,
    tireBrand: input.tireBrand ?? (meta.brand ? String(meta.brand) : null),
    tireCountry: input.tireCountry ?? (meta.country ? String(meta.country) : null),
    tireSeason: input.tireSeason ?? (meta.season ? String(meta.season) : null),
    tirePattern: input.tirePattern ?? (meta.pattern ? String(meta.pattern) : null),
    tireLoadIndex: input.tireLoadIndex ?? (meta.loadIndex ? String(meta.loadIndex) : null),
    tireSpeedIndex: input.tireSpeedIndex ?? (meta.speedIndex ? String(meta.speedIndex) : null),
    tireYear: input.tireYear ?? (typeof meta.year === 'number' ? meta.year : null),
    tireTubeless:
      input.tireTubeless ?? (typeof meta.tubeless === 'boolean' ? meta.tubeless : null),
    tireRunFlat: input.tireRunFlat ?? (typeof meta.runFlat === 'boolean' ? meta.runFlat : null),
    tireUsageType: input.tireUsageType ?? (meta.usageType ? String(meta.usageType) : null),
    tireSizeId: input.tireSizeId ?? null,
  };
}

export function computeBundlePrices(unitPrice: number, tireMeta?: TireMetaInput | null) {
  const pairDiscount = Number(tireMeta?.pairDiscountPercent ?? 0);
  const setDiscount = Number(tireMeta?.setDiscountPercent ?? 0);
  const pair = Math.round(unitPrice * 2 * (1 - Math.min(Math.max(pairDiscount, 0), 50) / 100));
  const setOf4 = Math.round(unitPrice * 4 * (1 - Math.min(Math.max(setDiscount, 0), 50) / 100));
  return { pairPrice: pair, setPrice: setOf4 };
}
