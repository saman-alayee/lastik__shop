<script setup lang="ts">
import type { VehicleMake } from '~/types';

const props = defineProps<{
  makes: VehicleMake[];
  title?: string;
}>();

const models = computed(() => {
  const rows: Array<{
    id: string;
    name: string;
    image: string | null;
    to: string;
  }> = [];
  for (const make of props.makes) {
    for (const model of make.models ?? []) {
      rows.push({
        id: model.id,
        name: model.name,
        image: model.image || make.logo || null,
        to: `/cars/${make.slug}/${model.slug}`,
      });
    }
  }
  return rows;
});

const scroller = ref<HTMLElement | null>(null);

function scrollByDir(dir: -1 | 1) {
  const el = scroller.value;
  if (!el) return;
  el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.55), behavior: 'smooth' });
}
</script>

<template>
  <section v-if="models.length" class="tire-car-strip">
    <div class="tire-car-strip__head">
      <h2 class="tire-car-strip__title">{{ title || 'لاستیک خودرو' }}</h2>
      <div class="tire-car-strip__nav">
        <button type="button" class="tire-car-strip__btn" aria-label="قبلی" @click="scrollByDir(1)">
          <AppIcon name="lucide:chevron-right" size="sm" />
        </button>
        <button type="button" class="tire-car-strip__btn" aria-label="بعدی" @click="scrollByDir(-1)">
          <AppIcon name="lucide:chevron-left" size="sm" />
        </button>
      </div>
    </div>

    <div ref="scroller" class="tire-car-strip__track">
      <NuxtLink
        v-for="item in models"
        :key="item.id"
        :to="item.to"
        class="tire-car-strip__card"
      >
        <div class="tire-car-strip__media">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            class="tire-car-strip__img"
            loading="lazy"
            width="240"
            height="160"
          />
          <AppIcon v-else name="lucide:car" size="lg" class="text-slate-300" />
        </div>
        <p class="tire-car-strip__label">{{ item.name }}</p>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.tire-car-strip {
  width: 100%;
}

.tire-car-strip__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.tire-car-strip__title {
  font-size: 1.15rem;
  font-weight: 900;
  color: #0f172a;
}

.tire-car-strip__nav {
  display: flex;
  gap: 0.35rem;
}

.tire-car-strip__btn {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.tire-car-strip__btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.tire-car-strip__track {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.tire-car-strip__track::-webkit-scrollbar {
  display: none;
}

.tire-car-strip__card {
  flex: 0 0 auto;
  width: min(42vw, 168px);
  scroll-snap-align: start;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.tire-car-strip__card:hover {
  transform: translateY(-3px);
}

.tire-car-strip__media {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid #e8edf3;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
}

.tire-car-strip__img {
  width: 92%;
  height: 88%;
  object-fit: contain;
  object-position: center bottom;
}

.tire-car-strip__label {
  margin-top: 0.55rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

@media (min-width: 768px) {
  .tire-car-strip__card {
    width: 176px;
  }

  .tire-car-strip__title {
    font-size: 1.35rem;
  }
}
</style>
