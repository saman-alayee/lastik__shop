<script setup lang="ts">
import type { Order, Pagination, Product } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';

definePageMeta({ layout: 'profile', middleware: 'auth' });

const api = useApi();
const { fetchFavorites } = useFavorites();
const { formatPrice, getProductImage, toPersianDigits } = useFormat();
const cartStore = useCartStore();
const toast = useToast();

const isTireStore = STORE_MODE === 'tire';
const loading = ref(true);
const orders = ref<Order[]>([]);
const favorites = ref<Product[]>([]);
const addingId = ref<string | null>(null);

const orderBuckets = computed(() => {
  const current = orders.value.filter((o) =>
    ['NEW', 'REVIEWING', 'PREPARING', 'SHIPPED'].includes(o.status)
  ).length;
  const delivered = orders.value.filter((o) => o.status === 'DELIVERED').length;
  const cancelled = orders.value.filter((o) => o.status === 'CANCELLED').length;
  return [
    {
      key: 'current',
      label: 'جاری',
      count: current,
      to: '/profile/orders?status=current',
      icon: 'lucide:package-search',
      tone: 'current',
    },
    {
      key: 'delivered',
      label: 'تحویل شده',
      count: delivered,
      to: '/profile/orders?status=DELIVERED',
      icon: 'lucide:package-check',
      tone: 'delivered',
    },
    {
      key: 'cancelled',
      label: 'لغو شده',
      count: cancelled,
      to: '/profile/orders?status=CANCELLED',
      icon: 'lucide:package-x',
      tone: 'cancelled',
    },
  ];
});

const favoritePreview = computed(() => favorites.value.slice(0, 8));

onMounted(async () => {
  loading.value = true;
  try {
    const [ordersRes, favs] = await Promise.all([
      api.get<{ orders: Order[]; pagination: Pagination }>('/orders?limit=50'),
      fetchFavorites().catch(() => [] as Product[]),
    ]);
    orders.value = ordersRes.data.orders ?? [];
    favorites.value = favs ?? [];
  } catch {
    orders.value = [];
    favorites.value = [];
  } finally {
    loading.value = false;
  }
});

async function addFavoriteToCart(product: Product) {
  if (addingId.value) return;
  addingId.value = product.id;
  try {
    await cartStore.addItem(product.id, 1);
    toast.success('به سبد خرید اضافه شد');
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'افزودن به سبد انجام نشد');
  } finally {
    addingId.value = null;
  }
}

useHead({ title: `حساب کاربری - ${SITE_NAME}` });
</script>

