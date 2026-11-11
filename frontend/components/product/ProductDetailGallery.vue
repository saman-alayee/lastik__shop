<script setup lang="ts">
const props = defineProps<{
  images: string[];
  activeIndex: number;
  productName: string;
  favorited: boolean;
}>();

const emit = defineEmits<{
  'update:activeIndex': [index: number];
  toggleFavorite: [];
}>();

const { getProductImage } = useFormat();

const activeSrc = computed(() => {
  const raw = props.images[props.activeIndex];
  return raw ? getProductImage(raw) : getProductImage(null);
});

const hasMany = computed(() => props.images.length > 1);
const imageKey = computed(() => `${props.activeIndex}-${activeSrc.value}`);

function step(delta: number) {
  const count = props.images.length;
  if (count < 2) return;
  emit('update:activeIndex', (props.activeIndex + delta + count) % count);
}
</script>

<template>
  <div class="pd-gallery md:sticky md:top-24">
    <div class="pd-gallery__stage">
      <div class="pd-gallery__glow" aria-hidden="true" />
      <div class="pd-gallery__ring" aria-hidden="true" />

      <Transition name="pd-fade" mode="out-in">
        <img
          :key="imageKey"
          :src="activeSrc"
          :alt="productName"
          class="pd-gallery__img"
          loading="eager"
        />
      </Transition>

      <button
        type="button"
        class="product-fav-btn absolute top-3 start-3 z-20 flex h-11 w-11 items-center justify-center rounded-full"
        :class="{ 'is-on': favorited }"
        :aria-pressed="favorited"
        :aria-label="favorited ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'"
        @click="emit('toggleFavorite')"
      >
        <AppIcon name="lucide:bookmark" size="md" class="product-fav-btn__icon" />
      </button>

      <template v-if="hasMany">
        <button
          type="button"
          class="pd-gallery__nav start-3"
          aria-label="تصویر قبلی"
          @click="step(-1)"
        >
          <AppIcon name="lucide:chevron-right" size="md" />
        </button>
        <button
          type="button"
          class="pd-gallery__nav end-3"
          aria-label="تصویر بعدی"
          @click="step(1)"
        >
          <AppIcon name="lucide:chevron-left" size="md" />
        </button>
        <div class="pd-gallery__dots" aria-hidden="true">
          <span
            v-for="(_, index) in images"
            :key="index"
            class="pd-gallery__dot"
            :class="{ 'is-active': activeIndex === index }"
          />
        </div>
      </template>
    </div>

    <div v-if="hasMany" class="pd-gallery__thumbs">
      <button
        v-for="(image, index) in images"
        :key="`${image}-${index}`"
        type="button"
        class="pd-gallery__thumb"
        :class="{ 'is-active': activeIndex === index }"
        :aria-label="`تصویر ${index + 1}`"
        @click="emit('update:activeIndex', index)"
      >
        <img
          :src="getProductImage(image)"
          :alt="`${productName} ${index + 1}`"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pd-gallery__stage {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255, 255, 255, 0.14), transparent 62%),
    linear-gradient(165deg, #1e293b 0%, #0f172a 48%, #020617 100%);
  min-height: min(72vw, 420px);
}

@media (min-width: 768px) {
  .pd-gallery__stage {
    min-height: 480px;
    border-radius: 1.25rem;
  }
}

.pd-gallery__glow {
  pointer-events: none;
  position: absolute;
  inset: auto -10% -30% -10%;
  height: 55%;
  background: radial-gradient(ellipse at center, rgba(220, 38, 38, 0.22), transparent 68%);
  z-index: 0;
}

.pd-gallery__ring {
  pointer-events: none;
  position: absolute;
  inset: 12% 8%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  z-index: 0;
}

.pd-gallery__img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: min(72vw, 420px);
  object-fit: contain;
  padding: 1.5rem 1rem 1.75rem;
  filter: drop-shadow(0 24px 40px rgba(0, 0, 0, 0.45));
}

@media (min-width: 768px) {
  .pd-gallery__img {
    height: 480px;
    padding: 2.25rem 1.75rem;
  }
}

.pd-gallery__nav {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  translate: 0 -50%;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  backdrop-filter: blur(8px);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.pd-gallery__nav:hover {
  background: rgba(15, 23, 42, 0.8);
  transform: translateY(-50%) scale(1.05);
}

.pd-gallery__dots {
  position: absolute;
  bottom: 0.65rem;
  left: 50%;
  z-index: 2;
  display: flex;
  translate: -50% 0;
  gap: 0.35rem;
}

.pd-gallery__dot {
  height: 0.3rem;
  width: 0.3rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.28);
  transition: width 0.25s ease, background-color 0.25s ease;
}

.pd-gallery__dot.is-active {
  width: 1.1rem;
  background: rgb(248 113 113);
}

.pd-gallery__thumbs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.85rem 0.15rem 0.15rem;
  scrollbar-width: none;
}

.pd-gallery__thumbs::-webkit-scrollbar {
  display: none;
}

.pd-gallery__thumb {
  height: 4.25rem;
  width: 4.25rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.85rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  opacity: 0.72;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.pd-gallery__thumb:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.pd-gallery__thumb.is-active {
  opacity: 1;
  border-color: rgb(220 38 38);
  box-shadow: 0 0 0 1px rgb(220 38 38);
}

.product-fav-btn {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.25);
  transition:
    transform 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.product-fav-btn:hover {
  transform: scale(1.05);
}

.product-fav-btn.is-on {
  color: #dc2626;
  background: #fff5f5;
  border-color: rgba(220, 38, 38, 0.35);
  animation: product-fav-pop 0.45s cubic-bezier(0.22, 1.4, 0.36, 1);
}

.product-fav-btn :deep(svg.product-fav-btn__icon path) {
  stroke-width: 2.35;
  fill: transparent;
}

.product-fav-btn.is-on :deep(svg.product-fav-btn__icon),
.product-fav-btn.is-on :deep(svg.product-fav-btn__icon path) {
  fill: #dc2626 !important;
  stroke: #dc2626 !important;
  color: #dc2626 !important;
}

.pd-fade-enter-active,
.pd-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.pd-fade-enter-from {
  opacity: 0;
  transform: scale(0.985);
}

.pd-fade-leave-to {
  opacity: 0;
  transform: scale(1.015);
}

@keyframes product-fav-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.22); }
  100% { transform: scale(1); }
}
</style>
