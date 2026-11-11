<script setup lang="ts">
import type { Product, Category } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';
import { navCategoryLabel } from '~/constants/categoryNav';
import wpCategoryParents from '~/constants/wpCategoryParents.json';
import { effectiveProductStock, parseClothingMeta } from '~/utils/clothing';

const route = useRoute();
const api = useApi();
const catalogDemo = useCatalogDemo();
const cartStore = useCartStore();
const toast = useToast();
const { formatPrice, getProductImage } = useFormat();
const { isFavorite, toggleFavorite } = useFavorites();

/** Must stay reactive — SPA reuse of this page keeps setup alive across slug changes. */
const slug = computed(() => String(route.params.slug || ''));
const isTireStore = STORE_MODE === 'tire';

const { data: product, pending: productPending, error: productError } = await useAsyncData(
  () => `product-${slug.value}`,
  async () => {
    const currentSlug = slug.value;
    if (!currentSlug) return null;

    if (catalogDemo.forceDemo.value || currentSlug.startsWith('demo-')) {
      const demo = catalogDemo.demoProduct(currentSlug);
      if (demo) {
        catalogDemo.markDemo(true);
        return demo;
      }
    }

    async function fetchOnce() {
      const { data } = await api.get<Product>(`/products/${currentSlug}`);
      return data;
    }

    try {
      const data = await fetchOnce();
      catalogDemo.markDemo(false);
      return data;
    } catch {
      // One retry covers brief backend/proxy blips that looked like empty product pages.
      try {
        await new Promise((r) => setTimeout(r, 250));
        if (slug.value !== currentSlug) return null;
        const data = await fetchOnce();
        catalogDemo.markDemo(false);
        return data;
      } catch {
        return null;
      }
    }
  },
  { watch: [slug] }
);

const parentBySlug = wpCategoryParents as Record<string, string | null>;

const { data: navCategories } = await useAsyncData('catalog-nav-categories', async () => {
  try {
    const { data } = await api.get<Category[]>('/categories?lite=1');
    return data ?? [];
  } catch {
    return [] as Category[];
  }
});

const crumbs = computed(() => {
  const current = product.value;
  if (!current) return [] as { label: string; to: string }[];

  const bySlug = new Map<string, { slug: string; name: string }>();
  for (const item of navCategories.value ?? []) bySlug.set(item.slug, item);
  for (const item of current.categories ?? []) bySlug.set(item.slug, item);
  if (current.category) bySlug.set(current.category.slug, current.category);

  function chain(start: string) {
    const items: { label: string; to: string }[] = [];
    const seen = new Set<string>();
    let slug: string | null = start;
    while (slug && !seen.has(slug)) {
      seen.add(slug);
      const category = bySlug.get(slug);
      items.unshift({
        label: category ? navCategoryLabel(category) : slug,
        to: `/categories/${slug}`,
      });
      slug = parentBySlug[slug] ?? null;
    }
    return items;
  }

  const slugs = [
    ...(current.categories ?? []).map((item) => item.slug),
    current.category?.slug,
  ].filter((slug): slug is string => Boolean(slug));
  const trail = [...new Set(slugs)]
    .map((slug) => chain(slug))
    .sort((a, b) => b.length - a.length)[0] ?? [];

  return [
    { label: 'خانه', to: '/' },
    ...trail,
    { label: current.name, to: '' },
  ];
});

const isDemoProduct = computed(
  () => !!product.value && catalogDemo.isDemoProductId(product.value.id)
);

const relatedProducts = ref<Product[]>([]);

const quantity = computed(() => cartStore.getItemQuantity(product.value?.id ?? ''));
const favorited = computed(() => (product.value ? isFavorite(product.value.id) : false));

const galleryImages = computed(() => {
  if (!product.value) return [] as string[];
  if (product.value.images?.length) return product.value.images;
  return product.value.image ? [product.value.image] : [];
});

const activeImageIndex = ref(0);
const clothingMeta = computed(() => (product.value ? parseClothingMeta(product.value) : null));
const selectedColor = ref<string | undefined>();
const selectedSize = ref<string | undefined>();

watch(clothingMeta, (meta) => {
  selectedColor.value = meta?.colors?.[0]?.name;
  selectedSize.value = meta?.sizes?.[0];
});

watch(selectedColor, (color) => {
  const meta = clothingMeta.value;
  const swatch = meta?.colors?.find((c) => c.name === color);
  if (swatch?.imageIndex != null && swatch.imageIndex < galleryImages.value.length) {
    activeImageIndex.value = swatch.imageIndex;
  }
});

const variantStock = computed(() => {
  if (!product.value) return 0;
  if (isTireStore) return product.value.stock ?? 0;
  return effectiveProductStock(product.value, selectedColor.value, selectedSize.value);
});

