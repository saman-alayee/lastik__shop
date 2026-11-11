<script setup lang="ts">
import { SITE_NAME } from '~/constants/site';

definePageMeta({
  layout: false,
});

setResponseStatus(404);

useHead({
  title: `صفحه پیدا نشد - ${SITE_NAME}`,
});

function goHome() {
  navigateTo('/');
}

function goBrowse() {
  navigateTo('/brands');
}
</script>

<template>
  <ErrorTireScene
    :code="404"
    title="این صفحه پیدا نشد"
    description="این مسیر در فروشگاه لاستیک وجود ندارد. به صفحه اصلی برگردید یا برندها و محصولات را ببینید."
    eyebrow="TIRE NOT FOUND"
    show-browse
    @home="goHome"
    @browse="goBrowse"
  >
    <template #brand>
      <NuxtLink
        to="/"
        class="mb-8 inline-flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100"
      >
        <img
          src="/logo.svg"
          :alt="SITE_NAME"
          class="h-11 w-11 object-contain"
          width="44"
          height="44"
        />
        <span class="text-sm font-semibold tracking-wide text-slate-900">{{ SITE_NAME }}</span>
      </NuxtLink>
    </template>
  </ErrorTireScene>
</template>
