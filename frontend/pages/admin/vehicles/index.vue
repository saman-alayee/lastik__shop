<script setup lang="ts">
import type { TireSize, VehicleFitment, VehicleMake, VehicleModel, VehicleTrim } from '~/types';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const toast = useToast();
const { confirm } = useConfirmDialog();

type FormKind = 'make' | 'model' | 'trim' | 'fitment';

const makes = ref<VehicleMake[]>([]);
const tireSizes = ref<TireSize[]>([]);
const fitments = ref<VehicleFitment[]>([]);
const loading = ref(true);

const expandedMakes = ref<Set<string>>(new Set());
const expandedModels = ref<Set<string>>(new Set());

const showForm = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const formKind = ref<FormKind>('make');
const kindLocked = ref(false);

const makeForm = reactive({
  name: '',
  nameEn: '',
  sortOrder: 0,
  isActive: true,
});

const modelForm = reactive({
  makeId: '',
  name: '',
  nameEn: '',
  sortOrder: 0,
  isActive: true,
});

const trimForm = reactive({
  modelId: '',
  name: '',
  sortOrder: 0,
  isActive: true,
});

const fitmentForm = reactive({
  modelId: '',
  trimId: '' as string | null,
  tireSizeId: '',
  tireSizeIds: [] as string[],
  yearFrom: null as number | null,
  yearTo: null as number | null,
  isStandard: true,
  note: '',
});

const allModels = computed(() => makes.value.flatMap((m) => m.models ?? []));

const makeSelectOptions = computed(() =>
  makes.value.map((make) => ({ value: make.id, label: make.name, icon: 'lucide:factory' }))
);

const modelSelectOptions = computed(() =>
  allModels.value.map((model) => ({
    value: model.id,
    label: modelLabel(model.id),
    icon: 'lucide:car',
  }))
);

const fitmentModelOptions = computed(() => modelSelectOptions.value);

const trimsForFitmentModel = computed(() => {
  const model = allModels.value.find((m) => m.id === fitmentForm.modelId);
  return model?.trims ?? [];
});

const fitmentTrimOptions = computed(() => [
  { value: '', label: 'بدون تیپ (برای کل مدل)' },
  ...trimsForFitmentModel.value.map((trim) => ({ value: trim.id, label: trim.name })),
]);

const tireSizeSelectOptions = computed(() =>
  tireSizes.value.map((size) => ({ value: size.id, label: size.label, icon: 'shop:rim' }))
);

const fitmentTrimId = computed({
  get: () => fitmentForm.trimId ?? '',
  set: (value: string | number) => {
    fitmentForm.trimId = value ? String(value) : null;
  },
});

const kindOptions: { key: FormKind; label: string; icon: string }[] = [
  { key: 'make', label: 'برند', icon: 'lucide:factory' },
  { key: 'model', label: 'مدل', icon: 'lucide:car' },
  { key: 'trim', label: 'تیپ', icon: 'lucide:list' },
  { key: 'fitment', label: 'سایز استاندارد', icon: 'lucide:link' },
];

const modalTitle = computed(() => {
  const label = kindOptions.find((k) => k.key === formKind.value)?.label ?? '';
  return editingId.value ? `ویرایش ${label}` : `افزودن ${label}`;
});

const treeRows = computed(() => {
  return makes.value.map((make) => {
    const models = (make.models ?? []).map((model) => {
      const modelFitments = fitments.value.filter((f) => f.modelId === model.id);
      return {
        model,
        trims: model.trims ?? [],
        fitments: modelFitments,
        fitmentCount: modelFitments.length,
        trimCount: model.trims?.length ?? 0,
      };
    });
    return {
      make,
      models,
      modelCount: models.length,
      fitmentCount: models.reduce((sum, m) => sum + m.fitmentCount, 0),
    };
  });
});

onMounted(loadAll);

