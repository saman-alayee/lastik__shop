<script setup lang="ts">
import type { ClothingMeta, Product, TireMeta } from '~/types';
import { CONTACT_PHONE, STORE_HOURS, STORE_MODE } from '~/constants/site';
import { brandLogoPath } from '~/constants/brandLogos';
import { formatTireSizeLabel, pairPrice, seasonLabel, setPrice, usageLabel } from '~/utils/tire';

const props = withDefaults(
  defineProps<{
    product: Product;
    clothingMeta: ClothingMeta | null;
    isDemoProduct: boolean;
    inStockDisplay: boolean;
    canPurchase: boolean;
    unavailableLabel?: string;
    holdLocked?: boolean;
    quantity: number;
    adding?: boolean;
    justAdded?: boolean;
  }>(),
  {
    unavailableLabel: 'ناموجود',
    holdLocked: false,
  }
);

const selectedColor = defineModel<string | undefined>('selectedColor');
const selectedSize = defineModel<string | undefined>('selectedSize');

const emit = defineEmits<{
  addToCart: [];
  addToCartQty: [qty: number];
  decreaseQty: [];
  increaseQty: [];
  removeFromCart: [];
}>();

const isTireStore = STORE_MODE === 'tire';
const { formatPrice, getCategoryImage, toPersianDigits } = useFormat();

const tireMeta = computed((): TireMeta | null => {
  if (!isTireStore) return null;
  const p = props.product;
  const raw = p.tireMeta;
  const base: TireMeta = {
    sizeLabel: p.tireSizeLabel ?? undefined,
    width: p.tireWidth ?? undefined,
    aspect: p.tireAspect ?? undefined,
    rim: p.tireRim ?? undefined,
    brand: p.tireBrand ?? undefined,
    country: p.tireCountry ?? undefined,
    season: p.tireSeason ?? undefined,
    pattern: p.tirePattern ?? undefined,
    loadIndex: p.tireLoadIndex ?? undefined,
    speedIndex: p.tireSpeedIndex ?? undefined,
    year: p.tireYear ?? undefined,
    tubeless: p.tireTubeless ?? undefined,
    runFlat: p.tireRunFlat ?? undefined,
    usageType: p.tireUsageType ?? undefined,
    pairDiscountPercent: raw?.pairDiscountPercent,
    setDiscountPercent: raw?.setDiscountPercent,
  };
  return Object.values(base).some((v) => v !== undefined && v !== null) ? base : null;
});

const tireSizeDisplay = computed(() => {
  const m = tireMeta.value;
  if (!m) return '';
  return m.sizeLabel || formatTireSizeLabel(m.width, m.aspect, m.rim);
});

const brandName = computed(
  () => tireMeta.value?.brand || props.product.tireBrand || props.product.category?.name || ''
);

const brandLogoSrc = computed(() => {
  if (!brandName.value) return null;
  const path = brandLogoPath(brandName.value);
  return path ? getCategoryImage(path) : null;
});

const discountPercent = computed(() => {
  const price = props.product.price;
  const discounted = props.product.discountPrice;
  if (!price || !discounted || discounted >= price) return 0;
  return Math.round(((price - discounted) / price) * 100);
});

const computedPairPrice = computed(() => {
  return props.product.pairPrice ?? pairPrice(props.product.effectivePrice, tireMeta.value);
});

const computedSetPrice = computed(() => {
  return props.product.setPrice ?? setPrice(props.product.effectivePrice, tireMeta.value);
});

const highlightChips = computed(() => {
  const m = tireMeta.value;
  if (!m) return [] as string[];
  const chips: string[] = [];
  if (m.season) chips.push(seasonLabel(m.season));
  if (m.usageType) chips.push(usageLabel(m.usageType));
  if (m.tubeless) chips.push('تیوبلس');
  if (m.runFlat) chips.push('ران‌فلت');
  if (m.year) chips.push(`تولید ${toPersianDigits(String(m.year))}`);
  return chips.slice(0, 4);
});

const tireSpecRows = computed(() => {
  const m = tireMeta.value;
  if (!m) return [] as { label: string; value: string; dir?: 'ltr' }[];
  const rows: { label: string; value: string; dir?: 'ltr' }[] = [];
  if (tireSizeDisplay.value) rows.push({ label: 'سایز', value: tireSizeDisplay.value, dir: 'ltr' });
  if (m.brand) rows.push({ label: 'برند', value: m.brand });
  if (m.country) rows.push({ label: 'کشور سازنده', value: m.country });
  if (m.season) rows.push({ label: 'فصل', value: seasonLabel(m.season) });
  if (m.usageType) rows.push({ label: 'کاربری', value: usageLabel(m.usageType) });
  if (m.pattern) rows.push({ label: 'طرح آج', value: m.pattern });
  if (m.loadIndex) rows.push({ label: 'شاخص بار', value: m.loadIndex, dir: 'ltr' });
  if (m.speedIndex) rows.push({ label: 'شاخص سرعت', value: m.speedIndex, dir: 'ltr' });
  if (m.year) rows.push({ label: 'سال تولید', value: toPersianDigits(String(m.year)) });
  if (m.tubeless) rows.push({ label: 'تیوبلس', value: 'بله' });
  if (m.runFlat) rows.push({ label: 'ران‌فلت', value: 'بله' });
  return rows;
});

