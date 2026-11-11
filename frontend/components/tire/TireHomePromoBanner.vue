<script setup lang="ts">
const slides = [
  {
    id: 'warehouse',
    eyebrow: 'انبار آماده ارسال',
    title: 'لاستیک اصل، قیمت شفاف، ارسال سریع',
    lead: 'از جستجوی خودرو تا خرید جفت و چهارحلقه، همه چیز برای خرید مطمئن لاستیک طراحی شده است.',
    image: '/images/tire/hero-slide-2.jpg',
    imageAlt: 'انبار لاستیک آماده ارسال',
    primary: { to: '/shop?sort=price_asc', label: 'شروع خرید' },
    secondary: { to: '/cars', label: 'انتخاب خودرو' },
  },
  {
    id: 'tread',
    eyebrow: 'کیفیت و اصالت',
    title: 'برندهای معتبر، موجودی واقعی',
    lead: 'لاستیک‌های نکسین و برندهای مطرح بازار با موجودی به‌روز و قیمت جفت و چهارحلقه.',
    image: '/images/tire/hero-slide-1.jpg',
    imageAlt: 'آج لاستیک خودرو',
    primary: { to: '/brands', label: 'مشاهده برندها' },
    secondary: { to: '/shop', label: 'فروشگاه لاستیک' },
  },
  {
    id: 'fitment',
    eyebrow: 'سایز دقیق خودرو',
    title: 'لاستیک مناسب ماشین شما',
    lead: 'با انتخاب برند و مدل خودرو، سایزهای استاندارد ماشین را ببینید و مستقیم سفارش دهید.',
    image: '/images/tire/hero-slide-3.jpg',
    imageAlt: 'نصب تایر نو روی خودرو',
    primary: { to: '/cars', label: 'انتخاب خودرو' },
    secondary: { to: '/shop?inStock=1', label: 'موجودی انبار' },
  },
  {
    id: 'ready',
    eyebrow: 'ارسال سراسر کشور',
    title: 'از انبار تا درب منزل',
    lead: 'سفارش آنلاین، آماده‌سازی سریع از انبار و پیگیری وضعیت تا رسیدن به مقصد.',
    image: '/images/tire/hero-warehouse.jpg',
    imageAlt: 'انبار تخصصی لاستیک',
    primary: { to: '/shop?sort=price_asc', label: 'مشاهده قیمت‌ها' },
    secondary: { to: '/contact', label: 'تماس با ما' },
  },
] as const;

const active = ref(0);
const rootRef = ref<HTMLElement | null>(null);
const inView = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;

const current = computed(() => slides[active.value] ?? slides[0]);

function goTo(index: number) {
  active.value = (index + slides.length) % slides.length;
}

function next() {
  goTo(active.value + 1);
}

function prev() {
  goTo(active.value - 1);
}

function start() {
  stop();
  if (!inView.value || slides.length <= 1) return;
  timer = setInterval(next, 5600);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined' && rootRef.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        inView.value = Boolean(entry?.isIntersecting);
        if (inView.value) start();
        else stop();
      },
      { threshold: 0.25 }
    );
    observer.observe(rootRef.value);
  }
  start();
});

onBeforeUnmount(() => {
  stop();
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <section
    ref="rootRef"
    class="promo-banner mx-auto mb-4 max-w-store px-4"
    aria-roledescription="carousel"
    aria-label="بنرهای تبلیغاتی فروشگاه"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div class="promo-banner__frame">
      <div class="promo-banner__media" aria-hidden="true">
        <Transition name="promo-fade" mode="out-in">
          <img
            :key="current.id"
            :src="current.image"
            :alt="current.imageAlt"
            class="promo-banner__img"
            width="1200"
            height="640"
            loading="lazy"
            decoding="async"
          />
        </Transition>
        <div class="promo-banner__shade" />
        <div class="promo-banner__grain" />
      </div>

      <div class="promo-banner__body">
        <div class="promo-banner__copy">
          <Transition name="promo-rise" mode="out-in">
            <div :key="current.id" class="promo-banner__copy-inner">
              <p class="promo-banner__eyebrow">{{ current.eyebrow }}</p>
              <h2 class="promo-banner__title">{{ current.title }}</h2>
              <p class="promo-banner__lead">{{ current.lead }}</p>
              <div class="promo-banner__actions">
                <NuxtLink :to="current.primary.to" class="promo-banner__btn promo-banner__btn--primary">
                  {{ current.primary.label }}
                </NuxtLink>
                <NuxtLink :to="current.secondary.to" class="promo-banner__btn promo-banner__btn--ghost">
                  {{ current.secondary.label }}
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <div class="promo-banner__aside">
          <Transition name="promo-fade" mode="out-in">
            <img
              :key="`${current.id}-aside`"
              :src="current.image"
              :alt="current.imageAlt"
              class="promo-banner__aside-img"
              width="640"
              height="400"
              loading="lazy"
              decoding="async"
            />
          </Transition>
        </div>
      </div>

      <div class="promo-banner__controls">
        <button type="button" class="promo-banner__nav" aria-label="اسلاید قبلی" @click="prev">
          <AppIcon name="lucide:chevron-right" size="sm" />
        </button>
        <div class="promo-banner__dots" role="tablist" aria-label="انتخاب اسلاید">
          <button
            v-for="(slide, index) in slides"
            :key="slide.id"
            type="button"
            role="tab"
            class="promo-banner__dot"
            :class="{ 'is-active': index === active }"
            :aria-selected="index === active"
            :aria-label="slide.title"
            @click="goTo(index)"
          />
        </div>
        <button type="button" class="promo-banner__nav" aria-label="اسلاید بعدی" @click="next">
          <AppIcon name="lucide:chevron-left" size="sm" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.promo-banner__frame {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #020617;
  min-height: 18.5rem;
  color: #fff;
  box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.55);
}

.promo-banner__media {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.promo-banner__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.04);
  filter: saturate(0.92) brightness(0.55);
}

