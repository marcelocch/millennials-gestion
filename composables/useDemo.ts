// Estado de la demo. Vive en memoria: al recargar la página vuelve al punto de partida.
// En el sistema real, cada función de este archivo se convierte en una consulta o acción del servidor.

import { reactive, computed } from 'vue'
import * as datos from '~/data/datos'
import type { Financiamiento, Demo, Cuota, Venta, MedioPago, FormaPago, LineaVenta } from '~/data/datos'
import { HOY, masDias, diasEntre, soles, fCorta } from '~/utils/formato'

export type RolId = 'gerencia' | 'distribuidor' | 'cobranzas' | 'vendedor' | 'telemarketing' | 'administracion' | 'contabilidad'

// El emprendedor de la demo tiene demos hoy y ventas en curso, para que su vista tenga contenido.
const enCurso = (id: string) => datos.demos.filter(d => d.vendedorId === id && d.venta && d.etapa < 5).length
  + 10 * datos.demos.filter(d => d.vendedorId === id && diasEntre(d.fecha, HOY) === 0).length
const vendedorDemo = datos.vendedores
  .filter(v => v.rango === 'Emprendedor' && v.distribucionId === 'd1')
  .sort((x, y) => enCurso(y.id) - enCurso(x.id))[0]
const admin = datos.personas.find(p => p.area === 'Administración')!
const conta = datos.personas.find(p => p.area === 'Contabilidad')!

export const ROLES: { id: RolId; nombre: string; personaId: string; inicio: string; describe: string }[] = [
  { id: 'gerencia', nombre: 'Gerencia general', personaId: 'p1', inicio: '/', describe: 'Ve toda la red' },
  { id: 'distribuidor', nombre: 'Distribuidor a cargo', personaId: 'p2', inicio: '/', describe: 'Ve solo a su equipo' },
  { id: 'cobranzas', nombre: 'Gestor de cobranzas', personaId: datos.gestores[0].id, inicio: '/cobranzas', describe: 'Su cartera del día' },
  { id: 'vendedor', nombre: 'Emprendedor', personaId: vendedorDemo.id, inicio: '/demos', describe: 'Su agenda y sus ventas' },
  { id: 'telemarketing', nombre: 'Operador de telemarketing', personaId: datos.operadores[0].id, inicio: '/telemarketing', describe: 'Su cola de llamadas' },
  { id: 'administracion', nombre: 'Administración', personaId: admin.id, inicio: '/reclutamiento', describe: 'Entrevistas e inducción' },
  { id: 'contabilidad', nombre: 'Contabilidad', personaId: conta.id, inicio: '/ventas?vista=cuadre', describe: 'Ingresos y cuadre con Hy Cite' },
]

