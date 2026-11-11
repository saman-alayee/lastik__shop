<script setup lang="ts">
import type { ClothingMeta, Product, TireMeta } from '~/types';
import { STORE_MODE } from '~/constants/site';
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

const computedPairPrice = computed(() => {
  return props.product.pairPrice ?? pairPrice(props.product.effectivePrice, tireMeta.value);
});

const computedSetPrice = computed(() => {
  return props.product.setPrice ?? setPrice(props.product.effectivePrice, tireMeta.value);
});

const tireSpecRows = computed(() => {
  const m = tireMeta.value;
  if (!m) return [] as { label: string; value: string }[];
  const rows: { label: string; value: string }[] = [];
  if (tireSizeDisplay.value) rows.push({ label: 'سایز', value: tireSizeDisplay.value });
  if (m.brand) rows.push({ label: 'برند', value: m.brand });
  if (m.country) rows.push({ label: 'کشور', value: m.country });
  if (m.season) rows.push({ label: 'فصل', value: seasonLabel(m.season) });
  if (m.usageType) rows.push({ label: 'کاربری', value: usageLabel(m.usageType) });
  if (m.pattern) rows.push({ label: 'طرح آج', value: m.pattern });
  if (m.loadIndex) rows.push({ label: 'شاخص بار', value: m.loadIndex });
  if (m.speedIndex) rows.push({ label: 'شاخص سرعت', value: m.speedIndex });
  if (m.year) rows.push({ label: 'سال', value: String(m.year) });
  if (m.tubeless) rows.push({ label: 'تیوبلس', value: 'بله' });
  if (m.runFlat) rows.push({ label: 'ران‌فلت', value: 'بله' });
  return rows;
});

const { formatPrice } = useFormat();

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
  <div class="mt-5 flex min-w-0 flex-col md:mt-1">
    <h1 class="text-[19px] font-bold leading-8 text-[#3c322b] md:text-xl">
      {{ product.name }}
    </h1>
    <ProductRating
      v-if="product.ratingCount"
      class="mt-2"
      :value="product.ratingAvg || 0"
      :count="product.ratingCount"
      size="md"
    />

    <div class="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
      <p class="text-[22px] font-bold leading-none text-[#3c322b]">
        {{ formatPrice(product.effectivePrice) }}
      </p>
      <p v-if="product.discountPrice" class="text-sm text-gray-400 line-through">
        {{ formatPrice(product.price) }}
      </p>
      <span
        v-if="!isDemoProduct && !inStockDisplay && quantity === 0"
        class="inline-flex w-fit max-w-full items-center rounded bg-[#fde8e6] px-1.5 py-px text-[11px] font-semibold leading-5 text-[#b42318]"
      >
        {{ unavailableLabel }}
      </span>
    </div>

    <div v-if="tireMeta && tireSpecRows.length" class="mt-4 overflow-hidden rounded-xl border border-gray-200">
      <dl class="divide-y divide-gray-100 text-sm">
        <div v-for="row in tireSpecRows" :key="row.label" class="flex justify-between gap-3 px-3 py-2">
          <dt class="text-gray-500">{{ row.label }}</dt>
          <dd class="font-semibold text-gray-900" :dir="row.label === 'سایز' ? 'ltr' : undefined">{{ row.value }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="tireMeta && canPurchase" class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800 hover:bg-primary-100"
        :disabled="adding"
        @click="emit('addToCartQty', 2)"
      >
        افزودن جفت ({{ formatPrice(computedPairPrice) }})
      </button>
      <button
        type="button"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
        :disabled="adding"
        @click="emit('addToCartQty', 4)"
      >
        افزودن ست ۴تایی ({{ formatPrice(computedSetPrice) }})
      </button>
    </div>

    <p v-if="isDemoProduct" class="mt-2 text-xs text-gray-500">موجود — فقط نمایشی</p>
    <p v-else-if="holdLocked" class="mt-2 text-sm text-amber-800">
      {{ unavailableLabel }}
    </p>
    <p v-else-if="!inStockDisplay && quantity === 0" class="mt-2 text-sm text-neutral-500">
      این محصول فعلاً موجود نیست؛ مشخصات را می‌توانید ببینید.
    </p>

    <div
      v-if="clothingMeta?.sizes?.length || clothingMeta?.colors?.length"
      class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
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

    <div class="mt-5 hidden items-center gap-3 md:flex">
      <button
        v-if="quantity === 0 || justAdded || adding"
        type="button"
        class="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-lg px-6 text-sm text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
        :class="justAdded ? 'bg-[#1f8a4c]' : 'bg-primary-700 hover:bg-primary-800'"
        :disabled="!canPurchase || adding"
        @click="emit('addToCart')"
      >
        <AppIcon v-if="justAdded" name="lucide:check" size="sm" />
        {{ !canPurchase ? unavailableLabel : adding ? 'در حال افزودن…' : justAdded ? 'به سبد اضافه شد' : 'افزودن به سبد خرید' }}
      </button>

      <div v-else class="inline-flex h-12 min-w-[190px] items-center justify-between gap-3 rounded-lg bg-[#1f8a4c] px-3 text-white">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md bg-white/15"
          aria-label="کم کردن"
          @click="quantity <= 1 ? emit('removeFromCart') : emit('decreaseQty')"
        >
          <AppIcon name="lucide:minus" size="sm" />
        </button>
        <span class="text-sm font-bold">{{ quantity }} در سبد</span>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md bg-white/15"
          aria-label="زیاد کردن"
          @click="emit('increaseQty')"
        >
          <AppIcon name="lucide:plus" size="sm" />
        </button>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-2 text-gray-400">
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 hover:text-[#25D366]" aria-label="واتساپ" @click="share('whatsapp')">
        <AppIcon name="lucide:message-circle" size="sm" />
      </button>
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 hover:text-[#229ED9]" aria-label="تلگرام" @click="share('telegram')">
        <AppIcon name="lucide:send" size="sm" />
      </button>
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" aria-label="ایکس" @click="share('twitter')">
        <AppIcon name="lucide:twitter" size="sm" />
      </button>
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 hover:text-[#1877F2]" aria-label="فیسبوک" @click="share('facebook')">
        <AppIcon name="lucide:facebook" size="sm" />
      </button>
    </div>

    <div
      v-if="product.description"
      class="mt-8 text-sm leading-8 text-[#6e655d] whitespace-pre-line"
    >
      {{ product.description }}
    </div>

    <div v-if="clothingMeta?.sizeGuide" class="mt-6 text-sm leading-8 text-[#6e655d] whitespace-pre-line">
      <p class="mb-1 font-bold text-[#3c322b]">راهنمای سایز</p>
      {{ clothingMeta.sizeGuide }}
    </div>
  </div>
</template>
