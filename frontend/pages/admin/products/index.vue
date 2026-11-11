<script setup lang="ts">
import type { Product, Category, Pagination } from '~/types';
import { STORE_MODE } from '~/constants/site';
import { TIRE_SEASON_OPTIONS, TIRE_USAGE_OPTIONS } from '~/utils/tire';

const isTireStore = STORE_MODE === 'tire';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const toast = useToast();
const { formatPrice, resolveMediaUrl, formatNumber, formatShortDate } = useFormat();

const PAGE_SIZE = 50;

const products = ref<Product[]>([]);
const pagination = ref<Pagination | null>(null);
const page = ref(1);
const categories = ref<Category[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const route = useRoute();
const search = ref(typeof route.query.search === 'string' ? route.query.search : '');
const categoryFilter = ref('');
const sortFilter = ref<'newest' | 'discount' | 'bestsellers'>('newest');
const statusFilter = ref<'active' | 'inactive' | 'all'>('all');
const stockFilter = ref<'all' | 'sold' | 'in'>('all');

const selectedIds = ref<string[]>([]);
const showBulkConfirm = ref(false);
const bulkConfirmChecked = ref(false);
const bulkDeleting = ref(false);
const pendingSingleDelete = ref<Product | null>(null);

const form = reactive({
  name: '',
  description: '',
  barcode: '',
  price: 0,
  discountPrice: null as number | null,
  stock: 0,
  unit: '',
  categoryIds: [] as string[],
  image: null as string | null,
  images: [] as string[],
  isFeatured: false,
  isNew: false,
  isOldPrice: false,
  isHomeDeal: false,
  isHomeFeatured: false,
  isActive: true,
  clothingMetaJson: '',
  tireWidth: null as number | null,
  tireAspect: null as number | null,
  tireRim: null as number | null,
  tireBrand: '',
  tireCountry: '',
  tireSeason: '',
  tirePattern: '',
  tireLoadIndex: '',
  tireSpeedIndex: '',
  tireYear: null as number | null,
  tireTubeless: false,
  tireRunFlat: false,
  tireUsageType: '',
  tirePairDiscount: 0,
  tireSetDiscount: 0,
  seoTitle: '',
  seoDescription: '',
});

const categoryOptions = computed(() =>
  categories.value.map((cat) => ({
    value: cat.id,
    label: cat.name,
    icon: 'lucide:folder',
  }))
);

const showingSold = computed(() => stockFilter.value === 'sold');

const selectableProducts = computed(() =>
  products.value.filter((p) => p.isActive)
);

const allPageSelected = computed(
  () =>
    selectableProducts.value.length > 0 &&
    selectableProducts.value.every((p) => selectedIds.value.includes(p.id))
);

const selectedCount = computed(() => selectedIds.value.length);

type ProductGroup = { key: string; label: string; products: Product[] };

const groupedProducts = computed((): ProductGroup[] => {
  if (!showingSold.value) {
    return [{ key: 'all', label: '', products: products.value }];
  }

  const map = new Map<string, Product[]>();
  for (const product of products.value) {
    const raw = product.updatedAt || product.createdAt || '';
    const key = raw ? String(raw).slice(0, 10) : 'unknown';
    const list = map.get(key) || [];
    list.push(product);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, rows]) => ({
      key,
      label: key === 'unknown' ? 'بدون تاریخ' : formatShortDate(key),
      products: rows,
    }));
});

onMounted(loadData);

function resetToFirstPageAndLoad() {
  page.value = 1;
  selectedIds.value = [];
  void loadData();
}

watch([statusFilter, sortFilter, stockFilter], () => {
  resetToFirstPageAndLoad();
});

