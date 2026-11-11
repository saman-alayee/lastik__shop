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
        <TireCarModelStrip :makes="tireMakes" title="لاستیک خودرو" />
        <div class="mt-4 text-end">
          <NuxtLink to="/cars" class="text-xs font-bold text-red-600 hover:text-red-700">
            همه خودروها
          </NuxtLink>
        </div>
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
