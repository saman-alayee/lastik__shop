<script setup lang="ts">
import type { VehicleMake } from '~/types';
import { SITE_NAME } from '~/constants/site';

const api = useApi();
const makes = ref<VehicleMake[]>([]);
const loading = ref(true);

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

usePageSeo({
  title: `لاستیک خودرو | ${SITE_NAME}`,
  description: 'انتخاب برند و مدل خودرو برای یافتن سایز و لاستیک مناسب',
});
</script>

<template>
  <div class="mx-auto max-w-[1240px] px-4 py-6 md:py-8">
    <h1 class="section-title">لاستیک بر اساس خودرو</h1>
    <p class="mb-4 text-sm text-slate-500">مدل ماشین را انتخاب کنید تا سایز استاندارد و لاستیک مناسب را ببینید.</p>

    <TireSearchWidget class="mb-8" />

    <LoadingSpinner :show="loading" />

    <TireCarModelStrip v-if="!loading && makes.length" :makes="makes" title="مدل‌های پرفروش" />

    <div v-if="!loading && makes.length" class="mt-10 space-y-8">
      <section v-for="make in makes" :key="make.id">
        <div class="mb-3 flex items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img
              v-if="make.logo || make.models?.[0]?.image"
              :src="make.logo || make.models?.[0]?.image || ''"
              :alt="make.name"
              class="h-full w-full object-contain p-1"
              width="44"
              height="44"
              loading="lazy"
            />
            <AppIcon v-else name="lucide:car" size="md" class="text-slate-400" />
          </span>
          <h2 class="text-base font-extrabold text-slate-900">{{ make.name }}</h2>
        </div>

        <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <li v-for="model in make.models" :key="model.id">
            <NuxtLink
              :to="`/cars/${make.slug}/${model.slug}`"
              class="group block rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <div class="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white">
                <img
                  v-if="model.image"
                  :src="model.image"
                  :alt="model.name"
                  class="h-[88%] w-[92%] object-contain object-bottom transition duration-300 group-hover:scale-[1.03]"
                  width="200"
                  height="150"
                  loading="lazy"
                />
                <AppIcon v-else name="lucide:car" size="lg" class="text-slate-300" />
              </div>
              <p class="mt-2 text-center text-sm font-bold text-slate-800">{{ model.name }}</p>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <EmptyState
      v-if="!loading && !makes.length"
      title="خودرویی ثبت نشده"
      description="از پنل مدیریت، برند و مدل خودرو را اضافه کنید."
    />
  </div>
</template>