async function loadData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(page.value),
      status: statusFilter.value || 'all',
      stock: stockFilter.value || 'all',
    });
    if (search.value.trim()) params.set('search', search.value.trim());
    if (categoryFilter.value) params.set('categoryId', categoryFilter.value);
    if (sortFilter.value && sortFilter.value !== 'newest') params.set('sort', sortFilter.value);

    const [prodRes, catRes] = await Promise.all([
      api.get<{ products: Product[]; pagination: Pagination }>(`/admin/products?${params}`),
      categories.value.length
        ? Promise.resolve({ data: categories.value })
        : api.get<Category[]>('/admin/categories'),
    ]);
    products.value = prodRes.data?.products ?? [];
    pagination.value = prodRes.data?.pagination ?? null;
    categories.value = catRes.data ?? categories.value;
    selectedIds.value = selectedIds.value.filter((id) =>
      products.value.some((p) => p.id === id)
    );

    if (
      pagination.value &&
      pagination.value.totalPages > 0 &&
      page.value > pagination.value.totalPages
    ) {
      page.value = pagination.value.totalPages;
      await loadData();
    }
  } catch (e: unknown) {
    products.value = [];
    pagination.value = null;
    toast.error(e instanceof Error ? e.message : 'بارگذاری محصولات انجام نشد');
  } finally {
    loading.value = false;
  }
}

function goToPage(next: number) {
  page.value = next;
  selectedIds.value = [];
  void loadData();
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSelect(id: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id];
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  }
}

function toggleSelectAll(checked: boolean) {
  if (!checked) {
    selectedIds.value = [];
    return;
  }
  selectedIds.value = selectableProducts.value.map((p) => p.id);
}

function openBulkConfirm() {
  if (!selectedIds.value.length) {
    toast.info('ابتدا چند محصول را انتخاب کنید');
    return;
  }
  pendingSingleDelete.value = null;
  bulkConfirmChecked.value = false;
  showBulkConfirm.value = true;
}

function openSingleDeleteConfirm(product: Product) {
  if (!product.isActive) {
    toast.info('این محصول از قبل حذف/غیرفعال است');
    return;
  }
  pendingSingleDelete.value = product;
  selectedIds.value = [product.id];
  bulkConfirmChecked.value = false;
  showBulkConfirm.value = true;
}

function closeBulkConfirm() {
  showBulkConfirm.value = false;
  bulkConfirmChecked.value = false;
  pendingSingleDelete.value = null;
}

async function confirmBulkDelete() {
  if (!bulkConfirmChecked.value) {
    toast.error('برای حذف باید تأیید را تیک بزنید');
    return;
  }
  if (!selectedIds.value.length) return;

  bulkDeleting.value = true;
  try {
    const { data } = await api.post<{ deleted: number; requested: number }>(
      '/admin/products/bulk-delete',
      { ids: selectedIds.value }
    );
    const deleted = data?.deleted ?? 0;
    toast.success(
      deleted
        ? `${formatNumber(deleted)} محصول حذف شد و از فروشگاه پنهان گردید`
        : 'محصول فعالی برای حذف نبود'
    );
    closeBulkConfirm();
    selectedIds.value = [];
    await loadData();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف گروهی انجام نشد');
  } finally {
    bulkDeleting.value = false;
  }
}

function openForm(product?: Product) {
  if (product) {
    editingId.value = product.id;
    Object.assign(form, {
      name: product.name,
      description: product.description || '',
      barcode: product.barcode || '',
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      unit: product.unit || '',
      categoryIds: product.categoryIds?.length
        ? [...product.categoryIds]
        : product.categoryId
          ? [product.categoryId]
          : [],
      image: product.image,
      images: product.images?.length ? [...product.images] : product.image ? [product.image] : [],
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isOldPrice: product.isOldPrice ?? false,
      isHomeDeal: product.isHomeDeal ?? false,
      isHomeFeatured: product.isHomeFeatured ?? false,
      isActive: product.isActive,
      clothingMetaJson: product.clothingMeta ? JSON.stringify(product.clothingMeta, null, 2) : '',
      tireWidth: product.tireWidth ?? null,
      tireAspect: product.tireAspect ?? null,
      tireRim: product.tireRim ?? null,
      tireBrand: product.tireBrand || '',
      tireCountry: product.tireCountry || '',
      tireSeason: product.tireSeason || '',
      tirePattern: product.tirePattern || '',
      tireLoadIndex: product.tireLoadIndex || '',
      tireSpeedIndex: product.tireSpeedIndex || '',
      tireYear: product.tireYear ?? null,
      tireTubeless: Boolean(product.tireTubeless),
      tireRunFlat: Boolean(product.tireRunFlat),
      tireUsageType: product.tireUsageType || '',
      tirePairDiscount: Number(product.tireMeta?.pairDiscountPercent ?? 0),
      tireSetDiscount: Number(product.tireMeta?.setDiscountPercent ?? 0),
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
    });
  } else {
    editingId.value = null;
    Object.assign(form, {
      name: '',
      description: '',
      barcode: '',
      price: 0,
      discountPrice: null,
      stock: 0,
      unit: '',
      categoryIds: [],
      image: null,
      images: [],
      isFeatured: false,
      isNew: false,
      isOldPrice: false,
      isHomeDeal: false,
      isHomeFeatured: false,
      isActive: true,
      clothingMetaJson: '',
      tireWidth: null,
      tireAspect: null,
      tireRim: null,
      tireBrand: '',
      tireCountry: '',
      tireSeason: '',
      tirePattern: '',
      tireLoadIndex: '',
      tireSpeedIndex: '',
      tireYear: null,
      tireTubeless: false,
      tireRunFlat: false,
      tireUsageType: '',
      tirePairDiscount: 0,
      tireSetDiscount: 0,
      seoTitle: '',
      seoDescription: '',
    });
  }
  showForm.value = true;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function onDiscountPriceInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value.trim();
  form.discountPrice = raw === '' ? null : Number(raw);
}