async function loadAll() {
  loading.value = true;
  try {
    const [makesRes, sizesRes, fitRes] = await Promise.all([
      api.get<VehicleMake[]>('/admin/vehicles/makes'),
      api.get<TireSize[]>('/admin/tire-sizes'),
      api.get<VehicleFitment[]>('/admin/vehicle-fitments'),
    ]);
    makes.value = makesRes.data ?? [];
    tireSizes.value = sizesRes.data ?? [];
    fitments.value = fitRes.data ?? [];

    if (!expandedMakes.value.size && makes.value.length) {
      expandedMakes.value = new Set(makes.value.slice(0, 3).map((m) => m.id));
    }
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'بارگذاری انجام نشد');
  } finally {
    loading.value = false;
  }
}

function modelLabel(id: string) {
  const m = allModels.value.find((x) => x.id === id);
  if (!m) return id;
  const make = makes.value.find((mk) => mk.id === m.makeId);
  return `${make?.name ?? ''} ${m.name}`.trim();
}

function toggleMake(id: string) {
  const next = new Set(expandedMakes.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedMakes.value = next;
}

function toggleModel(id: string) {
  const next = new Set(expandedModels.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedModels.value = next;
}

function expandAll() {
  expandedMakes.value = new Set(makes.value.map((m) => m.id));
  expandedModels.value = new Set(allModels.value.map((m) => m.id));
}

function collapseAll() {
  expandedMakes.value = new Set();
  expandedModels.value = new Set();
}

function resetForms() {
  Object.assign(makeForm, { name: '', nameEn: '', sortOrder: 0, isActive: true });
  Object.assign(modelForm, {
    makeId: makes.value[0]?.id ?? '',
    name: '',
    nameEn: '',
    sortOrder: 0,
    isActive: true,
  });
  Object.assign(trimForm, {
    modelId: allModels.value[0]?.id ?? '',
    name: '',
    sortOrder: 0,
    isActive: true,
  });
  Object.assign(fitmentForm, {
    modelId: allModels.value[0]?.id ?? '',
    trimId: '',
    tireSizeId: '',
    tireSizeIds: [],
    yearFrom: null,
    yearTo: null,
    isStandard: true,
    note: '',
  });
}

function openAddModal(kind: FormKind = 'make', preset?: { makeId?: string; modelId?: string }) {
  editingId.value = null;
  formKind.value = kind;
  kindLocked.value = Boolean(preset?.makeId || preset?.modelId);
  resetForms();
  if (preset?.makeId) modelForm.makeId = preset.makeId;
  if (preset?.modelId) {
    trimForm.modelId = preset.modelId;
    fitmentForm.modelId = preset.modelId;
  }
  showForm.value = true;
}

function openEditMake(item: VehicleMake) {
  editingId.value = item.id;
  formKind.value = 'make';
  kindLocked.value = true;
  Object.assign(makeForm, {
    name: item.name ?? '',
    nameEn: item.nameEn ?? '',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive ?? true,
  });
  showForm.value = true;
}

function openEditModel(item: VehicleModel) {
  editingId.value = item.id;
  formKind.value = 'model';
  kindLocked.value = true;
  Object.assign(modelForm, {
    makeId: item.makeId,
    name: item.name ?? '',
    nameEn: item.nameEn ?? '',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive ?? true,
  });
  showForm.value = true;
}

function openEditTrim(item: VehicleTrim) {
  editingId.value = item.id;
  formKind.value = 'trim';
  kindLocked.value = true;
  Object.assign(trimForm, {
    modelId: item.modelId,
    name: item.name ?? '',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive ?? true,
  });
  showForm.value = true;
}

function openEditFitment(item: VehicleFitment) {
  editingId.value = item.id;
  formKind.value = 'fitment';
  kindLocked.value = true;
  Object.assign(fitmentForm, {
    modelId: item.modelId,
    trimId: item.trimId ?? '',
    tireSizeId: item.tireSizeId,
    tireSizeIds: [item.tireSizeId],
    yearFrom: item.yearFrom ?? null,
    yearTo: item.yearTo ?? null,
    isStandard: item.isStandard ?? true,
    note: item.note ?? '',
  });
  showForm.value = true;
}

async function saveMake() {
  if (!makeForm.name.trim()) {
    toast.error('نام برند الزامی است');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...makeForm,
      nameEn: makeForm.nameEn || undefined,
    };
    if (editingId.value) {
      await api.put(`/admin/vehicles/makes/${editingId.value}`, payload);
      toast.success('برند به‌روز شد');
    } else {
      await api.post('/admin/vehicles/makes', payload);
      toast.success('برند ثبت شد');
    }
    showForm.value = false;
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره');
  } finally {
    saving.value = false;
  }
}

async function saveModel() {
  if (!modelForm.makeId || !modelForm.name.trim()) {
    toast.error('برند و نام مدل الزامی است');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...modelForm,
      nameEn: modelForm.nameEn || undefined,
    };
    if (editingId.value) {
      await api.put(`/admin/vehicles/models/${editingId.value}`, payload);
      toast.success('مدل به‌روز شد');
    } else {
      const { data } = await api.post<VehicleModel>('/admin/vehicles/models', payload);
      toast.success('مدل ثبت شد');
      if (data?.makeId) {
        expandedMakes.value = new Set([...expandedMakes.value, data.makeId]);
      }
    }
    showForm.value = false;
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره');
  } finally {
    saving.value = false;
  }
}

