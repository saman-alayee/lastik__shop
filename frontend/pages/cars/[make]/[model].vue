<script setup lang="ts">
import type { Pagination, Product, VehicleModel } from '~/types';
import { SITE_NAME } from '~/constants/site';

const route = useRoute();
const router = useRouter();
const api = useApi();

const makeSlug = computed(() => String(route.params.make || ''));
const modelSlug = computed(() => String(route.params.model || ''));
const trimSlug = computed(() => String(route.query.trim || ''));
const yearQuery = computed(() => {
  const raw = route.query.year;
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(n) && n > 0 ? n : null;
});

const model = ref<VehicleModel | null>(null);
const products = ref<Product[]>([]);
const pagination = ref<Pagination | null>(null);
const loading = ref(true);
const productsLoading = ref(false);

/** خالی = همه سایزهای سازگار خودرو */
const selectedSizeId = ref('');

const standardSizes = computed(() => {
  const fits = model.value?.fitments ?? [];
  const seen = new Set<string>();
  const rows: { label: string; id: string; isStandard?: boolean; note?: string | null }[] = [];
  for (const f of fits) {
    const label = f.tireSize?.label || '';
    if (!label || seen.has(f.tireSizeId)) continue;
    seen.add(f.tireSizeId);
    rows.push({
      label,
      id: f.tireSizeId,
      isStandard: f.isStandard,
      note: f.note,
    });
  }
  return rows.sort((a, b) => Number(Boolean(b.isStandard)) - Number(Boolean(a.isStandard)));
});

const activeSizeLabel = computed(() => {
  if (!selectedSizeId.value) return null;
  return standardSizes.value.find((s) => s.id === selectedSizeId.value)?.label ?? null;
});

async function loadModel() {
  loading.value = true;
  try {
    const { data } = await api.get<VehicleModel>(
      `/vehicles/makes/${makeSlug.value}/models/${modelSlug.value}`
    );
    model.value = data;

    const fromQuery = String(route.query.sizeId || route.query.tireSizeId || '');
    if (fromQuery && (data.fitments ?? []).some((f) => f.tireSizeId === fromQuery)) {
      selectedSizeId.value = fromQuery;
    } else if (
      selectedSizeId.value &&
      !(data.fitments ?? []).some((f) => f.tireSizeId === selectedSizeId.value)
    ) {
      selectedSizeId.value = '';
    }
  } catch {
    model.value = null;
  } finally {
    loading.value = false;
  }
}

let productsLoadId = 0;

async function loadProducts() {
  const requestId = ++productsLoadId;
  productsLoading.value = true;
  try {
    const params = new URLSearchParams({
      make: makeSlug.value,
      model: modelSlug.value,
      limit: '24',
      page: '1',
    });
    if (trimSlug.value) params.set('trim', trimSlug.value);
    if (yearQuery.value) params.set('year', String(yearQuery.value));
    if (selectedSizeId.value) params.set('tireSizeId', selectedSizeId.value);

    const { data } = await api.get<{ products: Product[]; pagination: Pagination }>(
      `/vehicles/compatible-products?${params}`
    );
    if (requestId !== productsLoadId) return;
    products.value = data.products ?? [];
    pagination.value = data.pagination ?? null;
  } catch {
    if (requestId !== productsLoadId) return;
    products.value = [];
    pagination.value = null;
  } finally {
    if (requestId === productsLoadId) productsLoading.value = false;
  }
}

async function loadPage() {
  await loadModel();
  await loadProducts();
}

function selectSize(sizeId: string) {
  selectedSizeId.value = sizeId;
  const query = { ...route.query } as Record<string, string | string[] | undefined>;
  if (sizeId) query.sizeId = sizeId;
  else delete query.sizeId;
  delete query.tireSizeId;
  void router.replace({ query });
  void loadProducts();
}

onMounted(loadPage);
watch([makeSlug, modelSlug, trimSlug, yearQuery], loadPage);

const pageTitle = computed(() => {
  if (!model.value) return 'خودرو';
  return `لاستیک ${model.value.make?.name ?? ''} ${model.value.name}`.trim();
});

usePageSeo(() => ({
  title: `${pageTitle.value} | ${SITE_NAME}`,
  description: model.value?.seoDescription || `لاستیک مناسب ${pageTitle.value}`,
}));
</script>

<template>
  <div class="mx-auto max-w-[1240px] px-4 py-6">
    <LoadingSpinner :show="loading" />

    <template v-if="!loading && model">
      <nav class="mb-2 text-xs text-gray-500">
        <NuxtLink to="/cars" class="hover:text-primary-600">خودروها</NuxtLink>
        <span class="mx-1">/</span>
        <span class="text-gray-800">{{ model.make?.name }} {{ model.name }}</span>
      </nav>

      <h1 class="section-title">لاستیک {{ model.make?.name }} {{ model.name }}</h1>
      <p class="mb-5 max-w-2xl text-sm leading-6 text-gray-500">
        این خودرو می‌تواند چند سایز استاندارد داشته باشد. یکی را انتخاب کنید یا همه را ببینید.
      </p>

      <section v-if="standardSizes.length" class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="text-sm font-bold text-gray-800">سایزهای استاندارد</h2>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ standardSizes.filter((s) => s.isStandard).length }} سایز استاندارد
              <span v-if="standardSizes.some((s) => !s.isStandard)">
                · {{ standardSizes.filter((s) => !s.isStandard).length }} سایز جایگزین
              </span>
            </p>
          </div>
          <p v-if="activeSizeLabel" class="text-xs font-semibold text-primary-700" dir="ltr">
            فیلتر: {{ activeSizeLabel }}
          </p>
        </div>

        <label class="block max-w-sm">
          <span class="field-label">انتخاب سایز</span>
          <AppSelect
            :model-value="selectedSizeId"
            :options="[
              { value: '', label: 'همه سایزها' },
              ...standardSizes.map((size) => ({
                value: size.id,
                label: size.isStandard ? `${size.label} ★` : size.label,
                hint: size.isStandard ? 'استاندارد' : 'جایگزین',
              })),
            ]"
            size="sm"
            searchable
            @update:model-value="(value) => selectSize(String(value || ''))"
          />
        </label>
      </section>

      <LoadingSpinner :show="productsLoading" />
      <ProductCardList v-if="!productsLoading" :products="products" />

      <EmptyCatalogScene
        v-if="!productsLoading && !products.length"
        variant="products"
        title="لاستیک سازگار یافت نشد"
        description="برای این مدل هنوز سایز استاندارد یا محصول مرتبط ثبت نشده است. سایز دیگری را امتحان کنید."
        class="mt-4"
      >
        <NuxtLink to="/shop" class="btn-primary btn-action text-sm px-6">فروشگاه لاستیک</NuxtLink>
      </EmptyCatalogScene>
    </template>

    <EmptyCatalogScene
      v-else-if="!loading"
      variant="products"
      title="مدل خودرو یافت نشد"
      class="mt-4"
    >
      <NuxtLink to="/cars" class="btn-primary btn-action text-sm px-6">بازگشت به خودروها</NuxtLink>
    </EmptyCatalogScene>
  </div>
</template>
