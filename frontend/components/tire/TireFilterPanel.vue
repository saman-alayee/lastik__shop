<script setup lang="ts">
import type { TireFilterFacets, TireSize } from '~/types';
import { TIRE_SEASON_OPTIONS, TIRE_USAGE_OPTIONS, seasonLabel, usageLabel } from '~/utils/tire';

export interface TireFiltersState {
  width?: number;
  aspect?: number;
  rim?: number;
  brand?: string;
  country?: string;
  season?: string;
  year?: number;
  loadIndex?: string;
  speedIndex?: string;
  usageType?: string;
  pattern?: string;
  tubeless?: boolean;
  runFlat?: boolean;
  priceMin?: number;
  priceMax?: number;
  minDiscount?: number;
  inStock?: boolean;
  discounted?: boolean;
}

const props = defineProps<{
  facets: TireFilterFacets | null;
  loading?: boolean;
}>();

const filters = defineModel<TireFiltersState>({ required: true });

const emit = defineEmits<{
  clear: [];
}>();

const api = useApi();
const sizes = ref<TireSize[]>([]);
const sizesLoading = ref(false);
const showTech = ref(true);
const showPrice = ref(true);

const hasActiveFilters = computed(() => {
  const f = filters.value;
  return Boolean(
    f.width ||
      f.aspect ||
      f.rim ||
      f.brand ||
      f.country ||
      f.season ||
      f.year ||
      f.loadIndex ||
      f.speedIndex ||
      f.usageType ||
      f.pattern ||
      f.tubeless ||
      f.runFlat ||
      (f.priceMin != null && f.priceMin > 0) ||
      (f.priceMax != null && f.priceMax > 0) ||
      (f.minDiscount != null && f.minDiscount > 0) ||
      f.inStock ||
      f.discounted
  );
});

const hasSizeFilter = computed(() =>
  Boolean(filters.value.width || filters.value.aspect || filters.value.rim)
);

function collectNumbers(
  fromSizes: (s: TireSize) => number | null | undefined,
  match: (s: TireSize) => boolean,
  facetFallback?: number[]
) {
  const set = new Set<number>();
  for (const s of sizes.value) {
    if (!match(s)) continue;
    const n = fromSizes(s);
    if (n) set.add(n);
  }
  if (!set.size && facetFallback?.length) {
    for (const n of facetFallback) set.add(n);
  }
  return [...set].sort((a, b) => a - b).map((n) => ({ value: n, label: String(n) }));
}

const widthOptions = computed(() =>
  collectNumbers((s) => s.width, () => true, props.facets?.widths)
);

const aspectOptions = computed(() => {
  const width = filters.value.width;
  const rim = filters.value.rim;
  return collectNumbers(
    (s) => s.aspect,
    (s) => (!width || s.width === width) && (!rim || s.rim === rim),
    props.facets?.aspects
  );
});

const rimOptions = computed(() => {
  const width = filters.value.width;
  const aspect = filters.value.aspect;
  return collectNumbers(
    (s) => s.rim,
    (s) => (!width || s.width === width) && (!aspect || s.aspect === aspect),
    props.facets?.rims
  );
});

const brandOptions = computed(() =>
  (props.facets?.brands ?? []).map((b) => ({ value: b, label: b }))
);

const countryOptions = computed(() =>
  (props.facets?.countries ?? []).map((c) => ({ value: c, label: c }))
);

const seasonOptions = computed(() => {
  const known = new Set(TIRE_SEASON_OPTIONS.map((o) => o.value));
  const extras = (props.facets?.seasons ?? [])
    .filter((s) => !known.has(s) && !known.has(s.toLowerCase()))
    .map((s) => ({ value: s, label: seasonLabel(s) }));
  return [...TIRE_SEASON_OPTIONS.map((o) => ({ value: o.value, label: o.label })), ...extras];
});

const usageOptions = computed(() => {
  const known = new Set(TIRE_USAGE_OPTIONS.map((o) => o.value));
  const extras = (props.facets?.usageTypes ?? [])
    .filter((u) => !known.has(u) && !known.has(u.toLowerCase()))
    .map((u) => ({ value: u, label: usageLabel(u) }));
  return [...TIRE_USAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label })), ...extras];
});

const yearOptions = computed(() =>
  (props.facets?.years ?? []).map((y) => ({ value: y, label: String(y) }))
);

const loadOptions = computed(() =>
  (props.facets?.loadIndexes ?? []).map((v) => ({ value: v, label: v }))
);

const speedOptions = computed(() =>
  (props.facets?.speedIndexes ?? []).map((v) => ({ value: v, label: v }))
);