async function saveTrim() {
  if (!trimForm.modelId || !trimForm.name.trim()) {
    toast.error('مدل و نام تیپ الزامی است');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/admin/vehicles/trims/${editingId.value}`, { ...trimForm });
      toast.success('تیپ به‌روز شد');
    } else {
      await api.post('/admin/vehicles/trims', { ...trimForm });
      toast.success('تیپ ثبت شد');
      expandedModels.value = new Set([...expandedModels.value, trimForm.modelId]);
    }
    showForm.value = false;
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره');
  } finally {
    saving.value = false;
  }
}

async function saveFitment() {
  const sizeIds = editingId.value
    ? fitmentForm.tireSizeId
      ? [fitmentForm.tireSizeId]
      : []
    : fitmentForm.tireSizeIds.filter(Boolean);

  if (!fitmentForm.modelId || !sizeIds.length) {
    toast.error('مدل و حداقل یک سایز لاستیک الزامی است');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/admin/vehicle-fitments/${editingId.value}`, {
        modelId: fitmentForm.modelId,
        trimId: fitmentForm.trimId || null,
        tireSizeId: sizeIds[0],
        yearFrom: fitmentForm.yearFrom,
        yearTo: fitmentForm.yearTo,
        isStandard: fitmentForm.isStandard,
        note: fitmentForm.note || null,
      });
      toast.success('سایز به‌روز شد');
    } else {
      await api.post('/admin/vehicle-fitments', {
        modelId: fitmentForm.modelId,
        trimId: fitmentForm.trimId || null,
        tireSizeIds: sizeIds,
        yearFrom: fitmentForm.yearFrom,
        yearTo: fitmentForm.yearTo,
        isStandard: fitmentForm.isStandard,
        note: fitmentForm.note || null,
      });
      toast.success(
        sizeIds.length > 1 ? `${sizeIds.length} سایز ثبت شد` : 'سایز استاندارد ثبت شد'
      );
      expandedModels.value = new Set([...expandedModels.value, fitmentForm.modelId]);
      const model = allModels.value.find((m) => m.id === fitmentForm.modelId);
      if (model?.makeId) {
        expandedMakes.value = new Set([...expandedMakes.value, model.makeId]);
      }
    }
    showForm.value = false;
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'خطا در ذخیره');
  } finally {
    saving.value = false;
  }
}

async function removeMake(id: string) {
  const ok = await confirm({
    title: 'حذف برند',
    message: 'برند و تمام مدل‌های زیرمجموعه حذف می‌شوند. این کار قابل بازگشت نیست.',
    confirmText: 'حذف برند',
  });
  if (!ok) return;
  try {
    await api.delete(`/admin/vehicles/makes/${id}`);
    toast.success('حذف شد');
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف انجام نشد');
  }
}

