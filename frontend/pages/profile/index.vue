<script setup lang="ts">
import { SITE_NAME, STORE_MODE } from '~/constants/site';

definePageMeta({ layout: 'profile', middleware: 'auth' });

const authStore = useAuthStore();
const api = useApi();
const { toPersianDigits, formatNumber } = useFormat();

const isTireStore = STORE_MODE === 'tire';
const stats = ref({ orders: 0, unread: 0, addresses: 0 });
const loading = ref(true);

const menuItems = [
  {
    to: '/profile/orders',
    label: 'سفارش‌های من',
    desc: isTireStore ? 'پیگیری تکی، جفت و دو جفت' : 'پیگیری وضعیت خریدها',
    icon: 'lucide:package',
  },
  {
    to: '/profile/favorites',
    label: 'علاقه‌مندی‌ها',
    desc: 'محصولات ذخیره‌شده',
    icon: 'lucide:bookmark',
  },
  {
    to: '/profile/notifications',
    label: 'اعلان‌ها',
    desc: 'وضعیت ارسال و پیام‌ها',
    icon: 'lucide:bell',
    badge: true,
  },
  {
    to: '/profile/addresses',
    label: 'آدرس‌های من',
    desc: 'مدیریت آدرس تحویل',
    icon: 'lucide:map-pin',
  },
  {
    to: '/profile/edit',
    label: 'اطلاعات حساب',
    desc: 'نام و تنظیمات پروفایل',
    icon: 'lucide:user-cog',
  },
  {
    to: '/profile/password',
    label: 'رمز عبور',
    desc: 'تعیین یا تغییر رمز ورود',
    icon: 'lucide:key-round',
  },
];

const packGuide = [
  { key: 'single', label: 'تکی', detail: '۱ حلقه', icon: '1' },
  { key: 'pair', label: 'جفت', detail: '۲ حلقه', icon: '2' },
  { key: 'set', label: 'دو جفت', detail: '۴ حلقه', icon: '4' },
];

