// https://nuxt.com/docs/api/configuration/nuxt-config
import { SITE_DESCRIPTION, SITE_NAME } from './constants/site';

export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  // SPA on the 1-CPU / 2GB VPS — SSR was OOM-crashing Node and causing 502s.
  ssr: false,

  experimental: {
    appManifest: false,
  },

  routeRules: {
    '/admin/**': { ssr: false },
    '/profile/**': { ssr: false },
    '/cart/**': { ssr: false },
    '/checkout/**': { ssr: false },
    '/auth/**': { ssr: false },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/icon',
  ],

  // Keep URLs without trailing slash (matches links + avoids nginx dir redirects)
  router: {
    options: {
      strict: false,
    },
  },

  features: {
    // Keep CSS as cacheable files instead of bloating the first HTML (~120KB inline before).
    inlineStyles: false,
  },

  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      routes: ['/'],
    },
    routeRules: {
      '/wp-home/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      '/logo.png': { headers: { 'cache-control': 'public, max-age=604800' } },
      '/pwa-*.png': { headers: { 'cache-control': 'public, max-age=604800' } },
      '/sitemap.xml': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/robots.txt': { headers: { 'cache-control': 'public, max-age=3600' } },
    },
    devProxy: {
      '/uploads': { target: 'http://127.0.0.1:3001/uploads', changeOrigin: true },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      title: SITE_NAME,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: SITE_DESCRIPTION,
        },
        { property: 'og:title', content: SITE_NAME },
        {
          property: 'og:description',
          content: SITE_DESCRIPTION,
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'fa_IR' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'theme-color', content: '#dc2626' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      style: [
        {
          innerHTML:
            'body{margin:0;background:#f8fafc}#__nuxt:empty{display:flex;min-height:100vh;align-items:center;justify-content:center}#__nuxt:empty::after{content:"";width:2.5rem;height:2.5rem;border:3px solid #dc2626;border-top-color:transparent;border-radius:9999px;animation:kk-spin .8s linear infinite}@keyframes kk-spin{to{transform:rotate(360deg)}}',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', href: '/logo.svg' },
        { rel: 'preload', as: 'image', href: '/images/tire/hero-warehouse.jpg', fetchpriority: 'high' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  icon: {
    size: '20px',
    class: 'icon',
    mode: 'svg',
    // آیکون‌ها از پکیج محلی @iconify-json می‌آیند، نه از api.iconify.design
    fallbackToApi: false,
    customCollections: [
      {
        prefix: 'shop',
        dir: './assets/icons',
      },
    ],
    serverBundle: {
      collections: ['lucide', 'heroicons'],
    },
    clientBundle: {
      scan: true,
      sizeLimitKb: 1024,
    },
  },

  runtimeConfig: {
    public: {
      // Local: set NUXT_PUBLIC_API_BASE in .env (http://localhost:3001/api)
      // Production: usually /api behind nginx
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      /** فقط با `NUXT_PUBLIC_FORCE_DEMO_CATALOG=true` کاتالوگ نمایشی روشن می‌شود؛ پیش‌فرض = محصولات واقعی API */
      forceDemoCatalog: process.env.NUXT_PUBLIC_FORCE_DEMO_CATALOG === 'true',
    },
  },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'لاستیک‌شاپ | فروشگاه تخصصی لاستیک',
      short_name: 'لاستیک‌شاپ',
      description: 'خرید آنلاین لاستیک خودرو با جستجوی تخصصی بر اساس خودرو و سایز',
      theme_color: '#dc2626',
      background_color: '#f8fafc',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'fa',
      dir: 'rtl',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      // Never serve the storefront shell for panel/auth/app routes (was sending /admin → home).
      navigateFallbackDenylist: [
        /^\/api\//,
        /^\/uploads\//,
        /^\/\.well-known\//,
        /^\/admin(\/|$)/,
        /^\/auth(\/|$)/,
        /^\/profile(\/|$)/,
        /^\/cart(\/|$)/,
        /^\/checkout(\/|$)/,
        /^\/maintenance(\/|$)/,
      ],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          // کاتالوگ باید همیشه از شبکه بیاید — کش خالی/کهنه باعث لود نشدن گاه‌به‌گاه محصولات می‌شد
          urlPattern: /\/api\/(categories|products)(\?|\/|$)/,
          handler: 'NetworkOnly',
          options: { cacheName: 'api-cache' },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

  compatibilityDate: '2024-12-01',
});