async function removeModel(id: string) {
  const ok = await confirm({
    title: 'حذف مدل',
    message: 'مدل همراه با تیپ‌ها و سایزهای زیرمجموعه حذف می‌شود.',
    confirmText: 'حذف مدل',
  });
  if (!ok) return;
  try {
    await api.delete(`/admin/vehicles/models/${id}`);
    toast.success('حذف شد');
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف انجام نشد');
  }
}

async function removeTrim(id: string) {
  const ok = await confirm({
    title: 'حذف تیپ',
    message: 'این تیپ از مدل خودرو حذف می‌شود.',
    confirmText: 'حذف تیپ',
  });
  if (!ok) return;
  try {
    await api.delete(`/admin/vehicles/trims/${id}`);
    toast.success('حذف شد');
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف انجام نشد');
  }
}

async function removeFitment(id: string) {
  const ok = await confirm({
    title: 'حذف سایز',
    message: 'این سایز از لیست سایزهای خودرو حذف می‌شود.',
    confirmText: 'حذف سایز',
  });
  if (!ok) return;
  try {
    await api.delete(`/admin/vehicle-fitments/${id}`);
    toast.success('حذف شد');
    await loadAll();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'حذف انجام نشد');
  }
}

function onSubmit() {
  if (formKind.value === 'make') void saveMake();
  else if (formKind.value === 'model') void saveModel();
  else if (formKind.value === 'trim') void saveTrim();
  else void saveFitment();
}

useHead({ title: 'خودرو و سایز — پنل مدیریت' });
</script>

