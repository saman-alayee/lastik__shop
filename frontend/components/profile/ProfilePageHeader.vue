<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  backTo?: string;
}>();
</script>

<template>
  <header class="pph">
    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="pph__back"
      aria-label="بازگشت"
    >
      <AppIcon name="lucide:arrow-right" size="md" />
    </NuxtLink>

    <div class="pph__copy min-w-0 flex-1">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
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
  padding: 0.95rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #fff;
}

.pph__back {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.55rem;
  color: #4b5563;
  transition: background-color 0.15s ease;
}

.pph__back:hover {
  background: #f9fafb;
}

.pph__copy h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.4;
}

.pph__copy p {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.5;
}
</style>
