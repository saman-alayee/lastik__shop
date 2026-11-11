<script setup lang="ts">
import type { Product } from '~/types';
import { brandLogoPath } from '~/constants/brandLogos';
import { STORE_MODE } from '~/constants/site';
import { parseClothingMeta } from '~/utils/clothing';
import {
  formatTireSizeLabel,
  pairPrice,
  parseTireMeta,
  seasonLabel,
  usageLabel,
} from '~/utils/tire';

const props = withDefaults(
  defineProps<{ product: Product; size?: 'default' | 'compact' | 'sarak' }>(),
  { size: 'default' }
);

const isClothingStore = STORE_MODE === 'clothing';
const isTireStore = STORE_MODE === 'tire';
const fabricLabel = computed(
  () => parseClothingMeta(props.product)?.fabric || props.product.unit || '\u00A0'
);
const tireMeta = computed(() => parseTireMeta(props.product));
const tireSizeLabel = computed(() => {
  const meta = tireMeta.value;
  return (
    meta?.sizeLabel ||
    formatTireSizeLabel(
      meta?.width ?? props.product.tireWidth,
      meta?.aspect ?? props.product.tireAspect,
      meta?.rim ?? props.product.tireRim
    ) ||
    ''
  );
});
const tireBrand = computed(
  () => tireMeta.value?.brand || props.product.tireBrand || ''
);
const tireSeason = computed(() => seasonLabel(tireMeta.value?.season || props.product.tireSeason));
const tireUsage = computed(() => usageLabel(tireMeta.value?.usageType || props.product.tireUsageType));
const tireLoadSpeed = computed(() => {
  const load = tireMeta.value?.loadIndex || props.product.tireLoadIndex;
  const speed = tireMeta.value?.speedIndex || props.product.tireSpeedIndex;
  if (!load && !speed) return '';
  return [load, speed].filter(Boolean).join(' / ');
});
const tirePairPrice = computed(() => {
  const unit = props.product.effectivePrice;
  return props.product.pairPrice ?? pairPrice(unit, tireMeta.value);
});
const composedCardImage = computed(() =>
  Boolean(props.product.image && String(props.product.image).includes('/nexen/cards/'))
);

const cartStore = useCartStore();
const { formatPriceCompact, getProductImage, toPersianDigits, getCategoryImage } = useFormat();
const brandLogoSrc = computed(() => {
  const brand = tireBrand.value;
  if (!brand) return null;
  const path = brandLogoPath(brand);
  return path ? getCategoryImage(path) : null;
});
const { isFavorite, toggleFavorite } = useFavorites();

const isCompact = computed(() => props.size === 'compact');
const isSarak = computed(() => props.size === 'sarak');

const clothingMeta = computed(() => parseClothingMeta(props.product));
const colorLabels = computed(() => clothingMeta.value?.colors?.map((c) => c.name).slice(0, 4) ?? []);

const {
  primarySrc: cardPrimarySrc,
  hoverSrc: cardHoverSrc,
  hoverEnabled: cardHoverEnabled,
  onPrimaryError: onCardPrimaryError,
  onHoverError: onCardHoverError,
  preloadHover: preloadCardHover,
} = useProductCardImages(toRef(props, 'product'));

const cardHasSwapHover = computed(() => Boolean(cardHoverSrc.value));
const sarakMediaRef = ref<HTMLElement | null>(null);

let sarakImageObserver: IntersectionObserver | null = null;

onMounted(() => {
  if (!isSarak.value || isTireStore) return;
  nextTick(() => {
    const el = sarakMediaRef.value;
    if (!el || typeof IntersectionObserver === 'undefined') {
      preloadCardHover();
      return;
    }
    sarakImageObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          preloadCardHover();
          sarakImageObserver?.disconnect();
          sarakImageObserver = null;
        }
      },
      { rootMargin: '160px 0px' }
    );
    sarakImageObserver.observe(el);
  });
});

onUnmounted(() => {
  sarakImageObserver?.disconnect();
  sarakImageObserver = null;
});

const outOfStock = computed(() => !props.product.inStock);
const holdLocked = computed(() => Boolean(props.product.isHeld));
const stockLabel = computed(() =>
  holdLocked.value
    ? props.product.holdMessage || 'این کالا انتخاب شده؛ در حال خرید است'
    : 'ناموجود'
);
const quantity = computed(() => cartStore.getItemQuantity(props.product.id));
const isAdding = computed(() => cartStore.addingProductId === props.product.id);
const favorited = computed(() => isFavorite(props.product.id));
const favLoading = ref(false);
const heartPop = ref(false);

