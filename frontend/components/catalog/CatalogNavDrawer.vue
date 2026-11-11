<script setup lang="ts">
import type { Category } from '~/types';
import { SITE_NAME, STORE_MODE } from '~/constants/site';

const isTireStore = STORE_MODE === 'tire';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const api = useApi();
const closeBtnRef = ref<HTMLButtonElement | null>(null);
const brandsOpen = ref(false);

const { data: categories, refresh } = await useAsyncData('catalog-nav-categories', async () => {
  try {
    const { data } = await api.get<Category[]>('/categories?lite=1');
    return data ?? [];
  } catch {
    return [];
  }
});

const brands = computed(() => {
  const list = categories.value ?? [];
  return list
    .filter((item) => !item.parentId)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'fa'));
});

const mainLinks = [
  { to: '/', label: 'خانه' },
  { to: '/shop', label: 'محصولات' },
] as const;

const afterBrandLinks = isTireStore
  ? [
      { to: '/cars', label: 'لاستیک خودرو' },
      { to: '/contact', label: 'تماس با ما' },
    ]
  : [
      { to: '/categories', label: 'دسته‌بندی‌ها' },
      { to: '/contact', label: 'تماس با ما' },
    ];

watch(
  () => props.open,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) {
      brandsOpen.value = false;
      return;
    }
    void refresh();
    await nextTick();
    closeBtnRef.value?.focus();
  }
);

function go(path: string) {
  emit('close');
  void navigateTo(path);
}

function toggleBrands() {
  brandsOpen.value = !brandsOpen.value;
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    e.preventDefault();
    emit('close');
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="nav-fade">
      <div
        v-if="open"
        class="store-nav-backdrop fixed inset-0 z-[80]"
        aria-hidden="true"
        @click="onBackdropClick"
      />
    </Transition>

    <Transition name="nav-slide">
      <aside
        v-if="open"
        class="store-nav-panel fixed inset-y-0 z-[81] flex w-[min(86vw,22rem)] flex-col bg-white"
        role="dialog"
        aria-modal="true"
        :aria-label="`منوی ${SITE_NAME}`"
      >
        <header class="store-nav-header shrink-0">
          <NuxtLink to="/" class="store-nav-logo" @click="emit('close')">
            <img src="/logo.svg" :alt="SITE_NAME" width="42" height="42" />
          </NuxtLink>
          <button
            ref="closeBtnRef"
            type="button"
            class="store-nav-close"
            aria-label="بستن منو"
            @click="emit('close')"
          >
            <AppIcon name="lucide:x" size="lg" />
          </button>
        </header>

        <nav class="store-nav-list min-h-0 flex-1 overflow-y-auto" aria-label="منوی اصلی">
          <button
            v-for="item in mainLinks"
            :key="item.to"
            type="button"
            class="store-nav-item"
            @click="go(item.to)"
          >
            {{ item.label }}
          </button>

          <div class="store-nav-group">
            <button
              type="button"
              class="store-nav-item store-nav-item--toggle"
              :aria-expanded="brandsOpen"
              @click="toggleBrands"
            >
              <span>برندها</span>
              <AppIcon
                name="lucide:chevron-down"
                size="sm"
                class="store-nav-chevron"
                :class="{ 'is-open': brandsOpen }"
              />
            </button>

            <div v-show="brandsOpen" class="store-nav-sub">
              <button type="button" class="store-nav-subitem store-nav-subitem--all" @click="go('/brands')">
                همه برندها
              </button>
              <button
                v-for="brand in brands"
                :key="brand.id"
                type="button"
                class="store-nav-subitem"
                @click="go(`/brands/${brand.slug}`)"
              >
                {{ brand.name }}
              </button>
              <p v-if="!brands.length" class="store-nav-empty">برندی ثبت نشده است</p>
            </div>
          </div>

          <button
            v-for="item in afterBrandLinks"
            :key="item.to"
            type="button"
            class="store-nav-item"
            @click="go(item.to)"
          >
            {{ item.label }}
          </button>
        </nav>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.store-nav-backdrop {
  background: rgba(15, 23, 42, 0.45);
}

.store-nav-panel {
  right: 0;
  left: auto;
  box-shadow: -16px 0 40px rgba(15, 23, 42, 0.18);
}

.store-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem 0.95rem;
  border-bottom: 1px solid #eceff3;
}

.store-nav-logo {
  display: inline-flex;
  align-items: center;
}

.store-nav-logo img {
  width: 2.6rem;
  height: 2.6rem;
  object-fit: contain;
}

.store-nav-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  color: #111827;
  border-radius: 0.5rem;
}

.store-nav-close:hover {
  background: #f3f4f6;
}

.store-nav-list {
  padding: 0;
}

.store-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.05rem 1.25rem;
  border-bottom: 1px solid #eceff3;
  text-align: start;
  font-size: 1.05rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.35;
  background: #fff;
}

.store-nav-item:active {
  background: #fafafa;
}

.store-nav-item--toggle {
  font-weight: 800;
}

.store-nav-chevron {
  color: #6b7280;
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.store-nav-chevron.is-open {
  transform: rotate(180deg);
}

.store-nav-group {
  border-bottom: 1px solid #eceff3;
}

.store-nav-group .store-nav-item {
  border-bottom: 0;
}

.store-nav-sub {
  background: #fafafa;
  border-top: 1px solid #eceff3;
}

.store-nav-subitem {
  width: 100%;
  display: block;
  padding: 0.85rem 1.25rem;
  text-align: start;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #eceff3;
}

.store-nav-subitem:last-child {
  border-bottom: 0;
}

.store-nav-subitem--all {
  color: #b91c1c;
  font-weight: 800;
}

.store-nav-subitem:active {
  background: #f3f4f6;
}

.store-nav-empty {
  margin: 0;
  padding: 0.9rem 1.25rem;
  font-size: 0.85rem;
  color: #9ca3af;
}

.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.22s ease;
}
.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
}

.nav-slide-enter-active,
.nav-slide-leave-active {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.nav-slide-enter-from,
.nav-slide-leave-to {
  transform: translate3d(100%, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .nav-slide-enter-active,
  .nav-slide-leave-active {
    transition: none;
  }
}
</style>
