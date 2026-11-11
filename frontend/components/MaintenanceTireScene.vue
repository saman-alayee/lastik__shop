<script setup lang="ts">
withDefaults(
  defineProps<{
    description: string;
    preview?: boolean;
  }>(),
  {
    preview: false,
  },
);

const steps = [
  { label: 'بررسی', done: true },
  { label: 'تعویض', done: true },
  { label: 'بالانس', done: false },
  { label: 'آماده‌سازی', done: false },
];
</script>

<template>
  <div class="garage relative min-h-[100dvh] overflow-hidden">
    <div class="garage-bg" aria-hidden="true">
      <span class="garage-grid" />
      <span class="garage-blob garage-blob-a" />
      <span class="garage-blob garage-blob-b" />
      <span class="garage-blob garage-blob-c" />
      <span
        v-for="i in 10"
        :key="i"
        class="garage-dot"
        :style="{ '--i': i }"
      />
    </div>

    <div class="relative z-10 mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
      <slot name="brand" />

      <div class="garage-stage relative mb-1 w-full max-w-lg">
        <svg
          class="mx-auto h-auto w-full max-w-[22rem]"
          viewBox="0 0 400 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="تعمیرگاه لاستیک"
        >
          <g class="garage-tire">
            <circle cx="200" cy="138" r="86" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-opacity="0.5" stroke-width="16" />
            <circle cx="200" cy="138" r="52" fill="none" stroke="#dc2626" stroke-opacity="0.3" stroke-width="9" />
            <circle cx="200" cy="138" r="24" fill="#fff" stroke="#0f172a" stroke-opacity="0.3" stroke-width="2.5" />
            <circle cx="200" cy="138" r="8" fill="#0f172a" fill-opacity="0.4" />
          </g>

          <g class="garage-wrench">
            <path
              d="M78 176c10-18 28-22 40-14l62 38c6 4 8 12 4 18l-10 16c-4 6-12 8-18 4L94 200c-12-8-20-24-16-24z"
              fill="#fff"
              stroke="#0f172a"
              stroke-opacity="0.45"
              stroke-width="2"
            />
            <circle cx="86" cy="188" r="10" fill="none" stroke="#dc2626" stroke-width="2.5" />
          </g>

          <g class="garage-tag garage-tag-a">
            <rect x="28" y="72" width="78" height="28" rx="6" fill="#fff" stroke="#0f172a" stroke-opacity="0.2" />
            <text x="67" y="90" text-anchor="middle" fill="#334155" font-size="11" font-family="Tahoma, sans-serif">در حال سرویس</text>
          </g>
          <g class="garage-tag garage-tag-b">
            <rect x="300" y="64" width="68" height="26" rx="6" fill="#fff" stroke="#dc2626" stroke-opacity="0.35" />
            <text x="334" y="81" text-anchor="middle" fill="#b91c1c" font-size="11" font-family="Tahoma, sans-serif">به‌روزرسانی</text>
          </g>
        </svg>
      </div>

      <p class="garage-eyebrow mt-1 text-[11px] font-medium tracking-[0.28em] text-red-700/75">
        GARAGE · TEMPORARILY CLOSED
      </p>
      <h1 class="garage-title mt-3 text-[1.65rem] font-semibold tracking-tight text-slate-950 md:text-3xl">
        فروشگاه موقتاً در حال تعمیر است
      </h1>
      <p class="garage-copy mt-3 max-w-md text-sm leading-7 text-slate-600 md:text-[15px]">
        {{ description }}
      </p>

      <div class="garage-steps mt-8 grid w-full max-w-md grid-cols-4 gap-2" aria-hidden="true">
        <div
          v-for="(step, index) in steps"
          :key="step.label"
          class="garage-step"
          :class="{ 'is-active': !step.done && steps[index - 1]?.done, 'is-done': step.done }"
          :style="{ '--step-i': index }"
        >
          <span class="garage-step-dot" />
          <span class="mt-1.5 block text-[10px] font-medium tracking-wide">{{ step.label }}</span>
        </div>
      </div>

      <div class="garage-progress mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-900/10" aria-hidden="true">
        <span class="garage-progress-bar block h-full rounded-full bg-gradient-to-l from-red-500 to-slate-800" />
      </div>

      <p class="mt-4 flex items-center justify-center gap-2 text-xs tracking-wide text-slate-600">
        <span class="garage-pulse-dot" />
        در حال آماده‌سازی انبار و سرویس فروشگاه…
      </p>

      <slot />

      <p v-if="preview" class="mt-6 text-xs text-red-700/70">
        پیش‌نمایش — هنوز برای مشتریان فعال نشده است.
      </p>
    </div>
  </div>
