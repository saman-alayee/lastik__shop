import { Router } from 'express';
import { vehicleService } from '../services/vehicle.service';
import { productService } from '../services/product.service';
import { asyncHandler, successResponse } from '../utils/errors';

const router = Router();

router.get(
  '/makes',
  asyncHandler(async (_req, res) => {
    const makes = await vehicleService.listMakes(false);
    successResponse(res, makes);
  })
);

router.get(
  '/makes/:slug',
  asyncHandler(async (req, res) => {
    const make = await vehicleService.getMakeBySlug(String(req.params.slug));
    successResponse(res, make);
  })
);

router.get(
  '/makes/:makeSlug/models/:modelSlug',
  asyncHandler(async (req, res) => {
    const model = await vehicleService.getModelBySlug(
      String(req.params.makeSlug),
      String(req.params.modelSlug)
    );
    successResponse(res, model);
  })
);

router.get(
  '/sizes',
  asyncHandler(async (_req, res) => {
    const sizes = await vehicleService.listSizes(false);
    successResponse(res, sizes);
  })
);

router.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    const facets = await vehicleService.getFilterFacets();
    successResponse(res, facets);
  })
);

router.get(
  '/compatible-products',
  asyncHandler(async (req, res) => {
    const makeSlug = req.query.make as string | undefined;
    const modelSlug = req.query.model as string | undefined;
    const trimSlug = req.query.trim as string | undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const requestedSizeId =
      (req.query.tireSizeId as string | undefined) ||
      (req.query.sizeId as string | undefined) ||
      undefined;

    const sizeIds = await vehicleService.resolveCompatibleSizeIds({
      makeSlug,
      modelSlug,
      trimSlug,
      year,
    });

    // یک خودرو می‌تواند چند سایز استاندارد داشته باشد؛ در صورت انتخاب یکی، فقط همان فیلتر می‌شود.
    const filteredSizeIds =
      requestedSizeId && sizeIds.includes(requestedSizeId) ? [requestedSizeId] : sizeIds;

    const result = await productService.getAll({
      tireSizeIds: filteredSizeIds.length ? filteredSizeIds : ['__none__'],
      inStock: req.query.inStock === '1' || req.query.inStock === 'true',
      tireBrand: req.query.brand as string | undefined,
      sort: (req.query.sort as string) || 'newest',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: Math.min(req.query.limit ? Number(req.query.limit) : 24, 50),
    });

    successResponse(res, {
      ...result,
      sizeIds,
      selectedSizeId: requestedSizeId && sizeIds.includes(requestedSizeId) ? requestedSizeId : null,
      query: { makeSlug, modelSlug, trimSlug, year, tireSizeId: requestedSizeId },
    });
  })
);

export default router;
