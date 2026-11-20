// Demo navegable: datos simulados en el cliente, sin base de datos ni API.

// VISTA_PREVIA=1 genera una versión estática con rutas relativas (npm run vista-previa),
// para publicarla como página suelta. El despliegue normal en Vercel no la usa.
const vistaPrevia = process.env.VISTA_PREVIA === '1'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  vite: { define: { __VISTA_PREVIA__: JSON.stringify(vistaPrevia) } },
  experimental: vistaPrevia ? { appManifest: false, payloadExtraction: false } : {},
  app: {
    baseURL: vistaPrevia ? './' : '/',
    buildAssetsDir: vistaPrevia ? '/recursos/' : '/_nuxt/',
    head: {
      title: 'Millennials · Plataforma de gestión',
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'description', content: 'Demo de la plataforma de gestión de Millennials Investments (datos simulados).' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: (vistaPrevia ? './' : '/') + 'favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap' },
      ],
    },
  },
})
