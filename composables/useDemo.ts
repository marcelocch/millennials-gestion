// Estado de la demo. Vive en memoria: al recargar la página vuelve al punto de partida.
// En el sistema real, cada función de este archivo se convierte en una consulta o acción del servidor.

import { reactive, computed } from 'vue'
import * as datos from '~/data/datos'
import type { Financiamiento, Demo, Cuota } from '~/data/datos'
import { HOY, diasEntre, soles, fCorta } from '~/utils/formato'

export type RolId = 'gerencia' | 'distribuidor' | 'cobranzas' | 'vendedor' | 'telemarketing' | 'administracion'

// El emprendedor de la demo tiene demos hoy y ventas en curso, para que su vista tenga contenido.
const enCurso = (id: string) => datos.demos.filter(d => d.vendedorId === id && d.venta && d.etapa < 5).length
  + 10 * datos.demos.filter(d => d.vendedorId === id && diasEntre(d.fecha, HOY) === 0).length
const vendedorDemo = datos.vendedores
  .filter(v => v.rango === 'Emprendedor' && v.distribucionId === 'd1')
  .sort((x, y) => enCurso(y.id) - enCurso(x.id))[0]
const admin = datos.personas.find(p => p.area === 'Administración')!

export const ROLES: { id: RolId; nombre: string; personaId: string; inicio: string; describe: string }[] = [
  { id: 'gerencia', nombre: 'Gerencia general', personaId: 'p1', inicio: '/', describe: 'Ve toda la red' },
  { id: 'distribuidor', nombre: 'Distribuidor a cargo', personaId: 'p2', inicio: '/', describe: 'Ve solo a su equipo' },
  { id: 'cobranzas', nombre: 'Gestor de cobranzas', personaId: datos.gestores[0].id, inicio: '/cobranzas', describe: 'Su cartera del día' },
  { id: 'vendedor', nombre: 'Emprendedor', personaId: vendedorDemo.id, inicio: '/demos', describe: 'Su agenda y sus ventas' },
  { id: 'telemarketing', nombre: 'Operador de telemarketing', personaId: datos.operadores[0].id, inicio: '/telemarketing', describe: 'Su cola de llamadas' },
  { id: 'administracion', nombre: 'Administración', personaId: admin.id, inicio: '/reclutamiento', describe: 'Entrevistas e inducción' },
]

export const MENU: { ruta: string; nombre: string; icono: string; roles: RolId[] }[] = [
  { ruta: '/', nombre: 'Tablero', icono: 'tablero', roles: ['gerencia', 'distribuidor'] },
  { ruta: '/cobranzas', nombre: 'Cobranzas', icono: 'cobranza', roles: ['gerencia', 'cobranzas'] },
  { ruta: '/demos', nombre: 'Demostraciones', icono: 'demo', roles: ['gerencia', 'distribuidor', 'vendedor'] },
  { ruta: '/reclutamiento', nombre: 'Reclutamiento', icono: 'personas', roles: ['gerencia', 'distribuidor', 'administracion'] },
  { ruta: '/capacitacion', nombre: 'Inducción y capacitación', icono: 'libro', roles: ['gerencia', 'distribuidor', 'administracion', 'vendedor'] },
  { ruta: '/telemarketing', nombre: 'Telemarketing', icono: 'telefono', roles: ['gerencia', 'telemarketing'] },
  { ruta: '/red', nombre: 'Red y equipo', icono: 'red', roles: ['gerencia', 'distribuidor'] },
  { ruta: '/configuracion', nombre: 'Configuración', icono: 'ajustes', roles: ['gerencia'] },
]

const estado = reactive({
  rol: 'gerencia' as RolId,
  whatsappOficial: true, // en Configuración se puede ver cómo opera mientras Meta aprueba el servicio
  personas: datos.personas,
  financiamientos: datos.financiamientos,
  demos: datos.demos,
  postulantes: datos.postulantes,
  sesiones: datos.sesiones,
  contactos: datos.contactos,
  reglas: datos.reglas,
  aviso: '' as string,
})

