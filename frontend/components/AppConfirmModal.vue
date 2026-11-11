<script setup lang="ts">
const { state, accept, cancel } = useConfirmDialog();

const iconName = computed(() => {
  if (state.variant === 'warning') return 'lucide:triangle-alert';
  if (state.variant === 'default') return 'lucide:circle-help';
  return 'lucide:trash-2';
});

function onKeydown(event: KeyboardEvent) {
  if (!state.open) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    accept();
  }
}

watch(
  () => state.open,
  (open) => {
    if (!import.meta.client) return;
    document.body.style.overflow = open ? 'hidden' : '';
  }
);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (import.meta.client) document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div
        v-if="state.open"
        class="confirm-root"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'confirm-title'"
        :aria-describedby="'confirm-message'"
        @click.self="cancel"
      >
        <div class="confirm-card" :class="`is-${state.variant}`">
          <div class="confirm-icon" aria-hidden="true">
            <AppIcon :name="iconName" size="lg" />
          </div>

          <div class="confirm-body">
            <h2 id="confirm-title" class="confirm-title">{{ state.title }}</h2>
            <p id="confirm-message" class="confirm-message">{{ state.message }}</p>
          </div>

          <div class="confirm-actions">
            <button type="button" class="confirm-btn confirm-btn--ghost" @click="cancel">
              {{ state.cancelText }}
            </button>
            <button
              type="button"
              class="confirm-btn"
              :class="{
                'confirm-btn--danger': state.variant === 'danger',
                'confirm-btn--warning': state.variant === 'warning',
                'confirm-btn--primary': state.variant === 'default',
              }"
              @click="accept"
            >
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-root {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
}

.confirm-card {
  width: min(100%, 26rem);
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  padding: 1.35rem 1.35rem 1.2rem;
  border: 1px solid #e2e8f0;
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  margin-bottom: 0.9rem;
}

.confirm-card.is-danger .confirm-icon {
  background: #fef2f2;
  color: #dc2626;
}

.confirm-card.is-warning .confirm-icon {
  background: #fff7ed;
  color: #ea580c;
}

.confirm-card.is-default .confirm-icon {
  background: #eff6ff;
  color: #2563eb;
}

.confirm-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.confirm-message {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #475569;
  white-space: pre-line;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.confirm-btn {
  min-height: 2.7rem;
  border-radius: 0.85rem;
  border: 0;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.confirm-btn:hover {
  filter: brightness(1.04);
}

.confirm-btn:active {
  transform: scale(0.98);
}

.confirm-btn--ghost {
  background: #f1f5f9;
  color: #334155;
}

.confirm-btn--danger {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #fff;
}

.confirm-btn--warning {
  background: linear-gradient(135deg, #f97316, #c2410c);
  color: #fff;
}

.confirm-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-enter-active .confirm-card,
.confirm-leave-active .confirm-card {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-card,
.confirm-leave-to .confirm-card {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}
</style>