async function save() {
  if (!form.categoryIds.length) {
    toast.error('حداقل یک دسته‌بندی انتخاب کنید');
    return;
  }

  const price = toOptionalNumber(form.price);
  if (price === null || price <= 0) {
    toast.error('قیمت باید یک عدد معتبر باشد');
    return;
  }

  const discountPrice = toOptionalNumber(form.discountPrice);
  if (discountPrice !== null && discountPrice <= 0) {
    toast.error('قیمت با تخفیف باید خالی باشد یا عددی بزرگ‌تر از صفر');
    return;
  }
  if (discountPrice !== null && discountPrice >= price) {
    toast.error('قیمت با تخفیف باید کمتر از قیمت اصلی باشد');
    return;
  }

  const stock = toOptionalNumber(form.stock) ?? 0;

  let clothingMeta: Record<string, unknown> | null = null;
  if (form.clothingMetaJson.trim()) {
    try {
      clothingMeta = JSON.parse(form.clothingMetaJson) as Record<string, unknown>;
    } catch {
      toast.error('JSON مشخصات محصول نامعتبر است');
      return;
    }
  }

  const {
    clothingMetaJson: _c,
    tirePairDiscount,
    tireSetDiscount,
    ...formFields
  } = form;

  const tireMeta =
    isTireStore &&
    (form.tireWidth ||
      form.tireBrand ||
      tirePairDiscount ||
      tireSetDiscount)
      ? {
          pairDiscountPercent: tirePairDiscount || 0,
          setDiscountPercent: tireSetDiscount || 0,
        }
      : null;

  const payload = {
    ...formFields,
    barcode: form.barcode.trim() || null,
    price,
    discountPrice,
    stock,
    clothingMeta: isTireStore ? null : clothingMeta,
    tireWidth: form.tireWidth,
    tireAspect: form.tireAspect,
    tireRim: form.tireRim,
    tireBrand: form.tireBrand.trim() || null,
    tireCountry: form.tireCountry.trim() || null,
    tireSeason: form.tireSeason || null,
    tirePattern: form.tirePattern.trim() || null,
    tireLoadIndex: form.tireLoadIndex.trim() || null,
    tireSpeedIndex: form.tireSpeedIndex.trim() || null,
    tireYear: form.tireYear,
    tireTubeless: form.tireTubeless,
    tireRunFlat: form.tireRunFlat,
    tireUsageType: form.tireUsageType || null,
    tireMeta,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    categoryIds: form.categoryIds,
    categoryId: form.categoryIds[0] ?? null,
    image: form.images[0] ?? form.image,
    images: form.images,
  };

  try {
    if (editingId.value) {
      await api.put(`/admin/products/${editingId.value}`, payload);
      toast.success('محصول به‌روزرسانی شد');
    } else {
      await api.post('/admin/products', payload);
      toast.success('محصول ایجاد شد');
    }
    showForm.value = false;
    await loadData();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره محصول');
  }
}

