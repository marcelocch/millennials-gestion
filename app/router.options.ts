import type { RouterConfig } from '@nuxt/schema'
import { createMemoryHistory } from 'vue-router'

declare const __VISTA_PREVIA__: boolean

// En la vista previa estática (sin servidor ni rutas propias) la navegación vive en memoria.
// En Vercel se usa el historial normal del navegador.
export default <RouterConfig>{
  history: base => (__VISTA_PREVIA__ ? createMemoryHistory(base) : undefined),
  // La página suelta se abre desde cualquier dirección: lo que no sea una ruta conocida va al inicio.
  routes: rutas => (__VISTA_PREVIA__ ? [...rutas, { path: '/:resto(.*)*', redirect: '/' }] : rutas),
}
