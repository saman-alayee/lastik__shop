<script setup lang="ts">
import type { NuxtError } from '#app';
import { SITE_NAME } from '~/constants/site';

const props = defineProps<{ error: NuxtError }>();

const is404 = computed(() => props.error?.statusCode === 404);

const title = computed(() =>
  is404.value ? 'این صفحه پیدا نشد' : 'فروشگاه موقتاً پاسخگو نیست'
);

const description = computed(() => {
  if (is404.value) {
    return 'این مسیر در فروشگاه لاستیک وجود ندارد. به صفحه اصلی برگردید یا برندها و محصولات را ببینید.';
  }
  return (
    props.error?.statusMessage ||
    props.error?.message ||
    'مشکلی پیش آمد. لطفاً چند لحظه دیگر دوباره تلاش کنید.'
  );
});

function goHome() {
  clearError({ redirect: '/' });
}

function goBrowse() {
  clearError({ redirect: '/brands' });
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    clearError();
    window.history.back();
    return;
  }
  goHome();
}
</script>

<template>
  <ErrorTireScene
    :code="error?.statusCode || 404"
    :title="title"
    :description="description"
    :eyebrow="is404 ? 'لاستیک پیدا نشد' : 'سرویس موقتاً قطع است'"
    :show-browse="is404"
    @home="goHome"
    @browse="goBrowse"
    @back="goBack"
  >
    <template #brand>
      <button
        type="button"
        class="mb-6 inline-flex items-center gap-2 opacity-95 transition-opacity hover:opacity-100"
        @click="goHome"
      >
        <img
          src="/logo.svg"
          :alt="SITE_NAME"
          class="h-11 w-11 object-contain"
          width="44"
          height="44"
        />
        <span class="text-base font-black tracking-tight text-white">{{ SITE_NAME }}</span>
      </button>
    </template>
  </ErrorTireScene>
</template>
