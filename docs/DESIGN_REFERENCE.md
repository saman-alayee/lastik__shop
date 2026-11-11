# گزارش طراحی — لاستیک‌شاپ

> برند فروشگاه **لاستیک‌شاپ** است؛ الهام چیدمان از فروشگاه‌های مرجع بررسی‌شده، بدون کپی هویت برند دیگران.

## پالت رنگی (تقریبی)

| نقش | HEX | کاربرد |
|-----|-----|--------|
| Primary | طبق `frontend/tailwind.config.ts` | نوار اعلان، دکمه CTA، حالت فعال |
| Text | `#111111` / `#000000` | عناوین و متن اصلی |
| Background | `#ffffff` | بدنه |
| Muted surface | `#f7f7f7` | فوتر، سکشن‌های متناوب |

## تایپوگرافی

- پیاده‌سازی: **IRANSansX** (موجود در پروژه)، وزن medium/bold برای عناوین، `text-sm` برای جزئیات محصول.

## چیدمان

| بخش | ابعاد تقریبی |
|-----|----------------|
| Hero | تمام‌عرض / اسلایدر لاستیک |
| کارت محصول | اسکرول افقی یا گرید فروشگاه |
| هدر | لوگو، منو، سبد/جستجو/ورود |

پیاده‌سازی: `layouts/home.vue`, `TireHomeHero`, `TireBrandSlider`, `ProductCardList`.

## صفحات مرجع

- صفحه اصلی (Hero، برندها، جدیدترین، پیشنهاد ویژه)
- منو: خانه / محصولات / برندها / لاستیک خودرو / تماس
- فروشگاه با فیلتر سایز و خودرو

## Design System در کد

- `frontend/tailwind.config.ts` — رنگ‌های primary/accent
- `frontend/assets/css/main.css` — دکمه‌ها، input، کارت محصول
- `frontend/constants/site.ts` — نام برند، متن بنر، تماس

## Stack

- Frontend: **Nuxt 3**, Vue 3, Pinia, Tailwind, PWA
- Backend: **Express**, Prisma, **MySQL**, JWT + OTP

### قابلیت‌ها

- احراز هویت، سبد، سفارش، علاقه‌مندی، آدرس، پنل admin
- محصولات لاستیک، دسته/برند، اسلایدر، home picks، تخفیف جفت/ست، محتوای ثابت

### کامپوننت‌های کلیدی

| کامپوننت | استفاده |
|----------|---------|
| AppHeader / AppFooter | هدر و فوتر فروشگاه |
| ProductCard / ProductCardList | کارت محصول لاستیک |
| TireFilterPanel / TireHomeHero | فیلتر و هیرو |
| layouts/admin + middleware | پنل ادمین |
| useApi, stores (auth, cart) | API و state |
