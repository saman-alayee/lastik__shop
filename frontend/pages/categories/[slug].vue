<script setup lang="ts">
import type { Category, Product, Pagination } from '~/types';

const route = useRoute();
const api = useApi();
const catalogDemo = useCatalogDemo();
const slug = computed(() => route.params.slug as string);

const PAGE_SIZE = 24;

type ListingFilter = 'all' | 'instock' | 'discount' | 'new' | 'other';
type SortMode = 'price_asc' | 'price_desc';

const filterOptions: { value: ListingFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'instock', label: 'موجود' },
  { value: 'discount', label: 'تخفیف' },
  { value: 'new', label: 'جدید' },
  { value: 'other', label: 'سایر' },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
];

function readFilter(value: unknown, inStockQuery?: unknown): ListingFilter {
  if (value === 'instock' || value === 'discount' || value === 'new' || value === 'other') return value;
  if (inStockQuery === '1' || inStockQuery === 'true') return 'instock';
  return 'all';
}

function readSort(value: unknown): SortMode {
  if (value === 'price_desc') return 'price_desc';
  return 'price_asc';
}

const listingFilter = ref<ListingFilter>(readFilter(route.query.filter, route.query.inStock));
const sort = ref<SortMode>(readSort(route.query.sort));

const { data: category } = await useAsyncData(
  () => `category-${slug.value}`,
  async () => {
    if (catalogDemo.forceDemo.value) {
      const demo = catalogDemo.demoCategory(slug.value);
      if (demo) return demo;
    }
    try {
      const { data } = await api.get<Category>(`/categories/${slug.value}`);
      return data;
    } catch {
      return null;
    }
  },
  { watch: [slug] }
);

const { data: categories } = await useAsyncData('all-categories', async () => {
  const { data } = await api.get<Category[]>('/categories');
  return data;
});

const products = ref<Product[]>([]);
const listPagination = ref<Pagination | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
let productsRequestId = 0;

const hasMore = computed(() => {
  const page = listPagination.value;
  return !!page && page.page < page.totalPages;
});

function applyClientFilter(list: Product[]) {
  let next = list;
  if (listingFilter.value === 'instock') next = next.filter((item) => item.inStock);
  if (listingFilter.value === 'discount') next = next.filter((item) => item.discountPrice != null);
  if (listingFilter.value === 'new') next = next.filter((item) => item.isNew);
  if (listingFilter.value === 'other') {
    next = next.filter((item) => !item.isNew && item.discountPrice == null);
  }
  return next;
}

function syncQuery() {
  navigateTo(
    {
      path: route.path,
      query: {
        ...(listingFilter.value === 'all' ? {} : { filter: listingFilter.value }),
        sort: sort.value,
      },
    },
    { replace: true }
  );
}

async function loadProducts(nextPage = 1, append = false) {
  const requestId = append ? productsRequestId : ++productsRequestId;
  const demoCat = catalogDemo.demoCategory(slug.value);
  if (catalogDemo.forceDemo.value && demoCat) {
    if (requestId !== productsRequestId) return;
    const demo = applyClientFilter(catalogDemo.demoProductsByCategory(slug.value));
    products.value = demo;
    listPagination.value = { page: 1, limit: PAGE_SIZE, total: demo.length, totalPages: 1 };
    return;
  }

  const params = new URLSearchParams({
    category: slug.value,
    limit: String(PAGE_SIZE),
    page: String(nextPage),
  });
  params.set('sort', sort.value);
  if (listingFilter.value === 'instock') params.set('inStock', 'true');
  if (listingFilter.value === 'discount') params.set('listing', 'discount');
  if (listingFilter.value === 'new') params.set('listing', 'new');
  if (listingFilter.value === 'other') params.set('listing', 'other');

  try {
    const { data } = await api.get<{ products: Product[]; pagination: Pagination }>(
      `/products?${params}`
    );
    if (requestId !== productsRequestId) return;
    products.value = append ? [...products.value, ...(data.products ?? [])] : (data.products ?? []);
    listPagination.value = data.pagination ?? null;
  } catch {
    if (requestId !== productsRequestId) return;
    if (!append) {
      products.value = [];
      listPagination.value = null;
    }
  }
}

async function reload() {
  loading.value = true;
  products.value = [];
  listPagination.value = null;
  const requestId = productsRequestId + 1;
  try {
    await loadProducts(1);
  } finally {
    if (requestId === productsRequestId) loading.value = false;
  }
}

function setFilter(value: string | number) {
  const next = readFilter(value);
  if (listingFilter.value === next) return;
  listingFilter.value = next;
  syncQuery();
  void reload();
}

function setSort(value: string | number) {
  const next = readSort(value);
  if (sort.value === next) return;
  sort.value = next;
  syncQuery();
  void reload();
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    await loadProducts((listPagination.value?.page ?? 1) + 1, true);
  } finally {
    loadingMore.value = false;
  }
}

const { sentinel: loadMoreSentinel } = useInfiniteScroll(loadMore);

watch(slug, () => {
  listingFilter.value = 'all';
  sort.value = 'price_asc';
  void reload();
});

onMounted(reload);

usePageSeo(() => ({
  title: category.value?.name || 'دسته‌بندی',
  description: category.value?.name
    ? `خرید ${category.value.name} از فروشگاه لاستیک‌شاپ، با ارسال سریع و ضمانت اصالت.`
    : undefined,
  path: category.value ? `/categories/${category.value.slug}` : undefined,
  image: category.value?.image || undefined,
}));
</script>

<template>
  <div class="pb-8">
    <div class="sticky top-14 z-30 min-w-0 border-b border-gray-100 bg-white/95 px-4 pb-4 pt-4 backdrop-blur">
      <h1 class="section-title mb-3">{{ category?.name }}</h1>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label class="block min-w-0">
          <span class="field-label">برند / دسته</span>
          <AppSelect
            :model-value="slug"
            :options="[
              { value: '__all__', label: 'همه دسته‌ها' },
              ...(categories ?? []).map((item) => ({ value: item.slug, label: item.name })),
            ]"
            searchable
            size="sm"
            @update:model-value="(value) => {
              const next = String(value || '');
              if (!next || next === '__all__') navigateTo('/categories');
              else if (next !== slug) navigateTo(`/categories/${next}`);
            }"
          />
        </label>
        <label class="block min-w-0">
          <span class="field-label">فیلتر</span>
          <AppSelect
            :model-value="listingFilter"
            :options="filterOptions"
            size="sm"
            @update:model-value="setFilter"
          />
        </label>
        <label class="block min-w-0">
          <span class="field-label">مرتب‌سازی</span>
          <AppSelect
            :model-value="sort"
            :options="sortOptions"
            size="sm"
            @update:model-value="setSort"
          />
        </label>
      </div>
    </div>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="px-4 pt-4">
      <ProductCardList v-if="products.length" :products="products" layout="grid" />
      <EmptyCatalogScene
        v-else
        variant="products"
        title="لاستیکی با این فیلتر پیدا نشد"
        description="فیلتر را عوض کنید یا همه محصولات این برند را ببینید."
      >
        <button type="button" class="btn-secondary btn-action text-sm px-5" @click="setFilter('all')">
          نمایش همه
        </button>
        <NuxtLink to="/brands" class="btn-primary btn-action text-sm px-5">برندها</NuxtLink>
      </EmptyCatalogScene>

      <div v-if="hasMore || loadingMore" class="flex flex-col items-center gap-2 py-6">
        <div ref="loadMoreSentinel" class="h-1 w-full" aria-hidden="true" />
        <LoadingSpinner :show="loadingMore" />
      </div>
    </div>
  </div>
</template>
