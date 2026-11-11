<script setup lang="ts">
const items = [
  { icon: 'lucide:truck', label: 'تحویل اکسپرس' },
  { icon: 'lucide:calendar-sync', label: '۷ روز ضمانت بازگشت' },
  { icon: 'lucide:handbag', label: 'پرداخت در محل' },
  { icon: 'lucide:wallet', label: 'تضمین بهترین قیمت' },
  { icon: 'lucide:badge-check', label: 'ضمانت کالای اصل' },
] as const;
</script>

<template>
  <section class="store-trust" aria-label="تضمین‌های فروشگاه">
    <div class="store-trust__shell">
      <ul class="store-trust__list">
        <li v-for="item in items" :key="item.label" class="store-trust__item">
          <span class="store-trust__icon" aria-hidden="true">
            <AppIcon :name="item.icon" size="lg" />
          </span>
          <span class="store-trust__label">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.store-trust {
  width: 100%;
  padding: 1rem 1rem 1.25rem;
  background: transparent;
}

.store-trust__shell {
  margin-inline: auto;
  max-width: 72rem;
  border-radius: 1.35rem;
  background: #f3f4f6;
  padding: 1.15rem 0.75rem;
}

.store-trust__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 0.5rem;
}

.store-trust__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  text-align: center;
  color: #4b5563;
}

.store-trust__icon {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  color: #4b5563;
}

.store-trust__icon :deep(svg) {
  width: 1.85rem;
  height: 1.85rem;
  stroke-width: 1.35;
}

.store-trust__label {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.45;
  color: #4b5563;
}

@media (min-width: 640px) {
  .store-trust__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .store-trust {
    padding: 1.25rem 1.25rem 1.5rem;
  }

  .store-trust__shell {
    padding: 1.45rem 1rem;
  }

  .store-trust__list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .store-trust__label {
    font-size: 0.8rem;
  }

  .store-trust__icon :deep(svg) {
    width: 2.05rem;
    height: 2.05rem;
  }
}
</style>
