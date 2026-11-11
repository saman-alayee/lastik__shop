<script setup lang="ts">
import type { Category, TireFilterFacets } from '~/types';
import { SITE_NAME } from '~/constants/site';
import { FEATURED_BRANDS, brandLogoPath, normalizeBrandKey } from '~/constants/brandLogos';

const api = useApi();
const { getCategoryImage } = useFormat();

const brands = ref<string[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);

const brandCards = computed(() => {
  const byName = new Map(
    categories.value.map((c) => [normalizeBrandKey(c.name), c] as const)
  );
  const bySlug = new Map(categories.value.map((c) => [normalizeBrandKey(c.slug), c] as const));

  const names = [...brands.value];
  for (const featured of FEATURED_BRANDS) {
    if (!names.some((n) => normalizeBrandKey(n) === normalizeBrandKey(featured.name))) {
      names.push(featured.name);
    }
  }

  return names.map((name) => {
    const key = normalizeBrandKey(name);
    const cat =
      byName.get(key) ||
      bySlug.get(key) ||
      categories.value.find((c) => key.includes(normalizeBrandKey(c.name)) || normalizeBrandKey(c.name).includes(key));
    const featured = FEATURED_BRANDS.find((f) => normalizeBrandKey(f.name) === key);
    const logo = brandLogoPath(name, cat?.image) || featured?.logo || null;
    return { name, logo, category: cat };
  });
});

onMounted(async () => {
  loading.value = true;
  try {
    const [facetsRes, catsRes] = await Promise.all([
      api.get<TireFilterFacets>('/vehicles/facets'),
      api.get<{ categories?: Category[] } | Category[]>('/categories'),
    ]);
    brands.value = facetsRes.data?.brands ?? [];
    const raw = catsRes.data;
    categories.value = Array.isArray(raw) ? raw : raw?.categories ?? [];
  } catch {
    brands.value = [];
    categories.value = [];
  } finally {
    loading.value = false;
  }
});

function brandSlug(name: string) {
  return encodeURIComponent(name);
}

usePageSeo({
  title: `برندهای لاستیک | ${SITE_NAME}`,
  description: 'خرید لاستیک برندهای معتبر داخلی و خارجی',
});
</script>

<template>
  <div class="brands-page">
    <header class="brands-hero">
      <div class="brands-hero__inner">
        <p class="brands-hero__eyebrow">کاتالوگ برند</p>
        <h1 class="brands-hero__title">برندهای لاستیک</h1>
        <p class="brands-hero__lead">
          برند مورد نظر را انتخاب کنید و محصولات همان برند را ببینید.
        </p>
      </div>
    </header>

    <div class="brands-body">
      <LoadingSpinner :show="loading" />

      <ul v-if="!loading && brandCards.length" class="brands-grid">
        <li v-for="brand in brandCards" :key="brand.name">
          <NuxtLink :to="`/brands/${brandSlug(brand.name)}`" class="brand-tile group">
            <span class="brand-tile__stage" aria-hidden="true" />
            <span class="brand-tile__logo">
              <img
                v-if="brand.logo"
                :src="getCategoryImage(brand.logo)"
                :alt="brand.name"
                class="brand-tile__img"
                loading="lazy"
                decoding="async"
              />
              <AppIcon v-else name="shop:tire" size="xl" class="text-slate-400" />
            </span>
            <span class="brand-tile__meta">
              <span class="brand-tile__name">{{ brand.name }}</span>
              <span class="brand-tile__cta">
                مشاهده
                <AppIcon name="lucide:arrow-left" size="xs" class="brand-tile__cta-icon" />
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>

      <EmptyState v-else-if="!loading" message="برندی ثبت نشده" />
    </div>
  </div>
</template>

<style scoped>
.brands-page {
  --brand-ink: #0f172a;
  --brand-muted: #64748b;
  --brand-line: #e2e8f0;
  --brand-red: #dc2626;
  min-height: 70vh;
}

