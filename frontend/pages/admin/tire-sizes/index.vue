<script setup lang="ts">
import type { TireSize } from '~/types';
import { formatTireSizeLabel } from '~/utils/tire';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const toast = useToast();
const { confirm } = useConfirmDialog();

const sizes = ref<TireSize[]>([]);
const loading = ref(true);
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);

const form = reactive({
  width: 205,
  aspect: 55,
  rim: 16,
  label: '',
  isActive: true,
  seoTitle: '',
  seoDescription: '',
});

const previewLabel = computed(() =>
  formatTireSizeLabel(form.width, form.aspect, form.rim) || form.label
);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const { data } = await api.get<TireSize[]>('/admin/tire-sizes');
    sizes.value = data ?? [];
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'بارگذاری انجام نشد');
  } finally {
    loading.value = false;
  }
}

function openForm(item?: TireSize) {
  if (item) {
    editingId.value = item.id;
    Object.assign(form, {
      width: item.width,
      aspect: item.aspect,
      rim: item.rim,
      label: item.label,
      isActive: item.isActive !== false,
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
    });
  } else {
    editingId.value = null;
    Object.assign(form, {
      width: 205,
      aspect: 55,
      rim: 16,
      label: '',
      isActive: true,
      seoTitle: '',
      seoDescription: '',
    });
  }
  showForm.value = true;
}

async function save() {
  if (!form.width || !form.aspect || !form.rim) {
    toast.error('عرض، نسبت و رینگ الزامی است');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      width: form.width,
      aspect: form.aspect,
      rim: form.rim,
      label: form.label || undefined,
      isActive: form.isActive,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };
    if (editingId.value) {
      await api.put(`/admin/tire-sizes/${editingId.value}`, payload);
      toast.success('سایز به‌روز شد');
    } else {
      await api.post('/admin/tire-sizes', payload);
      toast.success('سایز ثبت شد');
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
  const ok = await confirm({
    title: 'حذف سایز',
    message: 'این سایز لاستیک حذف می‌شود.',
    confirmText: 'حذف سایز',
  });
  if (!ok) return;
  try {
    await api.delete(`/admin/tire-sizes/${id}`);
    toast.success('حذف شد');
    await loadData();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف انجام نشد');
  }
}

useHead({ title: 'سایزهای لاستیک — پنل مدیریت' });
</script>

<template>
  <div>
    <AdminPageHeader
      title="سایزهای لاستیک"
      description="سایزهای استاندارد برای جستجو، فیلتر فروشگاه و اتصال به خودروها."
    >
      <template #actions>
        <button type="button" class="btn-primary !py-2 !px-4 text-sm" @click="openForm()">افزودن سایز</button>
      </template>
    </AdminPageHeader>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="data-table-wrap">
      <table class="data-table min-w-[640px]">
        <thead>
          <tr>
            <th>برچسب</th>
            <th class="data-num">عرض</th>
            <th class="data-num">نسبت</th>
            <th class="data-num">رینگ</th>
            <th class="data-num">محصول</th>
            <th>وضعیت</th>
            <th class="data-actions">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="size in sizes" :key="size.id">
            <td class="font-semibold" dir="ltr">{{ size.label }}</td>
            <td class="data-num" dir="ltr">{{ size.width }}</td>
            <td class="data-num" dir="ltr">{{ size.aspect }}</td>
            <td class="data-num" dir="ltr">{{ size.rim }}</td>
            <td class="data-num">{{ size._count?.products ?? 0 }}</td>
            <td>
              <span :class="size.isActive !== false ? 'admin-badge-success' : 'admin-badge-danger'">
                {{ size.isActive !== false ? 'فعال' : 'غیرفعال' }}
              </span>
            </td>
            <td class="data-actions">
              <div class="admin-actions">
                <button type="button" class="admin-btn-secondary" @click="openForm(size)">ویرایش</button>
                <button type="button" class="admin-btn-danger" @click="remove(size.id)">حذف</button>
              </div>
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
      <div class="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 class="mb-4 text-lg font-bold">{{ editingId ? 'ویرایش سایز' : 'افزودن سایز' }}</h2>
        <form class="space-y-3" @submit.prevent="save">
          <div class="grid grid-cols-3 gap-2">
            <input v-model.number="form.width" type="number" min="1" required class="input-field" placeholder="عرض" dir="ltr" />
            <input v-model.number="form.aspect" type="number" min="1" required class="input-field" placeholder="نسبت" dir="ltr" />
            <input v-model.number="form.rim" type="number" min="1" required class="input-field" placeholder="رینگ" dir="ltr" />
          </div>
          <p class="text-center text-sm font-semibold text-gray-600" dir="ltr">{{ previewLabel }}</p>
          <input v-model="form.label" class="input-field" placeholder="برچسب (اختیاری — پیش‌فرض از سایز)" dir="ltr" />
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.isActive" type="checkbox" /> فعال
          </label>
          <button type="submit" class="btn-primary w-full" :disabled="saving">
            {{ saving ? 'در حال ذخیره…' : 'ذخیره' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
