<script setup lang="ts">
withDefaults(
  defineProps<{
    /** missing = gap in tread for 404; empty = hollow bay; search = magnifier overlay */
    mode?: 'missing' | 'empty' | 'search' | 'cart' | 'favorites';
    size?: 'md' | 'lg';
  }>(),
  {
    mode: 'empty',
    size: 'lg',
  },
);
</script>

<template>
  <svg
    class="tire-mark"
    :class="[`is-${mode}`, `is-${size}`]"
    viewBox="0 0 320 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="tireRubber" cx="42%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="55%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </radialGradient>
      <radialGradient id="tireRim" cx="45%" cy="40%" r="58%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="45%" stop-color="#94a3b8" />
        <stop offset="100%" stop-color="#475569" />
      </radialGradient>
      <clipPath id="tireFace">
        <circle cx="160" cy="160" r="118" />
      </clipPath>
    </defs>

    <!-- ground shadow -->
    <ellipse cx="160" cy="278" rx="96" ry="14" fill="#0f172a" fill-opacity="0.18" />

    <!-- outer rubber -->
    <circle cx="160" cy="160" r="124" fill="url(#tireRubber)" />
    <circle cx="160" cy="160" r="124" stroke="#020617" stroke-width="4" />

    <!-- tread blocks -->
    <g class="tire-mark__tread" clip-path="url(#tireFace)">
      <g stroke="#020617" stroke-width="7" stroke-linecap="round">
        <path
          v-for="i in 18"
          :key="`t-${i}`"
          :transform="`rotate(${(i - 1) * 20} 160 160)`"
          d="M160 48c8 10 10 22 0 34 -8 10-10 22 0 34"
          opacity="0.55"
        />
      </g>
      <circle cx="160" cy="160" r="92" stroke="#1e293b" stroke-width="18" fill="none" />
      <circle cx="160" cy="160" r="78" stroke="#020617" stroke-width="2" stroke-opacity="0.45" fill="none" />
      <!-- circumferential grooves -->
      <circle cx="160" cy="160" r="108" stroke="#020617" stroke-width="3" stroke-opacity="0.35" fill="none" />
      <circle cx="160" cy="160" r="100" stroke="#334155" stroke-width="2" stroke-opacity="0.5" fill="none" />
    </g>

    <!-- missing tread bite for 404 -->
    <path
      v-if="mode === 'missing'"
      class="tire-mark__gap"
      d="M248 88c28 26 36 68 18 104"
      stroke="#dc2626"
      stroke-width="10"
      stroke-linecap="round"
      stroke-dasharray="12 10"
    />

    <!-- rim -->
    <circle cx="160" cy="160" r="58" fill="url(#tireRim)" stroke="#0f172a" stroke-width="3" />
    <g class="tire-mark__spokes" stroke="#0f172a" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round">
      <path d="M160 108v30M160 182v30M108 160h30M182 160h30" />
      <path d="M124 124l22 22M174 174l22 22M196 124l-22 22M146 174l-22 22" />
    </g>
    <circle cx="160" cy="160" r="22" fill="#0f172a" />
    <circle cx="160" cy="160" r="10" fill="#e2e8f0" />
    <circle cx="160" cy="160" r="4" fill="#dc2626" />

    <!-- lug nuts -->
    <g fill="#1e293b">
      <circle cx="160" cy="128" r="3.2" />
      <circle cx="186" cy="143" r="3.2" />
      <circle cx="176" cy="174" r="3.2" />
      <circle cx="144" cy="174" r="3.2" />
      <circle cx="134" cy="143" r="3.2" />
    </g>

    <!-- mode cues -->
    <g v-if="mode === 'search'" class="tire-mark__cue">
      <circle cx="214" cy="214" r="28" fill="#fff" fill-opacity="0.92" stroke="#0f172a" stroke-width="3" />
      <circle cx="214" cy="214" r="12" stroke="#dc2626" stroke-width="3" />
      <path d="M224 224l14 14" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
    </g>

    <g v-else-if="mode === 'cart'" class="tire-mark__cue">
      <rect x="198" y="198" width="56" height="40" rx="8" fill="#fff" fill-opacity="0.94" stroke="#0f172a" stroke-width="2.5" />
      <path d="M208 214h16l6 14h18" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" fill="none" />
      <circle cx="228" cy="234" r="2.8" fill="#dc2626" />
      <circle cx="242" cy="234" r="2.8" fill="#dc2626" />
    </g>

    <g v-else-if="mode === 'favorites'" class="tire-mark__cue">
      <path
        d="M228 206c-8-10-24-6-24 8 0 16 24 28 24 28s24-12 24-28c0-14-16-18-24-8z"
        fill="#dc2626"
        fill-opacity="0.9"
        stroke="#7f1d1d"
        stroke-width="2"
      />
    </g>

    <g v-else-if="mode === 'empty'" class="tire-mark__cue">
      <path
        d="M236 96h28v18h-12v28h-16V96z"
        fill="#fff"
        fill-opacity="0.9"
        stroke="#0f172a"
        stroke-width="2"
        transform="rotate(28 250 120)"
      />
    </g>
  </svg>
</template>

<style scoped>
.tire-mark {
  display: block;
  width: 100%;
  height: auto;
}

.tire-mark.is-md {
  max-width: 11rem;
}

.tire-mark.is-lg {
  max-width: 18rem;
}

.tire-mark__tread {
  transform-origin: 160px 160px;
  animation: tread-spin 22s linear infinite;
}

.tire-mark__gap {
  animation: gap-dash 2.8s linear infinite;
}

.tire-mark__cue {
  transform-origin: 230px 220px;
  animation: cue-bob 3.6s ease-in-out infinite;
}

@keyframes tread-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes gap-dash {
  to {
    stroke-dashoffset: -44;
  }
}

@keyframes cue-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tire-mark__tread,
  .tire-mark__gap,
  .tire-mark__cue {
    animation: none;
  }
}
</style>
