<script setup lang="ts">
import { SITE_NAME } from '~/constants/site';

const authStore = useAuthStore();
const route = useRoute();

const mode = ref<'password' | 'otp'>('password');
const step = ref<'phone' | 'otp'>('phone');
const phone = ref('');
const otp = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');

const redirect = computed(() => (route.query.redirect as string) || '/admin');
const loginError = computed(() => route.query.error as string);

async function afterLogin() {
  await authStore.fetchProfile().catch(() => undefined);
  await nextTick();

  if (!authStore.isAdmin) {
    error.value = 'این حساب دسترسی ادمین ندارد';
    authStore.logout();
    return;
  }

  const raw = redirect.value || '/admin';
  const target = raw.startsWith('/admin') && !raw.startsWith('//') ? raw : '/admin';
  await navigateTo(target, { replace: true });
}

async function sendOtp() {
  error.value = '';
  try {
    await authStore.sendOtp(phone.value);
    step.value = 'otp';
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'خطا در ارسال کد';
  }
}

async function verifyOtp() {
  error.value = '';
  try {
    await authStore.verifyAdminOtp(phone.value, otp.value);
    await afterLogin();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'کد نامعتبر است';
  }
}

async function loginWithPassword() {
  error.value = '';
  try {
    await authStore.loginAdminWithPassword(phone.value, password.value);
    await afterLogin();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'ورود ناموفق بود';
  }
}

function switchMode(next: 'password' | 'otp') {
  mode.value = next;
  step.value = 'phone';
  error.value = '';
  otp.value = '';
  password.value = '';
  showPassword.value = false;
}

useHead({
  title: `ورود ادمین - ${SITE_NAME}`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
definePageMeta({ layout: false });
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.25),transparent_55%)]" />
    <div class="admin-login-card relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl md:p-8">
      <div class="mb-6 text-center">
        <img src="/logo.svg" alt="" class="mx-auto h-14 w-14" width="56" height="56" />
        <h1 class="mt-3 text-xl font-black text-slate-900">ورود پنل مدیریت</h1>
        <p class="mt-1 text-sm text-slate-500">{{ SITE_NAME }} · فقط مدیران سیستم</p>
      </div>

      <div
        v-if="loginError === 'not-admin'"
        class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600"
      >
        حساب شما دسترسی پنل ادمین ندارد.
      </div>

      <div class="admin-tabs mb-6">
        <button
          type="button"
          class="admin-tab flex-1 justify-center"
          :class="{ 'is-active': mode === 'password' }"
          @click="switchMode('password')"
        >
          رمز عبور
        </button>
        <button
          type="button"
          class="admin-tab flex-1 justify-center"
          :class="{ 'is-active': mode === 'otp' }"
          @click="switchMode('otp')"
        >
          پیامک
        </button>
      </div>

      <form v-if="mode === 'password'" class="space-y-4" @submit.prevent="loginWithPassword">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">شماره موبایل</label>
          <input v-model="phone" type="tel" required class="input-field" placeholder="09120000000" dir="ltr" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">رمز عبور</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="4"
              class="input-field w-full !pl-10"
              placeholder="رمز عبور ادمین"
              dir="ltr"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700"
              @click="showPassword = !showPassword"
            >
              <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-5 w-5" />
            </button>
          </div>
        </div>
        <div v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
        <button type="submit" class="btn-primary w-full" :disabled="authStore.loading">
          {{ authStore.loading ? 'در حال ورود...' : 'ورود به پنل' }}
        </button>
      </form>

      <template v-else>
        <form v-if="step === 'phone'" class="space-y-4" @submit.prevent="sendOtp">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">شماره موبایل ادمین</label>
            <input v-model="phone" type="tel" required class="input-field" placeholder="09120000000" dir="ltr" />
          </div>
          <div v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
          <button type="submit" class="btn-primary w-full" :disabled="authStore.loading">
            {{ authStore.loading ? 'در حال ارسال...' : 'دریافت کد' }}
          </button>
        </form>

        <form v-else class="space-y-4" @submit.prevent="verifyOtp">
          <p class="text-sm text-slate-500">
            کد تأیید ارسال شد
            <button type="button" class="ms-1 text-red-600" @click="step = 'phone'">تغییر شماره</button>
          </p>
          <input
            v-model="otp"
            type="text"
            required
            maxlength="6"
            inputmode="numeric"
            class="input-field text-center text-2xl tracking-widest"
            placeholder="------"
            dir="ltr"
            autofocus
          />
          <div v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
          <button type="submit" class="btn-primary w-full" :disabled="authStore.loading">
            {{ authStore.loading ? 'در حال بررسی...' : 'ورود به پنل' }}
          </button>
        </form>
      </template>

      <NuxtLink to="/" class="mt-6 block text-center text-sm text-slate-500 hover:text-slate-800">
        بازگشت به فروشگاه
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.admin-login-card :deep(.input-field) {
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #fff;
  padding: 0.7rem 0.85rem;
  box-shadow: none;
}
.admin-login-card :deep(.input-field:focus) {
  border-color: #fca5a5;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
.admin-login-card :deep(.btn-primary) {
  background: #dc2626;
}
.admin-login-card :deep(.btn-primary:hover) {
  background: #b91c1c;
}
</style>
