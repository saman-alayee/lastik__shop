<script setup lang="ts">
import { SITE_NAME, STORE_MODE } from '~/constants/site';

const route = useRoute();
const authStore = useAuthStore();
const api = useApi();
const { toPersianDigits } = useFormat();

const unreadCount = ref(0);
const isTireStore = STORE_MODE === 'tire';

const displayName = computed(() => authStore.fullName || 'حساب کاربری');
const phone = computed(() => toPersianDigits(authStore.user?.phone || ''));

const navItems = computed(() => {
  const items = [
    { to: '/profile', label: 'خلاصه فعالیت‌ها', icon: 'lucide:layout-dashboard', exact: true },
    { to: '/profile/orders', label: 'سفارش‌های من', icon: 'lucide:package' },
    {
      to: '/profile/favorites',
      label: isTireStore ? 'لیست علاقه‌مندی' : 'لیست‌های من',
      icon: 'lucide:bookmark',
    },
    { to: '/profile/notifications', label: 'اعلان‌ها', icon: 'lucide:bell', badge: true },
    { to: '/profile/addresses', label: 'آدرس‌ها', icon: 'lucide:map-pin' },
    { to: '/profile/edit', label: 'اطلاعات حساب', icon: 'lucide:user-cog' },
    { to: '/profile/password', label: 'رمز عبور', icon: 'lucide:key-round' },
  ];
  if (authStore.isAdmin) {
    items.push({ to: '/admin', label: 'پنل مدیریت', icon: 'lucide:shield-check' });
  }
  return items;
});

function isActive(item: { to: string; exact?: boolean }) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

async function refreshUnread() {
  if (!authStore.isLoggedIn) {
    unreadCount.value = 0;
    return;
  }
  try {
    const { data } = await api.get<{ unreadCount: number }>('/notifications');
    unreadCount.value = data.unreadCount ?? 0;
  } catch {
    // ignore
  }
}

onMounted(refreshUnread);
watch(() => route.path, refreshUnread);

function logout() {
  authStore.logout();
  void navigateTo('/');
}
</script>

<template>
  <aside class="psb">
    <div class="psb-card">
      <div class="psb-user">
        <div class="psb-user__text min-w-0">
          <p class="psb-user__name truncate">{{ displayName }}</p>
          <p class="psb-user__phone" dir="ltr">{{ phone }}</p>
        </div>
        <NuxtLink to="/profile/edit" class="psb-user__edit" aria-label="ویرایش اطلاعات">
          <AppIcon name="lucide:pencil" size="sm" />
        </NuxtLink>
      </div>

      <div v-if="authStore.isAdmin" class="psb-admin">
        <AppIcon name="lucide:shield-check" size="xs" />
        مدیر {{ SITE_NAME }}
      </div>
    </div>

    <nav class="psb-card psb-nav" aria-label="منوی حساب کاربری">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="psb-nav__item"
        :class="{ 'is-active': isActive(item) }"
      >
        <span class="psb-nav__rail" aria-hidden="true" />
        <AppIcon :name="item.icon" size="sm" class="psb-nav__icon" />
        <span class="psb-nav__label">{{ item.label }}</span>
        <span
          v-if="item.badge && unreadCount > 0"
          class="psb-nav__badge"
        >
          {{ unreadCount > 9 ? '۹+' : toPersianDigits(unreadCount) }}
        </span>
      </NuxtLink>

      <button type="button" class="psb-nav__item psb-nav__item--logout" @click="logout">
        <span class="psb-nav__rail" aria-hidden="true" />
        <AppIcon name="lucide:log-out" size="sm" class="psb-nav__icon" />
        <span class="psb-nav__label">خروج از حساب</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.psb {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.psb-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #fff;
  overflow: hidden;
}

.psb-user {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.95rem;
}

.psb-user__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.5;
}

.psb-user__phone {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.psb-user__edit {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: #2563eb;
  border-radius: 999px;
  transition: background-color 0.15s ease;
}

.psb-user__edit:hover {
  background: #eff6ff;
}

.psb-admin {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 1rem 0.9rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  background: #fff1f2;
  color: #be123c;
  font-size: 0.7rem;
  font-weight: 700;
}

.psb-nav {
  padding: 0.35rem 0;
}

.psb-nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 0;
  background: transparent;
  color: #374151;
  text-decoration: none;
  text-align: start;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.psb-nav__item:hover {
  background: #f9fafb;
  color: #111827;
}

.psb-nav__item.is-active {
  background: #fff;
  color: #111827;
  font-weight: 800;
}

.psb-nav__rail {
  position: absolute;
  inset-block: 0.55rem;
  inset-inline-start: 0;
  width: 3px;
  border-radius: 999px;
  background: transparent;
}

.psb-nav__item.is-active .psb-nav__rail {
  background: #e11d48;
}

.psb-nav__icon {
  flex-shrink: 0;
  color: #6b7280;
}

.psb-nav__item.is-active .psb-nav__icon {
  color: #e11d48;
}

.psb-nav__label {
  flex: 1;
  min-width: 0;
  font-size: 0.86rem;
  font-weight: 600;
}

.psb-nav__item.is-active .psb-nav__label {
  font-weight: 800;
}

.psb-nav__badge {
  display: inline-flex;
  min-width: 1.2rem;
  height: 1.2rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #e11d48;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
}

.psb-nav__item--logout {
  border-top: 1px solid #f3f4f6;
  color: #e11d48;
}

.psb-nav__item--logout .psb-nav__icon,
.psb-nav__item--logout .psb-nav__label {
  color: #e11d48;
}
</style>
