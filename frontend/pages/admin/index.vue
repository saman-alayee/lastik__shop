<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const { navVisible, isFullAdmin } = useAdminAccess();
const { formatNumber } = useFormat();

const stats = ref<{
  orders: {
    total: number;
    newOrders: number;
    preparing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  products: number;
  categories: number;
} | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.get<typeof stats.value>('/admin/stats');
    stats.value = data;
  } catch {
    stats.value = null;
  }
});

const workflow = [
  {
    to: '/admin/orders?status=NEW',
    label: 'سفارش‌های جدید',
    desc: 'پرداخت‌شده؛ هنوز آماده ارسال نشده',
    icon: 'lucide:truck',
    tone: 'blue',
  },
  {
    to: '/admin/orders?status=PREPARING',
    label: 'در حال آماده‌سازی',
    desc: 'بسته‌بندی و ثبت ارسال',
    icon: 'shop:warehouse-tire',
    tone: 'amber',
  },
  {
    to: '/admin/products',
    label: 'مدیریت لاستیک‌ها',
    desc: 'قیمت، موجودی و مشخصات فنی',
    icon: 'shop:tire',
    tone: 'slate',
  },
  {
    to: '/admin/vehicles',
    label: 'خودرو و سایزهای استاندارد',
    desc: 'چند سایز برای هر مدل خودرو',
    icon: 'lucide:car',
    tone: 'red',
  },
];

const linkGroups = [
  {
    title: 'ویترین فروشگاه',
    links: [
      { to: '/admin/home-picks', label: 'صفحه اول', desc: 'ویژه و تخفیف‌دار', icon: 'lucide:sparkles' },
      { to: '/admin/sliders', label: 'بنرها', desc: 'اسلایدر فروشگاه', icon: 'lucide:images' },
      { to: '/admin/category-feed', label: 'محصولات دسته', desc: 'ترتیب نمایش دسته‌ها', icon: 'lucide:list-ordered' },
      { to: '/admin/content', label: 'قوانین و صفحات', desc: 'محتوای ثابت', icon: 'lucide:file-text' },
    ],
  },
  {
    title: 'فروش و پشتیبانی',
    links: [
      { to: '/admin/customers', label: 'مشتریان', desc: 'لیست خریداران', icon: 'lucide:users' },
      { to: '/admin/coupons', label: 'کد تخفیف', desc: 'کوپن سبد', icon: 'lucide:ticket-percent' },
      { to: '/admin/sales', label: 'گزارش فروش', desc: 'درآمد و پرفروش', icon: 'lucide:bar-chart-3' },
      { to: '/admin/reviews', label: 'نظرات', desc: 'نظر زیر محصولات', icon: 'lucide:star' },
    ],
  },
  {
    title: 'ابزارهای تخصصی',
    links: [
      { to: '/admin/tire-sizes', label: 'سایزهای لاستیک', desc: 'عرض / فاق / رینگ', icon: 'shop:rim' },
      { to: '/admin/settings', label: 'تنظیمات', desc: 'ارسال، تم، پیامک، بکاپ', icon: 'lucide:wrench' },
      { to: '/admin/admins', label: 'مدیران پنل', desc: 'دسترسی‌ها', icon: 'lucide:shield-check' },
      { to: '/', label: 'مشاهده فروشگاه', desc: 'باز کردن ویترین', icon: 'shop:warehouse-tire' },
    ],
  },
];

function canSee(to: string) {
  const path = to.split('?')[0];
  if (path === '/admin/admins') return isFullAdmin.value;
  return navVisible(path);
}

const visibleWorkflow = computed(() => workflow.filter((item) => canSee(item.to)));
const visibleGroups = computed(() =>
  linkGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => canSee(link.to)),
    }))
    .filter((group) => group.links.length)
);

const toneClass: Record<string, string> = {
  blue: 'from-blue-500/15 to-blue-500/5 text-blue-700 ring-blue-200',
  amber: 'from-amber-500/15 to-amber-500/5 text-amber-700 ring-amber-200',
  slate: 'from-slate-500/15 to-slate-500/5 text-slate-700 ring-slate-200',
  red: 'from-red-500/15 to-red-500/5 text-red-700 ring-red-200',
};

useHead({ title: 'داشبورد - پنل مدیریت' });
</script>

<template>
  <div>
    <AdminPageHeader
      title="داشبورد"
      description="از اینجا سفارش‌ها، لاستیک‌ها، خودروها و ویترین فروشگاه را سریع مدیریت کنید."
    />

    <AdminCodeLookup
      class="mb-6"
      autofocus
      @open-order="(id) => navigateTo(`/admin/orders?open=${id}`)"
    />

    <div v-if="stats" class="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-6">
      <div class="admin-stat-card">
        <p class="admin-stat-label">کل سفارش</p>
        <p class="admin-stat-value">{{ formatNumber(stats.orders.total) }}</p>
      </div>
      <NuxtLink to="/admin/orders?status=NEW" class="admin-stat-card admin-stat-card--link border-s-4 border-s-blue-500">
        <p class="admin-stat-label">جدید</p>
        <p class="admin-stat-value text-blue-600">{{ formatNumber(stats.orders.newOrders) }}</p>
      </NuxtLink>
      <NuxtLink to="/admin/orders?status=PREPARING" class="admin-stat-card admin-stat-card--link border-s-4 border-s-amber-500">
        <p class="admin-stat-label">آماده‌سازی</p>
        <p class="admin-stat-value text-amber-600">{{ formatNumber(stats.orders.preparing) }}</p>
      </NuxtLink>
      <div class="admin-stat-card border-s-4 border-s-violet-500">
        <p class="admin-stat-label">ارسال‌شده</p>
        <p class="admin-stat-value text-violet-600">{{ formatNumber(stats.orders.shipped) }}</p>
      </div>
      <div class="admin-stat-card border-s-4 border-s-emerald-500">
        <p class="admin-stat-label">تحویل</p>
        <p class="admin-stat-value text-emerald-600">{{ formatNumber(stats.orders.delivered) }}</p>
      </div>
      <div class="admin-stat-card">
        <p class="admin-stat-label">محصولات / دسته</p>
        <p class="admin-stat-value text-base">
          {{ formatNumber(stats.products) }}
          <span class="text-slate-400">/</span>
          {{ formatNumber(stats.categories) }}
        </p>
      </div>
    </div>

    <section class="mb-8">
      <h2 class="mb-3 text-sm font-bold text-slate-700">کار روزانه</h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="item in visibleWorkflow"
          :key="item.to"
          :to="item.to"
          class="admin-action-card"
          :class="toneClass[item.tone]"
        >
          <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-inset ring-black/5">
            <AppIcon :name="item.icon" size="md" />
          </div>
          <p class="font-bold text-slate-900">{{ item.label }}</p>
          <p class="mt-1 text-xs leading-5 text-slate-600">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <section v-for="group in visibleGroups" :key="group.title" class="mb-8">
      <h2 class="mb-3 text-sm font-bold text-slate-700">{{ group.title }}</h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="link in group.links"
          :key="link.to"
          :to="link.to"
          class="admin-card flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <AppIcon :name="link.icon" size="md" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-slate-900">{{ link.label }}</p>
            <p class="mt-0.5 text-xs text-slate-500">{{ link.desc }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
