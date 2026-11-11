<script setup lang="ts">
import { SITE_NAME } from '~/constants/site';
import { normalizePhoneInput } from '~/utils/normalize';

const authStore = useAuthStore();
const route = useRoute();

type Step = 'phone' | 'otp';

const step = ref<Step>('phone');
const phone = ref('');
const otp = ref('');
const info = ref('');
const error = ref('');
const resendLeft = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;

const redirect = computed(() => (route.query.redirect as string) || '');
const maskedPhone = computed(() => {
  const digits = normalizePhoneInput(phone.value);
  if (digits.length < 11) return phone.value;
  return `${digits.slice(0, 4)}***${digits.slice(-4)}`;
});
const resendClock = computed(() => {
  const minutes = String(Math.floor(resendLeft.value / 60)).padStart(2, '0');
  const seconds = String(resendLeft.value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
});

function safeRedirectTarget(raw: string) {
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/profile';
  if (raw.startsWith('/admin')) return '/profile';
  return raw;
}

function clearResendTimer() {
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = null;
}

function startResendTimer() {
  clearResendTimer();
  resendLeft.value = 120;
  resendTimer = setInterval(() => {
    resendLeft.value -= 1;
    if (resendLeft.value <= 0) clearResendTimer();
  }, 1000);
}

onUnmounted(clearResendTimer);

onMounted(async () => {
  authStore.init();
  if (authStore.isLoggedIn) {
    await navigateTo(safeRedirectTarget(redirect.value || '/profile'), { replace: true });
  }
});

function isValidMobile(value: string) {
  return /^09\d{9}$/.test(normalizePhoneInput(value));
}

async function afterLogin() {
  await authStore.fetchProfile().catch(() => undefined);
  await nextTick();
  await navigateTo(safeRedirectTarget(redirect.value || '/profile'), { replace: true });
}

function goBack() {
  error.value = '';
  otp.value = '';
  step.value = 'phone';
  info.value = '';
}

async function sendCode() {
  error.value = '';
  if (!isValidMobile(phone.value)) {
    error.value = 'فقط شماره موبایل ۱۱ رقمی وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹)';
    return;
  }
  try {
    const result = await authStore.startAuth(phone.value, 'otp');
    info.value = result.message || '';
    otp.value = '';
    step.value = 'otp';
    startResendTimer();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'شماره موبایل نامعتبر است';
  }
}

async function submitCode() {
  if (authStore.loading || otp.value.length < 6) return;
  error.value = '';
  try {
    await authStore.verifyOtp(phone.value, otp.value);
    await afterLogin();
  } catch (e: unknown) {
    otp.value = '';
    error.value = e instanceof Error ? e.message : 'کد تایید نامعتبر است';
  }
}

async function resend() {
  if (resendLeft.value > 0) return;
  await sendCode();
}

watch(otp, (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits !== value) {
    otp.value = digits;
    return;
  }
  if (digits.length === 6 && step.value === 'otp') void submitCode();
});

useHead({
  title: `ورود | ثبت‌نام - ${SITE_NAME}`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
definePageMeta({ layout: false });
</script>

<template>
  <AuthAtelierFrame>
    <button
      v-if="step !== 'phone'"
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500"
      @click="goBack"
    >
      <AppIcon name="lucide:arrow-right" size="sm" />
      تغییر شماره
    </button>

    <form v-if="step === 'phone'" class="space-y-5" @submit.prevent="sendCode">
      <div>
        <p class="text-[11px] font-bold tracking-[0.18em] text-red-600">ورود فقط با پیامک</p>
        <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">شماره موبایل را بزنید</h1>
        <p class="mt-2 text-sm leading-7 text-slate-500">
          ورود و ثبت‌نام فقط با کد پیامک است؛ رمز عبور لازم نیست.
        </p>
      </div>

      <label class="block space-y-2">
        <span class="text-sm font-semibold text-slate-700">موبایل</span>
        <div class="gate-field" dir="ltr">
          <span class="gate-field__prefix">+98</span>
          <input
            v-model="phone"
            type="tel"
            name="tel"
            required
            class="gate-field__input"
            placeholder="۹۱۲۳۴۵۶۷۸۹"
            inputmode="tel"
            autocomplete="tel"
          />
        </div>
      </label>

      <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button type="submit" class="gate-cta" :disabled="authStore.loading">
        <span>{{ authStore.loading ? 'در حال ارسال...' : 'ادامه با پیامک' }}</span>
        <AppIcon v-if="!authStore.loading" name="lucide:chevron-left" size="sm" />
      </button>

      <p class="text-center text-xs leading-6 text-slate-400">
        ورود یعنی پذیرش
        <NuxtLink to="/pages/terms" class="font-semibold text-slate-700 underline-offset-2 hover:underline">
          شرایط و قوانین
        </NuxtLink>
      </p>
    </form>

    <form v-else class="space-y-5" @submit.prevent="submitCode">
      <div>
        <p class="text-[11px] font-bold tracking-[0.18em] text-red-600">تأیید هویت</p>
        <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900">کد پیامک</h1>
        <p class="mt-2 text-sm leading-7 text-slate-500">
          کد ۶ رقمی برای
          <span class="font-bold text-slate-800" dir="ltr">{{ maskedPhone }}</span>
          ارسال شد.
        </p>
        <p v-if="info" class="mt-1 text-xs text-slate-400">{{ info }}</p>
      </div>

      <label class="block space-y-2">
        <span class="text-sm font-semibold text-slate-700">کد تأیید</span>
        <input
          v-model="otp"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          class="gate-otp"
          placeholder="------"
          dir="ltr"
        />
      </label>

      <button
        type="button"
        class="text-sm text-slate-500 disabled:opacity-50"
        :disabled="resendLeft > 0 || authStore.loading"
        @click="resend"
      >
        <template v-if="resendLeft > 0">ارسال مجدد تا {{ resendClock }}</template>
        <template v-else>ارسال مجدد کد</template>
      </button>

      <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button type="submit" class="gate-cta" :disabled="authStore.loading || otp.length < 6">
        {{ authStore.loading ? 'در حال بررسی...' : 'ورود به حساب' }}
      </button>
    </form>
  </AuthAtelierFrame>
</template>

<style scoped>
.gate-field {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  border: 1.5px solid #cbd5e1;
  border-radius: 0.95rem;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.gate-field:focus-within {
  border-color: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
}

.gate-field__prefix {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 0.85rem;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
  border-right: 1px solid #e2e8f0;
}

.gate-field__input {
  width: 100%;
  min-height: 3.2rem;
  border: 0;
  outline: none;
  background: transparent;
  padding: 0 0.95rem;
  color: #0f172a;
  font-size: 1.05rem;
  letter-spacing: 0.04em;
}

.gate-otp {
  width: 100%;
  min-height: 3.6rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 0.95rem;
  background: #fff;
  color: #0f172a;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.5em;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.gate-otp:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
}

.gate-cta {
  display: inline-flex;
  width: 100%;
  min-height: 3.35rem;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 0.95rem;
  background: #0f172a;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  transition: background 0.2s ease, transform 0.15s ease;
}

.gate-cta:hover:not(:disabled) {
  background: #dc2626;
}

.gate-cta:active:not(:disabled) {
  transform: translateY(1px);
}

.gate-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