export const MENU: { ruta: string; nombre: string; icono: string; roles: RolId[] }[] = [
  { ruta: '/', nombre: 'Tablero', icono: 'tablero', roles: ['gerencia', 'distribuidor'] },
  { ruta: '/ventas', nombre: 'Ventas e ingresos', icono: 'venta', roles: ['gerencia', 'distribuidor', 'vendedor', 'contabilidad'] },
  { ruta: '/cobranzas', nombre: 'Cobranzas', icono: 'cobranza', roles: ['gerencia', 'cobranzas', 'contabilidad'] },
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
  ventas: datos.ventas,
  bases: datos.bases,
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

/* ---------- Ventas e ingresos ---------- */

export const horaActual = () => new Date().toTimeString().slice(0, 5)

/** Lo que entró a caja un día: iniciales y ventas al contado, más cuotas cobradas. */
export const ingresosDel = (ventas: Venta[], cartera: Financiamiento[], dia: Date = HOY) => {
  const deVentas = ventas.filter(v => diasEntre(v.fecha, dia) === 0)
    .map(v => ({ hora: v.hora, concepto: v.forma === 'Contado' ? 'Venta al contado' : 'Inicial de venta', detalle: `${v.codigo} · ${v.cliente}`, monto: v.inicial, medio: v.medio }))
  const deCuotas = cartera.flatMap(f => f.cuotas.filter(c => c.pagada && c.pagadaEl && diasEntre(c.pagadaEl, dia) === 0)
    .map(c => ({ hora: c.pagadaHora ?? '', concepto: 'Cuota cobrada', detalle: `Cuota ${c.n} · ${f.cliente}`, monto: c.monto, medio: c.medio ?? 'Enlace de pago Hy Cite' as MedioPago })))
  return [...deVentas, ...deCuotas].sort((a, b) => b.hora.localeCompare(a.hora))
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
  const ventasVisibles = computed<Venta[]>(() => estado.ventas.filter(v =>
    estado.rol === 'vendedor' ? v.vendedorId === yo.value.id : !alcance.value || v.distribucionId === alcance.value))
  const postulantesVisibles = computed(() => estado.postulantes.filter(p => !alcance.value || p.distribucionId === alcance.value))

  const avisar = (texto: string) => {
    estado.aviso = texto
    setTimeout(() => { if (estado.aviso === texto) estado.aviso = '' }, 3200)
  }

  const registrarPago = (f: Financiamiento, c: Cuota, medio: MedioPago = 'Enlace de pago Hy Cite') => {
    c.pagada = true; c.pagadaEl = new Date(); c.pagadaHora = horaActual(); c.medio = medio
    f.gestiones.unshift({ fecha: new Date(), tipo: 'Pago', texto: `Pago registrado de la cuota ${c.n} (${soles(c.monto)})`, auto: false })
    avisar(`Pago de la cuota ${c.n} registrado`)
  }
  const registrarContacto = (f: Financiamiento, tipo: 'WhatsApp' | 'Correo' | 'Llamada', texto: string) => {
    f.contactadoHoy = true
    f.gestiones.unshift({ fecha: new Date(), tipo, texto, auto: false })
  }

  /** Registra una venta: queda por cuadrar con Hy Cite y, si se financia con Millennials, crea su cronograma. */
  const registrarVenta = (v: {
    demoId?: string; cliente: string; tel: string; dni: string; distrito: string; vendedorId: string
    lineas: LineaVenta[]; descuento: number; forma: FormaPago; inicial: number; medio: MedioPago; ordenHyCite: string
    cuotas?: number; frecuencia?: Financiamiento['frecuencia']
  }) => {
    const vendedor = datos.persona(v.vendedorId)
    const total = v.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0) - v.descuento
    const venta: Venta = {
      id: 'mv' + (estado.ventas.length + 1), codigo: 'MV-' + String(2400 + estado.ventas.length), fecha: new Date(HOY), hora: horaActual(),
      demoId: v.demoId, cliente: v.cliente, tel: v.tel, dni: v.dni, distrito: v.distrito,
      vendedorId: vendedor.id, distribucionId: vendedor.distribucionId, registradoPorId: yo.value.id,
      lineas: v.lineas, descuento: v.descuento, total, forma: v.forma, inicial: v.forma === 'Contado' ? total : v.inicial,
      medio: v.medio, ordenHyCite: v.ordenHyCite, cuadre: 'Por cuadrar',
    }
    estado.ventas.push(venta)
    const demo = estado.demos.find(d => d.id === v.demoId)
    if (demo) Object.assign(demo, { venta: true, visita: 'Realizada', etapa: 1, diasEnEtapa: 0, monto: total, producto: v.lineas.map(l => l.producto).join(' + ') })
    if (v.forma === 'Cuotas Millennials' && v.cuotas) {
      const PERIODO = { Semanal: 7, Quincenal: 15, Mensual: 30 }
      const { cuota } = datos.calcularCuota(total, v.inicial, v.cuotas)
      estado.financiamientos.unshift({
        id: 'f' + (estado.financiamientos.length + 1), cliente: v.cliente, tel: v.tel || '999000000', email: '', distrito: v.distrito,
        vendedorId: vendedor.id, distribucionId: vendedor.distribucionId, gestorId: datos.gestores[0].id,
        producto: venta.lineas.map(l => l.producto).join(' + '), total, inicial: v.inicial, frecuencia: v.frecuencia ?? 'Mensual',
        cuotas: Array.from({ length: v.cuotas }, (_, i) => ({ n: i + 1, vence: masDias(HOY, PERIODO[v.frecuencia ?? 'Mensual'] * (i + 1)), monto: cuota, pagada: false })),
        gestiones: [{ fecha: new Date(), tipo: 'Nota', texto: `Financiamiento creado desde la venta ${venta.codigo}`, auto: false }], contactadoHoy: false,
      })
    }
    return venta
  }

  return {
    estado, rol, yo, menu, alcance, demosVisibles, carteraVisible, equipoVisible, ventasVisibles, postulantesVisibles,
    avisar, registrarPago, registrarContacto, registrarVenta, datos,
  }
}