async function handleFavorite(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  if (favLoading.value) return;
  const wasOn = favorited.value;
  favLoading.value = true;
  try {
    await toggleFavorite(props.product.id);
    if (!wasOn) {
      heartPop.value = true;
      window.setTimeout(() => {
        heartPop.value = false;
      }, 520);
    }
  } finally {
    favLoading.value = false;
  }
}

async function handleAdd(event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  await cartStore.addItem(props.product.id);
}

async function handleIncrease(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  await cartStore.updateQuantity(props.product.id, quantity.value + 1);
}

async function handleDecrease(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  if (quantity.value <= 1) {
    await cartStore.removeItem(props.product.id);
  } else {
    await cartStore.updateQuantity(props.product.id, quantity.value - 1);
  }
}
</script>

<template>
  <!-- کارت تخصصی لاستیک -->
  <article
    v-if="isTireStore"
    class="tire-card group relative flex h-full w-full flex-col overflow-hidden"
    :class="[
      isCompact ? 'tire-card--compact' : '',
      outOfStock ? 'is-out' : '',
    ]"
  >
    <div class="tire-card__media" :class="{ 'tire-card__media--studio': true }">
      <NuxtLink :to="`/products/${product.slug}`" class="tire-card__image-link" draggable="false">
        <img
          :src="getProductImage(product.image)"
          :alt="product.name"
          class="tire-card__image tire-card__image--contain"
          loading="lazy"
          decoding="async"
          width="420"
          height="420"
          draggable="false"
          @error="(e) => { const t = e.target as HTMLImageElement; if (t) t.src = '/images/placeholder-product.svg' }"
        />
      </NuxtLink>

      <!-- اگر تصویر ترکیبی نبود: لوگو شفاف کنار سایز -->
      <div v-if="!composedCardImage && (brandLogoSrc || tireSizeLabel)" class="tire-card__size-row" dir="ltr">
        <img
          v-if="brandLogoSrc"
          :src="brandLogoSrc"
          :alt="tireBrand"
          class="tire-card__size-logo"
          loading="lazy"
        />
        <div v-if="tireSizeLabel" class="tire-card__size">
          <span class="tire-card__size-dot" aria-hidden="true" />
          <span>{{ tireSizeLabel }}</span>
        </div>
      </div>

      <div v-if="product.discountPercent > 0" class="tire-card__badge tire-card__badge--sale">
        {{ toPersianDigits(product.discountPercent) }}٪
      </div>
      <div v-else-if="product.isNew" class="tire-card__badge tire-card__badge--new">جدید</div>

      <button
        type="button"
        class="product-card-fav tire-card__fav absolute z-20 disabled:opacity-60"
        :class="{ 'is-on': favorited, 'is-pop': heartPop }"
        :disabled="favLoading"
        :aria-pressed="favorited"
        :aria-label="favorited ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'"
        @click="handleFavorite"
      >
        <AppIcon name="lucide:bookmark" :size="isCompact ? 'sm' : 'md'" class="product-card-fav__icon" />
      </button>
    </div>

    <div class="tire-card__body">
      <div class="tire-card__meta">
        <span v-if="tireBrand" class="tire-card__chip">{{ tireBrand }}</span>
        <span
          v-if="tireSeason && tireSeason !== '—'"
          class="tire-card__chip tire-card__chip--soft"
        >
          {{ tireSeason }}
        </span>
        <span
          v-if="!isCompact && tireUsage && tireUsage !== '—'"
          class="tire-card__chip tire-card__chip--soft"
        >
          {{ tireUsage }}
        </span>
      </div>

      <NuxtLink
        :to="`/products/${product.slug}`"
        class="tire-card__title"
        draggable="false"
      >
        {{ product.name }}
      </NuxtLink>

      <p v-if="!isCompact && tireLoadSpeed" class="tire-card__spec" dir="ltr">
        LI / SI · {{ tireLoadSpeed }}
      </p>

      <div class="tire-card__footer">
        <div class="tire-card__price-block">
          <p v-if="outOfStock" class="product-card-oos" :class="holdLocked ? 'product-card-oos--held' : ''">
            {{ stockLabel }}
          </p>
          <template v-else>
            <p v-if="product.discountPrice" class="tire-card__old-price">
              {{ formatPriceCompact(product.price) }}
            </p>
            <p class="tire-card__price">
              {{ formatPriceCompact(product.effectivePrice) }}
              <span>تومان</span>
            </p>
            <p v-if="!isCompact" class="tire-card__pair">
              جفت
              <strong>{{ formatPriceCompact(tirePairPrice) }}</strong>
              تومان
            </p>
          </template>
        </div>

        <div v-if="product.inStock" class="tire-card__cart">
          <template v-if="quantity === 0">
            <button
              type="button"
              class="tire-card__add"
              :disabled="isAdding"
              :aria-label="'افزودن به سبد'"
              @click="handleAdd"
            >
              <AppIcon v-if="!isAdding" name="lucide:plus" size="sm" />
              <AppIcon v-else name="lucide:loader-2" size="sm" class="animate-spin" />
              <span v-if="!isCompact">افزودن</span>
            </button>
          </template>
          <div v-else class="tire-card__qty">
            <button type="button" @click="handleDecrease">
              <AppIcon name="lucide:minus" size="sm" />
            </button>
            <span>{{ quantity }}</span>
            <button type="button" @click="handleIncrease">
              <AppIcon name="lucide:plus" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- سبک فشرده کارت (legacy density) -->
  <article
    v-else-if="isSarak"
    class="product-card product-card--sarak relative flex h-full w-full flex-col bg-white"
    :class="{ 'is-out': outOfStock }"
  >
    <NuxtLink
      ref="sarakMediaRef"
      :to="`/products/${product.slug}`"
      :class="[
        'product-card-sarak-media relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100',
        cardHasSwapHover ? 'product-card-sarak-media--swap' : 'product-card-sarak-media--lift',
      ]"
      draggable="false"
      @mouseenter="preloadCardHover()"
      @focusin="preloadCardHover()"
    >
      <span class="product-card-sarak-shine" aria-hidden="true" />
      <img
        :src="cardPrimarySrc"
        :alt="product.name"
        class="product-card-sarak-img-primary absolute inset-0 h-full w-full object-cover object-center"
        :class="[
          cardHoverSrc ? 'product-card-sarak-img-primary--swap' : 'product-card-sarak-img-primary--zoom',
          cardHoverEnabled ? 'product-card-sarak-img-primary--hide-on-hover' : '',
        ]"
        loading="lazy"
        decoding="async"
        width="400"
        height="533"
        draggable="false"
        @error="onCardPrimaryError()"
      />
      <img
        v-if="cardHoverSrc"
        :src="cardHoverSrc"
        :alt="product.name"
        class="product-card-sarak-img-hover absolute inset-0 h-full w-full object-cover object-center"
        :class="cardHoverEnabled ? 'product-card-sarak-img-hover--ready' : ''"
        loading="lazy"
        decoding="async"
        width="400"
        height="533"
        draggable="false"
        @error="onCardHoverError()"
      />

      <div
        v-if="colorLabels.length"
        class="product-card-sarak-colors pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-x-3 gap-y-1 px-3 pb-3 pt-12"
      >
        <span
          v-for="label in colorLabels"
          :key="label"
          class="text-xs font-normal leading-none text-white"
        >
          {{ label }}
        </span>
      </div>
    </NuxtLink>

    <button
      type="button"
      class="product-card-fav absolute top-2.5 end-2.5 z-20 flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-60"
      :class="{ 'is-on': favorited, 'is-pop': heartPop }"
      :disabled="favLoading"
      :aria-pressed="favorited"
      :aria-label="favorited ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'"
      @click="handleFavorite"
    >
      <AppIcon name="lucide:bookmark" size="md" class="product-card-fav__icon" />
    </button>

    <div class="flex flex-col gap-2 px-3 pb-3.5 pt-3.5 md:px-3.5 md:pb-4 md:pt-4">
      <NuxtLink
        :to="`/products/${product.slug}`"
        class="line-clamp-2 text-[0.9375rem] font-medium leading-6 tracking-tight text-primary-900 transition-opacity hover:opacity-70 md:text-base md:leading-7"
        draggable="false"
      >
        {{ product.name }}
      </NuxtLink>

      <p v-if="outOfStock" class="product-card-oos" :class="holdLocked ? 'product-card-oos--held' : ''">
        {{ stockLabel }}
      </p>
      <div v-else class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          v-if="product.discountPrice"
          class="price-text text-[0.75rem] font-normal leading-none text-primary-400 line-through decoration-primary-300"
        >
          {{ formatPriceCompact(product.price) }}
        </span>
        <span class="price-text text-[0.9375rem] font-semibold leading-none tracking-tight text-primary-900 md:text-base">
          {{ formatPriceCompact(product.effectivePrice) }}
        </span>
        <span class="text-[0.6875rem] font-normal leading-none text-primary-500">تومان</span>
      </div>
    </div>
  </article>

  <!-- سبک عمومی قبلی -->
  <div
    v-else
    :class="[
      'product-card group relative flex h-full w-full flex-col overflow-hidden bg-white',
      isCompact ? 'rounded-lg border border-gray-100/90' : 'rounded-xl border border-gray-100',
      outOfStock ? 'is-out' : '',
    ]"
  >
    <div class="relative shrink-0 overflow-hidden bg-neutral-50 aspect-[4/5]">
      <NuxtLink :to="`/products/${product.slug}`" class="block h-full w-full" draggable="false">
        <img
          :src="getProductImage(product.image)"
          :alt="product.name"
          class="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          width="400"
          height="533"
          draggable="false"
          @error="(e) => { const t = e.target as HTMLImageElement; if (t) t.src = '/images/placeholder-product.svg' }"
        />
      </NuxtLink>

      <div
        v-if="product.discountPercent > 0"
        :class="[
          'absolute z-10 font-bold text-white bg-red-500',
          isCompact ? 'top-0 start-0 rounded-ee-lg px-1.5 py-0.5 text-[9px]' : 'top-0 start-0 rounded-ee-xl px-2 py-1 text-[10px]',
        ]"
      >
        {{ product.discountPercent }}٪
      </div>

      <button
        type="button"
        class="product-card-fav absolute z-20 disabled:opacity-60"
        :class="[
          isCompact ? 'bottom-1.5 start-1.5 h-8 w-8' : 'bottom-2 end-2 h-10 w-10',
          { 'is-on': favorited, 'is-pop': heartPop },
        ]"
        :disabled="favLoading"
        :aria-pressed="favorited"
        :aria-label="favorited ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'"
        @click="handleFavorite"
      >
        <AppIcon
          name="lucide:bookmark"
          :size="isCompact ? 'sm' : 'md'"
          class="product-card-fav__icon"
        />
      </button>
    </div>

    <div
      :class="
        isCompact ? 'flex flex-1 flex-col px-2 pb-2 pt-1.5' : 'flex flex-1 flex-col px-3 pb-3 pt-2.5'
      "
    >
      <NuxtLink
        :to="`/products/${product.slug}`"
        :class="isCompact ? 'block h-[1.85rem] shrink-0' : 'block h-[2.6rem] shrink-0'"
        draggable="false"
      >
        <h3
          :class="[
            'line-clamp-2 font-medium text-gray-800',
            isCompact ? 'text-[11px] leading-[0.925rem]' : 'text-sm leading-[1.125rem]',
          ]"
        >
          {{ product.name }}
        </h3>
      </NuxtLink>

      <p
        v-if="!isCompact"
        class="mt-1 h-[15px] shrink-0 truncate text-[11px] leading-[15px] text-gray-400"
      >
        {{ fabricLabel }}
      </p>

      <div :class="isCompact ? 'mt-auto pt-1' : 'mt-auto flex flex-col gap-2.5 pt-2'">
        <div :class="isCompact ? 'shrink-0' : 'h-[2.6rem] shrink-0'">
          <p v-if="outOfStock" class="product-card-oos" :class="holdLocked ? 'product-card-oos--held' : ''">
            {{ stockLabel }}
          </p>
          <template v-else>
            <p
              v-if="product.discountPrice"
              :class="[
                'price-text line-through text-gray-400',
                isCompact ? 'mb-0 h-[10px] text-[9px] leading-[10px]' : 'mb-0.5 h-[15px] text-[11px] leading-[15px]',
              ]"
            >
              {{ formatPriceCompact(product.price) }}
            </p>
            <p
              :class="[
                'price-text font-bold leading-tight text-gray-900',
                isCompact ? 'text-[11px]' : 'text-base',
              ]"
            >
              {{ formatPriceCompact(product.effectivePrice) }}
              <span :class="isCompact ? 'text-[9px] font-medium text-gray-500' : 'text-[11px] font-medium text-gray-500'">
                تومان
              </span>
            </p>
          </template>
        </div>

        <div v-if="!isCompact && !isClothingStore && product.inStock" class="flex h-10 shrink-0 items-center justify-end">
          <div v-if="quantity === 0">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700 active:scale-95"
              :disabled="isAdding"
              @click.stop="handleAdd"
            >
              <AppIcon v-if="!isAdding" name="lucide:plus" size="sm" />
              <AppIcon v-else name="lucide:loader-2" size="sm" class="animate-spin" />
            </button>
          </div>
          <div v-else class="flex items-center rounded-lg bg-primary-50">
            <button class="flex h-8 w-8 items-center justify-center text-primary-600 hover:bg-primary-100" @click.stop="handleDecrease">
              <AppIcon name="lucide:minus" size="sm" />
            </button>
            <span class="w-6 text-center text-sm font-bold text-primary-700">{{ quantity }}</span>
            <button class="flex h-8 w-8 items-center justify-center text-primary-600 hover:bg-primary-100" @click.stop="handleIncrease">
              <AppIcon name="lucide:plus" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tire-card {
  border-radius: 1.15rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.tire-card:hover {
  transform: translateY(-3px);
  border-color: #fecaca;
  box-shadow:
    0 14px 28px rgba(15, 23, 42, 0.08),
    0 2px 8px rgba(220, 38, 38, 0.06);
}

.tire-card.is-out {
  opacity: 0.78;
}

.tire-card__media {
  position: relative;
  isolation: isolate;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #fff;
}

.tire-card__media--studio {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.tire-card__image-link {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  padding: 0.65rem;
}

.tire-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.tire-card__image--contain {
  object-fit: contain;
}

.tire-card:hover .tire-card__image {
  transform: scale(1.03);
}

.tire-card__badge {
  position: absolute;
  z-index: 3;
  top: 0.65rem;
  right: 0.65rem;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
}

.tire-card__badge--sale {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  box-shadow: 0 6px 14px rgba(185, 28, 28, 0.35);
}

.tire-card__badge--new {
  background: #0f172a;
}

.tire-card__fav {
  top: 0.65rem;
  left: 0.65rem;
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
}

.tire-card__size-row {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 0.7rem;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  max-width: calc(100% - 1.2rem);
}

.tire-card__size-logo {
  height: 1.55rem;
  width: auto;
  max-width: 4.5rem;
  object-fit: contain;
  background: transparent;
  filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.12));
}

