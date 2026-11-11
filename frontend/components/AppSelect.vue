<script setup lang="ts">
export type AppSelectOption = {
  value: string | number;
  label: string;
  hint?: string;
  disabled?: boolean;
  icon?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined;
    options: AppSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'soft' | 'hero';
    block?: boolean;
    clearable?: boolean;
  }>(),
  {
    placeholder: 'انتخاب کنید',
    disabled: false,
    searchable: false,
    searchPlaceholder: 'جستجو...',
    size: 'md',
    variant: 'default',
    block: true,
    clearable: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number | ''];
  change: [value: string | number | ''];
}>();

const open = ref(false);
const query = ref('');
const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);

const selected = computed(() =>
  props.options.find((o) => String(o.value) === String(props.modelValue ?? ''))
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      String(o.value).toLowerCase().includes(q) ||
      (o.hint || '').toLowerCase().includes(q)
  );
});

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    query.value = '';
    const idx = filtered.value.findIndex((o) => String(o.value) === String(props.modelValue ?? ''));
    activeIndex.value = idx >= 0 ? idx : 0;
    nextTick(() => {
      listRef.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    });
  }
}

function close() {
  open.value = false;
  query.value = '';
  activeIndex.value = -1;
}

function pick(option: AppSelectOption) {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
  emit('change', option.value);
  close();
}

function clearValue(e: Event) {
  e.stopPropagation();
  emit('update:modelValue', '');
  emit('change', '');
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return;
  if (!open.value && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
    e.preventDefault();
    toggle();
    return;
  }
  if (!open.value) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
    scrollActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const opt = filtered.value[activeIndex.value];
    if (opt) pick(opt);
  }
}

function scrollActive() {
  nextTick(() => {
    listRef.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  });
}

function onDocPointer(e: PointerEvent) {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener('pointerdown', onDocPointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointer));

watch(
  () => props.disabled,
  (v) => {
    if (v) close();
  }
);
</script>

<template>
  <div
    ref="rootRef"
    class="app-select"
    :class="[
      `app-select--${size}`,
      `app-select--${variant}`,
      { 'is-open': open, 'is-disabled': disabled, 'is-block': block },
    ]"
  >
    <button
      type="button"
      class="app-select__trigger"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="app-select__value" :class="{ 'is-placeholder': !selected }">
        <AppIcon v-if="selected?.icon" :name="selected.icon" size="sm" class="app-select__value-icon" />
        <span class="truncate">{{ selected?.label || placeholder }}</span>
      </span>
      <span class="app-select__actions">
        <span
          v-if="clearable && selected && !disabled"
          class="app-select__clear"
          role="button"
          tabindex="-1"
          aria-label="پاک کردن"
          @click="clearValue"
        >
          <AppIcon name="lucide:x" size="xs" />
        </span>
        <AppIcon
          name="lucide:chevron-down"
          size="sm"
          class="app-select__chevron"
          :class="{ 'is-open': open }"
        />
      </span>
    </button>

    <Transition name="app-select-menu">
      <div v-if="open" class="app-select__menu" role="listbox">
        <div v-if="searchable" class="app-select__search">
          <label class="app-select__search-box">
            <AppIcon name="lucide:search" size="sm" class="app-select__search-icon" />
            <input
              v-model="query"
              type="search"
              class="app-select__search-input"
              :placeholder="searchPlaceholder"
              @keydown="onKeydown"
            />
          </label>
        </div>

        <div ref="listRef" class="app-select__list">
          <button
            v-for="(option, index) in filtered"
            :key="String(option.value)"
            type="button"
            class="app-select__option"
            :class="{
              'is-selected': String(option.value) === String(modelValue ?? ''),
              'is-active': index === activeIndex,
              'is-disabled': option.disabled,
            }"
            :data-active="index === activeIndex"
            :disabled="option.disabled"
            role="option"
            :aria-selected="String(option.value) === String(modelValue ?? '')"
            @mouseenter="activeIndex = index"
            @click="pick(option)"
          >
            <span class="app-select__option-main">
              <AppIcon v-if="option.icon" :name="option.icon" size="sm" class="shrink-0 opacity-80" />
              <span class="min-w-0">
                <span class="app-select__option-label">{{ option.label }}</span>
                <span v-if="option.hint" class="app-select__option-hint">{{ option.hint }}</span>
              </span>
            </span>
            <AppIcon
              v-if="String(option.value) === String(modelValue ?? '')"
              name="lucide:check"
              size="sm"
              class="app-select__check"
            />
          </button>

          <p v-if="!filtered.length" class="app-select__empty">موردی پیدا نشد</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-select {
  position: relative;
  min-width: 0;
}
.app-select.is-block {
  width: 100%;
}

