<script setup lang="ts">
const route = useRoute();
const api = useApi();
const { toPersianDigits } = useFormat();

const unreadCount = ref(0);

const navItems = [
  { to: '/profile', label: 'حساب من', icon: 'lucide:user', exact: true },
  { to: '/profile/orders', label: 'سفارش‌ها', icon: 'lucide:package' },
  { to: '/profile/favorites', label: 'علاقه‌مندی', icon: 'lucide:bookmark' },
  { to: '/profile/notifications', label: 'اعلان‌ها', icon: 'lucide:bell', badge: true },
  { to: '/profile/addresses', label: 'آدرس‌ها', icon: 'lucide:map-pin' },
  { to: '/profile/edit', label: 'اطلاعات', icon: 'lucide:user-cog' },
];

function isActive(item: (typeof navItems)[0]) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

async function refreshUnread() {
  try {
    const { data } = await api.get<{ unreadCount: number }>('/notifications');
    unreadCount.value = data.unreadCount ?? 0;
  } catch {
    // ignore
  }
}

onMounted(refreshUnread);
watch(() => route.path, refreshUnread);
</script>

<template>
  <nav class="profile-subnav" aria-label="بخش‌های حساب کاربری">
    <div class="profile-subnav__inner">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="profile-subnav__link"
        :class="{ 'is-active': isActive(item) }"
      >
        <AppIcon :name="item.icon" size="sm" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge && unreadCount > 0"
          class="profile-subnav__badge"
        >
          {{ unreadCount > 9 ? '۹+' : toPersianDigits(unreadCount) }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.profile-subnav {
  position: sticky;
  top: 3.5rem;
  z-index: 40;
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(248, 250, 252, 0.88);
  backdrop-filter: blur(12px);
}

@media (min-width: 768px) {
  .profile-subnav {
    top: 4rem;
  }
}

.profile-subnav__inner {
  display: flex;
  gap: 0.15rem;
  max-width: 44rem;
  margin-inline: auto;
  padding: 0.55rem 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.profile-subnav__inner::-webkit-scrollbar {
  display: none;
}

.profile-subnav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.55rem 0.85rem;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.profile-subnav__link:hover {
  color: #0f172a;
}

.profile-subnav__link.is-active {
  color: #0f172a;
  border-bottom-color: #dc2626;
}

.profile-subnav__badge {
  display: inline-flex;
  min-width: 1.15rem;
  height: 1.15rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  background: #dc2626;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
}
</style>
