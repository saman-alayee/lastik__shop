<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  backTo?: string;
}>();
</script>

<template>
  <header class="pph ui-panel">
    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="ui-icon-btn"
      aria-label="بازگشت"
    >
      <AppIcon name="lucide:arrow-right" size="md" />
    </NuxtLink>

    <div class="pph__copy min-w-0 flex-1">
      <h1 class="ui-title">{{ title }}</h1>
      <p v-if="subtitle" class="ui-subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.action" class="pph__action shrink-0">
      <slot name="action" />
    </div>
  </header>
</template>

<style scoped>
.pph {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-block: 0.95rem;
}

.pph :deep(.ui-title) {
  font-size: 1.05rem;
}
</style>