const patternOptions = computed(() =>
  (props.facets?.patterns ?? []).map((v) => ({ value: v, label: v }))
);

const pricePresets = computed(() => {
  const max = props.facets?.priceMax ?? 0;
  if (!max) return [] as { label: string; min?: number; max?: number }[];
  const step = Math.max(500_000, Math.round(max / 4 / 100_000) * 100_000);
  return [
    { label: 'همه', min: undefined, max: undefined },
    { label: `تا ${(step / 1_000_000).toFixed(step % 1_000_000 ? 1 : 0)} م`, max: step },
    { label: `تا ${((step * 2) / 1_000_000).toFixed(step % 1_000_000 ? 1 : 0)} م`, max: step * 2 },
    { label: `بالای ${((step * 2) / 1_000_000).toFixed(step % 1_000_000 ? 1 : 0)} م`, min: step * 2 },
  ];
});

function setNum(
  key: 'width' | 'aspect' | 'rim' | 'year' | 'priceMin' | 'priceMax' | 'minDiscount',
  value: string | number
) {
  const next = value === '' || value == null ? undefined : Number(value);
  filters.value = {
    ...filters.value,
    [key]: Number.isFinite(next as number) ? next : undefined,
  };
}

const widthModel = computed({
  get: () => filters.value.width ?? '',
  set: (value: string | number) => setNum('width', value),
});
const aspectModel = computed({
  get: () => filters.value.aspect ?? '',
  set: (value: string | number) => setNum('aspect', value),
});
const rimModel = computed({
  get: () => filters.value.rim ?? '',
  set: (value: string | number) => setNum('rim', value),
});
const brandModel = computed({
  get: () => filters.value.brand ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, brand: value ? String(value) : undefined };
  },
});
const countryModel = computed({
  get: () => filters.value.country ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, country: value ? String(value) : undefined };
  },
});
const yearModel = computed({
  get: () => filters.value.year ?? '',
  set: (value: string | number) => setNum('year', value),
});
const loadModel = computed({
  get: () => filters.value.loadIndex ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, loadIndex: value ? String(value) : undefined };
  },
});
const speedModel = computed({
  get: () => filters.value.speedIndex ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, speedIndex: value ? String(value) : undefined };
  },
});
const patternModel = computed({
  get: () => filters.value.pattern ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, pattern: value ? String(value) : undefined };
  },
});

const seasonModel = computed({
  get: () => filters.value.season ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, season: value ? String(value) : undefined };
  },
});

const usageModel = computed({
  get: () => filters.value.usageType ?? '',
  set: (value: string | number) => {
    filters.value = { ...filters.value, usageType: value ? String(value) : undefined };
  },
});

const featureOptions = [
  { value: 'inStock', label: 'فقط موجود' },
  { value: 'discounted', label: 'تخفیف‌دار' },
  { value: 'tubeless', label: 'تیوبلس' },
  { value: 'runFlat', label: 'ران‌فلت' },
];

const featureModel = computed({
  get: () => {
    const f = filters.value;
    const selected: string[] = [];
    if (f.inStock) selected.push('inStock');
    if (f.discounted) selected.push('discounted');
    if (f.tubeless) selected.push('tubeless');
    if (f.runFlat) selected.push('runFlat');
    return selected;
  },
  set: (values: string[]) => {
    const set = new Set(values);
    filters.value = {
      ...filters.value,
      inStock: set.has('inStock') || undefined,
      discounted: set.has('discounted') || undefined,
      tubeless: set.has('tubeless') || undefined,
      runFlat: set.has('runFlat') || undefined,
    };
  },
});

const pricePresetOptions = computed(() =>
  pricePresets.value.map((preset, index) => ({
    value: String(index),
    label: preset.label,
  }))
);

const pricePresetModel = computed({
  get: () => {
    const idx = pricePresets.value.findIndex(
      (preset) =>
        filters.value.priceMin === preset.min && filters.value.priceMax === preset.max
    );
    return idx >= 0 ? String(idx) : '0';
  },
  set: (value: string | number) => {
    const preset = pricePresets.value[Number(value)] ?? pricePresets.value[0];
    if (!preset) return;
    filters.value = {
      ...filters.value,
      priceMin: preset.min,
      priceMax: preset.max,
    };
  },
});

const discountModel = computed({
  get: () => (filters.value.minDiscount != null ? String(filters.value.minDiscount) : ''),
  set: (value: string | number) => {
    const next = value === '' || value == null ? undefined : Number(value);
    filters.value = {
      ...filters.value,
      minDiscount: Number.isFinite(next as number) ? (next as number) : undefined,
      discounted: next ? true : filters.value.discounted,
    };
  },
});

