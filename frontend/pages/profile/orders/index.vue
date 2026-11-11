<script setup lang="ts">
import type { Order, OrderStatus, Pagination } from '~/types';
import { ORDER_STATUS_LABELS } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';
import { tirePackLabel } from '~/utils/tire';

definePageMeta({ layout: 'profile', middleware: 'auth' });

const api = useApi();
const { formatPrice, formatShortDate, toPersianDigits } = useFormat();
const isTireStore = STORE_MODE === 'tire';

const orders = ref<Order[]>([]);
const loading = ref(true);
const statusFilter = ref<OrderStatus | ''>('');

const statusFilters: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'همه' },
  { value: 'NEW', label: ORDER_STATUS_LABELS.NEW },
  { value: 'PREPARING', label: ORDER_STATUS_LABELS.PREPARING },
  { value: 'SHIPPED', label: ORDER_STATUS_LABELS.SHIPPED },
  { value: 'DELIVERED', label: ORDER_STATUS_LABELS.DELIVERED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABELS.CANCELLED },
];

const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value;
  return orders.value.filter((o) => o.status === statusFilter.value);
});

function orderRingCount(order: Order) {
  return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function orderPackSummary(order: Order) {
  if (!isTireStore) {
    const count = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    return count ? `${toPersianDigits(count)} قلم` : '';
  }
  const packs = (order.items || []).map((item) => tirePackLabel(item.quantity));
  const unique = [...new Set(packs.filter(Boolean))];
  if (!unique.length) return '';
  if (unique.length === 1) return unique[0];
  return unique.slice(0, 2).join(' · ');
}

onMounted(loadOrders);

async function loadOrders() {
  loading.value = true;
  try {
    const ordersResult = await api.get<{ orders: Order[]; pagination: Pagination }>('/orders?limit=50');
    orders.value = ordersResult.data.orders;
  } finally {
    loading.value = false;
  }
}

useHead({ title: `سفارش‌های من - ${SITE_NAME}` });
</script>

<template>
  <div class="orders-page pb-24">
    <ProfilePageHeader
      title="سفارش‌های من"
      :subtitle="isTireStore ? 'تکی، جفت و دو جفت — پیگیری خریدها' : 'تاریخچه و پیگیری سفارشات'"
      back-to="/profile"
    />

    <div class="orders-filters">
      <button
        v-for="filter in statusFilters"
        :key="filter.value || 'all'"
        type="button"
        :class="['orders-filters__chip', statusFilter === filter.value && 'is-active']"
        @click="statusFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading && filteredOrders.length" class="orders-list">
      <NuxtLink
        v-for="order in filteredOrders"
        :key="order.id"
        :to="`/profile/orders/${order.id}`"
        class="order-card group"
      >
        <div class="order-card__head">
          <div class="order-card__id">
            <span class="order-card__icon">
              <AppIcon name="lucide:package" size="sm" />
            </span>
            <span class="order-card__number" dir="ltr">{{ order.orderNumber }}</span>
          </div>
          <OrderStatusBadge :status="order.status" />
        </div>

        <div class="order-card__meta">
          <span class="order-card__date">
            <AppIcon name="lucide:calendar" size="xs" />
            {{ formatShortDate(order.createdAt) }}
          </span>
          <span v-if="orderPackSummary(order)" class="order-card__pack">
            {{ orderPackSummary(order) }}
            <template v-if="isTireStore && orderRingCount(order)">
              · {{ toPersianDigits(orderRingCount(order)) }} حلقه
            </template>
          </span>
        </div>

        <div class="order-card__foot">
          <p v-if="order.status === 'NEW'" class="order-card__hint order-card__hint--new">
            پرداخت ثبت شد — در صف آماده‌سازی
          </p>
          <p v-else-if="order.status === 'PREPARING'" class="order-card__hint order-card__hint--prep">
            در حال آماده‌سازی و بسته‌بندی
          </p>
          <span v-else class="order-card__hint-spacer" />
          <strong class="order-card__price">{{ formatPrice(order.totalPrice) }}</strong>
        </div>
      </NuxtLink>
    </div>

    <EmptyState v-else-if="!loading" message="سفارشی یافت نشد" />
  </div>
</template>

<style scoped>
.orders-filters {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  padding-bottom: 0.2rem;
  scrollbar-width: none;
}

.orders-filters::-webkit-scrollbar {
  display: none;
}

.orders-filters__chip {
  flex-shrink: 0;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}

.orders-filters__chip.is-active {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.order-card {
  display: block;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  text-decoration: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.order-card:hover {
  transform: translateY(-1px);
  border-color: rgba(220, 38, 38, 0.28);
  box-shadow: 0 14px 28px -20px rgba(15, 23, 42, 0.35);
}

.order-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.order-card__id {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.order-card__icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.8rem;
  display: grid;
  place-items: center;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #eef2f7;
  flex-shrink: 0;
}

.group:hover .order-card__icon {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.order-card__number {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.85rem;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.order-card__date {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.order-card__pack {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.order-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.order-card__hint {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
}

.order-card__hint--new {
  color: #b91c1c;
}

.order-card__hint--prep {
  color: #b45309;
}

.order-card__hint-spacer {
  flex: 1;
}

.order-card__price {
  margin-inline-start: auto;
  font-size: 0.95rem;
  font-weight: 900;
  color: #0f172a;
}
</style>