const initials = computed(() => {
  const u = authStore.user;
  if (u?.firstName && u?.lastName) {
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`;
  }
  if (u?.firstName) return u.firstName.slice(0, 2);
  return u?.phone?.slice(-2) || '؟';
});

const displayName = computed(() => authStore.fullName || 'حساب کاربری');

onMounted(async () => {
  loading.value = true;
  try {
    const [ordersRes, notifRes, addrRes] = await Promise.all([
      api.get<{ pagination: { total: number } }>('/orders?limit=1'),
      api.get<{ unreadCount: number }>('/notifications'),
      api.get<unknown[]>('/addresses'),
    ]);
    stats.value = {
      orders: ordersRes.data.pagination?.total ?? 0,
      unread: notifRes.data.unreadCount ?? 0,
      addresses: Array.isArray(addrRes.data) ? addrRes.data.length : 0,
    };
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
});

useHead({ title: `حساب کاربری - ${SITE_NAME}` });
</script>

<template>
  <div class="profile-home">
    <section class="profile-hero">
      <div class="profile-hero__glow" aria-hidden="true" />
      <div class="profile-hero__grid" aria-hidden="true" />

      <div class="profile-hero__top">
        <div class="profile-hero__avatar">{{ initials }}</div>
        <div class="profile-hero__who min-w-0">
          <p class="profile-hero__eyebrow">حساب کاربری</p>
          <h1 class="profile-hero__name truncate">{{ displayName }}</h1>
          <p class="profile-hero__phone" dir="ltr">{{ toPersianDigits(authStore.user?.phone || '') }}</p>
          <span v-if="authStore.isAdmin" class="profile-hero__badge">مدیر سیستم</span>
        </div>
      </div>

      <div v-if="!loading" class="profile-stats">
        <NuxtLink to="/profile/orders" class="profile-stat">
          <strong>{{ formatNumber(stats.orders) }}</strong>
          <span>سفارش</span>
        </NuxtLink>
        <NuxtLink to="/profile/notifications" class="profile-stat">
          <strong>{{ formatNumber(stats.unread) }}</strong>
          <span>اعلان</span>
        </NuxtLink>
        <NuxtLink to="/profile/addresses" class="profile-stat">
          <strong>{{ formatNumber(stats.addresses) }}</strong>
          <span>آدرس</span>
        </NuxtLink>
      </div>
    </section>

    <section v-if="isTireStore" class="pack-guide" aria-label="راهنمای خرید لاستیک">
      <div class="pack-guide__head">
        <h2>واحد خرید لاستیک</h2>
        <p>سفارش‌ها بر اساس تعداد حلقه ثبت می‌شوند</p>
      </div>
      <ul class="pack-guide__list">
        <li v-for="pack in packGuide" :key="pack.key" class="pack-guide__item">
          <span class="pack-guide__count" aria-hidden="true">{{ pack.icon }}</span>
          <span class="pack-guide__label">{{ pack.label }}</span>
          <span class="pack-guide__detail">{{ pack.detail }}</span>
        </li>
      </ul>
    </section>

    <section class="profile-nav">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="profile-nav__item group"
      >
        <span class="profile-nav__icon">
          <AppIcon :name="item.icon" size="md" />
        </span>
        <span class="profile-nav__copy min-w-0">
          <span class="profile-nav__label">
            {{ item.label }}
            <span
              v-if="item.badge && stats.unread > 0"
              class="profile-nav__badge"
            >{{ toPersianDigits(stats.unread) }}</span>
          </span>
          <span class="profile-nav__desc">{{ item.desc }}</span>
        </span>
        <AppIcon name="lucide:chevron-left" size="sm" class="profile-nav__chevron" />
      </NuxtLink>

      <NuxtLink
        v-if="authStore.isAdmin"
        to="/admin"
        class="profile-nav__item profile-nav__item--admin"
      >
        <span class="profile-nav__icon profile-nav__icon--admin">
          <AppIcon name="lucide:layout-dashboard" size="md" />
        </span>
        <span class="profile-nav__copy">
          <span class="profile-nav__label">پنل مدیریت</span>
          <span class="profile-nav__desc">مدیریت فروشگاه</span>
        </span>
        <AppIcon name="lucide:chevron-left" size="sm" class="profile-nav__chevron" />
      </NuxtLink>
    </section>

    <footer class="profile-foot">
      <NuxtLink to="/pages/terms" class="profile-foot__link">
        <AppIcon name="lucide:file-text" size="sm" />
        قوانین و مقررات
      </NuxtLink>
      <button
        type="button"
        class="profile-foot__logout"
        @click="authStore.logout(); navigateTo('/')"
      >
        <AppIcon name="lucide:log-out" size="sm" />
        خروج از حساب
      </button>
    </footer>
  </div>
</template>

<style scoped>
.profile-home {
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --red: #dc2626;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-bottom: 1.5rem;
}

.profile-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.6rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(145deg, #0f172a 0%, #1e293b 48%, #334155 100%);
  color: #fff;
  padding: 1.35rem 1.2rem 1.2rem;
  box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.7);
}

.profile-hero__glow {
  position: absolute;
  width: 14rem;
  height: 14rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(220, 38, 38, 0.35), transparent 70%);
  top: -5rem;
  inset-inline-end: -4rem;
  pointer-events: none;
}

.profile-hero__grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 0.7px, transparent 0.7px);
  background-size: 12px 12px;
  pointer-events: none;
}

.profile-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.profile-hero__avatar {
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 1.25rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 1.15rem;
  font-weight: 800;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
}

.profile-hero__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #fca5a5;
}

.profile-hero__name {
  margin: 0.15rem 0 0;
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1.35;
}

.profile-hero__phone {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.85);
}

.profile-hero__badge {
  display: inline-flex;
  margin-top: 0.45rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  background: rgba(220, 38, 38, 0.25);
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.profile-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 1.15rem;
}

.profile-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.7rem 0.4rem;
  border-radius: 1rem;
  text-decoration: none;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 180ms ease, transform 180ms ease;
}

.profile-stat:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.profile-stat strong {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1;
}

.profile-stat span {
  font-size: 0.68rem;
  color: rgba(226, 232, 240, 0.8);
}

.pack-guide {
  border-radius: 1.35rem;
  border: 1px solid var(--line);
  background:
    radial-gradient(90% 80% at 100% 0%, rgba(220, 38, 38, 0.06), transparent 55%),
    #fff;
  padding: 1rem 1rem 0.95rem;
}

.pack-guide__head h2 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--ink);
}

.pack-guide__head p {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--muted);
}

.pack-guide__list {
  list-style: none;
  margin: 0.85rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.pack-guide__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.7rem 0.35rem;
  border-radius: 1rem;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  text-align: center;
}

.pack-guide__count {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 0.55rem;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(160deg, #dc2626, #991b1b);
}

.pack-guide__label {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--ink);
}

.pack-guide__detail {
  font-size: 0.68rem;
  color: var(--muted);
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.profile-nav__item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 0.95rem;
  border-radius: 1.2rem;
  border: 1px solid var(--line);
  background: #fff;
  text-decoration: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.profile-nav__item:hover {
  transform: translateY(-1px);
  border-color: rgba(220, 38, 38, 0.28);
  box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.35);
}

.profile-nav__item--admin {
  background: linear-gradient(180deg, #fff, #fff5f5);
  border-color: rgba(220, 38, 38, 0.2);
}

.profile-nav__icon {
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 0.95rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.profile-nav__icon--admin {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fecaca;
}

.profile-nav__label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--ink);
}

.profile-nav__desc {
  display: block;
  margin-top: 0.12rem;
  font-size: 0.72rem;
  color: var(--muted);
}

.profile-nav__badge {
  display: inline-flex;
  min-width: 1.15rem;
  justify-content: center;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  color: #fff;
  background: var(--red);
}

.profile-nav__chevron {
  margin-inline-start: auto;
  color: #cbd5e1;
  transition: color 160ms ease, transform 160ms ease;
}

.profile-nav__item:hover .profile-nav__chevron {
  color: var(--red);
  transform: translateX(-2px);
}

.profile-foot {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.25rem 0.15rem 0;
}

.profile-foot__link,
.profile-foot__logout {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  width: fit-content;
}

.profile-foot__link {
  color: var(--muted);
  text-decoration: none;
}

.profile-foot__link:hover {
  color: var(--ink);
}

.profile-foot__logout {
  color: #ef4444;
}

.profile-foot__logout:hover {
  color: #b91c1c;
}
</style>
