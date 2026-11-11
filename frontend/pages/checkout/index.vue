<script setup lang="ts">
import type { Address } from '~/types';
import { normalizePhoneInput } from '~/utils/normalize';
import { splitCustomerName, validateCustomerName } from '~/utils/customerName';
import { SITE_NAME } from '~/constants/site';
import { type ShippingMethod } from '~/constants/shipping';
import { useOrdersStore } from '~/stores/orders';

const route = useRoute();
const cartStore = useCartStore();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();
const api = useApi();
const toast = useToast();
const { formatPrice } = useFormat();
const { shippingOptions, feeFor, loadShippingSettings } = useShippingSettings();
const manualAddress = useAddressFields();
const { street, plaque, unit, province, city, postalCode, cityOptions, errors: addressErrors, validate: validateAddress, payload: manualPayload, loadFromAddress } = manualAddress;

const form = reactive({
  customerName: '',
  customerPhone: '',
  notes: '',
  deliveryMethod: 'NATIONWIDE' as ShippingMethod,
});
const { applied, discountAmount, refresh } = useCoupon();

const loading = ref(false);
const error = ref('');
const nameError = ref('');
const phoneError = ref('');
const addressesLoading = ref(false);

const displayDiscount = computed(() => discountAmount.value);
const deliveryFee = computed(() => feeFor(form.deliveryMethod));
const displayTotal = computed(() => Math.max(0, cartStore.totalPrice - displayDiscount.value) + deliveryFee.value);

