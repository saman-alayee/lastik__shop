<script setup lang="ts">
import type { Category, HomeSections, Product, TireFilterFacets, VehicleMake } from '~/types';
import { SITE_DESCRIPTION, SITE_NAME, STORE_MODE } from '~/constants/site';
import { FEATURED_BRANDS, brandLogoPath, normalizeBrandKey } from '~/constants/brandLogos';

const isTireStore = STORE_MODE === 'tire';
/** Max items for home curated / newest strip (matches admin home-picks limit). */
const HOME_SECTION_LIMIT = 10;

definePageMeta({ layout: 'home' });

const api = useApi();

const newestProducts = ref<Product[]>([]);
const specialProducts = ref<Product[]>([]);
const bestsellerProducts = ref<Product[]>([]);
const sectionsLoading = ref(true);
const tireBrands = ref<string[]>([]);
const tireMakes = ref<VehicleMake[]>([]);
const brandCategories = ref<Category[]>([]);

const homeBrandCards = computed(() => {
  const cats = brandCategories.value;
  const names = [...tireBrands.value];
  for (const featured of FEATURED_BRANDS) {
    if (!names.some((n) => normalizeBrandKey(n) === normalizeBrandKey(featured.name))) {
      names.push(featured.name);
    }
  }
  return names.slice(0, 20).map((name) => {
    const key = normalizeBrandKey(name);
    const cat = cats.find(
      (c) =>
        normalizeBrandKey(c.name) === key ||
        normalizeBrandKey(c.slug) === key ||
        key.includes(normalizeBrandKey(c.name))
    );
    const featured = FEATURED_BRANDS.find((f) => normalizeBrandKey(f.name) === key);
    return { name, logo: brandLogoPath(name, cat?.image) || featured?.logo || null };
  });
});

function takeHomeList(...lists: Array<Product[] | undefined | null>) {
  for (const list of lists) {
    if (list?.length) return list.slice(0, HOME_SECTION_LIMIT);
  }
  return [] as Product[];
}

async function loadHomeSections() {
  sectionsLoading.value = true;
  try {
    const emptyProducts = { data: { products: [] as Product[] } };
    const emptyHome: { data: HomeSections } = {
      data: { featured: [], discounted: [], newProducts: [], homeDeals: [], homeFeatured: [] },
    };

    const [homeRes, bestRes, facetsRes, makesRes, catsRes] = await Promise.all([
      api.get<HomeSections>('/products/home').catch(() => emptyHome),
      api
        .get<{ products: Product[] }>('/products?sort=price_asc&limit=12&inStock=true')
        .catch(() => emptyProducts),
      api.get<TireFilterFacets>('/vehicles/facets').catch(() => ({ data: null })),
      api.get<VehicleMake[]>('/vehicles/makes').catch(() => ({ data: [] as VehicleMake[] })),
      api.get<{ categories?: Category[] } | Category[]>('/categories').catch(() => ({ data: [] as Category[] })),
    ]);

    const home = homeRes.data;
    // Dashboard picks first; fallback to auto lists so the page is not empty.
    specialProducts.value = takeHomeList(home?.homeDeals, home?.discounted);
    newestProducts.value = takeHomeList(home?.homeFeatured, home?.newProducts, home?.featured);
    bestsellerProducts.value = (bestRes.data?.products ?? []).slice(0, HOME_SECTION_LIMIT);
    tireBrands.value = (facetsRes.data?.brands ?? []).slice(0, 10);
    tireMakes.value = (makesRes.data ?? []).slice(0, 12);
    const rawCats = catsRes.data;
    brandCategories.value = Array.isArray(rawCats) ? rawCats : rawCats?.categories ?? [];
  } catch {
    newestProducts.value = [];
    specialProducts.value = [];
    bestsellerProducts.value = [];
    tireBrands.value = [];
    tireMakes.value = [];
    brandCategories.value = [];
  } finally {
    sectionsLoading.value = false;
  }
}