</template>

<style scoped>
.garage {
  background:
    radial-gradient(ellipse 90% 55% at 50% -8%, rgba(220, 38, 38, 0.12), transparent 58%),
    radial-gradient(ellipse 50% 40% at 100% 100%, rgba(15, 23, 42, 0.08), transparent 50%),
    linear-gradient(168deg, #f8fafc 0%, #eef2f7 46%, #e2e8f0 100%);
  color: #0f172a;
}

.garage-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.garage-grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
}

.garage-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(52px);
  opacity: 0.55;
  animation: garage-drift 16s ease-in-out infinite;
}

.garage-blob-a {
  width: 20rem;
  height: 20rem;
  top: -5rem;
  right: -4rem;
  background: rgba(220, 38, 38, 0.16);
}

.garage-blob-b {
  width: 15rem;
  height: 15rem;
  bottom: 6%;
  left: -3rem;
  background: rgba(15, 23, 42, 0.12);
  animation-delay: -5s;
}

.garage-blob-c {
  width: 11rem;
  height: 11rem;
  top: 45%;
  right: 16%;
  background: rgba(248, 113, 113, 0.12);
  animation-delay: -9s;
}

.garage-dot {
  position: absolute;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  border: 1.5px solid rgba(15, 23, 42, 0.16);
  top: calc(10% + (var(--i) * 7%));
  left: calc(8% + (var(--i) * 8%));
  animation: garage-bob 5s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.4s);
}

.garage-tire {
  transform-origin: 200px 138px;
  animation: garage-spin 10s linear infinite;
}

.garage-wrench {
  transform-origin: 86px 188px;
  animation: garage-wrench 2.8s ease-in-out infinite;
}

.garage-tag {
  transform-box: fill-box;
  transform-origin: center;
}

.garage-tag-a {
  animation: garage-float 4s ease-in-out infinite;
}

.garage-tag-b {
  animation: garage-float 5s ease-in-out infinite reverse;
}

.garage-step {
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.7);
  padding: 0.65rem 0.35rem;
  color: #64748b;
  animation: garage-rise 0.55s ease both;
  animation-delay: calc(var(--step-i) * 0.06s);
}

.garage-step.is-done {
  color: #0f172a;
  border-color: rgba(15, 23, 42, 0.16);
}

.garage-step.is-active {
  color: #b91c1c;
  border-color: rgba(220, 38, 38, 0.35);
  background: rgba(254, 226, 226, 0.55);
}

.garage-step-dot {
  display: block;
  width: 0.55rem;
  height: 0.55rem;
  margin-inline: auto;
  border-radius: 999px;
  background: #cbd5e1;
}

.garage-step.is-done .garage-step-dot {
  background: #0f172a;
}

.garage-step.is-active .garage-step-dot {
  background: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);
}

.garage-progress-bar {
  width: 55%;
  animation: garage-progress 2.4s ease-in-out infinite;
}

.garage-pulse-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #dc2626;
  animation: garage-pulse 1.4s ease-in-out infinite;
}

.garage-eyebrow,
.garage-title,
.garage-copy {
  animation: garage-rise 0.7s ease both;
}

.garage-title {
  animation-delay: 0.08s;
}

.garage-copy {
  animation-delay: 0.16s;
}

@keyframes garage-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes garage-wrench {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(10deg);
  }
}

@keyframes garage-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes garage-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

@keyframes garage-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-14px, 18px) scale(1.06);
  }
}

@keyframes garage-progress {
  0%,
  100% {
    transform: translateX(8%);
  }
  50% {
    transform: translateX(-8%);
  }
}

@keyframes garage-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes garage-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .garage-blob,
  .garage-dot,
  .garage-tire,
  .garage-wrench,
  .garage-tag,
  .garage-progress-bar,
  .garage-pulse-dot,
  .garage-step,
  .garage-eyebrow,
  .garage-title,
  .garage-copy {
    animation: none !important;
  }
}
</style>
