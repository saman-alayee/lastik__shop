<script setup lang="ts">
import type { Category } from '~/types';
import { STORE_MODE } from '~/constants/site';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const isTireStore = STORE_MODE === 'tire';
const api = useApi();
const toast = useToast();
const { confirm } = useConfirmDialog();
const { resolveMediaUrl } = useFormat();

const categories = ref<Category[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const showAdvanced = ref(false);

const form = reactive({
  name: '',
  sortOrder: 0,
  isActive: true,
  showOnHome: true,
  image: null as string | null,
});

const pageTitle = computed(() => (isTireStore ? 'برندها / دسته‌ها' : 'دسته‌بندی‌ها'));
const itemLabel = computed(() => (isTireStore ? 'برند' : 'دسته‌بندی'));

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const { data } = await api.get<Category[]>('/admin/categories');
    categories.value = data;
  } finally {
    loading.value = false;
  }
}

function openForm(category?: Category) {
  showAdvanced.value = false;
  if (category) {
    editingId.value = category.id;
    form.name = category.name;
    form.sortOrder = category.sortOrder;
    form.isActive = category.isActive;
    form.showOnHome = Boolean(category.showOnHome);
    form.image = category.image;
  } else {
    editingId.value = null;
    form.name = '';
    form.sortOrder = categories.value.length;
    form.isActive = true;
    form.showOnHome = true;
    form.image = null;
  }
  showForm.value = true;
}

async function save() {
  if (!form.name.trim()) {
    toast.error(`نام ${itemLabel.value} را وارد کنید`);
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/admin/categories/${editingId.value}`, { ...form });
      toast.success(`${itemLabel.value} به‌روز شد`);
    } else {
      await api.post('/admin/categories', { ...form });
      toast.success(`${itemLabel.value} اضافه شد`);
    }
    showForm.value = false;
    await loadData();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره');
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  const category = categories.value.find((item) => item.id === id);
  const productCount = category?._count?.products ?? 0;
  if (productCount > 0) {
    toast.error(
      `روی این ${itemLabel.value} هنوز ${productCount} محصول هست. اول محصولات را جابه‌جا یا غیرفعال کنید.`
    );
    return;
  }
  const ok = await confirm({
    title: `حذف ${itemLabel.value}`,
    message: `${itemLabel.value} «${category?.name || ''}» حذف شود؟`,
    confirmText: 'حذف',
  });
  if (!ok) return;

  try {
    await api.delete(`/admin/categories/${id}`);
    toast.success('حذف شد');
    await loadData();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'خطا در حذف';
    toast.error(message.includes('محصول') ? message : 'حذف انجام نشد.');
  }
}

useHead({ title: `${pageTitle.value} - پنل مدیریت` });
</script>

<template>
  <div>
    <AdminPageHeader
      :title="pageTitle"
      :description="
        isTireStore
          ? 'اینجا برندهای لاستیک را می‌سازید (مثل نکسین). بعد موقع افزودن محصول همان برند را انتخاب می‌کنید.'
          : 'دسته‌بندی‌های فروشگاه را مدیریت کنید.'
      "
    >
      <template #actions>
        <button class="btn-primary !py-2 !px-4 text-sm" @click="openForm()">
          + افزودن {{ itemLabel }}
        </button>
      </template>
    </AdminPageHeader>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="data-table-wrap">
      <table class="data-table min-w-[720px]">
        <thead>
          <tr>
            <th class="w-24">تصویر</th>
            <th>نام</th>
            <th class="data-num">محصول</th>
            <th>وضعیت</th>
            <th class="data-actions">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td>
              <div class="flex h-12 w-[4.5rem] items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-[#f7f1e8]">
                <img
                  v-if="cat.image"
                  :src="resolveMediaUrl(cat.image)"
                  :alt="cat.name"
                  class="h-full w-full object-cover"
                />
                <AppIcon v-else name="lucide:image" size="md" class="text-slate-300" />
              </div>
            </td>
            <td class="font-semibold text-slate-800">{{ cat.name }}</td>
            <td class="data-num">{{ cat._count?.products || 0 }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span :class="cat.isActive ? 'admin-badge-success' : 'admin-badge-danger'">
                  {{ cat.isActive ? 'فعال' : 'غیرفعال' }}
                </span>
                <span v-if="cat.showOnHome" class="admin-badge-info">صفحه اول</span>
              </div>
            </td>
            <td class="data-actions">
              <div class="admin-actions">
                <button type="button" class="admin-btn-secondary" @click="openForm(cat)">ویرایش</button>
                <button
                  type="button"
                  class="admin-btn-danger"
                  :disabled="(cat._count?.products ?? 0) > 0"
                  :title="
                    (cat._count?.products ?? 0) > 0
                      ? 'اول محصولات این مورد را جابه‌جا کنید'
                      : 'حذف'
                  "
                  @click="remove(cat.id)"
                >
                  حذف
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!categories.length">
            <td colspan="5" class="py-10 text-center text-sm text-slate-400">
              هنوز {{ itemLabel }}ی ثبت نشده. از دکمه افزودن شروع کنید.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showForm = false"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6">
        <h2 class="mb-1 text-lg font-bold">
          {{ editingId ? `ویرایش ${itemLabel}` : `افزودن ${itemLabel}` }}
        </h2>
        <p class="mb-4 text-xs leading-5 text-gray-500">
          {{
            isTireStore
              ? 'فقط نام برند کافی است. تصویر برای صفحه اصلی اختیاری است.'
              : 'نام دسته را وارد کنید.'
          }}
        </p>
        <form class="space-y-3" @submit.prevent="save">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold text-gray-600">
              نام {{ isTireStore ? 'برند' : 'دسته' }}
            </span>
            <input
              v-model="form.name"
              required
              :placeholder="isTireStore ? 'مثلاً نکسین' : 'نام دسته‌بندی'"
              class="input-field"
            />
          </label>

          <AppImageUpload
            v-model="form.image"
            upload-endpoint="/admin/categories/upload"
            :label="isTireStore ? 'لوگو یا عکس برند (اختیاری)' : 'تصویر دسته'"
            hint="اگر می‌خواهید در صفحه اصلی دیده شود، عکس بگذارید"
            preview-class="w-full aspect-[2/1] max-h-40 object-cover rounded-xl bg-[#f7f1e8]"
          />

          <AppSwitch
            v-model="form.isActive"
            :label="`${itemLabel} فعال باشد`"
            description="در فروشگاه و انتخاب محصول دیده شود"
          />
          <AppSwitch
            v-model="form.showOnHome"
            label="نمایش در صفحه اصلی"
            :description="isTireStore ? 'کارت این برند بالای فروشگاه دیده شود' : 'کارت دسته در صفحه اصلی'"
          />

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
            @click="showAdvanced = !showAdvanced"
          >
            <span>تنظیمات بیشتر</span>
            <AppIcon
              name="lucide:chevron-down"
              size="sm"
              class="transition-transform"
              :class="{ 'rotate-180': showAdvanced }"
            />
          </button>

          <label v-if="showAdvanced" class="block">
            <span class="mb-1 block text-xs font-semibold text-gray-600">اولویت نمایش</span>
            <input
              v-model.number="form.sortOrder"
              type="number"
              class="input-field"
              placeholder="عدد کوچکتر = بالاتر"
              dir="ltr"
            />
            <p class="mt-1 text-[11px] text-gray-400">معمولاً لازم نیست تغییر دهید.</p>
          </label>

          <button type="submit" class="btn-primary w-full" :disabled="saving">
            {{ saving ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : `ثبت ${itemLabel}` }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
