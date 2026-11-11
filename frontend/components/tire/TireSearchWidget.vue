<script setup lang="ts">
import type { TireSize, VehicleMake, VehicleModel, VehicleTrim } from '~/types';
import { formatTireSizeLabel } from '~/utils/tire';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'hero';
  }>(),
  { variant: 'default' }
);

const isHero = computed(() => props.variant === 'hero');

const api = useApi();
const router = useRouter();

type Tab = 'car' | 'size';
const activeTab = ref<Tab>('car');

const makes = ref<VehicleMake[]>([]);
const sizes = ref<TireSize[]>([]);
const loading = ref(true);

const makeSlug = ref('');
const modelSlug = ref('');
const trimSlug = ref('');
const year = ref<number | ''>('');

const width = ref<number | ''>('');
const aspect = ref<number | ''>('');
const rim = ref<number | ''>('');

const modelsForMake = computed((): VehicleModel[] => {
  const make = makes.value.find((m) => m.slug === makeSlug.value);
  return make?.models ?? [];
});

const trimsForModel = computed((): VehicleTrim[] => {
  const model = modelsForMake.value.find((m) => m.slug === modelSlug.value);
  return model?.trims ?? [];
});

const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 2005; y -= 1) years.push(y);
  return years;
});

const widthOptions = computed(() => {
  const set = new Set<number>();
  for (const s of sizes.value) if (s.width) set.add(s.width);
  return [...set].sort((a, b) => a - b);
});

const aspectOptions = computed(() => {
  if (width.value === '') return [] as number[];
  const set = new Set<number>();
  for (const s of sizes.value) {
    if (s.width === width.value && s.aspect) set.add(s.aspect);
  }
  return [...set].sort((a, b) => a - b);
});

const rimOptions = computed(() => {
  if (width.value === '' || aspect.value === '') return [] as number[];
  const set = new Set<number>();
  for (const s of sizes.value) {
    if (s.width === width.value && s.aspect === aspect.value && s.rim) set.add(s.rim);
  }
  return [...set].sort((a, b) => a - b);
});

watch(makeSlug, () => {
  modelSlug.value = '';
  trimSlug.value = '';
  year.value = '';
});

watch(modelSlug, () => {
  trimSlug.value = '';
  year.value = '';
});

watch(width, () => {
  aspect.value = '';
  rim.value = '';
});

watch(aspect, () => {
  rim.value = '';
});

onMounted(async () => {
  loading.value = true;
  try {
    const [makesRes, sizesRes] = await Promise.all([
      api.get<VehicleMake[]>('/vehicles/makes'),
      api.get<TireSize[]>('/vehicles/sizes'),
    ]);
    makes.value = makesRes.data ?? [];
    sizes.value = sizesRes.data ?? [];
  } catch {
    makes.value = [];
    sizes.value = [];
  } finally {
    loading.value = false;
  }
});

function searchByCar() {
  if (!makeSlug.value || !modelSlug.value) return;
  void router.push({
    path: `/cars/${makeSlug.value}/${modelSlug.value}`,
    query: {
      ...(trimSlug.value ? { trim: trimSlug.value } : {}),
      ...(year.value !== '' ? { year: String(year.value) } : {}),
    },
  });
}

function searchBySize() {
  if (width.value === '' || aspect.value === '' || rim.value === '') return;
  void router.push({
    path: '/shop',
    query: {
      width: String(width.value),
      aspect: String(aspect.value),
      rim: String(rim.value),
    },
  });
}

function onSearch() {
  if (activeTab.value === 'car') searchByCar();
  else searchBySize();
}

const canSearch = computed(() =>
  activeTab.value === 'car'
    ? Boolean(makeSlug.value && modelSlug.value)
    : width.value !== '' && aspect.value !== '' && rim.value !== ''
);

const previewSize = computed(() =>
  width.value !== '' && aspect.value !== '' && rim.value !== ''
    ? formatTireSizeLabel(width.value, aspect.value, rim.value)
    : ''
);

const selectVariant = computed(() => (isHero.value ? 'hero' : 'soft'));

const makeOptions = computed(() =>
  makes.value.map((make) => ({ value: make.slug, label: make.name }))
);
const modelOptions = computed(() =>
  modelsForMake.value.map((model) => ({ value: model.slug, label: model.name }))
);
const trimOptions = computed(() =>
  trimsForModel.value.map((trim) => ({ value: trim.slug, label: trim.name }))
);
const yearSelectOptions = computed(() =>
  yearOptions.value.map((y) => ({ value: y, label: String(y) }))
);
const widthSelectOptions = computed(() =>
  widthOptions.value.map((w) => ({ value: w, label: String(w) }))
);
const aspectSelectOptions = computed(() =>
  aspectOptions.value.map((a) => ({ value: a, label: String(a) }))
);
const rimSelectOptions = computed(() =>
  rimOptions.value.map((r) => ({ value: r, label: String(r) }))
);
</script>

