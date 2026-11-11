<script setup lang="ts">
export type TireBrandCard = {
  name: string;
  logo: string | null;
};

const props = defineProps<{
  brands: TireBrandCard[];
}>();

const { getCategoryImage } = useFormat();

const stripRef = ref<HTMLElement | null>(null);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);
const inView = ref(true);
let autoTimer: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;

function brandSlug(name: string) {
  return encodeURIComponent(name);
}

function updateScrollState() {
  const el = stripRef.value;
  if (!el) {
    canScrollPrev.value = false;
    canScrollNext.value = false;
    return;
  }
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  // RTL: scrollLeft can be negative in some browsers
  const left = el.scrollLeft;
  const atStart = Math.abs(left) <= 2;
  const atEnd = Math.abs(left) >= maxScroll - 2;
  canScrollPrev.value = maxScroll > 2 && !atStart;
  canScrollNext.value = maxScroll > 2 && !atEnd;
}

function scrollByPage(direction: 'prev' | 'next') {
  const el = stripRef.value;
  if (!el) return;
  const amount = Math.max(220, Math.round(el.clientWidth * 0.72));
  // In RTL, "next" (more brands toward start visually for chevron-left) scrolls toward more content
  const rtl = getComputedStyle(el).direction === 'rtl';
  const sign = direction === 'next' ? (rtl ? -1 : 1) : rtl ? 1 : -1;
  el.scrollBy({ left: sign * amount, behavior: 'smooth' });
}

function autoAdvance() {
  const el = stripRef.value;
  if (!el || !inView.value || props.brands.length <= 1) return;
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  if (maxScroll <= 2) return;

  const rtl = getComputedStyle(el).direction === 'rtl';
  const left = el.scrollLeft;
  const atEnd = Math.abs(left) >= maxScroll - 4;

  if (atEnd) {
    el.scrollTo({ left: 0, behavior: 'smooth' });
  } else {
    const step = Math.max(160, Math.round(el.clientWidth * 0.45));
    el.scrollBy({ left: rtl ? -step : step, behavior: 'smooth' });
  }
}

function startAuto() {
  stopAuto();
  if (props.brands.length <= 3) return;
  autoTimer = setInterval(autoAdvance, 3200);
}

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

onMounted(() => {
  nextTick(updateScrollState);
  const el = stripRef.value;
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
  }
  if (typeof IntersectionObserver !== 'undefined' && el) {
    observer = new IntersectionObserver(
      ([entry]) => {
        inView.value = Boolean(entry?.isIntersecting);
        if (inView.value) startAuto();
        else stopAuto();
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
  }
  startAuto();
});

onBeforeUnmount(() => {
  stopAuto();
  observer?.disconnect();
  stripRef.value?.removeEventListener('scroll', updateScrollState);
  window.removeEventListener('resize', updateScrollState);
});

watch(
  () => props.brands.length,
  () => nextTick(() => {
    updateScrollState();
    startAuto();
  })
);
</script>

<template>
  <div
    v-if="brands.length"
    class="brand-slider"
    aria-roledescription="carousel"
    aria-label="برندهای لاستیک"
    @mouseenter="stopAuto"
    @mouseleave="startAuto"
  >
    <button
      v-show="canScrollPrev"
      type="button"
      class="brand-slider__nav brand-slider__nav--prev"
      aria-label="برندهای قبلی"
      @click="scrollByPage('prev')"
    >
      <AppIcon name="lucide:chevron-right" size="sm" />
    </button>
    <button
      v-show="canScrollNext"
      type="button"
      class="brand-slider__nav brand-slider__nav--next"
      aria-label="برندهای بعدی"
      @click="scrollByPage('next')"
    >
      <AppIcon name="lucide:chevron-left" size="sm" />
    </button>

    <div ref="stripRef" class="brand-slider__track">
      <NuxtLink
        v-for="brand in brands"
        :key="brand.name"
        :to="`/brands/${brandSlug(brand.name)}`"
        class="brand-slider__card group"
      >
        <span class="brand-slider__logo">
          <img
            v-if="brand.logo"
            :src="getCategoryImage(brand.logo)"
            :alt="brand.name"
            class="brand-slider__img"
            loading="lazy"
            decoding="async"
          />
          <AppIcon v-else name="shop:tire" size="sm" class="text-slate-500" />
        </span>
        <span class="brand-slider__name">{{ brand.name }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.brand-slider {
  position: relative;
  min-width: 0;
}

.brand-slider__track {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 0.15rem 0.1rem 0.55rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.brand-slider__track::-webkit-scrollbar {
  display: none;
}

.brand-slider__card {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: min(42vw, 9.6rem);
  display: flex;
  flex-direction: column;
  height: 9.5rem;
  overflow: hidden;
  border-radius: 1.35rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  text-align: center;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.brand-slider__card:hover {
  transform: translateY(-2px);
  border-color: rgba(252, 165, 165, 0.7);
  box-shadow: 0 14px 28px -18px rgba(15, 23, 42, 0.35);
}

.brand-slider__logo {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1rem 0.5rem;
  background: radial-gradient(70% 65% at 50% 42%, #fff, #f1f5f9 62%, #e2e8f0 120%);
}

.brand-slider__img {
  max-height: 3.5rem;
  max-width: 78%;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.08));
  transition: transform 0.2s ease;
}

.brand-slider__card:hover .brand-slider__img {
  transform: scale(1.05);
}

.brand-slider__name {
  display: flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #f1f5f9;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: #0f172a;
  transition: color 0.2s ease;
}

.brand-slider__card:hover .brand-slider__name {
  color: #dc2626;
}

.brand-slider__nav {
  display: none;
  position: absolute;
  top: 42%;
  z-index: 2;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  box-shadow: 0 10px 22px -14px rgba(15, 23, 42, 0.45);
  transform: translateY(-50%);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.brand-slider__nav:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.brand-slider__nav--prev {
  inset-inline-start: -0.35rem;
}

.brand-slider__nav--next {
  inset-inline-end: -0.35rem;
}

@media (min-width: 640px) {
  .brand-slider__card {
    width: 10.25rem;
  }
}

@media (min-width: 768px) {
  .brand-slider__nav {
    display: grid;
  }

  .brand-slider__card {
    width: 10.75rem;
  }

  .brand-slider__track {
    gap: 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-slider__track {
    scroll-behavior: auto;
  }

  .brand-slider__card,
  .brand-slider__img,
  .brand-slider__name {
    transition: none;
  }
}
</style>