<template>
  <div class="ui-stack">
    <section class="ui-panel">
      <div class="ui-head">
        <h2 class="ui-title">سفارش‌های من</h2>
        <NuxtLink to="/profile/orders" class="ui-link">
          مشاهده همه
          <AppIcon name="lucide:chevron-left" size="sm" />
        </NuxtLink>
      </div>

      <LoadingSpinner :show="loading" />

      <div v-if="!loading" class="pdash-orders">
        <NuxtLink
          v-for="bucket in orderBuckets"
          :key="bucket.key"
          :to="bucket.to"
          class="pdash-order"
          :data-tone="bucket.tone"
        >
          <span class="pdash-order__icon">
            <AppIcon :name="bucket.icon" size="lg" />
          </span>
          <span class="pdash-order__meta">
            <strong>{{ toPersianDigits(bucket.count) }} سفارش</strong>
            <span>{{ bucket.label }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>

    <section class="ui-panel">
      <div class="ui-head">
        <h2 class="ui-title ui-title--accent">
          {{ isTireStore ? 'از علاقه‌مندی‌های شما' : 'از لیست‌های شما' }}
        </h2>
        <NuxtLink to="/profile/favorites" class="ui-link">
          مشاهده همه
          <AppIcon name="lucide:chevron-left" size="sm" />
        </NuxtLink>
      </div>

      <div v-if="!loading && favoritePreview.length" class="pdash-favs">
        <article v-for="product in favoritePreview" :key="product.id" class="pdash-fav">
          <NuxtLink :to="`/products/${product.slug}`" class="pdash-fav__media">
            <img
              :src="getProductImage(product.image)"
              :alt="product.name"
              loading="lazy"
              width="160"
              height="160"
            />
          </NuxtLink>
          <NuxtLink :to="`/products/${product.slug}`" class="pdash-fav__title">
            {{ product.name }}
          </NuxtLink>
          <p
            v-if="(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 4"
            class="pdash-fav__stock"
          >
            تنها {{ toPersianDigits(product.stock || 0) }} عدد در انبار باقی مانده
          </p>
          <p class="pdash-fav__price">
            <strong>{{ formatPrice(product.effectivePrice) }}</strong>
          </p>
          <button
            type="button"
            class="ui-pill-btn"
            :disabled="addingId === product.id || !((product.stock ?? 0) > 0)"
            @click="addFavoriteToCart(product)"
          >
            <AppIcon name="lucide:shopping-cart" size="sm" />
            {{
              !((product.stock ?? 0) > 0)
                ? 'ناموجود'
                : addingId === product.id
                  ? '…'
                  : 'افزودن به سبد'
            }}
          </button>
        </article>
      </div>

      <EmptyCatalogScene
        v-else-if="!loading"
        variant="favorites"
        title="هنوز موردی ذخیره نکرده‌اید"
        description="لاستیک‌های موردعلاقه را ذخیره کنید تا اینجا ببینید."
        class="!py-8"
      >
        <NuxtLink to="/shop" class="btn-primary btn-action text-sm px-5">رفتن به فروشگاه</NuxtLink>
      </EmptyCatalogScene>
    </section>

    <section class="ui-panel pdash-quick">
      <div class="ui-head">
        <h2 class="ui-title">دسترسی سریع</h2>
      </div>
      <div class="pdash-quick__grid">
        <NuxtLink to="/profile/addresses" class="pdash-quick__item">
          <AppIcon name="lucide:map-pin" size="md" />
          <span>آدرس‌ها</span>
        </NuxtLink>
        <NuxtLink to="/profile/notifications" class="pdash-quick__item">
          <AppIcon name="lucide:bell" size="md" />
          <span>اعلان‌ها</span>
        </NuxtLink>
        <NuxtLink to="/profile/edit" class="pdash-quick__item">
          <AppIcon name="lucide:user-cog" size="md" />
          <span>اطلاعات حساب</span>
        </NuxtLink>
        <NuxtLink to="/shop" class="pdash-quick__item">
          <AppIcon name="shop:tire" size="md" />
          <span>فروشگاه</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pdash-orders {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.pdash-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 0.4rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease;
}

.pdash-order:hover {
  background: rgb(var(--color-surface-muted));
}

.pdash-order__icon {
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 999px;
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
}

.pdash-order[data-tone='delivered'] .pdash-order__icon {
  background: rgb(var(--color-success) / 0.1);
  color: rgb(var(--color-success));
}

.pdash-order[data-tone='cancelled'] .pdash-order__icon {
  background: rgb(var(--color-warning) / 0.12);
  color: rgb(var(--color-warning));
}

.pdash-order__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-align: center;
}

.pdash-order__meta strong {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgb(var(--color-text));
}

.pdash-order__meta span {
  font-size: 0.72rem;
  color: rgb(var(--color-text-muted));
}

.pdash-favs {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(11.5rem, 14rem);
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.pdash-fav {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.65rem;
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-sm);
}

.pdash-fav__media {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: rgb(var(--color-surface-muted));
}

.pdash-fav__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pdash-fav__title {
  display: -webkit-box;
  overflow: hidden;
  min-height: 2.6em;
  color: rgb(var(--color-text));
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
  text-decoration: none;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pdash-fav__stock {
  margin: 0;
  color: rgb(var(--color-accent-500));
  font-size: 0.68rem;
  font-weight: 700;
}

.pdash-fav__price {
  margin: 0;
  color: rgb(var(--color-text));
  font-size: 0.9rem;
}

.pdash-quick__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

@media (min-width: 640px) {
  .pdash-quick__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.pdash-quick__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.9rem 0.5rem;
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-sm);
  color: rgb(var(--color-text));
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 700;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.pdash-quick__item:hover {
  border-color: rgb(var(--color-accent-500) / 0.35);
  background: rgb(var(--color-accent-500) / 0.05);
  color: rgb(var(--color-accent-600));
}

@media (max-width: 640px) {
  .pdash-orders {
    gap: 0.25rem;
  }

  .pdash-order__icon {
    width: 2.8rem;
    height: 2.8rem;
  }
}
</style>