function clearAll() {
  emit('clear');
}

function clearSize() {
  filters.value = {
    ...filters.value,
    width: undefined,
    aspect: undefined,
    rim: undefined,
  };
}

onMounted(async () => {
  sizesLoading.value = true;
  try {
    const { data } = await api.get<TireSize[]>('/vehicles/sizes');
    sizes.value = data ?? [];
  } catch {
    sizes.value = [];
  } finally {
    sizesLoading.value = false;
  }
});
</script>

<template>
  <aside class="tire-filters">
    <div class="tire-filters__head">
      <div>
        <h2>فیلتر دقیق</h2>
        <p class="tire-filters__hint">سایز، برند، فصل و مشخصات فنی</p>
      </div>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="tire-filters__clear"
        @click="clearAll"
      >
        پاک کردن همه
      </button>
    </div>

    <LoadingSpinner :show="loading || sizesLoading" />

    <template v-if="!loading">
      <section class="tire-filters__section" :class="{ 'is-active': hasSizeFilter }">
        <div class="tire-filters__section-head">
          <div>
            <p class="tire-filters__section-title">سایز لاستیک</p>
            <p class="tire-filters__section-sub">عرض، فاق و رینگ را جدا یا با هم انتخاب کنید</p>
          </div>
          <button
            v-if="hasSizeFilter"
            type="button"
            class="tire-filters__clear"
            @click="clearSize"
          >
            پاک کردن
          </button>
        </div>

        <label class="tire-filters__field">
          <span class="tire-filters__label">عرض</span>
          <AppSelect
            v-model="widthModel"
            :options="widthOptions"
            placeholder="مثلاً ۲۰۵"
            searchable
            clearable
            size="sm"
          />
        </label>
        <label class="tire-filters__field">
          <span class="tire-filters__label">فاق (نسبت)</span>
          <AppSelect
            v-model="aspectModel"
            :options="aspectOptions"
            placeholder="مثلاً ۵۵"
            searchable
            clearable
            size="sm"
          />
        </label>
        <label class="tire-filters__field">
          <span class="tire-filters__label">رینگ</span>
          <AppSelect
            v-model="rimModel"
            :options="rimOptions"
            placeholder="مثلاً ۱۶"
            searchable
            clearable
            size="sm"
          />
        </label>
      </section>

      <section class="tire-filters__section">
        <p class="tire-filters__section-title">برند و موجودی</p>
        <label class="tire-filters__field">
          <span class="tire-filters__label">برند لاستیک</span>
          <AppSelect
            v-model="brandModel"
            :options="brandOptions"
            placeholder="همه برندها"
            searchable
            clearable
            size="sm"
          />
        </label>

        <label class="tire-filters__field">
          <span class="tire-filters__label">ویژگی‌ها</span>
          <AppMultiSelect
            v-model="featureModel"
            :options="featureOptions"
            placeholder="انتخاب ویژگی"
            :searchable="false"
          />
        </label>
      </section>

      <section class="tire-filters__section">
        <p class="tire-filters__section-title">فصل و کاربری</p>
        <label class="tire-filters__field">
          <span class="tire-filters__label">فصل</span>
          <AppSelect
            v-model="seasonModel"
            :options="seasonOptions"
            placeholder="همه فصل‌ها"
            clearable
            size="sm"
          />
        </label>
        <label class="tire-filters__field">
          <span class="tire-filters__label">نوع کاربری</span>
          <AppSelect
            v-model="usageModel"
            :options="usageOptions"
            placeholder="همه کاربری‌ها"
            clearable
            size="sm"
          />
        </label>
      </section>

      <section class="tire-filters__section">
        <button type="button" class="tire-filters__toggle" @click="showTech = !showTech">
          <span>مشخصات فنی</span>
          <AppIcon
            name="lucide:chevron-down"
            size="sm"
            class="tire-filters__toggle-icon"
            :class="{ 'is-open': showTech }"
          />
        </button>

        <div v-if="showTech" class="tire-filters__stack">
          <label class="tire-filters__field">
            <span class="tire-filters__label">کشور سازنده</span>
            <AppSelect
              v-model="countryModel"
              :options="countryOptions"
              placeholder="همه کشورها"
              searchable
              clearable
              size="sm"
            />
          </label>

          <label class="tire-filters__field">
            <span class="tire-filters__label">سال ساخت</span>
            <AppSelect
              v-model="yearModel"
              :options="yearOptions"
              placeholder="همه سال‌ها"
              clearable
              size="sm"
            />
          </label>

          <div class="tire-filters__prices">
            <label class="tire-filters__field">
              <span class="tire-filters__label">شاخص بار</span>
              <AppSelect
                v-model="loadModel"
                :options="loadOptions"
                placeholder="—"
                searchable
                clearable
                size="sm"
              />
            </label>
            <label class="tire-filters__field">
              <span class="tire-filters__label">شاخص سرعت</span>
              <AppSelect
                v-model="speedModel"
                :options="speedOptions"
                placeholder="—"
                searchable
                clearable
                size="sm"
              />
            </label>
          </div>

          <label class="tire-filters__field">
            <span class="tire-filters__label">طرح آج / گل</span>
            <AppSelect
              v-model="patternModel"
              :options="patternOptions"
              placeholder="همه طرح‌ها"
              searchable
              clearable
              size="sm"
            />
          </label>
        </div>
      </section>

      <section class="tire-filters__section">
        <button type="button" class="tire-filters__toggle" @click="showPrice = !showPrice">
          <span>قیمت و تخفیف</span>
          <AppIcon
            name="lucide:chevron-down"
            size="sm"
            class="tire-filters__toggle-icon"
            :class="{ 'is-open': showPrice }"
          />
        </button>

        <div v-if="showPrice" class="tire-filters__stack">
          <label v-if="pricePresetOptions.length" class="tire-filters__field">
            <span class="tire-filters__label">بازه قیمت پیشنهادی</span>
            <AppSelect
              v-model="pricePresetModel"
              :options="pricePresetOptions"
              size="sm"
            />
          </label>

          <div class="tire-filters__prices">
            <label class="tire-filters__field">
              <span class="tire-filters__label">حداقل قیمت</span>
              <input
                :value="filters.priceMin ?? ''"
                type="number"
                min="0"
                class="tire-filters__input"
                dir="ltr"
                placeholder="0"
                @input="setNum('priceMin', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="tire-filters__field">
              <span class="tire-filters__label">حداکثر قیمت</span>
              <input
                :value="filters.priceMax ?? ''"
                type="number"
                min="0"
                class="tire-filters__input"
                dir="ltr"
                placeholder="—"
                @input="setNum('priceMax', ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>

          <label class="tire-filters__field">
            <span class="tire-filters__label">حداقل تخفیف</span>
            <AppSelect
              v-model="discountModel"
              :options="[
                { value: '', label: 'هر تخفیف' },
                { value: '10', label: 'از ۱۰٪' },
                { value: '15', label: 'از ۱۵٪' },
                { value: '20', label: 'از ۲۰٪' },
              ]"
              size="sm"
              clearable
            />
          </label>
        </div>
      </section>
    </template>
  </aside>