const holdLocked = computed(() => Boolean(product.value?.isHeld) && quantity.value === 0);
const inStockDisplay = computed(() => {
  // Already reserved in this shopper's cart — keep cart controls usable.
  if (quantity.value > 0) return true;
  if (product.value?.isHeld) return false;
  return variantStock.value > 0;
});
const canPurchase = computed(() => !isDemoProduct.value && inStockDisplay.value);
const unavailableLabel = computed(() =>
  holdLocked.value
    ? product.value?.holdMessage || 'این کالا انتخاب شده؛ در حال خرید است'
    : 'ناموجود'
);
const addingToCart = ref(false);
const justAdded = ref(false);
let addedTimer: ReturnType<typeof setTimeout> | null = null;

async function addToCart(qty = 1) {
  if (!product.value || !canPurchase.value || addingToCart.value) return;
  addingToCart.value = true;
  justAdded.value = false;
  try {
    await cartStore.addItem(product.value.id, qty);
    justAdded.value = true;
    toast.success('به سبد خرید اضافه شد');
    if (addedTimer) clearTimeout(addedTimer);
    addedTimer = setTimeout(() => {
      justAdded.value = false;
    }, 1600);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'افزودن به سبد انجام نشد');
  } finally {
    addingToCart.value = false;
  }
}

onUnmounted(() => {
  if (addedTimer) clearTimeout(addedTimer);
});

watch(galleryImages, (images) => {
  if (activeImageIndex.value >= images.length) {
    activeImageIndex.value = 0;
  }
});

async function loadRelated() {
  if (!product.value) {
    relatedProducts.value = [];
    return;
  }
  if (isDemoProduct.value) {
    relatedProducts.value = catalogDemo.demoRelated(slug.value, 12);
    return;
  }
  try {
    const { data } = await api.get<Product[]>(`/products/${slug.value}/related?limit=12`);
    relatedProducts.value = data;
  } catch {
    relatedProducts.value = [];
  }
}

watch(slug, () => {
  activeImageIndex.value = 0;
  selectedColor.value = undefined;
  selectedSize.value = undefined;
  relatedProducts.value = [];
});

watch(product, loadRelated, { immediate: true });

usePageSeo(() => ({
  title: product.value?.seoTitle || product.value?.name || 'محصول',
  description:
    product.value?.seoDescription ||
    product.value?.description?.slice(0, 160) ||
    undefined,
  path: product.value ? `/products/${product.value.slug}` : undefined,
  image: product.value ? getProductImage(product.value.image) : undefined,
  jsonLd: product.value
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.value.name,
        description: product.value.seoDescription || product.value.description || undefined,
        brand: product.value.tireBrand
          ? { '@type': 'Brand', name: product.value.tireBrand }
          : undefined,
        sku: product.value.tireSizeLabel || product.value.barcode || undefined,
        image: galleryImages.value.map((img) => getProductImage(img)),
        offers: {
          '@type': 'Offer',
          price: product.value.effectivePrice,
          priceCurrency: 'IRR',
          availability: canPurchase.value
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      }
    : undefined,
}));
</script>