const stockTone = computed(() => {
  if (props.isDemoProduct) return 'info';
  if (props.holdLocked || (!props.inStockDisplay && props.quantity === 0)) return 'danger';
  if ((props.product.stock ?? 0) > 0 && (props.product.stock ?? 0) <= 4) return 'warn';
  return 'ok';
});

const stockText = computed(() => {
  if (props.isDemoProduct) return 'نمایشی — خرید غیرفعال';
  if (props.holdLocked) return props.unavailableLabel;
  if (!props.inStockDisplay && props.quantity === 0) return 'فعلاً ناموجود';
  const stock = props.product.stock ?? 0;
  if (isTireStore && stock > 0 && stock <= 4) {
    return `فقط ${toPersianDigits(String(stock))} حلقه مانده`;
  }
  return isTireStore ? 'آماده ارسال' : 'موجود در انبار';
});

function share(kind: 'whatsapp' | 'telegram' | 'twitter' | 'facebook') {
  if (!import.meta.client) return;
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(props.product.name);
  const links = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  };
  window.open(links[kind], '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div class="pd-specs">
    <div class="pd-specs__intro">
      <div class="pd-specs__brand-row">
        <div v-if="brandLogoSrc || brandName" class="pd-specs__brand">
          <img v-if="brandLogoSrc" :src="brandLogoSrc" :alt="brandName" class="pd-specs__brand-logo" />
          <span v-else class="pd-specs__brand-fallback">{{ brandName }}</span>
        </div>
        <ProductRating
          v-if="product.ratingCount"
          :value="product.ratingAvg || 0"
          :count="product.ratingCount"
          size="md"
        />
      </div>

      <p v-if="isTireStore && tireSizeDisplay" class="pd-specs__size" dir="ltr">
        {{ tireSizeDisplay }}
      </p>

      <h1 class="pd-specs__title">{{ product.name }}</h1>

      <div v-if="highlightChips.length" class="pd-specs__chips">
        <span v-for="chip in highlightChips" :key="chip" class="pd-specs__chip">{{ chip }}</span>
      </div>
    </div>

    <div class="pd-specs__buy">
      <div class="pd-specs__price-block">
        <div class="pd-specs__price-main">
          <p class="pd-specs__price">{{ formatPrice(product.effectivePrice) }}</p>
          <span class="pd-specs__unit">{{ isTireStore ? 'هر حلقه' : '' }}</span>
        </div>
        <div v-if="product.discountPrice" class="pd-specs__price-old">
          <span class="line-through opacity-60">{{ formatPrice(product.price) }}</span>
          <span v-if="discountPercent" class="pd-specs__discount">٪{{ toPersianDigits(String(discountPercent)) }}</span>
        </div>
        <p class="pd-specs__stock" :data-tone="stockTone">
          <span class="pd-specs__stock-dot" aria-hidden="true" />
          {{ stockText }}
        </p>
      </div>

      <div v-if="isTireStore && canPurchase" class="pd-specs__qty-packs">
        <button
          type="button"
          class="pd-pack"
          :disabled="adding"
          @click="emit('addToCartQty', 2)"
        >
          <span class="pd-pack__label">جفت</span>
          <span class="pd-pack__price">{{ formatPrice(computedPairPrice) }}</span>
        </button>
        <button
          type="button"
          class="pd-pack pd-pack--accent"
          :disabled="adding"
          @click="emit('addToCartQty', 4)"
        >
          <span class="pd-pack__label">ست ۴ حلقه</span>
          <span class="pd-pack__price">{{ formatPrice(computedSetPrice) }}</span>
        </button>
      </div>

      <div class="pd-specs__cta hidden md:flex">
        <button
          v-if="quantity === 0 || justAdded || adding"
          type="button"
          class="pd-cta"
          :class="{ 'is-success': justAdded }"
          :disabled="!canPurchase || adding"
          @click="emit('addToCart')"
        >
          <AppIcon v-if="justAdded" name="lucide:check" size="sm" />
          <AppIcon v-else-if="!adding" name="lucide:shopping-cart" size="sm" />
          {{
            !canPurchase
              ? unavailableLabel
              : adding
                ? 'در حال افزودن…'
                : justAdded
                  ? 'به سبد اضافه شد'
                  : isTireStore
                    ? 'افزودن یک حلقه'
                    : 'افزودن به سبد خرید'
          }}
        </button>

        <div v-else class="pd-qty">
          <button
            type="button"
            class="pd-qty__btn"
            aria-label="کم کردن"
            @click="quantity <= 1 ? emit('removeFromCart') : emit('decreaseQty')"
          >
            <AppIcon name="lucide:minus" size="sm" />
          </button>
          <span class="pd-qty__value">{{ toPersianDigits(String(quantity)) }} در سبد</span>
          <button type="button" class="pd-qty__btn" aria-label="زیاد کردن" @click="emit('increaseQty')">
            <AppIcon name="lucide:plus" size="sm" />
          </button>
        </div>
      </div>

      <p v-if="isDemoProduct" class="pd-specs__hint">این کالا فقط برای پیش‌نمایش است.</p>
      <p v-else-if="!inStockDisplay && quantity === 0 && !holdLocked" class="pd-specs__hint">
        مشخصات را ببینید؛ به‌محض موجود شدن می‌توانید سفارش دهید.
      </p>
    </div>

    <div
      v-if="clothingMeta?.sizes?.length || clothingMeta?.colors?.length"
      class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <label v-if="clothingMeta?.sizes?.length" class="block">
        <span class="field-label">سایز</span>
        <select v-model="selectedSize" class="input-field">
          <option v-for="size in clothingMeta.sizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <label v-if="clothingMeta?.colors?.length" class="block">
        <span class="field-label">رنگ</span>
        <select v-model="selectedColor" class="input-field">
          <option v-for="color in clothingMeta.colors" :key="color.name" :value="color.name">
            {{ color.name }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="tireSpecRows.length" class="pd-specs__table-wrap">
      <h2 class="pd-specs__section-title">مشخصات فنی</h2>
      <dl class="pd-specs__table">
        <div v-for="row in tireSpecRows" :key="row.label" class="pd-specs__row">
          <dt>{{ row.label }}</dt>
          <dd :dir="row.dir">{{ row.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="pd-trust">
      <div class="pd-trust__item">
        <AppIcon name="lucide:shield-check" size="sm" />
        <span>ضمانت اصالت کالا</span>
      </div>
      <div class="pd-trust__item">
        <AppIcon name="lucide:truck" size="sm" />
        <span>ارسال سریع</span>
      </div>
      <div class="pd-trust__item">
        <AppIcon name="lucide:clock-3" size="sm" />
        <span>{{ STORE_HOURS }}</span>
      </div>
      <a :href="`tel:${CONTACT_PHONE}`" class="pd-trust__item pd-trust__item--link" dir="ltr">
        <AppIcon name="lucide:phone" size="sm" />
        <span>{{ CONTACT_PHONE }}</span>
      </a>
    </div>

    <div class="pd-share">
      <span class="pd-share__label">اشتراک‌گذاری</span>
      <div class="pd-share__actions">
        <button type="button" aria-label="واتساپ" @click="share('whatsapp')">
          <AppIcon name="lucide:message-circle" size="sm" />
        </button>
        <button type="button" aria-label="تلگرام" @click="share('telegram')">
          <AppIcon name="lucide:send" size="sm" />
        </button>
        <button type="button" aria-label="ایکس" @click="share('twitter')">
          <AppIcon name="lucide:twitter" size="sm" />
        </button>
        <button type="button" aria-label="فیسبوک" @click="share('facebook')">
          <AppIcon name="lucide:facebook" size="sm" />
        </button>
      </div>
    </div>

    <div v-if="product.description" class="pd-desc">
      <h2 class="pd-specs__section-title">توضیحات</h2>
      <p>{{ product.description }}</p>
    </div>

    <div v-if="clothingMeta?.sizeGuide" class="pd-desc">
      <h2 class="pd-specs__section-title">راهنمای سایز</h2>
      <p>{{ clothingMeta.sizeGuide }}</p>
    </div>
  </div>
</template>

<style scoped>
.pd-specs {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.35rem;
  padding-top: 0.25rem;
}

.pd-specs__intro {
  animation: pd-rise 0.45s ease both;
}

.pd-specs__brand-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pd-specs__brand {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
}

.pd-specs__brand-logo {
  height: 1.75rem;
  width: auto;
  max-width: 7rem;
  object-fit: contain;
}

.pd-specs__brand-fallback {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgb(71 85 105);
  text-transform: uppercase;
}

.pd-specs__size {
  margin-top: 0.85rem;
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.01em;
  color: rgb(15 23 42);
}

.pd-specs__title {
  margin-top: 0.55rem;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.7;
  color: rgb(51 65 85);
}

.pd-specs__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

.pd-specs__chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.3rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgb(71 85 105);
}

.pd-specs__buy {
  border-block: 1px solid rgb(226 232 240);
  padding-block: 1.15rem;
  animation: pd-rise 0.55s ease 0.06s both;
}

.pd-specs__price-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.pd-specs__price-main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.55rem;
}

.pd-specs__price {
  font-size: clamp(1.45rem, 4vw, 1.85rem);
  font-weight: 900;
  line-height: 1;
  color: rgb(15 23 42);
  font-variant-numeric: tabular-nums;
}

.pd-specs__unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(100 116 139);
}

.pd-specs__price-old {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgb(148 163 184);
}

.pd-specs__discount {
  display: inline-flex;
  align-items: center;
  background: rgb(254 226 226);
  color: rgb(185 28 28);
  padding: 0.1rem 0.45rem;
  font-size: 0.7rem;
  font-weight: 800;
}

.pd-specs__stock {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.15rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.pd-specs__stock-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: currentColor;
}

.pd-specs__stock[data-tone='ok'] { color: rgb(21 128 61); }
.pd-specs__stock[data-tone='warn'] { color: rgb(180 83 9); }
.pd-specs__stock[data-tone='danger'] { color: rgb(185 28 28); }
.pd-specs__stock[data-tone='info'] { color: rgb(71 85 105); }

.pd-specs__qty-packs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-top: 1rem;
}

