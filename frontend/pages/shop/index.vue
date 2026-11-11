<script setup lang="ts">
import type { Pagination, Product, TireFilterFacets } from '~/types';
import type { TireFiltersState } from '~/components/tire/TireFilterPanel.vue';
import { SITE_DESCRIPTION, SITE_NAME } from '~/constants/site';
import { normalizeSearchText, stripInvisibleChars } from '~/utils/normalize';
import { formatTireSizeLabel } from '~/utils/tire';

const route = useRoute();
const router = useRouter();
const api = useApi();

const PAGE_SIZE = 24;
type SortMode = 'price_asc' | 'price_desc';

const products = ref<Product[]>([]);
const pagination = ref<Pagination | null>(null);
const facets = ref<TireFilterFacets | null>(null);
const facetsLoading = ref(true);
const loading = ref(false);
const loadingMore = ref(false);
const showMobileFilters = ref(false);
/** Ignore stale responses when filters/query change quickly. */
let productsRequestId = 0;

const sort = ref<SortMode>('price_asc');
const query = ref('');

const filters = ref<TireFiltersState>({});

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
];

const pageTitle = computed(() => {
  if (route.query.homeDeal === '1' || route.query.homeDeal === 'true') {
    return 'پیشنهاد شگفت‌انگیز';
  }
  if (route.query.homeFeatured === '1' || route.query.homeFeatured === 'true') {
    return 'جدیدترین لاستیک‌ها';
  }
  const { width, aspect, rim, brand } = filters.value;
  if (width && aspect && rim) {
    return `لاستیک ${formatTireSizeLabel(width, aspect, rim)}`;
  }
  if (brand) return `لاستیک ${brand}`;
  return 'فروشگاه لاستیک';
});