<template>
  <div v-if="productPending && !product" class="mx-auto max-w-[1240px] px-4 py-16 text-center text-sm text-gray-500">
    در حال بارگذاری محصول…
  </div>

  <div v-else-if="!product" class="mx-auto max-w-[1240px] px-4 py-10">
    <EmptyCatalogScene
      variant="products"
      title="این محصول پیدا نشد"
      :description="
        productError
          ? 'بارگذاری محصول ناموفق بود. دوباره تلاش کنید.'
          : 'این لاستیک موجود نیست. فروشگاه یا برندها را ببینید.'
      "
    >
      <NuxtLink to="/shop" class="btn-primary btn-action text-sm px-6">
        فروشگاه لاستیک
      </NuxtLink>
      <NuxtLink to="/" class="btn-secondary btn-action text-sm px-6">خانه</NuxtLink>
    </EmptyCatalogScene>
  </div>

  <div v-else class="pd-page pb-28 md:pb-14">
    <div class="pd-page__wash" aria-hidden="true" />

    <div v-if="isDemoProduct" class="relative mx-auto max-w-[1240px] px-4 pt-3">
      <AppAlertBanner variant="info" message="این محصول نمایشی است (تصاویر placeholder) — فقط برای پیش‌نمایش ظاهر فروشگاه." />
    </div>

    <div class="relative mx-auto max-w-[1240px] px-4 pb-6 pt-6 md:pb-10 md:pt-10">
      <nav
        v-if="crumbs.length"
        aria-label="مسیر صفحه"
        class="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-slate-500"
      >
        <template v-for="(crumb, index) in crumbs" :key="`${crumb.label}-${index}`">
          <span v-if="index" class="text-slate-300" aria-hidden="true">/</span>
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="transition-colors hover:text-slate-900"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="font-semibold text-slate-900" aria-current="page">{{ crumb.label }}</span>
        </template>
      </nav>

      <div class="pd-page__layout">
        <ProductDetailGallery
          :images="galleryImages"
          :active-index="activeImageIndex"
          :product-name="product.name"
          :favorited="favorited"
          @update:active-index="activeImageIndex = $event"
          @toggle-favorite="toggleFavorite(product.id)"
        />

        <ProductDetailSpecs
          :product="product"
          :clothing-meta="clothingMeta"
          v-model:selected-color="selectedColor"
          v-model:selected-size="selectedSize"
          :is-demo-product="isDemoProduct"
          :in-stock-display="inStockDisplay"
          :can-purchase="canPurchase"
          :unavailable-label="unavailableLabel"
          :hold-locked="holdLocked"
          :quantity="quantity"
          :adding="addingToCart"
          :just-added="justAdded"
          @add-to-cart="addToCart()"
          @add-to-cart-qty="addToCart"
          @decrease-qty="cartStore.updateQuantity(product.id, quantity - 1)"
          @increase-qty="cartStore.updateQuantity(product.id, quantity + 1)"
          @remove-from-cart="cartStore.removeItem(product.id)"
        />
      </div>
    </div>

    <ProductReviews v-if="product" :slug="product.slug" />

    <section v-if="relatedProducts.length" class="relative mx-auto mt-2 max-w-[1240px] border-t border-slate-200/80 px-4 pb-8 pt-8">
      <div class="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 class="text-base font-extrabold text-slate-900">
            {{ isTireStore ? 'لاستیک‌های مشابه' : 'محصولات مشابه' }}
          </h2>
          <p class="mt-1 text-xs text-slate-500">گزینه‌های نزدیک از نظر سایز یا برند</p>
        </div>
        <NuxtLink to="/shop" class="text-xs font-bold text-accent-600 hover:text-accent-500">
          همه محصولات
        </NuxtLink>
      </div>
      <ProductCardList :products="relatedProducts" layout="strip" />
    </section>

    <div class="pd-mobile-bar md:hidden">
      <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[11px] font-semibold text-slate-500">
            {{ isTireStore ? 'قیمت هر حلقه' : 'قیمت' }}
          </p>
          <p
            v-if="!canPurchase && quantity === 0"
            class="text-sm font-extrabold text-red-700"
          >
            {{ unavailableLabel }}
          </p>
          <p v-else class="text-base font-extrabold tabular-nums text-slate-900">
            {{ formatPrice(product.effectivePrice) }}
          </p>
        </div>

        <button
          v-if="quantity === 0 || justAdded || addingToCart"
          type="button"
          class="pd-mobile-bar__cta"
          :class="{ 'is-success': justAdded }"
          :disabled="!canPurchase || addingToCart"
          @click="addToCart()"
        >
          <AppIcon v-if="justAdded" name="lucide:check" size="sm" />
          {{
            !canPurchase
              ? unavailableLabel
              : addingToCart
                ? '…'
                : justAdded
                  ? 'اضافه شد'
                  : 'افزودن'
          }}
        </button>

        <div v-else class="pd-mobile-bar__qty">
          <button
            type="button"
            class="pd-mobile-bar__qty-btn"
            aria-label="کم کردن"
            @click="quantity <= 1 ? cartStore.removeItem(product.id) : cartStore.updateQuantity(product.id, quantity - 1)"
          >
            <AppIcon name="lucide:minus" size="sm" />
          </button>
          <span class="text-sm font-bold">{{ quantity }}</span>
          <button
            type="button"
            class="pd-mobile-bar__qty-btn"
            aria-label="زیاد کردن"
            @click="cartStore.updateQuantity(product.id, quantity + 1)"
          >
            <AppIcon name="lucide:plus" size="sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pd-page {
  position: relative;
  isolation: isolate;
  overflow: clip;
  background: #f8fafc;
}

.pd-page__wash {
  pointer-events: none;
  position: absolute;
  inset: 0 0 auto 0;
  height: min(58vh, 560px);
  background:
    radial-gradient(ellipse 70% 55% at 85% -10%, rgba(220, 38, 38, 0.1), transparent 55%),
    radial-gradient(ellipse 55% 45% at 0% 10%, rgba(30, 41, 59, 0.08), transparent 50%),
    linear-gradient(180deg, #eef2f7 0%, #f8fafc 70%);
  z-index: 0;
}

.pd-page__layout {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .pd-page__layout {
    grid-template-columns: minmax(280px, 460px) minmax(0, 1fr);
    align-items: start;
    gap: 2.25rem;
  }
}

@media (min-width: 1100px) {
  .pd-page__layout {
    grid-template-columns: minmax(340px, 520px) minmax(0, 1fr);
    gap: 3rem;
  }
}

.pd-mobile-bar {
  position: fixed;
  inset-inline: 0;
  bottom: 4rem;
  z-index: 55;
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 -8px 28px rgba(15, 23, 42, 0.08);
}

.pd-mobile-bar__cta {
  display: inline-flex;
  height: 2.85rem;
  min-width: 7.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: rgb(30 41 59);
  padding: 0 1rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.pd-mobile-bar__cta:active:not(:disabled) {
  transform: scale(0.98);
}

.pd-mobile-bar__cta:disabled {
  cursor: not-allowed;
  background: rgb(203 213 225);
}

.pd-mobile-bar__cta.is-success {
  background: rgb(22 163 74);
}

.pd-mobile-bar__qty {
  display: inline-flex;
  height: 2.85rem;
  min-width: 7.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: rgb(22 163 74);
  padding: 0.25rem 0.4rem;
  color: #fff;
}

.pd-mobile-bar__qty-btn {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
}
</style>