<template>
  <!-- Hero: dark panel with labeled fields (distinct from lastikforoosh glass bar) -->
  <section v-if="isHero" class="hero-finder mx-auto w-full max-w-4xl">
    <div class="hero-finder__panel">
      <div class="hero-finder__accent" aria-hidden="true" />
      <div class="hero-finder__head">
        <div>
          <p class="hero-finder__eyebrow">جستجوی تخصصی</p>
          <h2 class="hero-finder__title">لاستیک مناسب خودرویتان را پیدا کنید</h2>
        </div>
        <div class="hero-finder__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="hero-finder__tab"
            :class="{ 'is-active': activeTab === 'car' }"
            :aria-selected="activeTab === 'car'"
            @click="activeTab = 'car'"
          >
            <AppIcon name="lucide:car" size="sm" />
            بر اساس خودرو
          </button>
          <button
            type="button"
            role="tab"
            class="hero-finder__tab"
            :class="{ 'is-active': activeTab === 'size' }"
            :aria-selected="activeTab === 'size'"
            @click="activeTab = 'size'"
          >
            <AppIcon name="shop:rim" size="sm" />
            بر اساس سایز
          </button>
        </div>
      </div>

      <LoadingSpinner :show="loading" class="mt-2" />

      <div v-if="!loading" class="hero-finder__body">
        <div v-if="activeTab === 'car'" class="hero-finder__grid">
          <label class="hero-finder__field">
            <span>برند خودرو</span>
            <AppSelect
              v-model="makeSlug"
              :options="makeOptions"
              placeholder="انتخاب برند"
              :variant="selectVariant"
              searchable
              search-placeholder="جستجوی برند..."
            />
          </label>
          <label class="hero-finder__field">
            <span>مدل خودرو</span>
            <AppSelect
              v-model="modelSlug"
              :options="modelOptions"
              placeholder="انتخاب مدل"
              :variant="selectVariant"
              :disabled="!makeSlug"
              searchable
              search-placeholder="جستجوی مدل..."
            />
          </label>
          <label class="hero-finder__field">
            <span>تیپ <em>(اختیاری)</em></span>
            <AppSelect
              v-model="trimSlug"
              :options="trimOptions"
              placeholder="همه تیپ‌ها"
              :variant="selectVariant"
              :disabled="!modelSlug"
              clearable
            />
          </label>
          <label class="hero-finder__field">
            <span>سال ساخت <em>(اختیاری)</em></span>
            <AppSelect
              v-model="year"
              :options="yearSelectOptions"
              placeholder="همه سال‌ها"
              :variant="selectVariant"
              :disabled="!modelSlug"
              clearable
            />
          </label>
        </div>

        <div v-else class="hero-finder__grid hero-finder__grid--size">
          <label class="hero-finder__field">
            <span>عرض</span>
            <AppSelect
              v-model="width"
              :options="widthSelectOptions"
              placeholder="مثلاً ۲۰۵"
              :variant="selectVariant"
              searchable
            />
          </label>
          <label class="hero-finder__field">
            <span>فاق</span>
            <AppSelect
              v-model="aspect"
              :options="aspectSelectOptions"
              placeholder="مثلاً ۵۵"
              :variant="selectVariant"
              :disabled="width === ''"
            />
          </label>
          <label class="hero-finder__field">
            <span>رینگ</span>
            <AppSelect
              v-model="rim"
              :options="rimSelectOptions"
              placeholder="مثلاً ۱۶"
              :variant="selectVariant"
              :disabled="aspect === ''"
            />
          </label>
        </div>

        <div class="hero-finder__actions">
          <p v-if="activeTab === 'size' && previewSize" class="hero-finder__preview" dir="ltr">
            {{ previewSize }}
          </p>
          <button
            type="button"
            class="hero-finder__cta"
            :disabled="!canSearch"
            @click="onSearch"
          >
            <AppIcon name="lucide:search" size="md" />
            {{ activeTab === 'car' ? 'نمایش لاستیک‌های مناسب' : 'جستجو در فروشگاه' }}
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Default compact card (shop / other pages) -->
  <section
    v-else
    class="tire-search-widget mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
  >
    <div class="mb-4 text-center">
      <h2 class="text-base font-bold text-gray-900 md:text-lg">جستجوی لاستیک</h2>
      <p class="mt-1 text-xs text-gray-500 md:text-sm">بر اساس خودرو یا سایز لاستیک</p>
    </div>

    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
        type="button"
        class="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors md:text-sm"
        :class="activeTab === 'car' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'"
        @click="activeTab = 'car'"
      >
        مدل خودرو
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors md:text-sm"
        :class="activeTab === 'size' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'"
        @click="activeTab = 'size'"
      >
        سایز لاستیک
      </button>
    </div>

    <LoadingSpinner :show="loading" class="mt-2" />

    <div v-if="!loading && activeTab === 'car'" class="mt-4 space-y-3">
      <label class="block">
        <span class="field-label">برند خودرو</span>
        <AppSelect
          v-model="makeSlug"
          :options="makeOptions"
          placeholder="برند خودرو"
          variant="soft"
          searchable
        />
      </label>
      <label class="block">
        <span class="field-label">مدل</span>
        <AppSelect
          v-model="modelSlug"
          :options="modelOptions"
          placeholder="مدل خودرو"
          variant="soft"
          :disabled="!makeSlug"
          searchable
        />
      </label>
      <button type="button" class="btn-primary w-full" :disabled="!canSearch" @click="searchByCar">
        مشاهده لاستیک‌های مناسب
      </button>
    </div>

    <div v-else-if="!loading && activeTab === 'size'" class="mt-4 space-y-3">
      <label class="block">
        <span class="field-label">عرض</span>
        <AppSelect v-model="width" :options="widthSelectOptions" placeholder="عرض" variant="soft" searchable />
      </label>
      <label class="block">
        <span class="field-label">نسبت</span>
        <AppSelect
          v-model="aspect"
          :options="aspectSelectOptions"
          placeholder="فاق"
          variant="soft"
          :disabled="width === ''"
        />
      </label>
      <label class="block">
        <span class="field-label">رینگ</span>
        <AppSelect
          v-model="rim"
          :options="rimSelectOptions"
          placeholder="رینگ"
          variant="soft"
          :disabled="aspect === ''"
        />
      </label>
      <p v-if="previewSize" class="text-center text-sm font-semibold text-gray-700" dir="ltr">
        {{ previewSize }}
      </p>
      <button type="button" class="btn-primary w-full" :disabled="!canSearch" @click="searchBySize">
        جستجو در فروشگاه
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero-finder__panel {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(160deg, rgba(15, 23, 42, 0.94) 0%, rgba(17, 24, 39, 0.92) 55%, rgba(127, 29, 29, 0.55) 140%);
  box-shadow: 0 24px 48px rgba(2, 6, 23, 0.45);
  padding: 1.1rem 1.1rem 1.2rem;
}