function parseRouteFilters(): TireFiltersState {
  const q = route.query;
  const num = (key: string) => {
    const v = q[key];
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (key: string) => {
    const v = q[key];
    return typeof v === 'string' && v ? v : undefined;
  };
  const bool = (key: string) => q[key] === '1' || q[key] === 'true';

  return {
    width: num('width'),
    aspect: num('aspect'),
    rim: num('rim'),
    brand: str('brand'),
    country: str('country'),
    season: str('season'),
    year: num('year'),
    loadIndex: str('loadIndex'),
    speedIndex: str('speedIndex'),
    usageType: str('usageType'),
    pattern: str('pattern'),
    tubeless: bool('tubeless') || undefined,
    runFlat: bool('runFlat') || undefined,
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    minDiscount: num('minDiscount'),
    inStock: bool('inStock') || undefined,
    discounted: bool('discounted') || undefined,
  };
}

function buildQueryFromState(): Record<string, string> {
  const next: Record<string, string> = {};
  const f = filters.value;
  const setNum = (key: string, val?: number) => {
    if (val != null && val > 0) next[key] = String(val);
  };
  const setStr = (key: string, val?: string) => {
    if (val) next[key] = val;
  };

  setNum('width', f.width);
  setNum('aspect', f.aspect);
  setNum('rim', f.rim);
  setStr('brand', f.brand);
  setStr('country', f.country);
  setStr('season', f.season);
  setNum('year', f.year);
  setStr('loadIndex', f.loadIndex);
  setStr('speedIndex', f.speedIndex);
  setStr('usageType', f.usageType);
  setStr('pattern', f.pattern);
  if (f.tubeless) next.tubeless = '1';
  if (f.runFlat) next.runFlat = '1';
  setNum('priceMin', f.priceMin);
  setNum('priceMax', f.priceMax);
  setNum('minDiscount', f.minDiscount);
  if (f.inStock) next.inStock = '1';
  if (f.discounted) next.discounted = '1';

  const term = normalizeSearchText(query.value);
  if (term) next.q = term;
  if (sort.value) next.sort = sort.value;
  return next;
}

function syncFromRoute() {
  filters.value = parseRouteFilters();
  query.value = normalizeSearchText((route.query.q as string) || '');
  const routeSort = route.query.sort as string;
  if (sortOptions.some((o) => o.value === routeSort)) {
    sort.value = routeSort as SortMode;
  } else {
    sort.value = 'price_asc';
  }
}

function replaceRoute() {
  void router.replace({ path: '/shop', query: buildQueryFromState() });
}

function clearFilters() {
  filters.value = {};
  query.value = '';
  sort.value = 'price_asc';
  void router.replace({ path: '/shop', query: { sort: 'price_asc' } });
}

async function loadFacets() {
  facetsLoading.value = true;
  try {
    const { data } = await api.get<TireFilterFacets>('/vehicles/facets');
    facets.value = data;
  } catch {
    facets.value = null;
  } finally {
    facetsLoading.value = false;
  }
}

async function fetchProducts(page: number, append: boolean) {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    page: String(page),
    sort: sort.value,
  });

  const f = filters.value;
  if (f.width) params.set('width', String(f.width));
  if (f.aspect) params.set('aspect', String(f.aspect));
  if (f.rim) params.set('rim', String(f.rim));
  if (f.brand) params.set('brand', f.brand);
  if (f.country) params.set('country', f.country);
  if (f.season) params.set('season', f.season);
  if (f.year) params.set('year', String(f.year));
  if (f.loadIndex) params.set('loadIndex', f.loadIndex);
  if (f.speedIndex) params.set('speedIndex', f.speedIndex);
  if (f.usageType) params.set('usageType', f.usageType);
  if (f.pattern) params.set('pattern', f.pattern);
  if (f.tubeless) params.set('tubeless', '1');
  if (f.runFlat) params.set('runFlat', '1');
  if (f.priceMin) params.set('priceMin', String(f.priceMin));
  if (f.priceMax) params.set('priceMax', String(f.priceMax));
  if (f.minDiscount) params.set('minDiscount', String(f.minDiscount));
  if (f.inStock) params.set('inStock', 'true');
  if (f.discounted || (f.minDiscount != null && f.minDiscount > 0)) {
    params.set('discounted', 'true');
  }

  const term = normalizeSearchText(query.value);
  if (term) params.set('q', term);
  if (route.query.homeDeal === '1' || route.query.homeDeal === 'true') {
    params.set('homeDeal', 'true');
  }
  if (route.query.homeFeatured === '1' || route.query.homeFeatured === 'true') {
    params.set('homeFeatured', 'true');
  }

  const requestId = append ? productsRequestId : ++productsRequestId;
  loading.value = !append;
  if (append) loadingMore.value = true;
  try {
    const { data } = await api.get<{ products: Product[]; pagination: Pagination }>(
      `/products?${params}`
    );
    if (requestId !== productsRequestId) return;
    products.value = append ? [...products.value, ...(data.products ?? [])] : (data.products ?? []);
    pagination.value = data.pagination ?? null;
  } catch {
    if (requestId !== productsRequestId) return;
    if (!append) {
      products.value = [];
      pagination.value = null;
    }
  } finally {
    if (requestId === productsRequestId) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

const hasMore = computed(() => {
  const p = pagination.value;
  return !!p && p.page < p.totalPages;
});

async function loadFirst() {
  await fetchProducts(1, false);
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  await fetchProducts((pagination.value?.page ?? 1) + 1, true);
}

const { sentinel: loadMoreSentinel } = useInfiniteScroll(loadMore);

let filterDebounce: ReturnType<typeof setTimeout> | null = null;

watch(
  filters,
  () => {
    if (filterDebounce) clearTimeout(filterDebounce);
    filterDebounce = setTimeout(() => {
      replaceRoute();
    }, 350);
  },
  { deep: true }
);

function setSort(next: SortMode) {
  sort.value = next;
  replaceRoute();
}

function onQueryInput(event: Event) {
  query.value = stripInvisibleChars((event.target as HTMLInputElement).value);
}

function submitSearch() {
  // Route watch loads products — avoid a second racing fetch here.
  replaceRoute();
}

watch(
  () => route.query,
  () => {
    syncFromRoute();
    void loadFirst();
  },
  { immediate: true }
);

onMounted(() => {
  void loadFacets();
});

usePageSeo(() => ({
  title: `${pageTitle.value} | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
}));
</script>

<template>
  <div class="mx-auto max-w-[1240px] px-4 py-4">
    <h1 class="section-title">{{ pageTitle }}</h1>

    <form class="mb-4" @submit.prevent="submitSearch">
      <div class="relative">
        <input
          :value="query"
          type="search"
          class="input-field pe-12"
          placeholder="جستجو در لاستیک‌ها..."
          @input="onQueryInput"
        />
        <button type="submit" class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400">
          <AppIcon name="lucide:search" size="md" />
        </button>
      </div>
    </form>

    <div class="mb-3 flex flex-wrap items-center gap-2 md:hidden">
      <button
        type="button"
        class="btn-secondary text-sm"
        @click="showMobileFilters = !showMobileFilters"
      >
        {{ showMobileFilters ? 'بستن فیلتر' : 'فیلترها' }}
      </button>
    </div>

    <div class="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
      <div :class="showMobileFilters ? 'mb-4 block' : 'hidden lg:block'">
        <TireFilterPanel v-model="filters" :facets="facets" :loading="facetsLoading" @clear="clearFilters" />
      </div>

      <div>
        <div class="mb-3 flex items-center gap-3">
          <span class="shrink-0 text-xs font-semibold text-slate-500">مرتب‌سازی:</span>
          <div class="flex gap-2">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              :class="[
                'rounded-full px-4 py-2 text-sm font-semibold border transition-colors',
                sort === option.value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
              @click="setSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <LoadingSpinner :show="loading" />
        <ProductCardList v-if="!loading" :products="products" />

        <div
          v-if="!loading && products.length && (hasMore || loadingMore)"
          class="flex flex-col items-center gap-2 py-6"
        >
          <div ref="loadMoreSentinel" class="h-1 w-full" aria-hidden="true" />
          <LoadingSpinner :show="loadingMore" />
        </div>

        <EmptyCatalogScene
          v-if="!loading && !products.length"
          variant="products"
          title="لاستیکی یافت نشد"
          description="فیلترها را تغییر دهید یا سایز دیگری را امتحان کنید."
          class="mt-4"
        >
          <button type="button" class="btn-primary btn-action text-sm px-6" @click="clearFilters">
            پاک کردن فیلترها
          </button>
        </EmptyCatalogScene>
      </div>
    </div>
  </div>
</template>