.brands-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--brand-line);
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(220, 38, 38, 0.1), transparent 55%),
    radial-gradient(90% 70% at 0% 100%, rgba(15, 23, 42, 0.06), transparent 50%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.brands-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(15, 23, 42, 0.05) 0.8px, transparent 0.8px);
  background-size: 14px 14px;
  opacity: 0.55;
  pointer-events: none;
}

.brands-hero__inner {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  max-width: 1240px;
  padding: 1.75rem 1rem 1.5rem;
}

.brands-hero__eyebrow {
  margin: 0 0 0.45rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--brand-red);
}

.brands-hero__title {
  margin: 0;
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  font-weight: 900;
  line-height: 1.25;
  color: var(--brand-ink);
}

.brands-hero__lead {
  margin: 0.55rem 0 0;
  max-width: 34rem;
  font-size: 0.9rem;
  line-height: 1.75;
  color: var(--brand-muted);
}

.brands-body {
  margin: 0 auto;
  max-width: 1240px;
  padding: 1.25rem 1rem 2.5rem;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .brands-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 900px) {
  .brands-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .brands-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.1rem;
  }
}

.brand-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 11.5rem;
  overflow: hidden;
  border: 1px solid var(--brand-line);
  border-radius: 1.35rem;
  background: #fff;
  text-decoration: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.brand-tile:hover,
.brand-tile:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(220, 38, 38, 0.35);
  box-shadow:
    0 14px 28px -18px rgba(15, 23, 42, 0.35),
    0 0 0 1px rgba(220, 38, 38, 0.08);
  outline: none;
}

.brand-tile__stage {
  position: absolute;
  inset: 0 0 3.4rem 0;
  background:
    radial-gradient(70% 65% at 50% 42%, rgba(255, 255, 255, 1), rgba(241, 245, 249, 0.92) 62%, rgba(226, 232, 240, 0.55)),
    linear-gradient(180deg, #f8fafc, #eef2f7);
  pointer-events: none;
}

.brand-tile__stage::after {
  content: '';
  position: absolute;
  inset: auto 12% 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.55), transparent);
}

.brand-tile__logo {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  min-height: 7.5rem;
  padding: 1.35rem 1.1rem 0.85rem;
}

.brand-tile__img {
  display: block;
  width: auto;
  max-width: 78%;
  height: auto;
  max-height: 4.75rem;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.08));
  transition: transform 240ms ease, filter 240ms ease;
}

.brand-tile:hover .brand-tile__img,
.brand-tile:focus-visible .brand-tile__img {
  transform: scale(1.06);
  filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.12));
}

.brand-tile__meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 3.4rem;
  padding: 0.7rem 0.95rem 0.85rem;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, #fff, #fafbfc);
}

.brand-tile__name {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--brand-ink);
  line-height: 1.35;
  transition: color 200ms ease;
}

.brand-tile:hover .brand-tile__name,
.brand-tile:focus-visible .brand-tile__name {
  color: var(--brand-red);
}

.brand-tile__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--brand-muted);
  opacity: 0.85;
  transition: color 200ms ease, opacity 200ms ease, transform 200ms ease;
}

.brand-tile__cta-icon {
  transition: transform 200ms ease;
}

.brand-tile:hover .brand-tile__cta,
.brand-tile:focus-visible .brand-tile__cta {
  color: var(--brand-red);
  opacity: 1;
}

.brand-tile:hover .brand-tile__cta-icon,
.brand-tile:focus-visible .brand-tile__cta-icon {
  transform: translateX(-2px);
}

@media (max-width: 420px) {
  .brand-tile {
    min-height: 10.5rem;
  }

  .brand-tile__logo {
    min-height: 6.5rem;
    padding: 1.1rem 0.85rem 0.7rem;
  }

  .brand-tile__img {
    max-height: 3.9rem;
  }

  .brand-tile__cta {
    display: none;
  }
}
</style>
