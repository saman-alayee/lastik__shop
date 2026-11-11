<script setup lang="ts">
import type { VehicleMake } from '~/types';
import { SITE_NAME } from '~/constants/site';

const api = useApi();
const makes = ref<VehicleMake[]>([]);
const loading = ref(true);
const expandedMake = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get<VehicleMake[]>('/vehicles/makes');
    makes.value = data ?? [];
  } catch {
    makes.value = [];
  } finally {
    loading.value = false;
  }
});

function toggleMake(slug: string) {
  expandedMake.value = expandedMake.value === slug ? null : slug;
}

usePageSeo({
  title: `لاستیک خودرو | ${SITE_NAME}`,
  description: 'انتخاب برند و مدل خودرو برای یافتن سایز و لاستیک مناسب',
});
</script>

<template>
  <div class="mx-auto max-w-[1240px] px-4 py-6">
    <h1 class="section-title">لاستیک بر اساس خودرو</h1>
    <p class="mb-4 text-sm text-gray-500">برند خودرو را انتخاب کنید، سپس مدل را برای دیدن لاستیک‌های سازگار.</p>

    <TireSearchWidget class="mb-8" />

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="space-y-3">
      <article
        v-for="make in makes"
        :key="make.id"
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
          @click="toggleMake(make.slug)"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
              <img
                v-if="make.logo || make.models?.[0]?.image"
                :src="make.logo || make.models?.[0]?.image || ''"
                :alt="make.name"
                class="h-full w-full object-cover"
                width="48"
                height="48"
                loading="lazy"
              />
              <span v-else class="grid h-full w-full place-items-center text-primary-700">
                <AppIcon name="lucide:car" size="md" />
              </span>
            </span>
            <span class="font-bold text-gray-900">{{ make.name }}</span>
          </div>
          <AppIcon
            name="lucide:chevron-down"
            size="sm"
            class="text-gray-400 transition-transform"
            :class="expandedMake === make.slug ? 'rotate-180' : ''"
          />
        </button>
        <ul v-if="expandedMake === make.slug && make.models?.length" class="border-t border-gray-100 px-2 pb-2">
          <li v-for="model in make.models" :key="model.id">
            <NuxtLink
              :to="`/cars/${make.slug}/${model.slug}`"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span class="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <img
                  v-if="model.image"
                  :src="model.image"
                  :alt="model.name"
                  class="h-full w-full object-cover"
                  width="64"
                  height="44"
                  loading="lazy"
                />
              </span>
              <span>{{ model.name }}</span>
            </NuxtLink>
          </li>
        </ul>
      </article>
    </div>

    <EmptyState
      v-if="!loading && !makes.length"
      title="خودرویی ثبت نشده"
      description="از پنل مدیریت، برند و مدل خودرو را اضافه کنید."
    />
  </div>
</template>
