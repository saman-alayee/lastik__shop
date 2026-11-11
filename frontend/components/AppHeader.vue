<script setup lang="ts">
import { SITE_NAME, STORE_MODE, TIRE_NAV } from '~/constants/site';
import { normalizeSearchText, stripInvisibleChars } from '~/utils/normalize';

const props = withDefaults(defineProps<{ overlay?: boolean }>(), { overlay: false });

const injectedOverlay = inject<boolean>('headerOverlay', false);
const overlayMode = computed(() => props.overlay || injectedOverlay);
const isTireStore = STORE_MODE === 'tire';

const authStore = useAuthStore();
const cartStore = useCartStore();
const { toPersianDigits } = useFormat();
const route = useRoute();

const searchQuery = ref('');
const showSearch = ref(false);
const catalogNavOpen = ref(false);
const solidHeader = ref(false);

function handleSearch() {
  const term = normalizeSearchText(searchQuery.value);
  searchQuery.value = term;
  if (term) {
    navigateTo(isTireStore ? `/shop?q=${encodeURIComponent(term)}` : `/search?q=${encodeURIComponent(term)}`);
    showSearch.value = false;
    catalogNavOpen.value = false;
  }
}

function onHeaderSearchInput(event: Event) {
  searchQuery.value = stripInvisibleChars((event.target as HTMLInputElement).value);
}

function onHeaderSearchPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? '';
  event.preventDefault();
  searchQuery.value = normalizeSearchText(text);
  if (searchQuery.value) handleSearch();
}

function onScroll() {
  if (!overlayMode.value) {
    solidHeader.value = true;
    return;
  }
  solidHeader.value = window.scrollY > 48;
}

const isLightOnHero = computed(() => overlayMode.value && !solidHeader.value && !showSearch.value);

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});

function navActive(to: string) {
  if (to === '/') return route.path === '/';
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <div :class="overlayMode ? 'fixed top-0 inset-x-0 z-[60]' : 'sticky top-0 z-50'">
    <AppAnnouncementBar />
    <header
      :class="[
        'transition-colors duration-300',
        isLightOnHero
          ? 'bg-transparent border-transparent text-white'
          : 'border-b border-slate-200 bg-slate-950 text-white shadow-sm',
      ]"
    >
      <div class="w-full px-4 md:px-8 lg:px-10">
        <div class="relative flex items-center justify-between h-14 md:h-[3.75rem]">
          <div class="flex items-center gap-1 z-10">
            <button
              type="button"
              class="p-2 -ms-1 text-white lg:hidden"
              aria-label="منو"
              @click="catalogNavOpen = !catalogNavOpen"
            >
              <AppIcon :name="catalogNavOpen ? 'lucide:x' : 'lucide:menu'" size="lg" />
            </button>
            <div class="hidden lg:block">
              <AppLogo size="sm" link light />
            </div>
          </div>

          <nav
            v-if="isTireStore"
            class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:flex"
          >
            <NuxtLink
              v-for="item in TIRE_NAV"
              :key="item.to"
              :to="item.to"
              class="rounded-lg px-3 py-2 text-sm font-medium transition"
              :class="navActive(item.to) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div v-else class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
            <AppLogo size="lg" link :light="isLightOnHero" :show-text="false" />
          </div>

          <div class="flex items-center gap-0.5 md:gap-1 z-10 text-white">
            <div class="lg:hidden">
              <AppLogo size="sm" link light :show-text="false" />
            </div>
            <NuxtLink to="/cart" class="relative p-2" aria-label="سبد خرید">
              <AppIcon name="lucide:shopping-cart" size="lg" />
              <span
                v-if="cartStore.totalItems > 0"
                class="badge absolute -top-0.5 -start-0.5 bg-red-600 text-white"
              >
                {{ toPersianDigits(cartStore.totalItems) }}
              </span>
            </NuxtLink>
            <button type="button" class="p-2" aria-label="جستجو" @click="showSearch = !showSearch">
              <AppIcon name="lucide:search" size="lg" />
            </button>
            <NuxtLink
              v-if="!authStore.isLoggedIn"
              to="/auth/login"
              class="hidden sm:flex items-center gap-1.5 text-xs md:text-sm px-1 md:px-2"
            >
              <AppIcon name="lucide:user" size="md" />
              <span class="hidden lg:inline">ورود | ثبت‌نام</span>
            </NuxtLink>
            <NuxtLink v-else to="/profile" class="hidden sm:flex items-center gap-1 p-1">
              <AppIcon name="lucide:user-circle" size="md" />
            </NuxtLink>
          </div>
        </div>

        <div v-if="showSearch" class="pb-3 md:pb-4">
          <form class="relative max-w-xl mx-auto" @submit.prevent="handleSearch">
            <input
              :value="searchQuery"
              type="search"
              enterkeyhint="search"
              autocomplete="off"
              :placeholder="`جستجو در ${SITE_NAME}...`"
              class="input-field pe-8"
              autofocus
              @input="onHeaderSearchInput"
              @paste="onHeaderSearchPaste"
              @search="handleSearch"
            />
            <button type="submit" class="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600">
              <AppIcon name="lucide:search" size="md" />
            </button>
          </form>
        </div>
      </div>
    </header>

    <CatalogNavDrawer :open="catalogNavOpen" @close="catalogNavOpen = false" />
  </div>
</template>
