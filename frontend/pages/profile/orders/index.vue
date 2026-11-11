<script setup lang="ts">
import type { Order, OrderStatus, Pagination } from '~/types';
import { ORDER_STATUS_LABELS } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';
import { tirePackLabel } from '~/utils/tire';

definePageMeta({ layout: 'profile', middleware: 'auth' });

const api = useApi();
const { formatPrice, formatShortDate, toPersianDigits } = useFormat();
const isTireStore = STORE_MODE === 'tire';

const route = useRoute();
const orders = ref<Order[]>([]);
const loading = ref(true);

const allowedStatuses = new Set<OrderStatus>([
  'NEW',
  'REVIEWING',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

function readStatusFilter(raw: unknown): OrderStatus | '' {
  const value = typeof raw === 'string' ? raw : '';
  if (value === 'current') return 'PREPARING';
  return allowedStatuses.has(value as OrderStatus) ? (value as OrderStatus) : '';
}

const statusFilter = ref<OrderStatus | ''>(readStatusFilter(route.query.status));

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
  if (statusFilter.value === 'PREPARING') {
    return orders.value.filter((o) =>
      ['NEW', 'REVIEWING', 'PREPARING', 'SHIPPED'].includes(o.status)
    );
  }
  return orders.value.filter((o) => o.status === statusFilter.value);
});

watch(
  () => route.query.status,
  (value) => {
    statusFilter.value = readStatusFilter(value);
  }
);

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
  <div class="orders-page pb-8">
    <ProfilePageHeader
      title="سفارش‌های من"
      :subtitle="isTireStore ? 'تکی، جفت و دو جفت — پیگیری خریدها' : 'تاریخچه و پیگیری سفارشات'"
      back-to="/profile"
    />

    <div class="ui-panel">
      <label class="orders-filter-field">
        <span>وضعیت سفارش</span>
        <AppSelect
          v-model="statusFilter"
          :options="statusFilters"
          placeholder="همه وضعیت‌ها"
          size="sm"
        />
      </label>

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
  </div>
</template>

<style scoped>
.orders-filter-field {
  display: block;
  max-width: 16rem;
  margin-bottom: 1rem;
}

.orders-filter-field > span {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(var(--color-text-muted));
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.order-card {
  display: block;
  padding: 0.95rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgb(var(--color-border));
  background: rgb(var(--color-surface));
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.order-card:hover {
  border-color: rgb(var(--color-border-strong));
  background: rgb(var(--color-surface-muted));
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
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: rgb(var(--color-surface-muted));
  color: rgb(var(--color-text-muted));
  border: 1px solid rgb(var(--color-border));
  flex-shrink: 0;
}

.group:hover .order-card__icon {
  background: rgb(var(--color-accent-500) / 0.08);
  color: rgb(var(--color-accent-500));
  border-color: rgb(var(--color-accent-500) / 0.3);
}

.order-card__number {
  font-size: 0.88rem;
  font-weight: 800;
  color: rgb(var(--color-text));
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
  color: rgb(var(--color-text-muted));
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
  color: rgb(var(--color-primary-700));
  background: rgb(var(--color-primary-100));
  border: 1px solid rgb(var(--color-border));
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
  color: rgb(var(--color-accent-600));
}

.order-card__hint--prep {
  color: rgb(var(--color-warning));
}

.order-card__hint-spacer {
  flex: 1;
}

.order-card__price {
  margin-inline-start: auto;
  font-size: 0.95rem;
  font-weight: 900;
  color: rgb(var(--color-text));
}
</style>
