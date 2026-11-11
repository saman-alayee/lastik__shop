<script setup lang="ts">
import type { Order } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';
import { tirePackLabel } from '~/utils/tire';

const route = useRoute();
const api = useApi();
const authStore = useAuthStore();
const { formatPrice, toPersianDigits } = useFormat();

const orderNumber = computed(() => String(route.query.number || ''));
const paid = ref<boolean | null>(null);
const checking = ref(true);
const order = ref<Order | null>(null);

const isTireStore = STORE_MODE === 'tire';

const statusTone = computed(() => {
  if (checking.value) return 'pending';
  if (paid.value === false) return 'failed';
  return 'success';
});

const title = computed(() => {
  if (checking.value) return 'در حال تأیید پرداخت';
  if (paid.value === false) return 'پرداخت انجام نشد';
  return 'سفارش شما ثبت شد';
});

const lead = computed(() => {
  if (checking.value) return 'لطفاً چند لحظه صبر کنید؛ وضعیت پرداخت از درگاه بررسی می‌شود.';
  if (paid.value === false) {
    return 'پرداخت زیبال ناموفق بود و سفارش لغو شد. اگر مبلغی کم شده باشد معمولاً به حساب برمی‌گردد. می‌توانید دوباره از سبد اقدام کنید.';
  }
  return 'از خرید شما متشکریم. سفارش در صف آماده‌سازی است و می‌توانید وضعیت ارسال را از پنل پیگیری کنید.';
});

