import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/helpers';
import { formatTireSizeLabel, slugifyTireSize } from '../utils/tire';

function ensureSlug(name: string, existing?: string | null) {
  return (existing?.trim() || slugify(name) || `item-${Date.now().toString(36)}`).toLowerCase();
}

export class VehicleService {
  async listMakes(includeInactive = false) {
    return prisma.vehicleMake.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        models: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            trims: {
              where: includeInactive ? undefined : { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            },
            _count: { select: { fitments: true } },
          },
        },
        _count: { select: { models: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getMakeBySlug(slug: string) {
    const make = await prisma.vehicleMake.findUnique({
      where: { slug },
      include: {
        models: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            trims: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
          },
        },
      },
    });
    if (!make || !make.isActive) throw new AppError(404, 'برند خودرو یافت نشد');
    return make;
  }

  async getModelBySlug(makeSlug: string, modelSlug: string) {
    const make = await prisma.vehicleMake.findUnique({ where: { slug: makeSlug } });
    if (!make || !make.isActive) throw new AppError(404, 'برند خودرو یافت نشد');
    const model = await prisma.vehicleModel.findFirst({
      where: { makeId: make.id, slug: modelSlug, isActive: true },
      include: {
        make: true,
        trims: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        fitments: {
          include: { tireSize: true, trim: true },
          orderBy: [{ isStandard: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!model) throw new AppError(404, 'مدل خودرو یافت نشد');
    return model;
  }

  async createMake(data: {
    name: string;
    slug?: string;
    nameEn?: string;
    logo?: string;
    sortOrder?: number;
    isActive?: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    return prisma.vehicleMake.create({
      data: {
        name: data.name,
        slug: ensureSlug(data.name, data.slug),
        nameEn: data.nameEn || null,
        logo: data.logo || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });
  }

  async updateMake(id: string, data: Record<string, unknown>) {
    return prisma.vehicleMake.update({ where: { id }, data });
  }

  async deleteMake(id: string) {
    await prisma.vehicleMake.delete({ where: { id } });
  }

  async createModel(data: {
    makeId: string;
    name: string;
    slug?: string;
    nameEn?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    return prisma.vehicleModel.create({
      data: {
        makeId: data.makeId,
        name: data.name,
        slug: ensureSlug(data.name, data.slug),
        nameEn: data.nameEn || null,
        image: data.image || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });
  }

  async updateModel(id: string, data: Record<string, unknown>) {
    return prisma.vehicleModel.update({ where: { id }, data });
  }

  async deleteModel(id: string) {
    await prisma.vehicleModel.delete({ where: { id } });
  }

  async createTrim(data: { modelId: string; name: string; slug?: string; sortOrder?: number; isActive?: boolean }) {
    return prisma.vehicleTrim.create({
      data: {
        modelId: data.modelId,
        name: data.name,
        slug: ensureSlug(data.name, data.slug),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateTrim(id: string, data: Record<string, unknown>) {
    return prisma.vehicleTrim.update({ where: { id }, data });
  }

  async deleteTrim(id: string) {
    await prisma.vehicleTrim.delete({ where: { id } });
  }

  async listSizes(includeInactive = false) {
    return prisma.tireSize.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ rim: 'asc' }, { width: 'asc' }, { aspect: 'asc' }],
      include: { _count: { select: { products: true, fitments: true } } },
    });
  }

  async upsertSize(data: {
    width: number;
    aspect: number;
    rim: number;
    label?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    isActive?: boolean;
  }) {
    const label = data.label || formatTireSizeLabel(data.width, data.aspect, data.rim);
    const slug = data.slug || slugifyTireSize(label);
    return prisma.tireSize.upsert({
      where: { label },
      create: {
        width: data.width,
        aspect: data.aspect,
        rim: data.rim,
        label,
        slug,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        isActive: data.isActive ?? true,
      },
      update: {
        width: data.width,
        aspect: data.aspect,
        rim: data.rim,
        slug,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateSize(id: string, data: Record<string, unknown>) {
    return prisma.tireSize.update({ where: { id }, data });
  }

  async deleteSize(id: string) {
    await prisma.tireSize.delete({ where: { id } });
  }

  async listFitments(modelId?: string) {
    return prisma.vehicleFitment.findMany({
      where: modelId ? { modelId } : undefined,
      include: {
        tireSize: true,
        trim: true,
        model: { include: { make: true } },
      },
      orderBy: [{ isStandard: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createFitment(data: {
    modelId: string;
    trimId?: string | null;
    tireSizeId?: string;
    tireSizeIds?: string[];
    yearFrom?: number | null;
    yearTo?: number | null;
    isStandard?: boolean;
    note?: string | null;
  }) {
    const sizeIds = [
      ...new Set(
        (data.tireSizeIds?.length ? data.tireSizeIds : data.tireSizeId ? [data.tireSizeId] : [])
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      ),
    ];
    if (!sizeIds.length) {
      throw new AppError(400, 'حداقل یک سایز لاستیک لازم است');
    }

    const trimId = data.trimId || null;
    const yearFrom = data.yearFrom ?? null;
    const yearTo = data.yearTo ?? null;
    const isStandard = data.isStandard ?? true;
    const note = data.note || null;
    const created = [];

    for (const tireSizeId of sizeIds) {
      const existing = await prisma.vehicleFitment.findFirst({
        where: { modelId: data.modelId, tireSizeId, trimId },
      });
      if (existing) {
        created.push(
          await prisma.vehicleFitment.update({
            where: { id: existing.id },
            data: { yearFrom, yearTo, isStandard, note },
            include: { tireSize: true, trim: true },
          })
        );
        continue;
      }
      created.push(
        await prisma.vehicleFitment.create({
          data: {
            modelId: data.modelId,
            trimId,
            tireSizeId,
            yearFrom,
            yearTo,
            isStandard,
            note,
          },
          include: { tireSize: true, trim: true },
        })
      );
    }

    return sizeIds.length === 1 ? created[0] : created;
  }

  async updateFitment(id: string, data: Record<string, unknown>) {
    return prisma.vehicleFitment.update({
      where: { id },
      data,
      include: { tireSize: true, trim: true },
    });
  }

  async deleteFitment(id: string) {
    await prisma.vehicleFitment.delete({ where: { id } });
  }

  async resolveCompatibleSizeIds(params: {
    makeSlug?: string;
    modelSlug?: string;
    trimSlug?: string;
    year?: number;
  }) {
    if (!params.makeSlug || !params.modelSlug) return [];
    const make = await prisma.vehicleMake.findUnique({ where: { slug: params.makeSlug } });
    if (!make) return [];
    const model = await prisma.vehicleModel.findFirst({
      where: { makeId: make.id, slug: params.modelSlug, isActive: true },
    });
    if (!model) return [];

    let trimId: string | undefined;
    if (params.trimSlug) {
      const trim = await prisma.vehicleTrim.findFirst({
        where: { modelId: model.id, slug: params.trimSlug, isActive: true },
      });
      trimId = trim?.id;
    }

    const fitments = await prisma.vehicleFitment.findMany({
      where: {
        modelId: model.id,
        ...(trimId ? { OR: [{ trimId }, { trimId: null }] } : {}),
        ...(params.year
          ? {
              AND: [
                { OR: [{ yearFrom: null }, { yearFrom: { lte: params.year } }] },
                { OR: [{ yearTo: null }, { yearTo: { gte: params.year } }] },
              ],
            }
          : {}),
      },
      select: { tireSizeId: true },
    });

    return [...new Set(fitments.map((f) => f.tireSizeId))];
  }

  async getFilterFacets() {
    const [
      brands,
      countries,
      seasons,
      usageTypes,
      years,
      widths,
      aspects,
      rims,
      loadIndexes,
      speedIndexes,
      patterns,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, tireBrand: { not: null } },
        distinct: ['tireBrand'],
        select: { tireBrand: true },
        orderBy: { tireBrand: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireCountry: { not: null } },
        distinct: ['tireCountry'],
        select: { tireCountry: true },
        orderBy: { tireCountry: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireSeason: { not: null } },
        distinct: ['tireSeason'],
        select: { tireSeason: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireUsageType: { not: null } },
        distinct: ['tireUsageType'],
        select: { tireUsageType: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireYear: { not: null } },
        distinct: ['tireYear'],
        select: { tireYear: true },
        orderBy: { tireYear: 'desc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireWidth: { not: null } },
        distinct: ['tireWidth'],
        select: { tireWidth: true },
        orderBy: { tireWidth: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireAspect: { not: null } },
        distinct: ['tireAspect'],
        select: { tireAspect: true },
        orderBy: { tireAspect: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireRim: { not: null } },
        distinct: ['tireRim'],
        select: { tireRim: true },
        orderBy: { tireRim: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireLoadIndex: { not: null } },
        distinct: ['tireLoadIndex'],
        select: { tireLoadIndex: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, tireSpeedIndex: { not: null } },
        distinct: ['tireSpeedIndex'],
        select: { tireSpeedIndex: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, tirePattern: { not: null } },
        distinct: ['tirePattern'],
        select: { tirePattern: true },
        orderBy: { tirePattern: 'asc' },
        take: 80,
      }),
    ]);

    const priceAgg = await prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
    });

    return {
      brands: brands.map((b) => b.tireBrand!).filter(Boolean),
      countries: countries.map((c) => c.tireCountry!).filter(Boolean),
      seasons: seasons.map((s) => s.tireSeason!).filter(Boolean),
      usageTypes: usageTypes.map((u) => u.tireUsageType!).filter(Boolean),
      years: years.map((y) => y.tireYear!).filter((y) => y != null),
      widths: widths.map((w) => w.tireWidth!).filter((w) => w != null),
      aspects: aspects.map((a) => a.tireAspect!).filter((a) => a != null),
      rims: rims.map((r) => r.tireRim!).filter((r) => r != null),
      loadIndexes: loadIndexes
        .map((l) => l.tireLoadIndex!)
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b, 'fa')),
      speedIndexes: speedIndexes
        .map((s) => s.tireSpeedIndex!)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'en')),
      patterns: patterns.map((p) => p.tirePattern!).filter(Boolean),
      priceMin: priceAgg._min.price ?? 0,
      priceMax: priceAgg._max.price ?? 0,
    };
  }
}

export const vehicleService = new VehicleService();