<template>
  <div>
    <AdminPageHeader
      title="خودرو و fitment"
      description="همه برندها، مدل‌ها، تیپ‌ها و سایزهای استاندارد در یک جدول زیرمجموعه‌ای. افزودن از یک پاپ‌آپ."
    >
      <template #actions>
        <NuxtLink to="/admin/tire-sizes" class="btn-secondary !py-2 !px-4 text-sm">
          سایزهای لاستیک
        </NuxtLink>
        <button type="button" class="btn-secondary !py-2 !px-4 text-sm" @click="expandAll">
          باز کردن همه
        </button>
        <button type="button" class="btn-secondary !py-2 !px-4 text-sm" @click="collapseAll">
          بستن همه
        </button>
        <button type="button" class="btn-primary !py-2 !px-4 text-sm" @click="openAddModal('make')">
          افزودن
        </button>
      </template>
    </AdminPageHeader>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="data-table-wrap vehicle-tree">
      <table class="data-table min-w-[920px]">
        <thead>
          <tr>
            <th>خودرو / زیرمجموعه</th>
            <th>جزئیات</th>
            <th>وضعیت</th>
            <th class="data-actions">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in treeRows" :key="row.make.id">
            <tr class="vehicle-tree__make">
              <td>
                <button type="button" class="vehicle-tree__toggle" @click="toggleMake(row.make.id)">
                  <AppIcon
                    :name="expandedMakes.has(row.make.id) ? 'lucide:chevron-down' : 'lucide:chevron-left'"
                    size="sm"
                  />
                  <AppIcon name="lucide:factory" size="sm" class="text-slate-400" />
                  <span class="font-bold text-slate-900">{{ row.make.name }}</span>
                </button>
              </td>
              <td class="text-xs text-slate-500">
                {{ row.modelCount }} مدل · {{ row.fitmentCount }} سایز
              </td>
              <td>
                <span :class="row.make.isActive !== false ? 'admin-badge-success' : 'admin-badge-danger'">
                  {{ row.make.isActive !== false ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td class="data-actions">
                <div class="admin-actions">
                  <button
                    type="button"
                    class="admin-btn-secondary"
                    @click="openAddModal('model', { makeId: row.make.id })"
                  >
                    + مدل
                  </button>
                  <button type="button" class="admin-btn-secondary" @click="openEditMake(row.make)">
                    ویرایش
                  </button>
                  <button type="button" class="admin-btn-danger" @click="removeMake(row.make.id)">
                    حذف
                  </button>
                </div>
              </td>
            </tr>

            <template v-if="expandedMakes.has(row.make.id)">
              <tr v-if="!row.models.length" class="vehicle-tree__empty">
                <td colspan="4" class="ps-12 text-xs text-slate-400">هنوز مدلی برای این برند ثبت نشده.</td>
              </tr>

              <template v-for="child in row.models" :key="child.model.id">
                <tr class="vehicle-tree__model">
                  <td>
                    <button
                      type="button"
                      class="vehicle-tree__toggle vehicle-tree__toggle--model"
                      @click="toggleModel(child.model.id)"
                    >
                      <AppIcon
                        :name="
                          expandedModels.has(child.model.id)
                            ? 'lucide:chevron-down'
                            : 'lucide:chevron-left'
                        "
                        size="sm"
                      />
                      <AppIcon name="lucide:car" size="sm" class="text-slate-400" />
                      <span class="font-semibold text-slate-800">{{ child.model.name }}</span>
                    </button>
                  </td>
                  <td class="text-xs text-slate-500">
                    {{ child.trimCount }} تیپ · {{ child.fitmentCount }} سایز
                  </td>
                  <td>
                    <span
                      :class="
                        child.model.isActive !== false ? 'admin-badge-success' : 'admin-badge-danger'
                      "
                    >
                      {{ child.model.isActive !== false ? 'فعال' : 'غیرفعال' }}
                    </span>
                  </td>
                  <td class="data-actions">
                    <div class="admin-actions">
                      <button
                        type="button"
                        class="admin-btn-secondary"
                        @click="openAddModal('trim', { modelId: child.model.id })"
                      >
                        + تیپ
                      </button>
                      <button
                        type="button"
                        class="admin-btn-secondary"
                        @click="openAddModal('fitment', { modelId: child.model.id })"
                      >
                        + سایز
                      </button>
                      <button
                        type="button"
                        class="admin-btn-secondary"
                        @click="openEditModel(child.model)"
                      >
                        ویرایش
                      </button>
                      <button
                        type="button"
                        class="admin-btn-danger"
                        @click="removeModel(child.model.id)"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>

                <template v-if="expandedModels.has(child.model.id)">
                  <tr
                    v-if="!child.trims.length && !child.fitments.length"
                    class="vehicle-tree__empty"
                  >
                    <td colspan="4" class="ps-16 text-xs text-slate-400">
                      تیپ یا سایز استانداردی ثبت نشده.
                    </td>
                  </tr>

                  <tr
                    v-for="trim in child.trims"
                    :key="`trim-${trim.id}`"
                    class="vehicle-tree__leaf"
                  >
                    <td>
                      <div class="vehicle-tree__leaf-label vehicle-tree__leaf-label--trim">
                        <span class="vehicle-tree__badge">تیپ</span>
                        <span>{{ trim.name }}</span>
                      </div>
                    </td>
                    <td class="text-xs text-slate-500" dir="ltr">ترتیب {{ trim.sortOrder ?? 0 }}</td>
                    <td>
                      <span
                        :class="trim.isActive !== false ? 'admin-badge-success' : 'admin-badge-danger'"
                      >
                        {{ trim.isActive !== false ? 'فعال' : 'غیرفعال' }}
                      </span>
                    </td>
                    <td class="data-actions">
                      <div class="admin-actions">
                        <button type="button" class="admin-btn-secondary" @click="openEditTrim(trim)">
                          ویرایش
                        </button>
                        <button type="button" class="admin-btn-danger" @click="removeTrim(trim.id)">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr
                    v-for="fit in child.fitments"
                    :key="`fit-${fit.id}`"
                    class="vehicle-tree__leaf"
                  >
                    <td>
                      <div class="vehicle-tree__leaf-label vehicle-tree__leaf-label--fit">
                        <span class="vehicle-tree__badge vehicle-tree__badge--fit">سایز</span>
                        <span dir="ltr" class="font-semibold">{{
                          fit.tireSize?.label || fit.tireSizeId
                        }}</span>
                        <span v-if="fit.isStandard" class="vehicle-tree__star" title="استاندارد">★</span>
                      </div>
                    </td>
                    <td class="text-xs text-slate-500">
                      <span>{{ fit.trim?.name || 'کل مدل' }}</span>
                      <span class="mx-1">·</span>
                      <span dir="ltr">{{ fit.yearFrom ?? '—' }}–{{ fit.yearTo ?? '—' }}</span>
                      <span v-if="fit.note" class="ms-1 text-slate-400">({{ fit.note }})</span>
                    </td>
                    <td>
                      <span :class="fit.isStandard ? 'admin-badge-success' : 'admin-badge-muted'">
                        {{ fit.isStandard ? 'استاندارد' : 'جایگزین' }}
                      </span>
                    </td>
                    <td class="data-actions">
                      <div class="admin-actions">
                        <button
                          type="button"
                          class="admin-btn-secondary"
                          @click="openEditFitment(fit)"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          class="admin-btn-danger"
                          @click="removeFitment(fit.id)"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </template>

          <tr v-if="!treeRows.length">
            <td colspan="4" class="py-10 text-center text-sm text-slate-400">
              هنوز برندی ثبت نشده. از دکمه «افزودن» شروع کنید.
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
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div class="mb-4 flex items-start justify-between gap-3">
          <h2 class="text-lg font-bold text-slate-900">{{ modalTitle }}</h2>
          <button type="button" class="text-slate-400 hover:text-slate-700" @click="showForm = false">
            <AppIcon name="lucide:x" size="md" />
          </button>
        </div>

        <div v-if="!editingId && !kindLocked" class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="opt in kindOptions"
            :key="opt.key"
            type="button"
            class="vehicle-kind"
            :class="{ 'is-active': formKind === opt.key }"
            @click="formKind = opt.key"
          >
            <AppIcon :name="opt.icon" size="sm" />
            {{ opt.label }}
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="onSubmit">
          <template v-if="formKind === 'make'">
            <label class="vehicle-field">
              <span>نام برند</span>
              <input v-model="makeForm.name" required class="input-field" placeholder="مثلاً پژو" />
            </label>
            <label class="vehicle-field">
              <span>نام انگلیسی</span>
              <input
                v-model="makeForm.nameEn"
                class="input-field"
                placeholder="مثلاً Peugeot (اختیاری)"
                dir="ltr"
              />
            </label>
            <label class="vehicle-field">
              <span>ترتیب نمایش</span>
              <input
                v-model.number="makeForm.sortOrder"
                type="number"
                class="input-field"
                placeholder="مثلاً ۱"
                dir="ltr"
              />
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="makeForm.isActive" type="checkbox" /> فعال
            </label>
          </template>

          <template v-else-if="formKind === 'model'">
            <label class="vehicle-field">
              <span>برند خودرو</span>
              <AppSelect
                v-model="modelForm.makeId"
                :options="makeSelectOptions"
                placeholder="انتخاب برند"
                searchable
              />
            </label>
            <label class="vehicle-field">
              <span>نام مدل</span>
              <input v-model="modelForm.name" required class="input-field" placeholder="مثلاً ۲۰۶" />
            </label>
            <label class="vehicle-field">
              <span>ترتیب نمایش</span>
              <input
                v-model.number="modelForm.sortOrder"
                type="number"
                class="input-field"
                placeholder="مثلاً ۱"
                dir="ltr"
              />
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="modelForm.isActive" type="checkbox" /> فعال
            </label>
          </template>

          <template v-else-if="formKind === 'trim'">
            <label class="vehicle-field">
              <span>مدل خودرو</span>
              <AppSelect
                v-model="trimForm.modelId"
                :options="modelSelectOptions"
                placeholder="انتخاب مدل"
                searchable
              />
            </label>
            <label class="vehicle-field">
              <span>نام تیپ</span>
              <input v-model="trimForm.name" required class="input-field" placeholder="مثلاً تیپ ۲" />
            </label>
            <label class="vehicle-field">
              <span>ترتیب نمایش</span>
              <input
                v-model.number="trimForm.sortOrder"
                type="number"
                class="input-field"
                placeholder="مثلاً ۱"
                dir="ltr"
              />
            </label>
          </template>

          <template v-else>
            <p class="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              هر مدل می‌تواند چند سایز استاندارد داشته باشد. چند سایز را یک‌جا انتخاب کنید.
            </p>
            <label class="vehicle-field">
              <span>مدل خودرو</span>
              <AppSelect
                v-model="fitmentForm.modelId"
                :options="fitmentModelOptions"
                placeholder="انتخاب مدل"
                searchable
              />
            </label>
            <label class="vehicle-field">
              <span>تیپ (اختیاری)</span>
              <AppSelect
                v-model="fitmentTrimId"
                :options="fitmentTrimOptions"
                placeholder="بدون تیپ — برای کل مدل"
                clearable
              />
            </label>
            <label v-if="editingId" class="vehicle-field">
              <span>سایز لاستیک</span>
              <AppSelect
                v-model="fitmentForm.tireSizeId"
                :options="tireSizeSelectOptions"
                placeholder="انتخاب سایز"
                searchable
              />
            </label>
            <label v-else class="vehicle-field">
              <span>سایزهای لاستیک</span>
              <AppMultiSelect
                v-model="fitmentForm.tireSizeIds"
                :options="tireSizeSelectOptions"
                placeholder="یک یا چند سایز انتخاب کنید"
                searchable
                required
              />
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="vehicle-field">
                <span>از سال ساخت</span>
                <input
                  :value="fitmentForm.yearFrom ?? ''"
                  type="number"
                  class="input-field"
                  placeholder="مثلاً ۲۰۱۰"
                  dir="ltr"
                  @input="
                    fitmentForm.yearFrom =
                      ($event.target as HTMLInputElement).value === ''
                        ? null
                        : Number(($event.target as HTMLInputElement).value)
                  "
                />
              </label>
              <label class="vehicle-field">
                <span>تا سال ساخت</span>
                <input
                  :value="fitmentForm.yearTo ?? ''"
                  type="number"
                  class="input-field"
                  placeholder="مثلاً ۲۰۲۴"
                  dir="ltr"
                  @input="
                    fitmentForm.yearTo =
                      ($event.target as HTMLInputElement).value === ''
                        ? null
                        : Number(($event.target as HTMLInputElement).value)
                  "
                />
              </label>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="fitmentForm.isStandard" type="checkbox" /> سایز استاندارد کارخانه
            </label>
            <label class="vehicle-field">
              <span>یادداشت</span>
              <input
                v-model="fitmentForm.note"
                class="input-field"
                placeholder="مثلاً رینگ آلومینیومی (اختیاری)"
              />
            </label>
          </template>

          <button type="submit" class="btn-primary w-full" :disabled="saving">
            {{ saving ? 'در حال ذخیره…' : 'ذخیره' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vehicle-tree__make td {
  background: #f8fafc;
}

.vehicle-tree__model td {
  background: #fff;
}

.vehicle-tree__leaf td {
  background: #fcfcfd;
}

.vehicle-tree__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: start;
}

.vehicle-tree__toggle--model {
  padding-inline-start: 1.25rem;
}

.vehicle-tree__leaf-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-inline-start: 2.75rem;
  font-size: 0.875rem;
}

.vehicle-tree__leaf-label--fit {
  padding-inline-start: 2.75rem;
}

.vehicle-tree__badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.65rem;
  font-weight: 800;
}

.vehicle-tree__badge--fit {
  background: #fee2e2;
  color: #b91c1c;
}

.vehicle-tree__star {
  color: #dc2626;
  font-size: 0.75rem;
}

.vehicle-field {
  display: grid;
  gap: 0.35rem;
}

.vehicle-field > span {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
}

.vehicle-kind {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 2.4rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
}

.vehicle-kind.is-active {
  border-color: #dc2626;
  background: #fef2f2;
  color: #b91c1c;
}

:deep(.admin-badge-muted) {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
}
</style>
