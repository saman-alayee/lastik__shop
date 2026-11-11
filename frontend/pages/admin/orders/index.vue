<script setup lang="ts">
import type { Order, OrderStatus, Pagination } from '~/types';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, getOrderPaymentUi } from '~/types';
import { shippingLabel } from '~/constants/shipping';
import { tirePackLabel } from '~/utils/tire';
import { STORE_MODE } from '~/constants/site';

const isTireStore = STORE_MODE === 'tire';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const toast = useToast();
const { formatPrice, formatDate, getProductImage, toPersianDigits } = useFormat();

const orders = ref<Order[]>([]);
const pagination = ref<Pagination | null>(null);
const page = ref(1);
const loading = ref(true);
const search = ref(typeof route.query.search === 'string' ? route.query.search : '');
const statusFilter = ref((route.query.status as OrderStatus) || '');
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const selectedOrder = ref<Order | null>(null);
const statusNote = ref('');
const statusError = ref('');

const statusOptions: OrderStatus[] = ['NEW', 'REVIEWING', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  NEW: ['PREPARING', 'CANCELLED'],
  REVIEWING: ['NEW', 'PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
};

const STATUS_HINTS: Partial<Record<OrderStatus, string>> = {
  REVIEWING: 'هنوز پول نیامده — منتظر درگاه / تأیید پرداخت',
  NEW: 'پرداخت شده؛ آماده پردازش. وضعیت را به «در حال آماده‌سازی» ببرید',
  SHIPPED: 'پیام ارسال به مشتری می‌رود',
  PREPARING: 'بسته‌بندی کنید و پس از تحویل به پیک، وضعیت را «ارسال شده» کنید',
  DELIVERED: 'سفارش تکمیل شد',
  CANCELLED: 'سفارش لغو می‌شود',
};

const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  NEW: 'سفارش جدید / پرداخت‌شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل داده شده',
  CANCELLED: 'لغو سفارش',
};

function deliveryLabel(order: Order) {
  return shippingLabel(order.paymentDetails?.deliveryMethod);
}

function paymentMethodLabel(order: Order) {
  if (!order.paymentMethod) return '—';
  return PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
}

function paymentDetailLine(order: Order) {
  const details = order.paymentDetails;
  const parts: string[] = [];
  if (details?.refNumber) parts.push(`پیگیری: ${details.refNumber}`);
  if (details?.trackId) parts.push(`زیبال: ${details.trackId}`);
  return parts.join(' · ');
}

function orderCodes(order: Order): string[] {
  const codes = (order.items || [])
    .map((item) => item.product?.barcode)
    .filter((code): code is string => Boolean(code));
  return [...new Set(codes)];
}

function orderItemCount(order: Order): number {
  return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function orderItemSummary(order: Order): string {
  const items = order.items || [];
  if (!items.length) return '—';
  const first = items[0]?.name || 'محصول';
  if (items.length === 1) {
    if (isTireStore) return `${first} · ${tirePackLabel(items[0].quantity)}`;
    return `${first} × ${toPersianDigits(items[0].quantity)}`;
  }
  const extra = items.length - 1;
  return `${first} و ${toPersianDigits(extra)} مورد دیگر`;
}

function orderPackHint(order: Order): string {
  if (!isTireStore) return `${toPersianDigits(orderItemCount(order))} عدد`;
  const packs = [...new Set((order.items || []).map((item) => tirePackLabel(item.quantity)))];
  return packs.join(' · ') || '—';
}

onMounted(async () => {
  await loadOrders();
  const openId = typeof route.query.open === 'string' ? route.query.open : '';
  if (openId) await openOrder(openId);
});

async function loadOrders() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', String(page.value));
    params.set('limit', '20');
    if (statusFilter.value) params.set('status', statusFilter.value);
    if (search.value) params.set('search', search.value);
    if (dateFrom.value) params.set('dateFrom', dateFrom.value);
    if (dateTo.value) params.set('dateTo', dateTo.value);
    const { data } = await api.get<{ orders: Order[]; pagination: Pagination }>(`/admin/orders?${params}`);
    orders.value = data.orders;
    pagination.value = data.pagination;
    if (
      pagination.value &&
      pagination.value.totalPages > 0 &&
      page.value > pagination.value.totalPages
    ) {
      page.value = pagination.value.totalPages;
      await loadOrders();
    }
  } finally {
    loading.value = false;
  }
}

function goToPage(next: number) {
  page.value = next;
  void loadOrders();
}

async function openOrder(orderId: string) {
  statusError.value = '';
  const { data } = await api.get<Order>(`/admin/orders/${orderId}`);
  selectedOrder.value = data;
  statusNote.value = '';
}

function closeOrder() {
  selectedOrder.value = null;
  statusNote.value = '';
  statusError.value = '';
}

