<script setup lang="ts">
import {
  CONTACT_PHONE,
  ENAMAD,
  SITE_TAGLINE,
  SOCIAL_LINKS,
  STORE_HOURS,
  STORE_MODE,
  TIRE_NAV,
} from '~/constants/site';

const isTireStore = STORE_MODE === 'tire';

const infoLinks = [
  { to: '/contact', label: 'تماس با ما' },
  { to: '/pages/terms', label: 'قوانین و مقررات' },
];

const shopLinks = isTireStore
  ? [
      { to: '/shop', label: 'فروشگاه لاستیک' },
      { to: '/brands', label: 'برندها' },
      { to: '/cars', label: 'جستجو بر اساس خودرو' },
      { to: '/shop?sort=price_asc', label: 'ارزان‌ترین‌ها' },
      { to: '/profile/orders', label: 'پیگیری سفارش' },
    ]
  : [
      { to: '/categories', label: 'دسته‌بندی‌ها' },
      { to: '/shop?sort=price_desc', label: 'گران‌ترین‌ها' },
      { to: '/search?discounted=1', label: 'پیشنهاد ویژه' },
      { to: '/profile/orders', label: 'پیگیری سفارش' },
    ];

const socialIcons = [
  {
    href: SOCIAL_LINKS.whatsapp,
    label: 'واتساپ',
    icon: 'shop:whatsapp',
    className: 'footer-social__btn--whatsapp',
  },
  {
    href: SOCIAL_LINKS.telegram,
    label: 'تلگرام',
    icon: 'shop:telegram',
    className: 'footer-social__btn--telegram',
  },
  {
    href: SOCIAL_LINKS.bale,
    label: 'بله',
    icon: 'shop:bale',
    className: 'footer-social__btn--bale',
  },
].filter((c) => c.href);

const channels = [
  { href: SOCIAL_LINKS.whatsappGroup, label: 'گروه واتساپ' },
  { href: SOCIAL_LINKS.rubikaChannel, label: 'کانال روبیکا' },
  { href: SOCIAL_LINKS.rubikaAdmin, label: 'ادمین روبیکا' },
].filter((c) => c.href);
</script>

<template>
  <footer class="mt-0 border-t border-slate-800 bg-slate-950 pb-24 text-slate-300 md:pb-0">
    <div class="max-w-store mx-auto px-4 py-10">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <AppLogo size="sm" light />
          <p class="mt-3 text-sm leading-relaxed text-slate-400">{{ SITE_TAGLINE }}</p>
          <p v-if="CONTACT_PHONE" class="mt-3 text-sm font-semibold text-white" dir="ltr">
            {{ CONTACT_PHONE }}
          </p>
          <div v-if="socialIcons.length" class="footer-social mt-4">
            <a
              v-for="item in socialIcons"
              :key="item.label"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social__btn"
              :class="item.className"
              :aria-label="item.label"
              :title="item.label"
            >
              <AppIcon :name="item.icon" size="md" />
            </a>
          </div>
          <a
            v-if="ENAMAD.href && ENAMAD.href !== '#'"
            :href="ENAMAD.href"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 inline-block"
            aria-label="نماد اعتماد الکترونیکی"
          >
            <img src="/enamad.png" alt="نماد اعتماد الکترونیکی" width="125" height="136" class="h-24 w-auto" />
          </a>
        </div>
        <div>
          <h3 class="mb-3 text-sm font-bold text-white">فروشگاه</h3>
          <nav class="flex flex-col gap-2 text-sm">
            <NuxtLink v-for="link in shopLinks" :key="link.to" :to="link.to" class="hover:text-white">
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
        <div>
          <h3 class="mb-3 text-sm font-bold text-white">اطلاعات</h3>
          <nav class="flex flex-col gap-2 text-sm">
            <NuxtLink
              v-for="link in (isTireStore ? [...TIRE_NAV.slice(0, 1), ...infoLinks] : infoLinks)"
              :key="link.to"
              :to="link.to"
              class="hover:text-white"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
        </div>
        <div>
          <h3 class="mb-3 text-sm font-bold text-white">پشتیبانی</h3>
          <p class="text-sm leading-relaxed text-slate-400">{{ STORE_HOURS }}</p>
          <nav v-if="channels.length" class="mt-3 flex flex-col gap-2 text-sm">
            <a
              v-for="channel in channels"
              :key="channel.href"
              :href="channel.href"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white"
            >
              {{ channel.label }}
            </a>
          </nav>
        </div>
      </div>
      <div class="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
        <NuxtLink to="/pages/terms" class="hover:text-white">
          حقوق و قوانین
        </NuxtLink>
        <p class="mt-3 leading-relaxed text-slate-500">
          کليه حقوق اين سايت متعلق به فروشگاه آنلاین لاستیک فروش می‌باشد.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.footer-social__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  color: #fff;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.footer-social__btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.footer-social__btn--whatsapp {
  background: #25d366;
}

.footer-social__btn--telegram {
  background: #229ed9;
}

.footer-social__btn--bale {
  background: #00a3ff;
}
</style>
