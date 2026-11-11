<script setup lang="ts">
import { SITE_NAME } from '~/constants/site';

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    link?: boolean;
    showText?: boolean;
    light?: boolean;
  }>(),
  {
    size: 'md',
    link: true,
    showText: true,
    light: false,
  },
);

const imgClass = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

const textClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};
</script>

<template>
  <NuxtLink
    v-if="link"
    to="/"
    class="inline-flex items-center gap-2 shrink-0 relative z-10 cursor-pointer hover:opacity-90 transition-opacity"
    :aria-label="`صفحه اصلی ${SITE_NAME}`"
  >
    <img src="/logo.svg" :class="imgClass[size]" :alt="SITE_NAME" width="64" height="64" decoding="async" />
    <span
      v-if="showText"
      :class="[
        textClass[size],
        'font-black tracking-tight',
        light ? 'text-white' : 'text-slate-900',
      ]"
    >
      {{ SITE_NAME }}
    </span>
  </NuxtLink>
  <div v-else class="inline-flex items-center gap-2 shrink-0">
    <img src="/logo.svg" :class="imgClass[size]" :alt="SITE_NAME" width="64" height="64" decoding="async" />
    <span
      v-if="showText"
      :class="[
        textClass[size],
        'font-black tracking-tight',
        light ? 'text-white' : 'text-slate-900',
      ]"
    >
      {{ SITE_NAME }}
    </span>
  </div>
</template>
