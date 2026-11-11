<script setup lang="ts">
const authStore = useAuthStore();
const cartStore = useCartStore();
const route = useRoute();

onMounted(() => {
  authStore.init();
  cartStore.fetchCart();

  if (!authStore.isLoggedIn && route.path.startsWith('/profile') && route.path !== '/profile/favorites') {
    navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`);
  }
});
</script>

<template>
  <div class="profile-shell">
    <AppHeader />

    <main class="profile-shell__main safe-bottom">
      <div
        class="profile-shell__frame"
        :class="{ 'is-home': route.path === '/profile' }"
      >
        <ProfileSidebar v-if="authStore.isLoggedIn" class="profile-shell__sidebar" />
        <div class="profile-shell__content">
          <slot />
        </div>
      </div>
    </main>

    <FloatingCart />
    <StoreTrustBar />
    <AppFooter />
    <BottomNav />
  </div>
</template>

<style scoped>
.profile-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: #f3f4f6;
  color: #111827;
}

.profile-shell__main {
  flex: 1;
}

.profile-shell__frame {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding: 1rem 1rem 2rem;
  display: grid;
  gap: 0.85rem;
}

.profile-shell__content {
  min-width: 0;
}

@media (max-width: 959px) {
  .profile-shell__frame:not(.is-home) .profile-shell__sidebar :deep(.psb-nav) {
    display: none;
  }
}

@media (min-width: 960px) {
  .profile-shell__frame {
    grid-template-columns: 17.5rem minmax(0, 1fr);
    align-items: start;
    gap: 1rem;
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .profile-shell__sidebar {
    position: sticky;
    top: 5rem;
  }
}
</style>