/* ---------- Cobranzas ---------- */

export type EstadoCobro = 'En mora' | 'Vence hoy' | 'Por vencer' | 'Al día' | 'Cancelado'

export const situacion = (f: Financiamiento) => {
  const cuota = f.cuotas.find(c => !c.pagada) ?? null
  if (!cuota) return { estado: 'Cancelado' as EstadoCobro, cuota, atraso: 0, falta: 0, vencido: 0, saldo: 0 }
  const atraso = diasEntre(cuota.vence, HOY)
  const pendientes = f.cuotas.filter(c => !c.pagada)
  const vencido = pendientes.filter(c => diasEntre(c.vence, HOY) > 0).reduce((s, c) => s + c.monto, 0)
  const saldo = pendientes.reduce((s, c) => s + c.monto, 0)
  const est: EstadoCobro = atraso > 0 ? 'En mora' : atraso === 0 ? 'Vence hoy' : atraso >= -7 ? 'Por vencer' : 'Al día'
  return { estado: est, cuota, atraso, falta: -atraso, vencido, saldo }
}

export const mensajeCobro = (f: Financiamiento) => {
  const s = situacion(f)
  if (!s.cuota) return ''
  const primer = f.cliente.split(' ')[0]
  const cuota = `${s.cuota.n} de ${f.cuotas.length}`
  const cuando = s.atraso > 0
    ? `venció el ${fCorta(s.cuota.vence)} y tiene ${s.atraso} ${s.atraso === 1 ? 'día' : 'días'} de atraso`
    : s.atraso === 0 ? 'vence hoy' : `vence el ${fCorta(s.cuota.vence)}`
  return `Hola ${primer}, te saluda Millennials. Tu cuota ${cuota} de ${soles(s.cuota.monto)} ${cuando}. Puedes pagarla en línea aquí: ${datos.ENLACE_PAGO}`
}

/* ---------- Acceso por rol ---------- */

export function useDemo() {
  const rol = computed(() => ROLES.find(r => r.id === estado.rol)!)
  const yo = computed(() => datos.persona(rol.value.personaId))
  const menu = computed(() => MENU.filter(m => m.roles.includes(estado.rol)))

  /** Distribución visible: la gerencia ve todas (null); un distribuidor o vendedor, solo la suya. */
  const alcance = computed(() =>
    estado.rol === 'distribuidor' || estado.rol === 'vendedor' ? yo.value.distribucionId : null)

  const demosVisibles = computed<Demo[]>(() => estado.demos.filter(d =>
    estado.rol === 'vendedor' ? d.vendedorId === yo.value.id : !alcance.value || d.distribucionId === alcance.value))
  const carteraVisible = computed<Financiamiento[]>(() => estado.financiamientos.filter(f =>
    estado.rol === 'cobranzas' ? f.gestorId === yo.value.id : !alcance.value || f.distribucionId === alcance.value))
  const equipoVisible = computed(() => estado.personas.filter(p => !alcance.value || p.distribucionId === alcance.value))

  const avisar = (texto: string) => {
    estado.aviso = texto
    setTimeout(() => { if (estado.aviso === texto) estado.aviso = '' }, 3200)
  }

  const registrarPago = (f: Financiamiento, c: Cuota) => {
    c.pagada = true; c.pagadaEl = new Date()
    f.gestiones.unshift({ fecha: new Date(), tipo: 'Pago', texto: `Pago registrado de la cuota ${c.n} (${soles(c.monto)})`, auto: false })
    avisar(`Pago de la cuota ${c.n} registrado`)
  }
  const registrarContacto = (f: Financiamiento, tipo: 'WhatsApp' | 'Correo' | 'Llamada', texto: string) => {
    f.contactadoHoy = true
    f.gestiones.unshift({ fecha: new Date(), tipo, texto, auto: false })
  }

  return {
    estado, rol, yo, menu, alcance, demosVisibles, carteraVisible, equipoVisible,
    avisar, registrarPago, registrarContacto, datos,
  }
}
