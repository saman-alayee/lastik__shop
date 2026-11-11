<script setup lang="ts">
export type EmptyCatalogVariant = 'products' | 'search' | 'favorites' | 'cart' | 'stock';

const props = withDefaults(
  defineProps<{
    variant?: EmptyCatalogVariant;
    title?: string;
    description?: string;
    compact?: boolean;
  }>(),
  {
    variant: 'products',
    compact: false,
  },
);

const defaults: Record<
  EmptyCatalogVariant,
  { title: string; description: string; icon: string }
> = {
  products: {
    title: 'لاستیکی برای نمایش نیست',
    description: 'این بخش فعلاً خالی است. فروشگاه، برندها یا جستجوی خودرو را امتحان کنید.',
    icon: 'shop:tire',
  },
  search: {
    title: 'لاستیکی پیدا نشد',
    description: 'سایز، برند یا عبارت دیگری را امتحان کنید.',
    icon: 'lucide:search-x',
  },
  favorites: {
    title: 'هنوز لاستیکی ذخیره نشده',
    description: 'با زدن روی قلب، لاستیک‌های محبوب‌تان اینجا جمع می‌شوند.',
    icon: 'lucide:heart',
  },
  cart: {
    title: 'سبد خالی است',
    description: 'هنوز حلقه‌ای اضافه نکرده‌اید. از فروشگاه یا بر اساس خودرو انتخاب کنید.',
    icon: 'lucide:shopping-cart',
  },
  stock: {
    title: 'فعلاً ناموجود',
    description: 'این سایز در انبار نیست. سایز یا برند دیگری را امتحان کنید.',
    icon: 'lucide:package-x',
  },
};

const copy = computed(() => {
  const base = defaults[props.variant];
  return {
    title: props.title || base.title,
    description: props.description || base.description,
    icon: base.icon,
  };
});
</script>

<template>
  <div class="empty-box" :class="{ 'empty-box--compact': compact }">
    <div class="empty-box__icon" aria-hidden="true">
      <AppIcon :name="copy.icon" size="xl" />
    </div>
    <h2 class="empty-box__title">{{ copy.title }}</h2>
    <p class="empty-box__desc">{{ copy.description }}</p>
    <div v-if="$slots.default" class="empty-box__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-radius: 1.25rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 2.5rem 1.25rem;
}

.empty-box--compact {
  padding: 1.75rem 1rem;
}

.empty-box__icon {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #94a3b8;
}

.empty-box__title {
  margin: 1rem 0 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.empty-box__desc {
  margin: 0.45rem 0 0;
  max-width: 20rem;
  font-size: 0.875rem;
  line-height: 1.8;
  color: #64748b;
}

.empty-box__actions {
  margin-top: 1.15rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}
</style>