</template>

<style scoped>
.tire-filters {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 1.15rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 8px 24px -18px rgba(15, 23, 42, 0.35);
}

.tire-filters__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.tire-filters__head h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.tire-filters__hint {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: #64748b;
}

.tire-filters__clear {
  border: 0;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 700;
  color: #dc2626;
  cursor: pointer;
  white-space: nowrap;
}

.tire-filters__clear:hover {
  color: #b91c1c;
}

.tire-filters__section {
  display: grid;
  gap: 0.7rem;
  padding: 0.85rem;
  border-radius: 0.95rem;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.tire-filters__section.is-active {
  border-color: #fecaca;
  background: linear-gradient(180deg, #fff5f5 0%, #fff 70%);
  box-shadow: inset 3px 0 0 #dc2626;
}

.tire-filters__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.tire-filters__section-title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
  color: #0f172a;
}

.tire-filters__section-sub {
  margin: 0.2rem 0 0;
  font-size: 0.7rem;
  line-height: 1.5;
  color: #64748b;
}

.tire-filters__field {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.tire-filters__label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
}

.tire-filters__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  min-height: 2.2rem;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.84rem;
  font-weight: 800;
  color: #0f172a;
  cursor: pointer;
}

.tire-filters__toggle-icon {
  color: #94a3b8;
  transition: transform 0.15s ease;
}

.tire-filters__toggle-icon.is-open {
  transform: rotate(180deg);
  color: #f87171;
}

.tire-filters__stack {
  display: grid;
  gap: 0.7rem;
}

.tire-filters__prices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.tire-filters__input {
  width: 100%;
  min-height: 2.35rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.65rem;
  background: #fff;
  padding: 0.4rem 0.65rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.tire-filters__input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
</style>
