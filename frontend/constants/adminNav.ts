import { STORE_MODE } from '~/constants/site';

const isTireStore = STORE_MODE === 'tire';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  hint?: string;
  keywords?: string[];
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: '',
    items: [
      {
        to: '/admin',
        label: 'داشبورد',
        icon: 'lucide:layout-dashboard',
        exact: true,
        hint: 'آمار و دسترسی سریع',
        keywords: ['خانه', 'dashboard'],
      },
      {
        to: '/',
        label: 'مشاهده فروشگاه',
        icon: 'lucide:store',
        exact: true,
        hint: 'باز کردن ویترین سایت',
        keywords: ['فروشگاه', 'سایت', 'storefront'],
      },
    ],
  },
  {
    id: 'sales',
    label: 'فروش و سفارش',
    items: [
      {
        to: '/admin/orders',
        label: 'سفارش‌ها',
        icon: 'lucide:package',
        hint: 'پیگیری و آماده‌سازی',
        keywords: ['order', 'ارسال'],
      },
      {
        to: '/admin/sales',
        label: 'گزارش فروش',
        icon: 'lucide:bar-chart-3',
        hint: 'درآمد و پرفروش‌ها',
        keywords: ['گزارش', 'آمار'],
      },
      {
        to: '/admin/customers',
        label: 'مشتریان',
        icon: 'lucide:user-round',
        hint: 'خریداران و تماس',
        keywords: ['کاربر'],
      },
      {
        to: '/admin/coupons',
        label: 'کدهای تخفیف',
        icon: 'lucide:ticket-percent',
        hint: 'کوپن سبد خرید',
        keywords: ['تخفیف', 'coupon'],
      },
    ],
  },
  {
    id: 'catalog',
    label: 'کاتالوگ',
    items: [
      {
        to: '/admin/products',
        label: isTireStore ? 'لاستیک‌ها' : 'محصولات',
        icon: 'shop:tire',
        hint: isTireStore ? 'سایز، قیمت، موجودی' : 'قیمت، موجودی، مشخصات',
        keywords: ['لاستیک', 'کالا', 'محصول'],
      },
      {
        to: '/admin/categories',
        label: isTireStore ? 'برندها' : 'دسته‌بندی‌ها',
        icon: 'lucide:layers',
        hint: isTireStore ? 'مثل نکسین، ایران تایر' : 'دسته‌های فروشگاه',
        keywords: ['برند', 'دسته'],
      },
      {
        to: '/admin/reviews',
        label: 'نظرات',
        icon: 'lucide:star',
        hint: 'نظر مشتریان',
        keywords: ['review'],
      },
    ],
  },
  {
    id: 'tire',
    label: 'تخصصی لاستیک',
    items: [
      {
        to: '/admin/vehicles',
        label: 'خودرو و سایز استاندارد',
        icon: 'lucide:car',
        hint: 'مثلاً پژو ۲۰۶ → سایزهای مناسب',
        keywords: ['ماشین', 'پژو', 'سایز خودرو', 'fitment'],
      },
      {
        to: '/admin/tire-sizes',
        label: 'سایزهای لاستیک',
        icon: 'shop:rim',
        hint: 'عرض / فاق / رینگ',
        keywords: ['185', 'size'],
      },
    ],
  },
  {
    id: 'storefront',
    label: 'ویترین فروشگاه',
    items: [
      {
        to: '/admin/home-picks',
        label: 'صفحه اول',
        icon: 'lucide:sparkles',
        hint: 'ویژه و تخفیف‌دار',
        keywords: ['home'],
      },
      {
        to: '/admin/category-feed',
        label: 'محصولات دسته',
        icon: 'lucide:list-ordered',
        hint: 'ترتیب نمایش دسته‌ها',
      },
      {
        to: '/admin/sliders',
        label: 'بنرها',
        icon: 'lucide:images',
        hint: 'اسلایدر صفحه اول',
        keywords: ['banner', 'اسلایدر'],
      },
      {
        to: '/admin/content',
        label: 'صفحات و قوانین',
        icon: 'lucide:file-text',
        hint: 'محتوای ثابت سایت',
      },
    ],
  },
  {
    id: 'system',
    label: 'سیستم',
    items: [
      {
        to: '/admin/settings',
        label: 'تنظیمات',
        icon: 'lucide:settings',
        hint: 'ارسال، تم، پیامک، بکاپ',
        keywords: ['config', 'بکاپ', 'backup'],
      },
      {
        to: '/admin/admins',
        label: 'مدیران پنل',
        icon: 'lucide:shield-check',
        hint: 'دسترسی ادمین و پرسنل',
        keywords: ['role', 'کاربر پنل'],
      },
    ],
  },
];

export function findAdminNavLabel(path: string): string {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.exact ? path === item.to : path === item.to || path.startsWith(`${item.to}/`)) {
        return item.label;
      }
    }
  }
  if (path.startsWith('/admin')) return 'پنل مدیریت';
  return 'پنل';
}