.app-select__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  text-align: start;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.app-select--sm .app-select__trigger {
  min-height: 2.25rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.8rem;
}
.app-select--md .app-select__trigger {
  min-height: 2.7rem;
  padding: 0.55rem 0.85rem;
  font-size: 0.875rem;
}
.app-select--lg .app-select__trigger {
  min-height: 3rem;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
}
.app-select--soft .app-select__trigger {
  background: #f8fafc;
}
.app-select--hero .app-select__trigger {
  min-height: 2.85rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(2, 6, 23, 0.45);
  border-radius: 0.75rem;
  padding-inline: 0.75rem;
  box-shadow: none;
  font-size: 0.88rem;
  font-weight: 600;
  color: #f1f5f9;
}
.app-select--hero .app-select__placeholder,
.app-select--hero .app-select__value.is-placeholder {
  color: #94a3b8;
  font-weight: 500;
}
.app-select--hero .app-select__chevron {
  color: #94a3b8;
}
.app-select.is-open .app-select__trigger,
.app-select__trigger:focus-visible {
  border-color: #fca5a5;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
  outline: none;
}
.app-select--hero.is-open .app-select__trigger,
.app-select--hero .app-select__trigger:focus-visible {
  border-color: rgba(248, 113, 113, 0.65);
  background: rgba(2, 6, 23, 0.65);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}
.app-select.is-disabled .app-select__trigger {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f1f5f9;
}
.app-select--hero.is-disabled .app-select__trigger {
  background: rgba(2, 6, 23, 0.28);
  border-color: rgba(148, 163, 184, 0.16);
}

.app-select__value {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-weight: 600;
}
.app-select__value.is-placeholder {
  color: #94a3b8;
  font-weight: 500;
}
.app-select__value-icon {
  color: #64748b;
}

.app-select__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}
.app-select__clear {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  color: #94a3b8;
}
.app-select__clear:hover {
  background: #f1f5f9;
  color: #475569;
}
.app-select__chevron {
  color: #94a3b8;
  transition: transform 0.18s ease;
}
.app-select__chevron.is-open {
  transform: rotate(180deg);
  color: #dc2626;
}

.app-select__menu {
  position: absolute;
  inset-inline: 0;
  top: calc(100% + 0.4rem);
  z-index: 50;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.06);
}

.app-select__search {
  padding: 0.65rem 0.65rem 0.35rem;
  border-bottom: 1px solid #f1f5f9;
}
.app-select__search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border-radius: 0.7rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.45rem 0.7rem;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.app-select__search-box:focus-within {
  border-color: #fecaca;
  background: #fff;
}
.app-select__search-icon {
  flex-shrink: 0;
  color: #94a3b8;
  pointer-events: none;
}
.app-select__search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.8rem;
  outline: none;
  color: #0f172a;
}
.app-select__search-input::placeholder {
  color: #94a3b8;
}

.app-select__list {
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.35rem;
}
.app-select__option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  border-radius: 0.75rem;
  padding: 0.55rem 0.65rem;
  text-align: start;
  color: #334155;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.app-select__option:hover,
.app-select__option.is-active {
  background: #f8fafc;
  color: #0f172a;
}
.app-select__option.is-selected {
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 700;
}
.app-select__option.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.app-select__option-main {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}
.app-select__option-label {
  display: block;
  font-size: 0.85rem;
  line-height: 1.3;
}
.app-select__option-hint {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}
.app-select__check {
  color: #dc2626;
  flex-shrink: 0;
}
.app-select__empty {
  margin: 0;
  padding: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
}

.app-select-menu-enter-active,
.app-select-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.app-select-menu-enter-from,
.app-select-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