.tire-card__size {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.tire-card__size-dot {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  background: #dc2626;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.85);
}

.tire-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.85rem 0.9rem 0.95rem;
}

.tire-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-height: 1.35rem;
}

.tire-card__chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  background: #0f172a;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.3;
}

.tire-card__chip--soft {
  background: #f1f5f9;
  color: #475569;
}

.tire-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
}

.tire-card__title:hover {
  color: #b91c1c;
}

.tire-card__spec {
  margin: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.tire-card__footer {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.6rem;
  padding-top: 0.35rem;
}

.tire-card__old-price {
  margin: 0;
  font-size: 0.72rem;
  color: #94a3b8;
  text-decoration: line-through;
  line-height: 1.2;
}

.tire-card__price {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
}

.tire-card__price span {
  margin-inline-start: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.tire-card__pair {
  margin: 0.2rem 0 0;
  font-size: 0.7rem;
  color: #64748b;
}

.tire-card__pair strong {
  color: #b91c1c;
  font-weight: 800;
}

.tire-card__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 2.35rem;
  padding: 0.45rem 0.8rem;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(185, 28, 28, 0.28);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.tire-card__add:hover {
  filter: brightness(1.05);
}

.tire-card__add:active {
  transform: scale(0.96);
}

.tire-card__qty {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  min-height: 2.35rem;
  padding: 0.2rem;
  border-radius: 0.8rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.tire-card__qty button {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.6rem;
  color: #b91c1c;
}

.tire-card__qty button:hover {
  background: #fff;
}

.tire-card__qty span {
  min-width: 1.4rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #991b1b;
}

.tire-card--compact .tire-card__body {
  padding: 0.65rem 0.7rem 0.75rem;
  gap: 0.3rem;
}

.tire-card--compact .tire-card__title {
  min-height: 2.1rem;
  font-size: 0.78rem;
}

.tire-card--compact .tire-card__price {
  font-size: 0.85rem;
}

.tire-card--compact .tire-card__add {
  min-height: 2rem;
  width: 2rem;
  padding: 0;
  border-radius: 999px;
}

.tire-card--compact .tire-card__size-row {
  bottom: 0.5rem;
  gap: 0.4rem;
}

.tire-card--compact .tire-card__size-logo {
  height: 1.2rem;
  max-width: 3.4rem;
}

.tire-card--compact .tire-card__size {
  font-size: 0.72rem;
  min-height: 1.7rem;
}

.tire-card--compact .tire-card__fav {
  width: 2rem;
  height: 2rem;
}

.product-card-oos {
  align-self: flex-start;
  width: fit-content;
  max-width: 100%;
  border-radius: 9999px;
  background: #f3ebe3;
  padding: 3px 9px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
  color: #6f5644;
}

.product-card-oos--held {
  background: #fff4e5;
  color: #9a3412;
  border-radius: 8px;
  line-height: 1.45;
}

.product-card-sarak-media {
  isolation: isolate;
}

.product-card-sarak-media::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    165deg,
    transparent 35%,
    rgba(101, 42, 59, 0.07) 100%
  );
  transition: opacity 0.45s ease;
}

.product-card-sarak-shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 42%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 58%
  );
  transform: translateX(-120%) skewX(-12deg);
  transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-card-sarak-img-primary,
