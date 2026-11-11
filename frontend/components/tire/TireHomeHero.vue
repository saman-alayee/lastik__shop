<script setup lang="ts">
import { SITE_NAME, SITE_TAGLINE } from '~/constants/site';

defineProps<{
  brands?: string[];
}>();

const slides = [
  {
    src: '/images/tire/hero-car.jpg',
    alt: 'لاستیک سواری خودرو',
  },
  {
    src: '/images/tire/hero-truck.jpg',
    alt: 'لاستیک کامیون و سنگین',
  },
  {
    src: '/images/tire/hero-stock.jpg',
    alt: 'انبار لاستیک آماده ارسال',
  },
] as const;

const active = ref(0);
const heroRef = ref<HTMLElement | null>(null);
const heroInView = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;
let visibilityObserver: IntersectionObserver | null = null;

function next() {
  active.value = (active.value + 1) % slides.length;
}

function start() {
  stop();
  if (!heroInView.value) return;
  timer = setInterval(next, 5500);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined' && heroRef.value) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        heroInView.value = Boolean(entry?.isIntersecting);
        if (heroInView.value) start();
        else stop();
      },
      { threshold: 0.35 }
    );
    visibilityObserver.observe(heroRef.value);
  }
  start();
});

onBeforeUnmount(() => {
  stop();
  visibilityObserver?.disconnect();
  visibilityObserver = null;
});
</script>

<template>
  <section
    ref="heroRef"
    class="tire-home-hero relative isolate min-h-[100svh] overflow-hidden bg-slate-950"
  >
    <div class="absolute inset-0">
      <img
        v-for="(slide, index) in slides"
        :key="slide.src"
        :src="slide.src"
        :alt="slide.alt"
        class="hero-slide-img absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
        :class="index === active ? 'opacity-100' : 'opacity-0'"
        width="1920"
        height="1080"
        :fetchpriority="index === 0 ? 'high' : 'low'"
        decoding="async"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/90" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(220,38,38,0.18),transparent_55%)]" />
      <div
        class="pointer-events-none absolute inset-y-0 end-0 w-16 opacity-40 md:w-24"
        style="background: url('/images/tire/tread-pattern.svg') repeat-y center / contain"
      />
    </div>

    <div class="relative z-10 mx-auto flex min-h-[100svh] max-w-store flex-col items-center justify-end px-4 pb-10 pt-28 md:justify-center md:pb-16 md:pt-24">
      <div class="hero-copy w-full max-w-2xl text-center text-white">
        <div class="inline-flex items-center justify-center gap-3">
          <img
            src="/logo.svg"
            :alt="SITE_NAME"
            class="h-14 w-14 rounded-full bg-white/95 p-1.5 shadow-lg md:h-16 md:w-16"
            width="64"
            height="64"
          />
          <div class="text-start">
            <p class="text-[11px] font-semibold tracking-[0.18em] text-red-300 md:text-xs">TIRE SPECIALIST</p>
            <h1 class="text-4xl font-black tracking-tight md:text-5xl">{{ SITE_NAME }}</h1>
          </div>
        </div>
        <p class="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/85 md:text-base">
          {{ SITE_TAGLINE }} — انتخاب بر اساس خودرو یا سایز، با قیمت شفاف.
        </p>
      </div>

      <div class="hero-search mt-7 w-full max-w-4xl">
        <TireSearchWidget variant="hero" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-copy {
  animation: hero-rise 0.7s ease-out both;
}

.hero-search {
  animation: hero-rise 0.85s ease-out 0.08s both;
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-search {
    animation: none;
  }

  .hero-slide-img {
    transition: none !important;
  }
}
</style>
