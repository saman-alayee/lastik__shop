<script setup lang="ts">
withDefaults(
  defineProps<{
    code?: number | string;
    title: string;
    description: string;
    eyebrow?: string;
    showBrowse?: boolean;
  }>(),
  {
    code: 404,
    eyebrow: 'مسیر پیدا نشد',
    showBrowse: true,
  },
);

const emit = defineEmits<{
  home: [];
  browse: [];
  back: [];
}>();
</script>

<template>
  <div class="err">
    <div class="err__media" aria-hidden="true">
      <img src="/images/tire/hero-slide-1.jpg" alt="" class="err__photo" decoding="async" />
      <div class="err__veil" />
      <div class="err__tread" />
    </div>

    <div class="err__content">
      <slot name="brand" />

      <div class="err__art">
        <TireMarkArt mode="missing" size="lg" />
        <p class="err__code" aria-hidden="true">{{ code }}</p>
      </div>

      <p class="err__eyebrow">{{ eyebrow }}</p>
      <h1 class="err__title">{{ title }}</h1>
      <p class="err__copy">{{ description }}</p>

      <div class="err__actions">
        <button type="button" class="err__btn err__btn--primary" @click="emit('home')">
          بازگشت به فروشگاه
        </button>
        <button
          v-if="showBrowse"
          type="button"
          class="err__btn err__btn--ghost"
          @click="emit('browse')"
        >
          دیدن برندها
        </button>
        <button
          v-else
          type="button"
          class="err__btn err__btn--ghost"
          @click="emit('back')"
        >
          صفحه قبل
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.err {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background: #020617;
  color: #f8fafc;
}

.err__media {
  position: absolute;
  inset: 0;
}

.err__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(0.7) contrast(1.05);
  transform: scale(1.04);
  animation: err-ken 28s ease-in-out infinite alternate;
}

.err__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 55% at 50% 30%, rgba(220, 38, 38, 0.22), transparent 60%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.55) 0%, rgba(2, 6, 23, 0.82) 48%, rgba(2, 6, 23, 0.96) 100%);
}

.err__tread {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background: url('/images/tire/tread-pattern.svg') center / 140px auto repeat;
  mix-blend-mode: soft-light;
  animation: err-tread 22s linear infinite;
}

.err__content {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  display: flex;
  min-height: 100dvh;
  max-width: 40rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  text-align: center;
}

.err__art {
  position: relative;
  width: min(100%, 18rem);
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 24px 40px rgba(0, 0, 0, 0.45));
}

.err__code {
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  top: 42%;
  transform: translateY(-50%);
  font-size: clamp(4.5rem, 18vw, 7rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(248, 250, 252, 0.12);
}

.err__eyebrow {
  margin-top: 0.75rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #fca5a5;
}

.err__title {
  margin-top: 0.7rem;
  font-size: clamp(1.55rem, 4vw, 2.1rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #fff;
}

.err__copy {
  margin-top: 0.75rem;
  max-width: 28rem;
  font-size: 0.95rem;
  line-height: 1.85;
  color: rgba(226, 232, 240, 0.78);
}

.err__actions {
  margin-top: 2rem;
  display: flex;
  width: 100%;
  max-width: 24rem;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .err__actions {
    max-width: none;
    flex-direction: row;
    justify-content: center;
  }
}

.err__btn {
  min-height: 3.25rem;
  min-width: 10rem;
  border-radius: 0.95rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 800;
  transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}

.err__btn--primary {
  background: #dc2626;
  color: #fff;
}

.err__btn--primary:hover {
  background: #b91c1c;
}

.err__btn--ghost {
  border: 1px solid rgba(248, 250, 252, 0.28);
  background: rgba(15, 23, 42, 0.45);
  color: #f8fafc;
}

.err__btn--ghost:hover {
  border-color: rgba(248, 250, 252, 0.5);
  background: rgba(15, 23, 42, 0.7);
}

.err__btn:active {
  transform: translateY(1px);
}

@keyframes err-ken {
  from {
    transform: scale(1.04) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.1) translate3d(-1.5%, 1%, 0);
  }
}

@keyframes err-tread {
  to {
    background-position: 140px 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .err__photo,
  .err__tread {
    animation: none;
  }
}
</style>
