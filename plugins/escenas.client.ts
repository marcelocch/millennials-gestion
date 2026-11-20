// Entradas directas a la demo por #nombre (por ejemplo, #cuadre o #mi-cola).
// Funcionan igual en Vercel y en la vista previa publicada, donde solo viaja un #nombre simple.
// Cada escena fija el perfil y abre la pantalla con la que esa persona empieza.
import type { RolId } from '~/composables/useDemo'

export const ESCENAS: Record<string, { rol: RolId; ruta: string; query?: Record<string, string> }> = {
  tablero: { rol: 'gerencia', ruta: '/' },
  'tablero-distribuidor': { rol: 'distribuidor', ruta: '/' },
  ventas: { rol: 'gerencia', ruta: '/ventas' },
  'registrar-venta': { rol: 'vendedor', ruta: '/ventas', query: { nueva: '1' } },
  'mis-ventas': { rol: 'vendedor', ruta: '/ventas' },
  cuadre: { rol: 'contabilidad', ruta: '/ventas', query: { vista: 'cuadre' } },
  cobranzas: { rol: 'gerencia', ruta: '/cobranzas' },
  'mi-dia': { rol: 'cobranzas', ruta: '/cobranzas' },
  demos: { rol: 'gerencia', ruta: '/demos' },
  'mis-demos': { rol: 'vendedor', ruta: '/demos' },
  evidencia: { rol: 'distribuidor', ruta: '/demos', query: { vista: 'validar' } },
  reclutamiento: { rol: 'administracion', ruta: '/reclutamiento' },
  'nuevo-postulante': { rol: 'distribuidor', ruta: '/reclutamiento', query: { nuevo: '1' } },
  referidos: { rol: 'gerencia', ruta: '/reclutamiento', query: { vista: 'referidos' } },
  capacitacion: { rol: 'administracion', ruta: '/capacitacion' },
  telemarketing: { rol: 'gerencia', ruta: '/telemarketing' },
  'mi-cola': { rol: 'telemarketing', ruta: '/telemarketing' },
  'calidad-citas': { rol: 'gerencia', ruta: '/telemarketing', query: { vista: 'citas' } },
  red: { rol: 'gerencia', ruta: '/red' },
  configuracion: { rol: 'gerencia', ruta: '/configuracion' },
}

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { estado } = useDemo()
  const ir = () => {
    const e = ESCENAS[decodeURIComponent(location.hash.slice(1))]
    if (!e) return
    estado.rol = e.rol
    router.replace({ path: e.ruta, query: e.query })
  }
  // Se espera a que la app termine su primera navegación; si no, esa navegación pisaría la escena.
  onNuxtReady(ir)
  window.addEventListener('hashchange', ir)
})