.hero-finder__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
  background: linear-gradient(180deg, #ef4444, #991b1b);
}

.hero-finder__head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-inline-start: 0.55rem;
}

.hero-finder__eyebrow {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #fca5a5;
}

.hero-finder__title {
  margin-top: 0.2rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.35;
}

.hero-finder__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.hero-finder__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.6rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 700;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.hero-finder__tab.is-active {
  border-color: rgba(248, 113, 113, 0.55);
  background: rgba(220, 38, 38, 0.2);
  color: #fff;
}

.hero-finder__body {
  margin-top: 1rem;
  padding-inline-start: 0.55rem;
}

.hero-finder__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.hero-finder__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.hero-finder__field > span {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
}

.hero-finder__field em {
  font-style: normal;
  font-weight: 500;
  color: #64748b;
}

.hero-finder__actions {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hero-finder__preview {
  align-self: flex-start;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fecaca;
}

.hero-finder__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 3rem;
  border-radius: 0.85rem;
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #fff;
  font-size: 0.92rem;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(127, 29, 29, 0.35);
  transition: filter 0.15s ease, transform 0.15s ease;
}

.hero-finder__cta:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.hero-finder__cta:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

@media (min-width: 768px) {
  .hero-finder__panel {
    padding: 1.35rem 1.45rem 1.45rem;
  }

  .hero-finder__head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .hero-finder__title {
    font-size: 1.25rem;
  }

  .hero-finder__tabs {
    min-width: 19rem;
  }

  .hero-finder__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem 1rem;
  }

  .hero-finder__grid--size {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-finder__actions {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .hero-finder__cta {
    width: auto;
    min-width: 15rem;
    padding-inline: 1.25rem;
  }
}
</style>