function printOrderSlip(orderId: string) {
  window.open(`/admin/orders/print/${orderId}`, '_blank', 'noopener');
}

async function updateStatus(orderId: string, status: OrderStatus) {
  statusError.value = '';
  try {
    await api.put(`/admin/orders/${orderId}/status`, {
      status,
      note: statusNote.value || undefined,
    });
    toast.success(`وضعیت به «${ORDER_STATUS_LABELS[status]}» تغییر کرد`);
    if (selectedOrder.value?.id === orderId) {
      await openOrder(orderId);
    }
    await loadOrders();
  } catch (e: unknown) {
    statusError.value = e instanceof Error ? e.message : 'خطا در تغییر وضعیت';
    toast.error(statusError.value);
  }
}

async function sendOrderSms(orderId: string) {
  try {
    await api.post(`/admin/orders/${orderId}/send-sms`);
    toast.success('پیامک ارسال شد');
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ارسال پیامک');
  }
}

function nextStatuses(status: OrderStatus) {
  return NEXT_STATUS[status] || [];
}

function searchOrders() {
  page.value = 1;
  void loadOrders();
}

watch(statusFilter, () => {
  page.value = 1;
  void loadOrders();
});
watch([dateFrom, dateTo], () => {
  page.value = 1;
  void loadOrders();
});

