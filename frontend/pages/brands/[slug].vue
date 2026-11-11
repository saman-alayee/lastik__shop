<script setup lang="ts">
import type { Category, Pagination, Product } from '~/types';
import { SITE_NAME } from '~/constants/site';
import { FEATURED_BRANDS, brandLogoPath, normalizeBrandKey } from '~/constants/brandLogos';

const route = useRoute();
const api = useApi();
const { getCategoryImage } = useFormat();

const brandName = computed(() => decodeURIComponent(String(route.params.slug || '')));

const products = ref<Product[]>([]);
const pagination = ref<Pagination | null>(null);
const loading = ref(true);
const brandLogo = ref<string | null>(null);

async function loadLogo() {
  try {
    const { data } = await api.get<{ categories?: Category[] } | Category[]>('/categories');
    const cats = Array.isArray(data) ? data : data?.categories ?? [];
    const key = normalizeBrandKey(brandName.value);
    const cat = cats.find(
      (c) =>
        normalizeBrandKey(c.name) === key ||
        normalizeBrandKey(c.slug) === key ||
        key.includes(normalizeBrandKey(c.name))
    );
    const featured = FEATURED_BRANDS.find(
      (f) => normalizeBrandKey(f.name) === key
    );
    brandLogo.value = brandLogoPath(brandName.value, cat?.image) || featured?.logo || null;
  } catch {
    const featured = FEATURED_BRANDS.find(
      (f) => normalizeBrandKey(f.name) === normalizeBrandKey(brandName.value)
    );
    brandLogo.value = brandLogoPath(brandName.value) || featured?.logo || null;
  }
}

let brandLoadId = 0;

async function load() {
  const requestId = ++brandLoadId;
  const currentBrand = brandName.value;
  loading.value = true;
  try {
    const params = new URLSearchParams({
      brand: currentBrand,
      limit: '24',
      page: '1',
    });
    const [{ data }] = await Promise.all([
      api.get<{ products: Product[]; pagination: Pagination }>(`/products?${params}`),
      loadLogo(),
    ]);
    if (requestId !== brandLoadId) return;
    products.value = data.products ?? [];
    pagination.value = data.pagination ?? null;
  } catch {
    if (requestId !== brandLoadId) return;
    products.value = [];
    pagination.value = null;
  } finally {
    if (requestId === brandLoadId) loading.value = false;
  }
}

onMounted(load);
watch(brandName, load);

usePageSeo(() => ({
  title: `لاستیک ${brandName.value} | ${SITE_NAME}`,
  description: `خرید لاستیک برند ${brandName.value}`,
}));
</script>

<template>
  <div class="mx-auto max-w-[1240px] px-4 py-6">
    <nav class="mb-2 text-xs text-gray-500">
      <NuxtLink to="/brands" class="hover:text-primary-600">برندها</NuxtLink>
      <span class="mx-1">/</span>
      <span class="text-gray-800">{{ brandName }}</span>
    </nav>
    <div class="mb-4 flex items-center gap-3.5">
      <span
        v-if="brandLogo"
        class="grid h-[4.25rem] w-[6.5rem] place-items-center rounded-2xl border border-slate-200 bg-[radial-gradient(70%_65%_at_50%_40%,#fff,#f1f5f9)] p-2.5 shadow-sm"
      >
        <img
          :src="getCategoryImage(brandLogo)"
          :alt="brandName"
          class="max-h-full max-w-full object-contain drop-shadow-sm"
        />
      </span>
      <h1 class="section-title mb-0 text-xl font-black md:text-2xl">لاستیک {{ brandName }}</h1>
    </div>

    <LoadingSpinner :show="loading" />
    <ProductCardList v-if="!loading" :products="products" class="mt-4" />

    <EmptyCatalogScene
      v-if="!loading && !products.length"
      variant="products"
      title="محصولی برای این برند نیست"
      class="mt-4"
    >
      <NuxtLink to="/shop" class="btn-primary btn-action text-sm px-6">همه لاستیک‌ها</NuxtLink>
    </EmptyCatalogScene>

    <p v-if="pagination && pagination.total > 0" class="mt-4 text-center text-xs text-gray-400">
      {{ pagination.total }} محصول
    </p>
  </div>
</template>
