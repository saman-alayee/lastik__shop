<script setup lang="ts">
defineProps<{
  message?: string;
  icon?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center px-4 py-12 text-center">
    <div
      class="mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400"
      aria-hidden="true"
    >
      <AppIcon :name="icon || 'lucide:inbox'" size="xl" />
    </div>
    <p class="text-sm leading-7 text-slate-500">{{ message || 'موردی یافت نشد' }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
