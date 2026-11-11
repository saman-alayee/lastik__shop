<script setup lang="ts">
import { ADMIN_NAV_GROUPS, findAdminNavLabel } from '~/constants/adminNav';
import { SITE_NAME } from '~/constants/site';

const route = useRoute();
const authStore = useAuthStore();
const { navVisible, roleLabel, canAccessPath, role, isFullAdmin } = useAdminAccess();
const { pendingCount, latestAlert, dismissAlert, openOrders } = useNewOrderAlarm();

const mobileNavOpen = ref(false);

const pageTitle = computed(() => findAdminNavLabel(route.path));

const filteredGroups = computed(() => {
  return ADMIN_NAV_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.to === '/') return true;
      if (item.to === '/admin/admins') {
        if (!isFullAdmin.value) return false;
      } else if (!navVisible(item.to)) {
        return false;
      }
      return true;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
});

function isActive(item: { to: string; exact?: boolean }) {
  return item.exact
    ? route.path === item.to
    : route.path === item.to || route.path.startsWith(`${item.to}/`);
}

onMounted(() => {
  void authStore.fetchProfile().catch(() => undefined);
});

watch(role, () => {
  if (route.path.startsWith('/admin') && route.path !== '/admin/login' && !canAccessPath(route.path)) {
    void navigateTo('/admin');
  }
});

watch(
  () => route.path,
  () => {
    mobileNavOpen.value = false;
  }
);
</script>

<template>
  <div class="admin-shell min-h-screen bg-[#f1f5f9]">
    <!-- Desktop sidebar -->
    <aside class="admin-sidebar fixed top-0 start-0 z-40 hidden h-dvh w-[16.5rem] flex-col overflow-hidden lg:flex">
      <div class="shrink-0 border-b border-white/10 px-3 py-3">
        <NuxtLink to="/admin" class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" class="h-8 w-8" width="32" height="32" />
          <div class="min-w-0">
            <p class="truncate text-[15px] font-black text-white">{{ SITE_NAME }}</p>
            <p class="text-[12px] text-slate-400">پنل مدیریت</p>
          </div>
        </NuxtLink>
      </div>

      <nav class="admin-sidebar-nav min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div v-for="group in filteredGroups" :key="group.id" class="admin-nav-group">
          <p v-if="group.label" class="admin-nav-group-label">{{ group.label }}</p>
          <div class="admin-nav-group-items">
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="admin-side-link"
              :class="{ 'is-active': isActive(item) }"
              :title="item.hint"
            >
              <AppIcon :name="item.icon" size="md" class="shrink-0 opacity-90" />
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="item.to === '/admin/orders' && pendingCount > 0"
                class="min-w-[1.1rem] rounded-full bg-red-500 px-1 py-0.5 text-center text-[9px] font-bold text-white"
              >
                {{ pendingCount > 99 ? '۹۹+' : pendingCount }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Mobile drawer -->
    <Transition name="admin-drawer">
      <div v-if="mobileNavOpen" class="fixed inset-0 z-50 lg:hidden">
        <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" @click="mobileNavOpen = false" />
        <aside class="admin-sidebar absolute top-0 start-0 flex h-full w-[19rem] flex-col shadow-2xl">
          <div class="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div class="flex items-center gap-2">
              <img src="/logo.svg" alt="" class="h-9 w-9" />
              <span class="text-sm font-bold text-white">{{ SITE_NAME }}</span>
            </div>
            <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/10" @click="mobileNavOpen = false">
              <AppIcon name="lucide:x" size="lg" />
            </button>
          </div>
          <nav class="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            <div v-for="group in filteredGroups" :key="group.id">
              <p v-if="group.label" class="mb-1 px-2 text-[13px] font-bold text-slate-500">{{ group.label }}</p>
              <div class="space-y-1">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.to"
                  :to="item.to"
                  class="admin-side-link"
                  :class="{ 'is-active': isActive(item) }"
                >
                  <AppIcon :name="item.icon" size="md" />
                  <span class="flex-1">{{ item.label }}</span>
                  <span
                    v-if="item.to === '/admin/orders' && pendingCount > 0"
                    class="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
                  >
                    {{ pendingCount }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </nav>
        </aside>
      </div>
    </Transition>

    <div class="lg:ms-[16.5rem]">
      <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div class="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 lg:hidden"
              @click="mobileNavOpen = true"
            >
              <AppIcon name="lucide:menu" size="lg" />
            </button>
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-slate-900 md:text-base">{{ pageTitle }}</p>
              <p class="truncate text-xs text-slate-500">
                {{ authStore.fullName || 'مدیر' }} · {{ roleLabel }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              class="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
              title="اعلان‌ها"
              @click="openOrders"
            >
              <AppIcon name="lucide:bell" size="md" :class="pendingCount > 0 ? 'text-red-500' : ''" />
              <span
                v-if="pendingCount > 0"
                class="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
              >
                {{ pendingCount > 99 ? '99+' : pendingCount }}
              </span>
            </button>

            <NuxtLink
              v-if="canAccessPath('/admin/settings')"
              to="/admin/settings"
              class="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
              title="تنظیمات"
            >
              <AppIcon name="lucide:settings" size="md" />
            </NuxtLink>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              @click="authStore.logout(); navigateTo('/')"
            >
              <AppIcon name="lucide:log-out" size="sm" />
              <span class="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <Transition name="alert-slide">
        <div
          v-if="latestAlert"
          class="flex items-center justify-between gap-3 bg-red-600 px-4 py-3 text-white shadow-md lg:px-6"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span class="relative flex h-3 w-3 shrink-0">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span class="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            <p class="truncate text-sm font-medium">
              سفارش جدید:
              <span class="font-mono" dir="ltr">{{ latestAlert.orderNumber }}</span>
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700" @click="openOrders">
              مشاهده
            </button>
            <button type="button" class="rounded-lg p-1.5 hover:bg-red-500" @click="dismissAlert">
              <AppIcon name="lucide:x" size="sm" />
            </button>
          </div>
        </div>
      </Transition>

      <main class="p-4 lg:p-6">
        <Transition name="admin-page" mode="out-in">
          <div :key="route.path" class="admin-page-shell mx-auto max-w-[1400px]">
            <slot />
          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  color: #e2e8f0;
}

.admin-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.admin-nav-group-label {
  margin: 0 0 0.2rem;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #64748b;
}

.admin-nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.admin-side-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 0.55rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.9rem;
  line-height: 1.25;
  color: #cbd5e1;
  transition: background-color 0.18s ease, color 0.18s ease;
}
.admin-side-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.admin-side-link.is-active {
  background: linear-gradient(90deg, rgba(220, 38, 38, 0.22), rgba(220, 38, 38, 0.08));
  color: #fff;
  box-shadow: inset 3px 0 0 #dc2626;
  font-weight: 600;
}

@media (max-height: 820px) {
  .admin-side-link {
    padding: 0.4rem 0.55rem;
    font-size: 0.84rem;
  }
  .admin-sidebar-nav {
    gap: 0.35rem;
  }
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.25s ease;
}
.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.admin-page-enter-active,
.admin-page-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}
.admin-page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.admin-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.admin-drawer-enter-active,
.admin-drawer-leave-active {
  transition: opacity 0.25s ease;
}
.admin-drawer-enter-active aside,
.admin-drawer-leave-active aside {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.admin-drawer-enter-from,
.admin-drawer-leave-to {
  opacity: 0;
}
.admin-drawer-enter-from aside,
.admin-drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
