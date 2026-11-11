type SitemapEntry = { loc: string; lastmod?: string };

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const base = ((config.public.siteUrl as string) || '').replace(/\/+$/, '');
  const apiBase = (config.public.apiBase as string).replace(/\/+$/, '');

  const staticPaths = ['/', '/shop', '/brands', '/cars', '/categories', '/contact', '/search'];
  const entries: SitemapEntry[] = staticPaths.map((path) => ({ loc: `${base}${path}` }));

  try {
    const [categoriesRes, productsRes, makesRes, sizesRes, facetsRes] = await Promise.all([
      $fetch<{ data: { slug: string; updatedAt?: string }[] }>(`${apiBase}/categories`),
      $fetch<{ data: { products: { slug: string; updatedAt?: string }[] } }>(
        `${apiBase}/products?limit=500&page=1`
      ),
      $fetch<{ data: { slug: string; models?: { slug: string }[] }[] }>(`${apiBase}/vehicles/makes`).catch(
        () => ({ data: [] })
      ),
      $fetch<{ data: { slug: string }[] }>(`${apiBase}/vehicles/sizes`).catch(() => ({ data: [] })),
      $fetch<{ data: { brands?: string[] } }>(`${apiBase}/vehicles/facets`).catch(() => ({ data: {} })),
    ]);

    for (const cat of categoriesRes.data ?? []) {
      entries.push({
        loc: `${base}/categories/${cat.slug}`,
        lastmod: cat.updatedAt,
      });
    }
    for (const product of productsRes.data?.products ?? []) {
      entries.push({
        loc: `${base}/products/${product.slug}`,
        lastmod: product.updatedAt,
      });
    }
    for (const make of makesRes.data ?? []) {
      entries.push({ loc: `${base}/cars` });
      for (const model of make.models ?? []) {
        entries.push({ loc: `${base}/cars/${make.slug}/${model.slug}` });
      }
    }
    for (const size of sizesRes.data ?? []) {
      entries.push({ loc: `${base}/shop?rim=` }); // placeholder avoided — use size landing if added
      void size;
    }
    for (const brand of facetsRes.data?.brands ?? []) {
      entries.push({ loc: `${base}/brands/${encodeURIComponent(brand)}` });
    }
  } catch {
    // Sitemap still returns static URLs if API is unavailable during build
  }

  // Deduplicate locs
  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    if (!e.loc || seen.has(e.loc) || e.loc.includes('rim=')) return false;
    seen.add(e.loc);
    return true;
  });

  const body = unique
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : '';
      return `<url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join('');

  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
});
