<script setup lang="ts">
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '~/constants/site';
</script>

<template>
  <section class="px-5 md:px-10 lg:px-16 py-10 md:py-14 max-w-4xl mx-auto text-center">
    <h1 class="text-lg md:text-xl font-bold text-gray-900">{{ SITE_NAME }}</h1>
    <h2 class="mt-3 text-base md:text-lg font-semibold text-gray-800">{{ SITE_TAGLINE }}</h2>
    <p class="mt-4 text-sm md:text-[15px] leading-relaxed text-gray-600">
      {{ SITE_DESCRIPTION }}
    </p>
  </section>
</template>