.product-card-sarak-img-hover {
  transition:
    opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.5s ease;
  will-change: opacity, transform;
}

.product-card-sarak-img-hover {
  opacity: 0;
  transform: scale(1.06) translateY(10px);
  filter: brightness(1.02);
}

.product-card-sarak-colors {
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.3s ease,
    transform 0.35s ease;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45), transparent 72%);
  z-index: 3;
}

@media (hover: hover) and (pointer: fine) {
  .product-card--sarak:hover .product-card-sarak-media::after {
    opacity: 1;
  }

  .product-card--sarak:hover .product-card-sarak-shine {
    transform: translateX(120%) skewX(-12deg);
  }

  .product-card--sarak:hover .product-card-sarak-img-primary--hide-on-hover {
    opacity: 0;
    transform: scale(1.04);
    filter: brightness(0.98);
  }

  .product-card--sarak:hover .product-card-sarak-img-hover--ready {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  .product-card--sarak:hover .product-card-sarak-img-primary--zoom {
    transform: scale(1.09);
    filter: brightness(1.03) contrast(1.02);
  }

  .product-card--sarak:hover .product-card-sarak-colors {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tire-card,
  .tire-card__image,
  .product-card-sarak-img-primary,
  .product-card-sarak-img-hover,
  .product-card-sarak-shine,
  .product-card-sarak-media::after {
    transition: none;
  }

  .tire-card:hover {
    transform: none;
  }

  .tire-card:hover .tire-card__image {
    transform: none;
  }
}

.product-card-fav {
  border-radius: 9999px;
  background: #fff;
  color: #3f3f46;
  box-shadow:
    0 1px 2px rgba(26, 15, 18, 0.12),
    0 6px 16px rgba(26, 15, 18, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.95);
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.product-card-fav:hover {
  transform: scale(1.06);
  color: #b91c1c;
  box-shadow:
    0 2px 4px rgba(26, 15, 18, 0.14),
    0 10px 22px rgba(185, 28, 28, 0.18);
}

.product-card-fav.is-on {
  color: #ef394e;
  background: #fff5f6;
  border-color: rgba(239, 57, 78, 0.28);
  box-shadow:
    0 1px 2px rgba(239, 57, 78, 0.16),
    0 8px 18px rgba(239, 57, 78, 0.22);
}

.product-card-fav.is-pop {
  animation: product-fav-pop 0.52s cubic-bezier(0.22, 1.4, 0.36, 1);
}

.product-card-fav :deep(svg.product-card-fav__icon path) {
  stroke-width: 2.35;
  fill: transparent;
  transition:
    fill 0.18s ease,
    stroke 0.18s ease;
}

.product-card-fav.is-on :deep(svg.product-card-fav__icon),
.product-card-fav.is-on :deep(svg.product-card-fav__icon path) {
  fill: #ef394e !important;
  stroke: #ef394e !important;
  color: #ef394e !important;
}

@keyframes product-fav-pop {
  0% {
    transform: scale(1);
  }
  28% {
    transform: scale(1.28);
  }
  55% {
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-card-fav.is-pop {
    animation: none;
  }
}
</style>