.pd-pack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  padding: 0.75rem 0.85rem;
  text-align: start;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.pd-pack:hover:not(:disabled) {
  border-color: rgb(148 163 184);
  transform: translateY(-1px);
}

.pd-pack:disabled {
  opacity: 0.5;
}

.pd-pack--accent {
  border-color: rgba(220, 38, 38, 0.28);
  background: linear-gradient(180deg, #fff 0%, #fff5f5 100%);
}

.pd-pack__label {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgb(100 116 139);
}

.pd-pack__price {
  font-size: 0.9rem;
  font-weight: 800;
  color: rgb(15 23 42);
  font-variant-numeric: tabular-nums;
}

.pd-specs__cta {
  margin-top: 1rem;
}

.pd-cta {
  display: inline-flex;
  min-height: 3.15rem;
  min-width: 13.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgb(30 41 59);
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: #fff;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.pd-cta:hover:not(:disabled) {
  background: rgb(15 23 42);
}

.pd-cta:active:not(:disabled) {
  transform: scale(0.98);
}

.pd-cta:disabled {
  cursor: not-allowed;
  background: rgb(203 213 225);
}

.pd-cta.is-success {
  background: rgb(22 163 74);
}

.pd-qty {
  display: inline-flex;
  min-height: 3.15rem;
  min-width: 13.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: rgb(22 163 74);
  padding: 0.35rem 0.55rem;
  color: #fff;
}

.pd-qty__btn {
  display: flex;
  height: 2.1rem;
  width: 2.1rem;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  transition: background-color 0.15s ease;
}

.pd-qty__btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.pd-qty__value {
  font-size: 0.9rem;
  font-weight: 800;
}

.pd-specs__hint {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  line-height: 1.7;
  color: rgb(100 116 139);
}

.pd-specs__section-title {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgb(15 23 42);
}

.pd-specs__table-wrap {
  animation: pd-rise 0.55s ease 0.1s both;
}

.pd-specs__table {
  display: grid;
  gap: 0;
  border-top: 1px solid rgb(226 232 240);
}

.pd-specs__row {
  display: grid;
  grid-template-columns: minmax(7rem, 38%) 1fr;
  gap: 0.75rem;
  border-bottom: 1px solid rgb(241 245 249);
  padding: 0.7rem 0;
  font-size: 0.85rem;
}

.pd-specs__row dt {
  color: rgb(100 116 139);
}

.pd-specs__row dd {
  font-weight: 700;
  color: rgb(15 23 42);
}

.pd-trust {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem 1rem;
  padding-top: 0.25rem;
}

@media (min-width: 640px) {
  .pd-trust {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.pd-trust__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(71 85 105);
}

.pd-trust__item--link:hover {
  color: rgb(185 28 28);
}

.pd-share {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid rgb(241 245 249);
  padding-top: 0.85rem;
}

.pd-share__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(148 163 184);
}

.pd-share__actions {
  display: flex;
  gap: 0.25rem;
}

.pd-share__actions button {
  display: flex;
  height: 2.15rem;
  width: 2.15rem;
  align-items: center;
  justify-content: center;
  color: rgb(100 116 139);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.pd-share__actions button:hover {
  background: rgb(241 245 249);
  color: rgb(15 23 42);
}

.pd-desc {
  font-size: 0.9rem;
  line-height: 2;
  color: rgb(71 85 105);
  white-space: pre-line;
}

@keyframes pd-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