function scrollToFirstError() {
  nextTick(() => {
    document.querySelector('[data-field-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

onMounted(async () => {
  void loadShippingSettings();
  if (route.query.payment === 'failed') {
    error.value = 'پرداخت زیبال انجام نشد. اگر مبلغی کم شده باشد به حساب برمی‌گردد. می‌توانید دوباره پرداخت کنید.';
  }

  authStore.init();
  if (!authStore.isLoggedIn) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent('/checkout')}`);
    return;
  }

  await cartStore.fetchCart();
  if (cartStore.isEmpty && route.query.payment !== 'failed') {
    await navigateTo('/cart');
    return;
  }

  await authStore.fetchProfile().catch(() => undefined);
  if (authStore.user) {
    // فقط اگر قبلاً اسم واقعی ثبت شده؛ شماره را جای نام نگذار
    form.customerName = authStore.fullName || '';
    form.customerPhone = authStore.user.phone;
  }
  await loadAddresses();
  await refresh(cartStore.totalPrice, form.customerPhone);
});

watch(
  () => cartStore.totalPrice,
  (subtotal) => {
    void refresh(subtotal, form.customerPhone);
  }
);

async function loadAddresses() {
  addressesLoading.value = true;
  try {
    const { data } = await api.get<Address[]>('/addresses');
    const saved = data.find((item) => item.isDefault) || data[0];
    if (saved) loadFromAddress(saved);
  } catch {
    // مشخصات را خود کاربر وارد می‌کند
  } finally {
    addressesLoading.value = false;
  }
}

async function submitOrder() {
  error.value = '';
  nameError.value = '';
  phoneError.value = '';

  const problems: string[] = [];
  const phone = normalizePhoneInput(form.customerPhone);
  form.customerPhone = phone;
  const nameProblem = validateCustomerName(form.customerName, phone);
  if (nameProblem) {
    nameError.value = nameProblem;
    problems.push(nameProblem);
  }
  if (!/^09\d{9}$/.test(phone)) {
    phoneError.value = phone
      ? `موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد؛ الان ${phone.length.toLocaleString('fa-IR')} رقم است`
      : 'شماره موبایل را وارد کنید';
    problems.push(phoneError.value);
  }

  if (!validateAddress()) {
    problems.push(
      ...[addressErrors.province, addressErrors.city, addressErrors.street, addressErrors.plaque, addressErrors.unit, addressErrors.postalCode].filter(
        (item): item is string => Boolean(item)
      )
    );
  }

  if (problems.length) {
    error.value = problems.join('\n');
    toast.error(problems[0]);
    scrollToFirstError();
    return;
  }

  loading.value = true;
  try {
    const customerName = form.customerName.replace(/\s+/g, ' ').trim();
    form.customerName = customerName;
    const { firstName, lastName } = splitCustomerName(customerName);
    if (firstName) {
      await authStore.updateProfile({ firstName, lastName: lastName || undefined }).catch(() => undefined);
    }

    const payload = {
      customerName,
      customerPhone: form.customerPhone.trim(),
      notes: form.notes.trim() || undefined,
      couponCode: applied.value?.code || undefined,
      deliveryMethod: form.deliveryMethod,
      ...manualPayload(),
    };

    const { data } = await api.post<{ orderNumber: string; paymentUrl?: string }>('/orders', {
      ...payload,
      paymentMethod: 'ZIBAL',
    });
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
      return;
    }
    await cartStore.fetchCart();
    await ordersStore.fetchCount();
    navigateTo(`/orders/success?number=${data.orderNumber}`);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'خطا در ثبت سفارش';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

useHead({
  title: `ثبت سفارش - ${SITE_NAME}`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<template>
  <div class="checkout-page px-4 py-4 max-w-lg md:max-w-2xl mx-auto pb-44 md:pb-32">
    <header class="checkout-hero mb-4">
      <p class="checkout-hero__eyebrow">تسویه حساب</p>
      <h1 class="checkout-hero__title">ثبت سفارش</h1>
      <p class="checkout-hero__lead">
        بعد از پرداخت موفق، سفارش ثبت می‌شود و وضعیت آماده‌سازی را از پروفایل می‌بینید.
      </p>
    </header>

    <div
      v-if="route.query.payment === 'failed'"
      class="checkout-fail mb-4"
      role="alert"
    >
      <span class="checkout-fail__icon">
        <AppIcon name="lucide:circle-alert" size="md" />
      </span>
      <div class="min-w-0">
        <p class="checkout-fail__title">پرداخت ناموفق بود</p>
        <p class="checkout-fail__text">
          {{ error || 'پرداخت زیبال انجام نشد. اگر مبلغی کم شده باشد به حساب برمی‌گردد. می‌توانید دوباره پرداخت کنید.' }}
        </p>
      </div>
    </div>

    <div class="card p-4 mb-4 space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">{{ cartStore.totalItems }} کالا</span>
        <span>{{ formatPrice(cartStore.totalPrice) }}</span>
      </div>
      <div v-if="displayDiscount" class="flex justify-between text-sm text-green-600">
        <span>تخفیف</span><span>- {{ formatPrice(displayDiscount) }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span>هزینه ارسال</span><span>{{ formatPrice(deliveryFee) }}</span>
      </div>
      <CouponCodeField class="pt-2" :subtotal="cartStore.totalPrice" :phone="form.customerPhone" />
      <div class="flex justify-between pt-2 border-t font-bold">
        <span>مبلغ قابل پرداخت</span>
        <span class="text-lg">{{ formatPrice(displayTotal) }}</span>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="submitOrder">
      <div :data-field-error="nameError ? 'true' : undefined">
        <label class="field-label">
          نام و نام خانوادگی
          <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.customerName"
          type="text"
          required
          autocomplete="name"
          class="input-field"
          :class="{ 'input-invalid': nameError }"
          placeholder="مثلاً: زهرا محمدی"
        />
        <p class="mt-1 text-xs text-gray-500">برای پیگیری سفارش، اسم کامل لازم است — شماره موبایل کافی نیست.</p>
        <AppFormError :message="nameError" />
      </div>
      <div>
        <label class="field-label">شماره موبایل</label>
        <input v-model="form.customerPhone" type="tel" required class="input-field" :class="{ 'input-invalid': phoneError }" dir="ltr" placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
        <AppFormError :message="phoneError" />
      </div>

      <div class="space-y-3">
        <LoadingSpinner :show="addressesLoading" />
        <AddressFields
          v-model:street="street"
          v-model:plaque="plaque"
          v-model:unit="unit"
          v-model:province="province"
          v-model:city="city"
          v-model:postal-code="postalCode"
          :city-options="cityOptions"
          :errors="addressErrors"
        />
      </div>

      <div class="space-y-1">
        <p class="field-label">هزینه ارسال</p>
        <p class="text-xs leading-6 text-gray-500">
          پس از پرداخت موفق، سفارش ثبت می‌شود و می‌توانید وضعیت آماده‌سازی و ارسال را از «سفارش‌های من» پیگیری کنید.
        </p>
        <label
          v-for="option in shippingOptions"
          :key="option.value"
          class="flex cursor-pointer items-center justify-between gap-4 border-b border-neutral-200 py-3"
        >
          <span>
            <span class="block text-sm text-neutral-900">{{ option.label }}</span>
            <span class="mt-0.5 block text-xs text-neutral-500">
              {{ option.hint }}<template v-if="option.fee"> — {{ formatPrice(option.fee) }}</template>
            </span>
          </span>
          <input v-model="form.deliveryMethod" type="radio" :value="option.value" />
        </label>
      </div>

      <div>
        <label class="field-label">توضیحات</label>
        <textarea v-model="form.notes" rows="2" class="input-field resize-none" />
      </div>

      <AppAlertBanner v-if="error && route.query.payment !== 'failed'" :message="error" />
    </form>

    <div class="fixed bottom-16 md:bottom-0 inset-x-0 z-[55] border-t bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
      <div v-if="error && route.query.payment !== 'failed'" class="mx-auto mb-2 max-w-lg md:max-w-2xl md:hidden">
        <AppAlertBanner :message="error" />
      </div>
      <div class="mx-auto max-w-lg md:max-w-2xl">
        <button type="button" class="btn-primary btn-action w-full" :disabled="loading" @click="submitOrder">
          {{ loading ? 'در حال اتصال به زیبال...' : `پرداخت با زیبال • ${formatPrice(displayTotal)}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-hero {
  border-radius: 1.35rem;
  border: 1px solid #e2e8f0;
  background:
    radial-gradient(90% 80% at 100% 0%, rgba(220, 38, 38, 0.08), transparent 55%),
    linear-gradient(180deg, #fff, #f8fafc);
  padding: 1rem 1.05rem 1.05rem;
}

.checkout-hero__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #dc2626;
}

.checkout-hero__title {
  margin: 0.25rem 0 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
}

.checkout-hero__lead {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  line-height: 1.7;
  color: #64748b;
}

.checkout-fail {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.95rem 1rem;
  border-radius: 1.2rem;
  border: 1px solid #fecaca;
  background: linear-gradient(180deg, #fff5f5, #fff);
}

.checkout-fail__icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #dc2626;
  background: #fee2e2;
}

.checkout-fail__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #991b1b;
}

.checkout-fail__text {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  line-height: 1.7;
  color: #7f1d1d;
}
</style>
