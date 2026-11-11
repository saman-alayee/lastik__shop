<script setup lang="ts">
import { SITE_NAME, SITE_TAGLINE } from '~/constants/site';

withDefaults(
  defineProps<{
    backTo?: string;
    backLabel?: string;
  }>(),
  {
    backTo: '/',
    backLabel: 'بازگشت به فروشگاه',
  }
);

const slides = [
  '/images/tire/hero-slide-1.jpg',
  '/images/tire/hero-slide-2.jpg',
  '/images/tire/hero-slide-3.jpg',
] as const;

const active = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    active.value = (active.value + 1) % slides.length;
  }, 5200);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="auth-gate">
    <section class="auth-gate__visual" aria-hidden="true">
      <div class="auth-gate__slides">
        <img
          v-for="(src, index) in slides"
          :key="src"
          :src="src"
          alt=""
          class="auth-gate__shot"
          :class="{ 'is-active': index === active }"
          decoding="async"
        />
      </div>
      <div class="auth-gate__veil" />
      <div class="auth-gate__scan" />

      <div class="auth-gate__visual-copy">
        <p class="auth-gate__kicker">فروشگاه تخصصی تایر</p>
        <p class="auth-gate__title">{{ SITE_NAME }}</p>
        <p class="auth-gate__sub">{{ SITE_TAGLINE }}</p>
      </div>

      <div class="auth-gate__meters">
        <span
          v-for="(src, index) in slides"
          :key="`m-${src}`"
          class="auth-gate__meter"
          :class="{ 'is-on': index === active }"
        />
      </div>
    </section>

    <section class="auth-gate__desk">
      <div class="auth-gate__desk-inner">
        <div class="auth-gate__slot">
          <slot />
        </div>

        <NuxtLink v-if="backTo" :to="backTo" class="auth-gate__home">
          <AppIcon name="lucide:arrow-right" size="sm" />
          {{ backLabel }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-gate {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  background: #f1f5f9;
}

@media (min-width: 900px) {
  .auth-gate {
    grid-template-columns: minmax(0, 1.15fr) minmax(22rem, 0.85fr);
  }
}

.auth-gate__visual {
  position: relative;
  min-height: 38vh;
  overflow: hidden;
  background: #0f172a;
}

@media (min-width: 900px) {
  .auth-gate__visual {
    min-height: 100vh;
    min-height: 100dvh;
  }
}

.auth-gate__slides,
.auth-gate__shot,
.auth-gate__veil,
.auth-gate__scan {
  position: absolute;
  inset: 0;
}

.auth-gate__shot {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.1s ease, transform 6s ease;
}

.auth-gate__shot.is-active {
  opacity: 1;
  transform: scale(1);
}

.auth-gate__veil {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.15) 0%, rgba(2, 6, 23, 0.55) 45%, rgba(2, 6, 23, 0.88) 100%),
    linear-gradient(90deg, rgba(220, 38, 38, 0.2), transparent 42%);
}

.auth-gate__scan {
  background: repeating-linear-gradient(
    -12deg,
    transparent 0 14px,
    rgba(255, 255, 255, 0.03) 14px 15px
  );
  mix-blend-mode: soft-light;
  animation: scan-drift 16s linear infinite;
}

.auth-gate__visual-copy {
  position: absolute;
  inset-inline: 1.25rem;
  bottom: 1.4rem;
  z-index: 1;
  max-width: 28rem;
  color: #fff;
}

@media (min-width: 900px) {
  .auth-gate__visual-copy {
    inset-inline-start: 2.5rem;
    bottom: 3rem;
  }
}

.auth-gate__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #fecaca;
}

.auth-gate__kicker::before {
  content: '';
  width: 1.6rem;
  height: 2px;
  background: #dc2626;
}

.auth-gate__title {
  margin-top: 0.55rem;
  font-size: clamp(2.4rem, 7vw, 4.4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  text-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
}

.auth-gate__sub {
  margin-top: 0.7rem;
  max-width: 22rem;
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(248, 250, 252, 0.78);
}

.auth-gate__meters {
  position: absolute;
  z-index: 1;
  display: flex;
  gap: 0.35rem;
  inset-inline-end: 1.1rem;
  bottom: 1.3rem;
}

@media (min-width: 900px) {
  .auth-gate__meters {
    inset-inline-end: 2rem;
    bottom: 2.4rem;
  }
}

.auth-gate__meter {
  width: 1.5rem;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  transition: width 0.35s ease, background 0.35s ease;
}

.auth-gate__meter.is-on {
  width: 2.4rem;
  background: #dc2626;
}

.auth-gate__desk {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 1.4rem 1rem 2rem;
  background:
    radial-gradient(circle at 100% 0%, rgba(220, 38, 38, 0.08), transparent 34%),
    linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.auth-gate__desk::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
  background: linear-gradient(180deg, #dc2626, #7f1d1d);
}

@media (max-width: 899px) {
  .auth-gate__desk::before {
    inset-inline: 0;
    inset-block-start: 0;
    width: auto;
    height: 4px;
  }
}

.auth-gate__desk-inner {
  width: min(100%, 26rem);
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.auth-gate__slot {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 1.25rem;
  padding: 1.35rem 1.2rem 1.25rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.auth-gate__home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  align-self: center;
  font-size: 0.85rem;
  color: #475569;
  transition: color 0.2s ease;
}

.auth-gate__home:hover {
  color: #0f172a;
}

@keyframes scan-drift {
  to {
    background-position: 120px 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-gate__shot,
  .auth-gate__scan {
    animation: none;
    transition: none;
  }
}
</style>