async function activate(product: Product) {
  if (product.isActive) {
    toast.info('این محصول از قبل فعال است');
    return;
  }
  if (!confirm(`محصول «${product.name}» دوباره در فروشگاه نمایش داده شود؟`)) {
    return;
  }

  try {
    await api.put(`/admin/products/${product.id}`, { isActive: true });
    toast.success('محصول فعال شد');
    await loadData();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در فعال‌سازی محصول');
  }
}

useHead({ title: 'محصولات - پنل مدیریت' });
</script>

<template>
  <div>
    <AdminPageHeader
      title="مدیریت محصولات"
      description="لاستیک‌ها را با فیلتر موجودی، برند و جستجو مدیریت کنید. برای پاک‌سازی ناموجودها فیلتر «فروخته‌شده» را بزنید."
    >
      <template #actions>
        <NuxtLink to="/admin/home-picks" class="btn-secondary !py-2 !px-3 text-sm">صفحه اول</NuxtLink>
        <NuxtLink to="/admin/vehicles" class="btn-secondary !py-2 !px-3 text-sm">خودروها</NuxtLink>
        <button type="button" class="btn-primary !py-2 !px-4 text-sm" @click="openForm()">افزودن محصول</button>
      </template>
    </AdminPageHeader>

    <AdminFilterBar
      title="جستجو و فیلتر محصولات"
      hint="نام، برند یا سایز را بنویسید؛ سپس موجودی و وضعیت را محدود کنید."
    >
      <template #search>
        <label class="admin-filter-field">
          <span>جستجو</span>
          <div class="admin-filter-search">
            <AppIcon name="lucide:search" size="sm" class="admin-filter-search__icon" />
            <input
              v-model="search"
              type="search"
              class="input-field"
              placeholder="مثلاً کویر یا 185/65R15"
              @keyup.enter="resetToFirstPageAndLoad"
            />
          </div>
        </label>
      </template>
      <template #filters>
        <label class="admin-filter-field">
          <span>برند / دسته</span>
          <AppSelect
            v-model="categoryFilter"
            :options="[{ value: '', label: 'همه دسته‌ها', icon: 'lucide:layers' }, ...categoryOptions]"
            searchable
            @update:model-value="resetToFirstPageAndLoad"
          />
        </label>
        <label class="admin-filter-field">
          <span>مرتب‌سازی</span>
          <AppSelect
            v-model="sortFilter"
            :options="[
              { value: 'newest', label: 'جدیدترین' },
              { value: 'discount', label: 'بیشترین تخفیف' },
              { value: 'bestsellers', label: 'پرفروش‌ترین' },
            ]"
            @update:model-value="resetToFirstPageAndLoad"
          />
        </label>
        <label class="admin-filter-field">
          <span>موجودی</span>
          <AppSelect
            v-model="stockFilter"
            :options="[
              { value: 'all', label: 'همه موجودی‌ها' },
              { value: 'sold', label: 'فروخته‌شده (۰)' },
              { value: 'in', label: 'فقط موجود' },
            ]"
            @update:model-value="resetToFirstPageAndLoad"
          />
        </label>
        <label class="admin-filter-field">
          <span>وضعیت</span>
          <AppSelect
            v-model="statusFilter"
            :options="[
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'active', label: 'فقط فعال' },
              { value: 'inactive', label: 'فقط غیرفعال' },
            ]"
            @update:model-value="resetToFirstPageAndLoad"
          />
        </label>
      </template>
      <template #actions>
        <button type="button" class="btn-primary text-sm !py-2.5 !px-4" @click="resetToFirstPageAndLoad">
          اعمال فیلتر
        </button>
      </template>
    </AdminFilterBar>

    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
      <p class="text-sm text-gray-500">
        {{ formatNumber(pagination?.total ?? products.length) }} محصول
        <span v-if="showingSold" class="text-orange-600"> · مرتب بر اساس تاریخ</span>
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="selectedCount"
          type="button"
          class="btn-secondary text-sm py-2 text-red-700 border-red-200 hover:bg-red-50"
          @click="openBulkConfirm"
        >
          حذف گروهی ({{ formatNumber(selectedCount) }})
        </button>
      </div>
    </div>

    <div
      v-if="selectedCount"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>{{ formatNumber(selectedCount) }} محصول انتخاب شده</span>
      <div class="flex gap-2">
        <button type="button" class="text-xs underline" @click="selectedIds = []">لغو انتخاب</button>
        <button type="button" class="font-semibold underline" @click="openBulkConfirm">حذف با تأیید</button>
      </div>
    </div>

    <LoadingSpinner :show="loading" />

    <EmptyState
      v-if="!loading && !products.length"
      message="محصولی با این فیلتر پیدا نشد"
      class="py-10"
    />

    <div v-else-if="!loading" class="data-table-wrap">
      <table class="data-table min-w-[920px]">
        <thead>
          <tr>
            <th class="w-10">
              <input
                type="checkbox"
                class="rounded border-slate-300"
                :checked="allPageSelected"
                @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th class="w-16">تصویر</th>
            <th>نام</th>
            <th>کد</th>
            <th class="hidden md:table-cell">دسته</th>
            <th class="data-num">قیمت</th>
            <th class="data-num hidden md:table-cell">موجودی</th>
            <th v-if="showingSold" class="hidden sm:table-cell">تاریخ</th>
            <th>وضعیت</th>
            <th class="data-actions">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groupedProducts" :key="group.key">
            <tr v-if="showingSold && group.label">
              <td colspan="10" class="!py-2 !bg-slate-50">
                <span class="text-xs font-semibold text-slate-600">{{ group.label }}</span>
                <span class="text-[11px] text-slate-400 ms-2">
                  {{ formatNumber(group.products.length) }} مورد
                </span>
              </td>
            </tr>
            <tr v-for="product in group.products" :key="product.id">
              <td>
                <input
                  type="checkbox"
                  class="rounded border-slate-300"
                  :disabled="!product.isActive"
                  :checked="selectedIds.includes(product.id)"
                  @change="toggleSelect(product.id, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td>
                <div class="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center ring-1 ring-slate-200/80">
                  <img
                    v-if="product.image"
                    :src="resolveMediaUrl(product.image)"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                  <AppIcon v-else name="lucide:image-off" size="sm" class="text-slate-300" />
                </div>
              </td>
              <td>
                <p class="font-semibold text-slate-800">{{ product.name }}</p>
              </td>
              <td>
                <span
                  v-if="product.barcode"
                  class="font-semibold tabular-nums text-primary-700"
                  dir="ltr"
                >
                  {{ product.barcode }}
                </span>
                <span v-else class="text-xs text-slate-400">—</span>
              </td>
              <td class="hidden md:table-cell text-slate-500">{{ product.category?.name || '—' }}</td>
              <td class="data-num">
                <div class="inline-flex flex-col items-end gap-0.5">
                  <span
                    v-if="product.discountPrice"
                    class="text-xs text-slate-400 line-through"
                  >
                    {{ formatPrice(product.price) }}
                  </span>
                  <span :class="product.discountPrice ? 'text-red-600 font-semibold' : 'font-medium text-slate-800'">
                    {{ formatPrice(product.effectivePrice) }}
                  </span>
                </div>
              </td>
              <td class="data-num hidden md:table-cell">
                <span :class="product.stock <= 0 ? 'text-orange-600 font-semibold' : ''">
                  {{ product.stock }}
                </span>
              </td>
              <td v-if="showingSold" class="hidden sm:table-cell text-xs text-slate-500 whitespace-nowrap">
                {{ formatShortDate(product.updatedAt || product.createdAt || '') }}
              </td>
              <td>
                <span :class="product.isActive ? 'admin-badge-success' : 'admin-badge-danger'">
                  {{ product.isActive ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td class="data-actions">
                <div class="admin-actions">
                  <button type="button" class="admin-btn-secondary" @click="openForm(product)">ویرایش</button>
                  <button
                    v-if="product.isActive"
                    type="button"
                    class="admin-btn-danger"
                    @click="openSingleDeleteConfirm(product)"
                  >
                    حذف
                  </button>
                  <button
                    v-else
                    type="button"
                    class="admin-btn-success"
                    @click="activate(product)"
                  >
                    فعال‌سازی
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <AppPagination :pagination="pagination" compact @update:page="goToPage" />

    <!-- Bulk / single delete confirmation -->
    <div
      v-if="showBulkConfirm"
      class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      @click.self="closeBulkConfirm"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 class="text-lg font-bold text-slate-900 mb-2">تأیید حذف</h2>
        <p class="text-sm leading-7 text-slate-600 mb-4">
          <template v-if="pendingSingleDelete">
            محصول «{{ pendingSingleDelete.name }}» از فروشگاه حذف (پنهان) می‌شود.
          </template>
          <template v-else>
            {{ formatNumber(selectedCount) }} محصول انتخاب‌شده از فروشگاه حذف (پنهان) می‌شوند.
          </template>
          این کار برگشت‌پذیر است فقط با فعال‌سازی دوباره از پنل.
        </p>

        <label class="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3 cursor-pointer mb-5">
          <input v-model="bulkConfirmChecked" type="checkbox" class="mt-1 rounded border-red-300" />
          <span class="text-sm text-red-800 leading-6">
            تأیید می‌کنم این {{ pendingSingleDelete ? 'محصول' : 'محصولات' }} حذف شوند.
          </span>
        </label>

        <div class="flex gap-2">
          <button type="button" class="btn-secondary flex-1" :disabled="bulkDeleting" @click="closeBulkConfirm">
            انصراف
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-red-600 text-white text-sm font-semibold py-2.5 disabled:opacity-40 hover:bg-red-700"
            :disabled="!bulkConfirmChecked || bulkDeleting"
            @click="confirmBulkDelete"
          >
            {{ bulkDeleting ? 'در حال حذف...' : 'حذف قطعی' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Product form modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="showForm = false">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 class="text-lg font-bold mb-4">{{ editingId ? 'ویرایش محصول' : 'افزودن محصول' }}</h2>
        <form class="space-y-4" @submit.prevent="save">
          <AppImagesUpload
            v-model="form.images"
            upload-endpoint="/admin/products/upload"
            label="تصاویر محصول"
            hint="JPEG, PNG, WebP یا GIF — حداکثر ۵ مگابایت"
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
            <input v-model="form.name" required placeholder="مثلاً نکسین ۲۲۵/۴۵R۱۷" class="input-field" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">کد / بارکد محصول</label>
            <input
              v-model="form.barcode"
              type="text"
              dir="ltr"
              placeholder="مثلاً ۵۶۰"
              class="input-field"
            />
            <p class="mt-1 text-xs text-gray-400">با همین کد در سفارش‌ها و داشبورد جستجو می‌شود.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea
              v-model="form.description"
              placeholder="توضیحات کوتاه محصول"
              rows="3"
              class="input-field resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
              <input v-model.number="form.price" type="number" min="0" required class="input-field" dir="ltr" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">قیمت با تخفیف</label>
              <input
                :value="form.discountPrice ?? ''"
                type="number"
                min="0"
                placeholder="اختیاری — خالی = بدون تخفیف"
                class="input-field"
                dir="ltr"
                @input="onDiscountPriceInput"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">موجودی انبار</label>
              <input v-model.number="form.stock" type="number" min="0" required class="input-field" dir="ltr" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">واحد فروش</label>
              <input v-model="form.unit" :placeholder="isTireStore ? 'حلقه' : 'عدد'" class="input-field" />
              <p class="mt-1 text-xs text-gray-400">{{ isTireStore ? 'معمولاً «حلقه» — قیمت پایه برای یک حلقه است.' : 'روی کارت محصول، زیر نام دیده می‌شود.' }}</p>
            </div>
          </div>

          <template v-if="isTireStore">
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
              <p class="text-sm font-semibold text-gray-800">مشخصات لاستیک</p>
              <div class="grid grid-cols-3 gap-2">
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">عرض</span>
                  <input v-model.number="form.tireWidth" type="number" class="input-field" placeholder="مثلاً ۲۰۵" dir="ltr" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">نسبت (فاق)</span>
                  <input v-model.number="form.tireAspect" type="number" class="input-field" placeholder="مثلاً ۵۵" dir="ltr" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">رینگ</span>
                  <input v-model.number="form.tireRim" type="number" class="input-field" placeholder="مثلاً ۱۶" dir="ltr" />
                </label>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">برند لاستیک</span>
                  <input v-model="form.tireBrand" class="input-field" placeholder="مثلاً نکسین" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">کشور سازنده</span>
                  <input v-model="form.tireCountry" class="input-field" placeholder="مثلاً کره" />
                </label>
              </div>
              <hr class="border-gray-200" />
              <label class="block">
                <span class="mb-1 block text-xs font-semibold text-gray-600">فصل</span>
                <select v-model="form.tireSeason" class="input-field">
                  <option value="">انتخاب فصل</option>
                  <option v-for="o in TIRE_SEASON_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-semibold text-gray-600">نوع کاربری</span>
                <select v-model="form.tireUsageType" class="input-field">
                  <option value="">انتخاب کاربری</option>
                  <option v-for="o in TIRE_USAGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">شاخص بار</span>
                  <input v-model="form.tireLoadIndex" class="input-field" placeholder="مثلاً ۸۸" dir="ltr" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">شاخص سرعت</span>
                  <input v-model="form.tireSpeedIndex" class="input-field" placeholder="مثلاً H" dir="ltr" />
                </label>
              </div>
              <label class="block">
                <span class="mb-1 block text-xs font-semibold text-gray-600">طرح آج</span>
                <input v-model="form.tirePattern" class="input-field" placeholder="نام گل / طرح آج" />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-semibold text-gray-600">سال تولید</span>
                <input v-model.number="form.tireYear" type="number" class="input-field" placeholder="مثلاً ۲۰۲۴" dir="ltr" />
              </label>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">تخفیف جفت ٪</span>
                  <input v-model.number="form.tirePairDiscount" type="number" min="0" max="50" class="input-field" placeholder="۰ تا ۵۰" dir="ltr" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-semibold text-gray-600">تخفیف ست ٪</span>
                  <input v-model.number="form.tireSetDiscount" type="number" min="0" max="50" class="input-field" placeholder="۰ تا ۵۰" dir="ltr" />
                </label>
              </div>
              <div class="flex flex-wrap gap-3 text-sm">
                <label class="flex items-center gap-2"><input v-model="form.tireTubeless" type="checkbox" /> تیوبلس</label>
                <label class="flex items-center gap-2"><input v-model="form.tireRunFlat" type="checkbox" /> ران‌فلت</label>
              </div>
              <input v-model="form.seoTitle" class="input-field" placeholder="عنوان سئو (اختیاری)" />
              <textarea v-model="form.seoDescription" rows="2" class="input-field" placeholder="توضیح سئو (اختیاری)" />
            </div>
          </template>

          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-1">سایز، رنگ و موجودی هر تنوع</label>
            <textarea
              v-model="form.clothingMetaJson"
              rows="5"
              dir="ltr"
              class="input-field font-mono text-xs"
              placeholder='{"sizes":["S","M","L"],"colors":[{"name":"مشکی","hex":"#111"}],"variants":[{"color":"مشکی","size":"M","stock":3}]}'
            />
            <p class="text-xs leading-5 text-gray-400 mt-1">
              فقط اگر سایز و رنگ جدا دارید پر کنید. sizes فهرست سایز، colors رنگ‌ها و variants موجودی هر ترکیب است. اگر خالی بماند، فقط موجودی کلی بالا استفاده می‌شود.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی‌ها</label>
            <AppMultiSelect
              v-model="form.categoryIds"
              :options="categoryOptions"
              placeholder="یک یا چند دسته‌بندی انتخاب کنید"
              searchable
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">وضعیت نمایش</label>
            <div class="flex flex-wrap gap-2">
              <AppToggleChip v-model="form.isNew" label="جدید" icon="lucide:badge-plus" />
              <AppToggleChip v-model="form.isHomeDeal" label="تخفیف‌دار صفحه اول" icon="lucide:percent" />
              <AppToggleChip v-model="form.isHomeFeatured" label="ویژه صفحه اول" icon="lucide:house" />
              <AppToggleChip v-model="form.isActive" label="فعال در فروشگاه" icon="lucide:eye" />
            </div>
          </div>

          <button type="submit" class="btn-primary w-full">ذخیره</button>
        </form>
      </div>
    </div>
  </div>
</template>