const ringCount = computed(() =>
  (order.value?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
);

const packSummary = computed(() => {
  if (!isTireStore || !order.value?.items?.length) return '';
  const packs = [...new Set(order.value.items.map((item) => tirePackLabel(item.quantity)))];
  return packs.join(' · ');
});

onMounted(async () => {
  authStore.init();
  if (!orderNumber.value) {
    paid.value = false;
    checking.value = false;
    return;
  }
  try {
    const { data } = await api.get<Order>(`/orders/track/${encodeURIComponent(orderNumber.value)}`);
    order.value = data;
    paid.value = data.status !== 'CANCELLED' && data.status !== 'REVIEWING';
  } catch {
    paid.value = route.query.paid === '1';
  }
  checking.value = false;
});

useHead({
  title: () => `${title.value} - ${SITE_NAME}`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<template>
  <div class="result-page">
    <div class="result-shell" :data-tone="statusTone">
      <div class="result-glow" aria-hidden="true" />
      <div class="result-dots" aria-hidden="true" />

      <div class="result-mark">
        <span class="result-mark__ring" />
        <span class="result-mark__icon">
          <AppIcon
            v-if="checking"
            name="lucide:loader-2"
            size="xl"
            class="result-mark__spin"
          />
          <AppIcon
            v-else-if="paid === false"
            name="lucide:circle-x"
            size="xl"
          />
          <AppIcon
            v-else
            name="lucide:circle-check"
            size="xl"
          />
        </span>
      </div>

      <p class="result-eyebrow">
        <template v-if="checking">درگاه زیبال</template>
        <template v-else-if="paid === false">پرداخت ناموفق</template>
        <template v-else>پرداخت موفق</template>
      </p>
      <h1 class="result-title">{{ title }}</h1>
      <p class="result-lead">{{ lead }}</p>

      <div v-if="orderNumber" class="result-ticket">
        <div class="result-ticket__row">
          <span>شماره سفارش</span>
          <strong dir="ltr">{{ orderNumber }}</strong>
        </div>
        <div v-if="order && paid !== false" class="result-ticket__row">
          <span>مبلغ</span>
          <strong>{{ formatPrice(order.totalPrice) }}</strong>
        </div>
        <div v-if="isTireStore && paid !== false && packSummary" class="result-ticket__row">
          <span>نوع خرید</span>
          <strong>
            {{ packSummary }}
            <template v-if="ringCount"> · {{ toPersianDigits(ringCount) }} حلقه</template>
          </strong>
        </div>
      </div>

      <ul v-if="paid !== false && !checking" class="result-steps">
        <li>
          <span class="result-steps__n">۱</span>
          <span>سفارش در صف آماده‌سازی قرار گرفت</span>
        </li>
        <li>
          <span class="result-steps__n">۲</span>
          <span>پس از بسته‌بندی، ارسال می‌شود</span>
        </li>
        <li>
          <span class="result-steps__n">۳</span>
          <span>وضعیت را از «سفارش‌های من» ببینید</span>
        </li>
      </ul>

      <div class="result-actions">
        <template v-if="paid === false">
          <NuxtLink to="/checkout" class="result-btn result-btn--primary">تلاش دوباره برای پرداخت</NuxtLink>
          <NuxtLink to="/cart" class="result-btn result-btn--ghost">بازگشت به سبد</NuxtLink>
        </template>
        <template v-else-if="!checking">
          <NuxtLink
            v-if="order?.id"
            :to="`/profile/orders/${order.id}`"
            class="result-btn result-btn--primary"
          >
            پیگیری سفارش
          </NuxtLink>
          <NuxtLink to="/profile/orders" class="result-btn result-btn--ghost">سفارش‌های من</NuxtLink>
        </template>
        <NuxtLink to="/shop" class="result-btn result-btn--soft">ادامه خرید لاستیک</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-page {
  min-height: calc(100svh - 8rem);
  display: grid;
  place-items: center;
  padding: 1.25rem 1rem 6.5rem;
  background:
    radial-gradient(90% 60% at 50% 0%, rgba(220, 38, 38, 0.08), transparent 55%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.result-shell {
  position: relative;
  width: min(100%, 28rem);
  overflow: hidden;
  border-radius: 1.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.75rem 1.25rem 1.35rem;
  text-align: center;
  box-shadow: 0 24px 48px -32px rgba(15, 23, 42, 0.45);
}

.result-shell[data-tone='success'] {
  border-color: rgba(22, 163, 74, 0.22);
}

.result-shell[data-tone='failed'] {
  border-color: rgba(220, 38, 38, 0.28);
}

.result-shell[data-tone='pending'] {
  border-color: rgba(100, 116, 139, 0.25);
}

.result-glow {
  position: absolute;
  width: 16rem;
  height: 16rem;
  border-radius: 999px;
  top: -7rem;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.result-shell[data-tone='success'] .result-glow {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.22), transparent 70%);
}

.result-shell[data-tone='failed'] .result-glow {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.22), transparent 70%);
}

.result-shell[data-tone='pending'] .result-glow {
  background: radial-gradient(circle, rgba(100, 116, 139, 0.18), transparent 70%);
}

.result-dots {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: radial-gradient(rgba(15, 23, 42, 0.08) 0.7px, transparent 0.7px);
  background-size: 12px 12px;
  pointer-events: none;
}

.result-mark {
  position: relative;
  z-index: 1;
  width: 5.5rem;
  height: 5.5rem;
  margin: 0 auto 1rem;
}

.result-mark__ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  opacity: 0.2;
}

.result-shell[data-tone='success'] .result-mark__ring {
  background: #22c55e;
}

.result-shell[data-tone='failed'] .result-mark__ring {
  background: #ef4444;
}

.result-shell[data-tone='pending'] .result-mark__ring {
  background: #64748b;
}

.result-mark__icon {
  position: absolute;
  inset: 0.55rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
}

.result-shell[data-tone='success'] .result-mark__icon {
  background: linear-gradient(160deg, #22c55e, #15803d);
}

.result-shell[data-tone='failed'] .result-mark__icon {
  background: linear-gradient(160deg, #f87171, #b91c1c);
}

.result-shell[data-tone='pending'] .result-mark__icon {
  background: linear-gradient(160deg, #94a3b8, #475569);
}

.result-mark__spin {
  animation: result-spin 0.9s linear infinite;
}

@keyframes result-spin {
  to {
    transform: rotate(360deg);
  }
}

.result-eyebrow {
  position: relative;
  z-index: 1;
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.result-shell[data-tone='success'] .result-eyebrow {
  color: #15803d;
}

.result-shell[data-tone='failed'] .result-eyebrow {
  color: #dc2626;
}

.result-shell[data-tone='pending'] .result-eyebrow {
  color: #64748b;
}

.result-title {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.7rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.35;
}

.result-lead {
  position: relative;
  z-index: 1;
  margin: 0.65rem auto 0;
  max-width: 24rem;
  font-size: 0.88rem;
  line-height: 1.8;
  color: #64748b;
}

.result-ticket {
  position: relative;
  z-index: 1;
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  border-radius: 1.15rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  text-align: start;
}

.result-ticket__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  font-size: 0.82rem;
}

.result-ticket__row + .result-ticket__row {
  border-top: 1px solid #e2e8f0;
}

.result-ticket__row span {
  color: #64748b;
}

.result-ticket__row strong {
  color: #0f172a;
  font-weight: 800;
}

.result-steps {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 1.1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-align: start;
}

.result-steps li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.9rem;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  font-size: 0.78rem;
  color: #334155;
  font-weight: 600;
}

.result-steps__n {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.45rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 900;
  color: #fff;
  background: #0f172a;
}

.result-actions {
  position: relative;
  z-index: 1;
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.result-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3.1rem;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 0.92rem;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.result-btn:hover {
  transform: translateY(-1px);
}

.result-btn--primary {
  background: linear-gradient(160deg, #dc2626, #991b1b);
  color: #fff;
  box-shadow: 0 12px 24px -16px rgba(185, 28, 28, 0.8);
}

.result-btn--ghost {
  background: #fff;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.result-btn--soft {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}
</style>
