<script setup lang="ts">
const items = [
  { icon: 'lucide:truck', title: 'ارسال سریع', desc: 'به سراسر کشور' },
  { icon: 'lucide:shield-check', title: 'ضمانت اصالت', desc: 'کالای اصل' },
  { icon: 'lucide:badge-percent', title: 'بهترین قیمت', desc: 'جفت و چهارحلقه' },
  { icon: 'lucide:headphones', title: 'پشتیبانی', desc: 'مشاوره تخصصی' },
];
</script>

<template>
  <section class="border-y border-slate-200 bg-white">
    <ul class="mx-auto grid max-w-store grid-cols-2 gap-px bg-slate-100 md:grid-cols-4">
      <li
        v-for="item in items"
        :key="item.title"
        class="flex items-center gap-3 bg-white px-4 py-5 md:justify-center md:px-6"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AppIcon :name="item.icon" size="md" />
        </span>
        <div>
          <p class="text-sm font-bold text-slate-900">{{ item.title }}</p>
          <p class="text-xs text-slate-500">{{ item.desc }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