useHead({ title: 'سفارش‌ها - پنل مدیریت' });
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-800">مدیریت سفارش‌ها</h1>
      <p class="text-sm leading-6 text-gray-500 mt-1 max-w-3xl">
        ستون پرداخت وضعیت پول را نشان می‌دهد.
        بعد از پرداخت موفق، سفارش «جدید» می‌شود؛ شما آن را آماده‌سازی و سپس ارسال می‌کنید تا به تحویل برسد.
      </p>
    </div>

    <AdminFilterBar
      title="جستجو و فیلتر سفارش‌ها"
      hint="شماره سفارش، نام، موبایل یا کد محصول را جستجو کنید؛ وضعیت را از فهرست انتخاب کنید."
    >
      <template #search>
        <label class="admin-filter-field">
          <span>جستجو</span>
          <div class="admin-filter-search">
            <AppIcon name="lucide:search" size="sm" class="admin-filter-search__icon" />
            <input
              v-model="search"
              type="search"
              class="input-field"
              placeholder="شماره سفارش، نام یا موبایل..."
              @keyup.enter="searchOrders"
            />
          </div>
        </label>
      </template>
      <template #filters>
        <label class="admin-filter-field">
          <span>وضعیت سفارش</span>
          <AppSelect
            v-model="statusFilter"
            :options="[
              { value: '', label: 'همه وضعیت‌ها' },
              ...statusOptions.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
              })),
            ]"
            size="sm"
          />
        </label>
        <label class="admin-filter-field">
          <span>از تاریخ</span>
          <AppDatePicker v-model="dateFrom" placeholder="از تاریخ" />
        </label>
        <label class="admin-filter-field">
          <span>تا تاریخ</span>
          <AppDatePicker v-model="dateTo" placeholder="تا تاریخ" :min="dateFrom" />
        </label>
      </template>
      <template #actions>
        <button type="button" class="btn-primary text-sm !py-2.5 !px-4" @click="searchOrders">
          اعمال فیلتر
        </button>
      </template>
    </AdminFilterBar>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="orders-table-wrap">
      <table class="orders-table">
        <thead>
          <tr>
            <th>سفارش</th>
            <th>مشتری</th>
            <th>اقلام</th>
            <th>مبلغ</th>
            <th>پرداخت</th>
            <th>ارسال</th>
            <th>وضعیت</th>
            <th class="orders-table__actions-col">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="orders-table__row"
            @click="openOrder(order.id)"
          >
            <td>
              <div class="orders-cell">
                <span class="orders-cell__primary" dir="ltr">{{ order.orderNumber }}</span>
                <span class="orders-cell__meta">{{ formatDate(order.createdAt) }}</span>
              </div>
            </td>
            <td>
              <div class="orders-cell">
                <span class="orders-cell__primary">{{ order.customerName || '—' }}</span>
                <span class="orders-cell__meta" dir="ltr">{{ order.customerPhone || '—' }}</span>
              </div>
            </td>
            <td>
              <div class="orders-cell">
                <span class="orders-cell__primary orders-cell__clamp">{{ orderItemSummary(order) }}</span>
                <span class="orders-cell__meta">
                  <span class="orders-pill">{{ orderPackHint(order) }}</span>
                  <span
                    v-if="orderCodes(order).length"
                    class="orders-cell__code"
                    dir="ltr"
                    :title="orderCodes(order).join(' · ')"
                  >
                    {{ orderCodes(order)[0] }}{{ orderCodes(order).length > 1 ? ` +${orderCodes(order).length - 1}` : '' }}
                  </span>
                </span>
              </div>
            </td>
            <td>
              <span class="orders-amount">{{ formatPrice(order.totalPrice) }}</span>
            </td>
            <td>
              <div class="orders-cell orders-cell--badges">
                <OrderPaymentBadge :order="order" />
                <span class="orders-cell__meta">{{ paymentMethodLabel(order) }}</span>
              </div>
            </td>
            <td>
              <span class="orders-ship">{{ deliveryLabel(order) }}</span>
            </td>
            <td>
              <OrderStatusBadge :status="order.status" />
            </td>
            <td class="orders-table__actions-col" @click.stop>
              <div class="orders-actions">
                <button type="button" class="orders-action orders-action--primary" @click="openOrder(order.id)">
                  جزئیات
                </button>
                <button
                  type="button"
                  class="orders-action"
                  title="چاپ فیش جمع‌آوری"
                  aria-label="چاپ فیش"
                  @click="printOrderSlip(order.id)"
                >
                  <AppIcon name="lucide:printer" size="sm" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!orders.length" message="سفارشی یافت نشد" class="py-10" />
    </div>

    <AppPagination
      v-if="!loading && pagination && pagination.totalPages > 1"
      :pagination="pagination"
      compact
      class="mt-6"
      @update:page="goToPage"
    />

    <!-- Order detail modal -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
      @click.self="closeOrder"
    >
      <div class="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div class="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-bold text-lg truncate" dir="ltr">{{ selectedOrder.orderNumber }}</h2>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <OrderPaymentBadge :order="selectedOrder" />
              <OrderStatusBadge :status="selectedOrder.status" />
            </div>
          </div>
          <button
            type="button"
            class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="چاپ فیش جمع‌آوری"
            @click="printOrderSlip(selectedOrder.id)"
          >
            <AppIcon name="lucide:printer" size="lg" />
          </button>
          <button
            type="button"
            class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="بستن"
            @click="closeOrder"
          >
            <AppIcon name="lucide:x" size="lg" />
          </button>
        </div>

        <div class="p-4 space-y-2 text-sm">
          <div
            class="rounded-xl border p-3"
            :class="{
              'border-emerald-200 bg-emerald-50/70': getOrderPaymentUi(selectedOrder) === 'paid',
              'border-orange-200 bg-orange-50/70': getOrderPaymentUi(selectedOrder) === 'pending',
              'border-red-200 bg-red-50/70': getOrderPaymentUi(selectedOrder) === 'failed',
              'border-slate-200 bg-slate-50': getOrderPaymentUi(selectedOrder) === 'cod',
            }"
          >
            <p class="text-xs text-gray-500 mb-1">وضعیت پول</p>
            <div class="flex flex-wrap items-center gap-2">
              <OrderPaymentBadge :order="selectedOrder" />
              <span class="text-sm text-gray-700">{{ paymentMethodLabel(selectedOrder) }}</span>
            </div>
            <p v-if="paymentDetailLine(selectedOrder)" class="mt-1 text-xs text-gray-500" dir="ltr">
              {{ paymentDetailLine(selectedOrder) }}
            </p>
            <p v-if="getOrderPaymentUi(selectedOrder) === 'pending'" class="mt-2 text-xs text-orange-800 leading-5">
              مشتری هنوز پرداخت را کامل نکرده. تا وقتی پرداخت تأیید نشود بسته‌بندی/ارسال نکنید.
              اگر مطمئنید پول آمده، وضعیت را به «سفارش جدید» بزنید.
            </p>
          </div>

          <p><span class="text-gray-500">مشتری:</span> {{ selectedOrder.customerName }}</p>
          <p dir="ltr"><span class="text-gray-500">موبایل:</span> {{ selectedOrder.customerPhone }}</p>
          <div>
            <p class="text-gray-500 mb-1">آدرس تحویل:</p>
            <p v-if="selectedOrder.addressTitle" class="font-medium text-gray-800">{{ selectedOrder.addressTitle }}</p>
            <p class="leading-relaxed">{{ selectedOrder.deliveryAddress }}</p>
          </div>
          <p v-if="selectedOrder.couponCode"><span class="text-gray-500">کد تخفیف:</span> {{ selectedOrder.couponCode }}</p>

          <div class="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
            <p class="text-xs text-gray-500 mb-0.5">نوع ارسال</p>
            <p class="font-bold text-primary-800">{{ deliveryLabel(selectedOrder) }}</p>
            <p
              v-if="selectedOrder.paymentDetails?.deliveryFee != null"
              class="text-xs text-gray-600 mt-1"
            >
              هزینه ارسال: {{ formatPrice(Number(selectedOrder.paymentDetails.deliveryFee)) }}
            </p>
          </div>

          <p v-if="selectedOrder.discountAmount">
            <span class="text-gray-500">تخفیف:</span> {{ formatPrice(selectedOrder.discountAmount) }}
          </p>
          <p class="font-bold text-base pt-2">{{ formatPrice(selectedOrder.totalPrice) }}</p>
        </div>

        <div v-if="selectedOrder.items?.length" class="px-4 pb-4 border-t pt-4">
          <p class="text-sm font-medium mb-2">اقلام</p>
          <div class="space-y-2">
            <div
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-2"
            >
              <img
                :src="getProductImage(item.product?.image ?? null)"
                :alt="item.name"
                class="h-14 w-14 shrink-0 rounded-lg object-cover bg-white border border-gray-100"
                loading="lazy"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-800 leading-snug">{{ item.name }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  تعداد: {{ item.quantity }}
                  <template v-if="item.product?.barcode">
                    · کد
                    <span class="font-semibold text-primary-700" dir="ltr">{{ item.product.barcode }}</span>
                  </template>
                </p>
              </div>
              <span class="shrink-0 text-sm font-bold text-gray-800">
                {{ formatPrice(item.subtotal || item.price * item.quantity) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="nextStatuses(selectedOrder.status).length" class="px-4 pb-4 border-t pt-4">
          <AppAlertBanner :message="statusError" class="mb-3" />

          <label class="block text-sm font-medium mb-2">یادداشت برای مشتری (اختیاری)</label>
          <textarea v-model="statusNote" rows="2" class="input-field text-sm resize-none mb-3" placeholder="مثلاً: پیک تا ۳۰ دقیقه دیگر می‌رسد" />

          <p class="text-sm font-medium mb-2">تغییر وضعیت</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="status in nextStatuses(selectedOrder.status)"
              :key="status"
              class="btn-primary text-sm"
              @click="updateStatus(selectedOrder!.id, status)"
            >
              {{ STATUS_ACTION_LABELS[status] || ORDER_STATUS_LABELS[status] }}
            </button>
          </div>
          <p v-for="status in nextStatuses(selectedOrder.status)" :key="`hint-${status}`" class="text-xs text-gray-400 mt-2">
            {{ STATUS_HINTS[status] }}
          </p>
        </div>

        <div class="px-4 pb-4 flex flex-col gap-2">
          <button
            class="btn-secondary w-full text-sm"
            @click="printOrderSlip(selectedOrder.id)"
          >
            چاپ فیش جمع‌آوری
          </button>
          <button
            v-if="selectedOrder.status === 'PREPARING' || selectedOrder.status === 'SHIPPED'"
            class="btn-secondary w-full text-sm"
            @click="sendOrderSms(selectedOrder.id)"
          >
            ارسال دوباره پیامک وضعیت
          </button>
        </div>

        <div v-if="selectedOrder.statusLogs?.length" class="px-4 pb-6 border-t pt-4">
          <p class="text-sm font-medium mb-2">تاریخچه</p>
          <div v-for="log in selectedOrder.statusLogs" :key="log.id" class="text-xs text-gray-500 py-1 border-b border-gray-50 last:border-0">
            {{ ORDER_STATUS_LABELS[log.status] }} — {{ formatDate(log.createdAt) }}
            <span v-if="log.note" class="block text-gray-400">{{ log.note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.35);
}

.orders-table {
  width: 100%;
  min-width: 960px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.orders-table th,
.orders-table td {
  text-align: start;
  vertical-align: middle;
  padding: 0.95rem 1rem;
}

.orders-table thead th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  border-bottom: 1px solid #e2e8f0;
}

.orders-table tbody td {
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.orders-table tbody tr:last-child td {
  border-bottom: 0;
}

.orders-table__row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.orders-table__row:hover td {
  background: #f8fafc;
}

.orders-table__actions-col {
  width: 1%;
  white-space: nowrap;
}

.orders-cell {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.orders-cell--badges {
  justify-items: start;
}

.orders-cell__primary {
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.orders-cell__clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 16rem;
  font-weight: 600;
}

.orders-cell__meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.4;
}

.orders-cell__code {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border-radius: 0.35rem;
  padding: 0.1rem 0.35rem;
}

.orders-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
}

.orders-amount {
  display: inline-block;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.orders-ship {
  display: inline-flex;
  max-width: 8.5rem;
  align-items: center;
  border-radius: 0.55rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.3rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  line-height: 1.35;
}

.orders-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.orders-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  min-width: 2rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.55rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.orders-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.orders-action--primary {
  padding-inline: 0.7rem;
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
}

.orders-action--primary:hover {
  background: #1e293b;
  border-color: #1e293b;
  color: #fff;
}
</style>
