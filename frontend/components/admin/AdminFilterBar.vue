<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    hint?: string;
  }>(),
  {
    title: 'جستجو و فیلتر',
  }
);
</script>

<template>
  <section class="admin-filter-bar">
    <div class="admin-filter-bar__head">
      <div class="min-w-0">
        <p class="admin-filter-bar__title">{{ title }}</p>
        <p v-if="hint" class="admin-filter-bar__hint">{{ hint }}</p>
      </div>
      <div v-if="$slots.meta" class="admin-filter-bar__meta">
        <slot name="meta" />
      </div>
    </div>

    <div class="admin-filter-bar__body">
      <div v-if="$slots.search" class="admin-filter-bar__search">
        <slot name="search" />
      </div>
      <div v-if="$slots.filters" class="admin-filter-bar__filters">
        <slot name="filters" />
      </div>
      <div v-if="$slots.actions" class="admin-filter-bar__actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.chips" class="admin-filter-bar__chips">
      <slot name="chips" />
    </div>
  </section>
</template>

<style scoped>
.admin-filter-bar {
  margin-bottom: 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.admin-filter-bar__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.65rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.admin-filter-bar__title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f172a;
}

.admin-filter-bar__hint {
  margin-top: 0.2rem;
  font-size: 0.72rem;
  line-height: 1.6;
  color: #64748b;
}

.admin-filter-bar__meta {
  flex-shrink: 0;
}

.admin-filter-bar__body {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem 1rem 1rem;
}

.admin-filter-bar__search {
  min-width: 0;
}

.admin-filter-bar__filters {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: 1fr;
}

.admin-filter-bar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.admin-filter-bar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0 1rem 1rem;
}

@media (min-width: 768px) {
  .admin-filter-bar__body {
    grid-template-columns: minmax(14rem, 1.4fr) minmax(0, 2fr) auto;
    align-items: end;
  }

  .admin-filter-bar__filters {
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  }

  .admin-filter-bar__actions {
    justify-content: flex-end;
    padding-bottom: 0.1rem;
  }
}

@media (min-width: 1100px) {
  .admin-filter-bar__body {
    grid-template-columns: minmax(16rem, 1.2fr) minmax(0, 2.2fr) auto;
  }
}
</style>