.promo-banner__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(2, 6, 23, 0.92) 0%, rgba(2, 6, 23, 0.78) 42%, rgba(2, 6, 23, 0.35) 72%, rgba(2, 6, 23, 0.55) 100%),
    radial-gradient(ellipse at 85% 20%, rgba(220, 38, 38, 0.28), transparent 50%);
}

.promo-banner__grain {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image: url('/images/tire/tread-pattern.svg');
  background-size: 88px auto;
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.promo-banner__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1.25rem;
  padding: 1.6rem 1.25rem 3.4rem;
}

.promo-banner__copy-inner {
  max-width: 36rem;
}

.promo-banner__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #f87171;
}

.promo-banner__title {
  margin: 0.55rem 0 0;
  font-size: clamp(1.35rem, 4.2vw, 1.9rem);
  font-weight: 900;
  line-height: 1.35;
}

.promo-banner__lead {
  margin: 0.7rem 0 0;
  max-width: 34rem;
  font-size: 0.9rem;
  line-height: 1.85;
  color: #cbd5e1;
}

.promo-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.promo-banner__btn {
  display: inline-flex;
  min-height: 2.7rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  font-size: 0.875rem;
  font-weight: 800;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.promo-banner__btn:active {
  transform: scale(0.98);
}

.promo-banner__btn--primary {
  background: #dc2626;
  color: #fff;
}

.promo-banner__btn--primary:hover {
  background: #ef4444;
}

.promo-banner__btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(6px);
}

.promo-banner__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.promo-banner__aside {
  display: none;
}

.promo-banner__controls {
  position: absolute;
  z-index: 2;
  inset-inline: 1rem;
  bottom: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.promo-banner__nav {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(2, 6, 23, 0.45);
  color: #fff;
  backdrop-filter: blur(8px);
  transition: background-color 0.18s ease;
}

.promo-banner__nav:hover {
  background: rgba(220, 38, 38, 0.85);
  border-color: transparent;
}

.promo-banner__dots {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.promo-banner__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  transition: width 0.2s ease, background-color 0.2s ease;
}

.promo-banner__dot.is-active {
  width: 1.35rem;
  background: #fff;
}

.promo-fade-enter-active,
.promo-fade-leave-active {
  transition: opacity 0.45s ease;
}

.promo-fade-enter-from,
.promo-fade-leave-to {
  opacity: 0;
}

.promo-rise-enter-active,
.promo-rise-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.promo-rise-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.promo-rise-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (min-width: 768px) {
  .promo-banner__frame {
    min-height: 20rem;
  }

  .promo-banner__body {
    grid-template-columns: 1.25fr 0.85fr;
    align-items: center;
    gap: 1.75rem;
    padding: 2rem 2rem 3.5rem;
  }

  .promo-banner__aside {
    display: block;
    position: relative;
  }

  .promo-banner__aside-img {
    display: block;
    width: 100%;
    height: 15.5rem;
    object-fit: cover;
    border-radius: 1.5rem;
    box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.65);
  }

  .promo-banner__aside::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    pointer-events: none;
  }

  .promo-banner__controls {
    inset-inline: 1.5rem;
    bottom: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-fade-enter-active,
  .promo-fade-leave-active,
  .promo-rise-enter-active,
  .promo-rise-leave-active,
  .promo-banner__dot {
    transition: none;
  }
}
</style>
