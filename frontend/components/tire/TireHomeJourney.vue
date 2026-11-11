<script setup lang="ts">
const steps = [
  {
    icon: 'lucide:car',
    title: 'خودرویتان را انتخاب کنید',
    desc: 'برند و مدل ماشین را بزنید؛ سایز استاندارد را پیدا می‌کنیم.',
    to: '/cars',
    cta: 'انتخاب خودرو',
  },
  {
    icon: 'shop:rim',
    title: 'یا مستقیم سایز بزنید',
    desc: 'عرض، فاق و رینگ را فیلتر کنید و لیست قیمت را ببینید.',
    to: '/shop',
    cta: 'جستجوی سایز',
  },
  {
    icon: 'shop:tire',
    title: 'جفت یا چهارحلقه بخرید',
    desc: 'قیمت شفاف، موجودی واقعی و ارسال سریع به سراسر کشور.',
    to: '/shop?sort=price_asc',
    cta: 'مشاهده محصولات',
  },
];
</script>

<template>
  <section class="relative overflow-hidden border-y border-slate-200 bg-[#0f172a] text-white">
    <div
      class="pointer-events-none absolute inset-0 opacity-20"
      style="background: url('/images/tire/tread-pattern.svg') repeat center / 90px auto"
    />
    <div class="relative mx-auto max-w-store px-4 py-12 md:py-16">
      <div class="max-w-xl">
        <p class="text-xs font-bold tracking-[0.16em] text-red-400">مسیر خرید</p>
        <h2 class="mt-2 text-2xl font-black md:text-3xl">از انتخاب خودرو تا تایر نو</h2>
        <p class="mt-2 text-sm leading-7 text-slate-300">
          سه قدم ساده برای پیدا کردن لاستیک درست، بدون سردرگمی بین تیپ‌ها و سال ساخت.
        </p>
      </div>

      <ol class="mt-8 grid gap-4 md:grid-cols-3">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-red-400/40 hover:bg-white/10"
        >
          <span class="absolute -top-3 -start-1 text-6xl font-black text-white/5">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-900/30">
            <AppIcon :name="step.icon" size="md" />
          </span>
          <h3 class="relative mt-4 text-lg font-bold">{{ step.title }}</h3>
          <p class="relative mt-2 text-sm leading-6 text-slate-300">{{ step.desc }}</p>
          <NuxtLink
            :to="step.to"
            class="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-red-300 transition group-hover:text-red-200"
          >
            {{ step.cta }}
            <AppIcon name="lucide:arrow-left" size="sm" />
          </NuxtLink>
        </li>
      </ol>
    </div>
  </section>
</template>