onMounted(() => {
  if (isTireStore) loadHomeSections();
});

const siteUrl = String(useRuntimeConfig().public.siteUrl || '').replace(/\/+$/, '');

usePageSeo({
  title: `${SITE_NAME} | خرید لاستیک خودرو`,
  description: SITE_DESCRIPTION,
  image: '/images/tire/hero-car.jpg',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: siteUrl,
      image: `${siteUrl}/images/tire/hero-car.jpg`,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IR',
      },
    },
  ],
});
</script>

<template>
  <div class="bg-[#f4f6f8] pb-10">
    <TireHomeHero :brands="tireBrands" />
    <TireTrustStrip />
    <TireHomeJourney />

    <section v-if="bestsellerProducts.length" class="mx-auto max-w-store px-4 py-10 md:py-14">
      <HomeSection title="پیشنهادهای قیمت‌محور" to="/shop?sort=price_asc" link-label="همه محصولات" />
      <ProductCardList :products="bestsellerProducts" layout="strip" />
    </section>

    <section v-if="specialProducts.length" class="relative overflow-hidden py-10 md:py-14">
      <div class="absolute inset-0 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_45%,#f8fafc_100%)]" />
      <div class="relative mx-auto max-w-store px-4">
        <HomeSection title="پیشنهاد شگفت‌انگیز" to="/shop?homeDeal=1" link-label="همه تخفیف‌ها" />
        <ProductCardList :products="specialProducts" layout="strip" />
      </div>
    </section>

    <section v-if="tireMakes.length" class="border-y border-slate-200 bg-white py-10 md:py-14">
      <div class="mx-auto max-w-store px-4">
        <HomeSection title="لاستیک بر اساس خودرو" to="/cars" />
        <ul class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <li v-for="make in tireMakes" :key="make.id">
            <article class="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
              <div class="relative aspect-[16/10] overflow-hidden bg-slate-200">
                <img
                  v-if="make.logo || make.models?.[0]?.image"
                  :src="make.logo || make.models?.[0]?.image || ''"
                  :alt="make.name"
                  class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                  width="480"
                  height="300"
                />
                <div
                  v-else
                  class="grid h-full place-items-center bg-slate-900 text-red-300"
                >
                  <AppIcon name="lucide:car" size="lg" />
                </div>
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-2.5 pt-8">
                  <p class="text-sm font-bold text-white">{{ make.name }}</p>
                </div>
              </div>
              <div class="p-4">
                <div class="flex flex-wrap gap-1.5">
                  <NuxtLink
                    v-for="model in (make.models ?? []).slice(0, 4)"
                    :key="model.id"
                    :to="`/cars/${make.slug}/${model.slug}`"
                    class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-red-600 hover:ring-red-200"
                  >
                    {{ model.name }}
                  </NuxtLink>
                </div>
                <NuxtLink
                  v-if="make.models?.[0]"
                  :to="`/cars/${make.slug}/${make.models[0].slug}`"
                  class="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-red-600 group-hover:text-red-700"
                >
                  مشاهده سایزها
                  <AppIcon name="lucide:arrow-left" size="xs" />
                </NuxtLink>
              </div>
            </article>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="homeBrandCards.length" class="mx-auto max-w-store px-4 py-10 md:py-14">
      <HomeSection title="برندهای لاستیک" to="/brands" />
      <TireBrandSlider :brands="homeBrandCards" />
    </section>

    <TireHomePromoBanner />

    <section v-if="newestProducts.length" class="mx-auto max-w-store px-4 pb-12">
      <HomeSection title="جدیدترین لاستیک‌ها" to="/shop?homeFeatured=1" link-label="مشاهده بیشتر" />
      <ProductCardList :products="newestProducts" layout="strip" />
    </section>

    <LoadingSpinner :show="sectionsLoading" />
  </div>
</template>
