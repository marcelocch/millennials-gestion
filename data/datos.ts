// Datos simulados de la demo. Todo se genera en el navegador con una semilla fija:
// los mismos nombres y cifras en cada carga, con fechas relativas al día de hoy.
// Ninguna persona, cliente o monto de este archivo es real, salvo la gerencia.

import { HOY, masDias, diasEntre } from '~/utils/formato'

/* ---------- Tipos ---------- */

export type Rango =
  | 'Premier Network Leader' | 'Royal Network' | 'Blue Network'
  | 'Distribuidor' | 'Distribuidor Junior' | 'Emprendedor'

export type Area =
  | 'Ventas' | 'Gerencia' | 'Cobranzas' | 'Telemarketing'
  | 'Administración' | 'Secretaría' | 'Contabilidad' | 'Marketing'

export interface Distribucion { id: string; lider: string; rango: Rango; oficina: string }
export interface Persona {
  id: string; nombre: string; tel: string; area: Area; rango?: Rango
  distribucionId: string; ingreso: Date; induccion: number
}

export const ETAPAS = ['Demo', 'Cierre de venta', 'Producto entregado', 'Curado', 'Cocinado', 'Comisión'] as const
export type Visita = 'Programada' | 'Confirmada' | 'Realizada' | 'Reprogramada' | 'Cancelada' | 'Cliente ausente'

export interface Demo {
  id: string; vendedorId: string; distribucionId: string
  cliente: string; tel: string; distrito: string; origen: string
  fecha: Date; hora: string; visita: Visita
  /** Índice de la última etapa completada. 0 = solo demo, sin venta. */
  etapa: number; venta: boolean; producto: string; monto: number
  evidenciaCurado: boolean; evidenciaCocinado: boolean; validada: boolean
  diasEnEtapa: number
  /** Operador de telemarketing que agendó la demo, si vino de una llamada. */
  operadorId?: string
}

export type FormaPago = 'Contado' | 'Crédito Hy Cite' | 'Cuotas Millennials'
export type EstadoCuadre = 'Por cuadrar' | 'Cuadrada' | 'Con diferencia'
export interface LineaVenta { producto: string; precio: number; cantidad: number }
export interface Venta {
  id: string; codigo: string; fecha: Date; hora: string; demoId?: string
  cliente: string; tel: string; dni: string; distrito: string
  vendedorId: string; distribucionId: string; registradoPorId: string
  lineas: LineaVenta[]; descuento: number; total: number
  forma: FormaPago; inicial: number; medio: MedioPago
  /** Número de la orden registrada en el sistema de Hy Cite. */
  ordenHyCite: string
  cuadre: EstadoCuadre; montoHyCite?: number; inicialHyCite?: number; notaCuadre?: string
  cuadradoPorId?: string; cuadradoEl?: Date
}

export type MedioPago = 'Efectivo' | 'Yape o Plin' | 'Transferencia' | 'Enlace de pago Hy Cite'
export const MEDIOS: MedioPago[] = ['Efectivo', 'Yape o Plin', 'Transferencia', 'Enlace de pago Hy Cite']
export interface Cuota { n: number; vence: Date; monto: number; pagada: boolean; pagadaEl?: Date; pagadaHora?: string; medio?: MedioPago }
export interface Gestion { fecha: Date; tipo: 'WhatsApp' | 'Correo' | 'Llamada' | 'Nota' | 'Pago'; texto: string; auto: boolean }
export interface Financiamiento {
  id: string; cliente: string; tel: string; email: string; distrito: string
  vendedorId: string; distribucionId: string; gestorId: string
  producto: string; total: number; inicial: number
  frecuencia: 'Semanal' | 'Quincenal' | 'Mensual'; cuotas: Cuota[]
  gestiones: Gestion[]; contactadoHoy: boolean; promesa?: Date
}

export type EstadoPostulante = 'Citado' | 'Apto' | 'No apto' | 'No asistió' | 'Segunda entrevista' | 'En inducción' | 'Activo'
export const ORIGENES_POSTULANTE = ['Referido', 'Aviso de empleo', 'Redes sociales', 'Volanteo', 'Feria laboral'] as const
export type OrigenPostulante = typeof ORIGENES_POSTULANTE[number]
export interface Postulante {
  id: string; nombre: string; tel: string; distrito: string
  /** Cómo llegó. Si es "Referido", referidoPorId dice quién lo trajo. */
  origen: OrigenPostulante; referidoPorId?: string
  /** Equipo al que se suma si ingresa. */
  distribucionId: string
  fecha: Date; hora: string; entrevistadorId: string; oficina: string
  registradoPorId: string
  estado: EstadoPostulante; nota: string
  segunda?: { fecha: Date; hora: string }
}

export interface Sesion {
  id: string; tema: string; tipo: 'Inducción' | 'Producto' | 'Ventas' | 'Liderazgo'
  expositorId: string; fecha: Date; hora: string; oficina: string
  inscritos: string[]; asistieron: string[]
}

export type ResultadoLlamada = 'Cita agendada' | 'No contesta' | 'Volver a llamar' | 'No interesado' | 'Número equivocado'
export interface Contacto {
  id: string; nombre: string; tel: string; distrito: string; baseId: string
  operadorId: string; intentos: number; resultado: ResultadoLlamada | null; hora?: string
  /** En la base de referidos: el cliente que dio el nombre. */
  referente?: string
  /** Hora de la rellamada programada para hoy. */
  rellamada?: string
  nota?: string
}
export interface BaseTm { id: string; nombre: string; origen: string; registros: number; trabajados: number; contactos: number; citas: number; porAsignar: number }

/** Metas diarias por operador. Valores de ejemplo. */
export const META_LLAMADAS = 60
export const META_CITAS = 5

export interface Regla {
  id: string; nombre: string; dias: number; whatsapp: boolean; correo: boolean; activa: boolean; plantilla: string
}

/* ---------- Generador con semilla ---------- */

let semilla = 20261120
const azar = () => {
  semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const entero = (a: number, b: number) => a + Math.floor(azar() * (b - a + 1))
const uno = <T>(xs: readonly T[]): T => xs[Math.floor(azar() * xs.length)]
const prob = (p: number) => azar() < p

const NOMBRES = ['María', 'José', 'Luis', 'Ana', 'Carlos', 'Rosa', 'Juan', 'Carmen', 'Miguel', 'Julia', 'Pedro', 'Elena', 'Jorge', 'Patricia', 'Víctor', 'Silvia', 'César', 'Gladys', 'Raúl', 'Nancy', 'Óscar', 'Flor', 'Diego', 'Yolanda', 'Marco', 'Karina', 'Hugo', 'Vanessa', 'Iván', 'Sonia', 'Renato', 'Pilar', 'Fabián', 'Noemí', 'Álvaro', 'Daniela', 'Kevin', 'Brenda', 'Alonso', 'Ximena']
const APELLIDOS = ['Quispe', 'Flores', 'Sánchez', 'Rojas', 'García', 'Mamani', 'Ramos', 'Huamán', 'Torres', 'Díaz', 'Mendoza', 'Chávez', 'Vásquez', 'Castillo', 'Espinoza', 'Gutiérrez', 'Salazar', 'Condori', 'Romero', 'Cárdenas', 'Paredes', 'Villanueva', 'Aguilar', 'Benites', 'Córdova', 'Zapata', 'Palomino', 'Ccori', 'Reyes', 'Medina']
const DISTRITOS = ['San Juan de Lurigancho', 'Los Olivos', 'Comas', 'Ate', 'San Martín de Porres', 'Villa El Salvador', 'Santiago de Surco', 'Chorrillos', 'Independencia', 'Puente Piedra', 'La Molina', 'San Miguel', 'Callao', 'Carabayllo', 'Santa Anita']
const PRODUCTOS = [
  ['Juego de ollas 5 piezas', 3200], ['Juego de ollas 7 piezas', 4100], ['Sistema de cocina 10 piezas', 5600],
  ['Sartén Easy Release + Paellera', 1900], ['Extractor de jugos', 2400], ['Olla de presión + Sartén', 2700], ['Juego de cuchillos', 1500],
] as const
const ORIGENES = ['Referido 4 en 14', 'Referido 4 en 14', 'Telemarketing', 'Prospección propia', 'Cliente recurrente'] as const

const nombre = () => `${uno(NOMBRES)} ${uno(APELLIDOS)} ${uno(APELLIDOS)}`
const telefono = () => '9' + String(entero(10000000, 99999999))
const hora = (desde = 9, hasta = 19) => `${String(entero(desde, hasta)).padStart(2, '0')}:${uno(['00', '30'])}`

/* ---------- Red: distribuciones y personas ---------- */

export const distribuciones: Distribucion[] = [
  { id: 'd0', lider: 'Fernando Gambetta', rango: 'Premier Network Leader', oficina: 'Oficina principal' },
  { id: 'd1', lider: 'Carla Paredes Villanueva', rango: 'Royal Network', oficina: 'Oficina principal' },
  { id: 'd2', lider: 'Jorge Huamán Salazar', rango: 'Blue Network', oficina: 'Oficina principal' },
  { id: 'd3', lider: 'Milagros Torres Reyes', rango: 'Distribuidor', oficina: 'Oficina Norte' },
  { id: 'd4', lider: 'Renzo Castillo Medina', rango: 'Distribuidor', oficina: 'Oficina Norte' },
  { id: 'd5', lider: 'Lucía Vargas Benites', rango: 'Distribuidor Junior', oficina: 'Oficina principal' },
]

export const personas: Persona[] = []
const alta = (p: Omit<Persona, 'id' | 'tel' | 'induccion'> & { induccion?: number }) => {
  const persona: Persona = { id: 'p' + (personas.length + 1), tel: telefono(), induccion: 6, ...p }
  personas.push(persona)
  return persona
}

// Líderes de cada distribución
distribuciones.forEach((d, i) => alta({
  nombre: d.lider, area: i === 0 ? 'Gerencia' : 'Ventas', rango: d.rango,
  distribucionId: d.id, ingreso: masDias(HOY, -entero(700, 2400)),
}))
// Equipos de venta
;[11, 9, 8, 6, 5, 3].forEach((n, i) => {
  for (let k = 0; k < n; k++) {
    const antiguedad = k < 2 && i < 4 ? entero(3, 24) : entero(30, 520)
    alta({
      nombre: nombre(), area: 'Ventas', distribucionId: 'd' + i,
      rango: antiguedad > 300 && prob(0.45) ? 'Distribuidor Junior' : 'Emprendedor',
      ingreso: masDias(HOY, -antiguedad),
      induccion: antiguedad < 12 ? entero(1, 4) : antiguedad < 30 ? entero(4, 6) : 6,
    })
  }
})
export const vendedores = personas.filter(p => p.area === 'Ventas')
export const persona = (id: string) => personas.find(p => p.id === id)!
export const distribucion = (id: string) => distribuciones.find(d => d.id === id)!

// Áreas internas de Millennials
const interno = (area: Area, n: number) => Array.from({ length: n }, () =>
  alta({ nombre: nombre(), area, distribucionId: 'd0', ingreso: masDias(HOY, -entero(120, 1500)) }))
export const gestores = interno('Cobranzas', 3)
export const operadores = interno('Telemarketing', 5)
const OPERADORES_TM = operadores
interno('Administración', 2); interno('Secretaría', 1); interno('Contabilidad', 1); interno('Marketing', 1)

/* ---------- Demos y ventas ---------- */

export const demos: Demo[] = []
vendedores.forEach((v, orden) => {
  const ritmo = v.rango === 'Emprendedor' ? entero(14, 24) : entero(6, 12)
  for (let k = 0; k < ritmo; k++) {
    // Uno de cada tres vendedores tiene al menos una demo hoy.
    const dia = k === 0 && orden % 3 === 0 ? 0 : entero(-34, 6)
    const [producto, base] = uno(PRODUCTOS)
    const d: Demo = {
      id: 'v' + (demos.length + 1), vendedorId: v.id, distribucionId: v.distribucionId,
      cliente: nombre(), tel: telefono(), distrito: uno(DISTRITOS), origen: uno(ORIGENES),
      fecha: masDias(HOY, dia), hora: hora(10, 19), visita: 'Programada',
      etapa: 0, venta: false, producto, monto: base + entero(-2, 4) * 100,
      evidenciaCurado: false, evidenciaCocinado: false, validada: false, diasEnEtapa: 0,
    }
    if (d.origen === 'Telemarketing') d.operadorId = uno(OPERADORES_TM).id
    if (dia > 0) d.visita = prob(0.55) ? 'Confirmada' : 'Programada'
    else if (dia === 0) d.visita = uno(['Confirmada', 'Confirmada', 'Programada', 'Realizada'])
    else {
      const r = azar()
      d.visita = r < 0.74 ? 'Realizada' : r < 0.84 ? 'Reprogramada' : r < 0.93 ? 'Cancelada' : 'Cliente ausente'
    }
    if (d.visita === 'Realizada' && prob(0.46)) {
      d.venta = true
      const edad = -dia
      // Una venta avanza según su antigüedad; algunas se quedan detenidas.
      const tope = edad > 21 ? 5 : edad > 14 ? 4 : edad > 9 ? 3 : edad > 4 ? 2 : 1
      d.etapa = prob(0.25) ? Math.max(1, tope - entero(1, 2)) : tope
      // La mayoría de evidencias completas ya fue validada; quedan algunas en cola.
      if (d.etapa === 4 && prob(0.72)) d.etapa = 5
      d.evidenciaCurado = d.etapa >= 3
      d.evidenciaCocinado = d.etapa >= 4
      d.validada = d.etapa === 5
      d.diasEnEtapa = Math.max(0, edad - [0, 1, 5, 10, 15, 22][d.etapa] + entero(0, 2))
    }
    demos.push(d)
  }
})
demos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.localeCompare(b.hora))

// Las demos de hoy que ya pasaron de hora se realizaron, y más de la mitad cerró venta.
demos.filter(d => diasEntre(d.fecha, HOY) === 0 && d.hora <= '15:00').forEach((d) => {
  d.visita = 'Realizada'
  d.venta = prob(0.4)
  if (d.venta) { d.etapa = 1; d.diasEnEtapa = 0 }
})

/* ---------- Ventas registradas ---------- */

export const CATALOGO = PRODUCTOS.map(([producto, precio]) => ({ producto, precio }))
const contabilidad = personas.find(p => p.area === 'Contabilidad')!

/** Cada demo con venta tiene su registro de venta con montos, forma de pago y estado de cuadre con Hy Cite. */
export const ventas: Venta[] = demos.filter(d => d.venta).map((d, i) => {
  const lineas: LineaVenta[] = [{ producto: d.producto, precio: d.monto, cantidad: 1 }]
  if (prob(0.22)) { const [producto, precio] = uno(PRODUCTOS.slice(3)); if (producto !== d.producto) lineas.push({ producto, precio, cantidad: 1 }) }
  const bruto = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0)
  const descuento = prob(0.3) ? uno([100, 150, 200, 300]) : 0
  const total = bruto - descuento
  d.monto = total
  const r = azar()
  const forma: FormaPago = r < 0.55 ? 'Crédito Hy Cite' : r < 0.8 ? 'Cuotas Millennials' : 'Contado'
  const inicial = forma === 'Contado' ? total : Math.round((total * uno([0.1, 0.12, 0.15, 0.2])) / 10) * 10
  const dias = diasEntre(d.fecha, HOY)
  const q = azar()
  const cuadre: EstadoCuadre = dias === 0 ? 'Por cuadrar'
    : dias <= 3 ? (q < 0.68 ? 'Cuadrada' : q < 0.76 ? 'Con diferencia' : 'Por cuadrar')
      : (q < 0.97 ? 'Cuadrada' : q < 0.99 ? 'Con diferencia' : 'Por cuadrar')
  const v: Venta = {
    id: 'mv' + (i + 1), codigo: 'MV-' + String(2400 + i), fecha: d.fecha,
    hora: `${String(Math.min(Number(d.hora.slice(0, 2)) + 1, 21)).padStart(2, '0')}:${d.hora.slice(3)}`,
    demoId: d.id, cliente: d.cliente, tel: d.tel, dni: String(entero(10000000, 79999999)), distrito: d.distrito,
    vendedorId: d.vendedorId, distribucionId: d.distribucionId, registradoPorId: d.vendedorId,
    lineas, descuento, total, forma, inicial, medio: forma === 'Contado' ? uno(['Transferencia', 'Enlace de pago Hy Cite', 'Yape o Plin'] as const) : uno(MEDIOS),
    ordenHyCite: cuadre !== 'Por cuadrar' || prob(0.6) ? 'HC' + String(entero(10000000, 99999999)) : '',
    cuadre,
  }
  if (cuadre !== 'Por cuadrar') { v.cuadradoPorId = contabilidad.id; v.cuadradoEl = masDias(d.fecha, entero(1, Math.max(1, dias))) }
  if (cuadre === 'Cuadrada') { v.montoHyCite = total; v.inicialHyCite = inicial }
  if (cuadre === 'Con diferencia') {
    const tipo = uno(['monto', 'inicial', 'producto'] as const)
    v.montoHyCite = tipo === 'monto' ? total + uno([-200, -100, 100, 150]) : total
    v.inicialHyCite = tipo === 'inicial' ? inicial + uno([-50, 50, 100]) : inicial
    v.notaCuadre = tipo === 'monto' ? 'En Hy Cite la orden figura sin el descuento aplicado.'
      : tipo === 'inicial' ? 'La inicial registrada en Hy Cite no coincide con lo cobrado.'
        : 'En Hy Cite la orden figura con otro modelo de producto.'
  }
  return v
})

/* ---------- Cobranzas: financiamientos y cuotas ---------- */

/** Parámetros de ejemplo. Los reales se configuran con los de Millennials (2 a 31 cuotas). */
export const TRAMOS_RECARGO = [
  { hasta: 6, recargo: 0 }, { hasta: 12, recargo: 0.06 }, { hasta: 18, recargo: 0.1 },
  { hasta: 24, recargo: 0.14 }, { hasta: 31, recargo: 0.18 },
]
export const INICIAL_MINIMA = 0.1
export const calcularCuota = (total: number, inicial: number, n: number) => {
  const recargo = TRAMOS_RECARGO.find(t => n <= t.hasta)!.recargo
  const financiado = (total - inicial) * (1 + recargo)
  return { recargo, financiado, cuota: Math.ceil(financiado / n) }
}

export const ENLACE_PAGO = 'https://pagos.hycite.example/millennials'
const PERIODO = { Semanal: 7, Quincenal: 15, Mensual: 30 } as const

export const financiamientos: Financiamiento[] = []
for (let k = 0; k < 68; k++) {
  const v = uno(vendedores)
  const [producto, base] = uno(PRODUCTOS)
  const total = base + entero(-2, 4) * 100
  const frecuencia = uno(['Semanal', 'Quincenal', 'Quincenal', 'Mensual', 'Mensual'] as const)
  const periodo = PERIODO[frecuencia]
  const n = frecuencia === 'Semanal' ? entero(12, 31) : frecuencia === 'Quincenal' ? entero(6, 20) : entero(2, 12)
  const inicial = Math.round((total * uno([0.1, 0.15, 0.2, 0.25])) / 50) * 50
  const { cuota } = calcularCuota(total, inicial, n)
  // Cuántos días faltan para la próxima cuota: 0 = vence hoy.
  const falta = k < 7 ? 0 : k < 13 ? 1 : k < 24 ? entero(2, 7) : entero(0, periodo - 1)
  const transcurridas = entero(1, Math.max(1, n - 1))
  const moroso = k >= 24 && prob(0.3)
  const sinPagar = moroso ? entero(1, Math.min(3, transcurridas)) : 0
  const cuotas: Cuota[] = Array.from({ length: n }, (_, i) => {
    const vence = masDias(HOY, falta + (i - transcurridas) * periodo)
    const vencida = diasEntre(vence, HOY) > 0
    const pagada = vencida && i < transcurridas - sinPagar
    return { n: i + 1, vence, monto: cuota, pagada, pagadaEl: pagada ? masDias(vence, -entero(0, 2)) : undefined, medio: pagada ? uno(MEDIOS) : undefined }
  })
  // Tres clientes ya pagaron hoy la cuota que les vencía.
  if (k < 3) Object.assign(cuotas[transcurridas], { pagada: true, pagadaEl: new Date(HOY), pagadaHora: `${9 + k * 2}:${uno(['05', '20', '40'])}`.padStart(5, '0'), medio: uno(['Enlace de pago Hy Cite', 'Yape o Plin'] as const) })
  const f: Financiamiento = {
    id: 'f' + (k + 1), cliente: nombre(), tel: telefono(), email: '', distrito: uno(DISTRITOS),
    vendedorId: v.id, distribucionId: v.distribucionId, gestorId: gestores[k % gestores.length].id,
    producto, total, inicial, frecuencia, cuotas, gestiones: [], contactadoHoy: false,
  }
  f.email = f.cliente.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').split(' ').slice(0, 2).join('.') + '@correo.example'
  financiamientos.push(f)
}

export const reglas: Regla[] = [
  { id: 'r1', nombre: '7 días antes del vencimiento', dias: -7, whatsapp: true, correo: true, activa: true,
    plantilla: 'Hola {nombre}, te recordamos que tu cuota {cuota} de {monto} vence el {fecha}. Puedes pagar aquí: {enlace}' },
  { id: 'r2', nombre: '1 día antes del vencimiento', dias: -1, whatsapp: true, correo: false, activa: true,
    plantilla: 'Hola {nombre}, mañana vence tu cuota {cuota} de {monto}. Paga en línea: {enlace}' },
  { id: 'r3', nombre: 'El día del vencimiento', dias: 0, whatsapp: true, correo: true, activa: true,
    plantilla: 'Hola {nombre}, hoy vence tu cuota {cuota} de {monto}. Evita la mora pagando aquí: {enlace}' },
  { id: 'r4', nombre: '3 días después del vencimiento', dias: 3, whatsapp: true, correo: true, activa: true,
    plantilla: 'Hola {nombre}, tu cuota {cuota} de {monto} venció el {fecha}. Regulariza tu pago aquí: {enlace}' },
  { id: 'r5', nombre: '7 días después del vencimiento', dias: 7, whatsapp: true, correo: false, activa: true,
    plantilla: 'Hola {nombre}, tu cuota {cuota} tiene {atraso} días de atraso. Escríbenos para ayudarte a regularizar: {enlace}' },
  { id: 'r6', nombre: '15 días después del vencimiento', dias: 15, whatsapp: false, correo: true, activa: false,
    plantilla: 'Estimado(a) {nombre}, su cuota {cuota} registra {atraso} días de atraso. Comuníquese con cobranzas.' },
]

// Historial: lo que las reglas ya enviaron de forma automática para la cuota pendiente.
financiamientos.forEach((f) => {
  const pendiente = f.cuotas.find(c => !c.pagada)
  f.cuotas.filter(c => c.pagada).slice(-2).forEach(c =>
    f.gestiones.push({ fecha: c.pagadaEl!, tipo: 'Pago', texto: `Pago registrado de la cuota ${c.n}`, auto: false }))
  if (!pendiente) return
  reglas.filter(r => r.activa).forEach((r) => {
    const envio = masDias(pendiente.vence, r.dias)
    if (diasEntre(envio, HOY) < 0) return
    if (r.whatsapp) f.gestiones.push({ fecha: envio, tipo: 'WhatsApp', texto: `Recordatorio automático: ${r.nombre.toLowerCase()}`, auto: true })
    if (r.correo) f.gestiones.push({ fecha: envio, tipo: 'Correo', texto: `Recordatorio automático: ${r.nombre.toLowerCase()}`, auto: true })
  })
  const atraso = diasEntre(pendiente.vence, HOY)
  if (atraso > 5 && prob(0.6)) {
    f.gestiones.push({ fecha: masDias(HOY, -entero(1, 4)), tipo: 'Llamada', texto: 'Cliente indica que pagará esta semana', auto: false })
    if (prob(0.5)) f.promesa = masDias(HOY, entero(0, 3))
  }
  f.gestiones.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
})

/* ---------- Reclutamiento ---------- */

const entrevistadores = personas.filter(p => p.area === 'Ventas' && p.rango !== 'Emprendedor')
const recepcion = personas.filter(p => p.area === 'Administración' || p.area === 'Secretaría')
export const postulantes: Postulante[] = Array.from({ length: 74 }, (_, k) => {
  const dia = k < 9 ? 0 : k < 17 ? entero(1, 4) : -entero(1, 30)
  const e = uno(entrevistadores)
  // Quien refiere suele ser del mismo equipo; el líder trae más gente que el resto.
  const equipo = personas.filter(p => p.area === 'Ventas' && p.distribucionId === e.distribucionId)
  const lider = equipo.find(p => p.rango !== 'Emprendedor' && p.rango !== 'Distribuidor Junior') ?? equipo[0]
  const referido = prob(0.58)
  const refiere = referido ? uno([lider, lider, ...equipo.slice(0, 5)]) : undefined
  const r = azar()
  const estado: EstadoPostulante = dia >= 0
    ? (dia === 0 && k < 3 ? uno(['Apto', 'No asistió', 'Segunda entrevista'] as const) : 'Citado')
    : r < 0.18 ? 'No asistió' : r < 0.34 ? 'No apto' : r < 0.42 ? 'Segunda entrevista' : r < 0.56 ? 'Apto' : r < 0.76 ? 'En inducción' : 'Activo'
  return {
    id: 'c' + (k + 1), nombre: nombre(), tel: telefono(), distrito: uno(DISTRITOS),
    origen: referido ? 'Referido' : uno(['Aviso de empleo', 'Aviso de empleo', 'Redes sociales', 'Volanteo', 'Feria laboral'] as const),
    referidoPorId: refiere?.id, distribucionId: e.distribucionId,
    fecha: masDias(HOY, dia), hora: hora(9, 17), entrevistadorId: e.id, oficina: distribucion(e.distribucionId).oficina,
    registradoPorId: prob(0.5) ? uno(recepcion).id : e.id, estado,
    nota: estado === 'Apto' ? 'Buena actitud comercial, disponibilidad inmediata.' : estado === 'No apto' ? 'No cuenta con disponibilidad de tiempo.' : '',
    segunda: estado === 'Segunda entrevista' ? { fecha: masDias(HOY, entero(1, 3)), hora: hora(9, 17) } : undefined,
  }
}).sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.localeCompare(b.hora))

/* ---------- Inducción y capacitación ---------- */

export const PASOS_INDUCCION = [
  'Bienvenida y cultura Millennials', 'Conoce el producto', 'Guion de la demostración',
  'Práctica de demo con su líder', 'Programa de referidos 4 en 14', 'Primera demo acompañada',
]
const TEMAS: [string, Sesion['tipo']][] = [
  ['Inducción: bienvenida y cultura Millennials', 'Inducción'], ['Conoce el producto: acero quirúrgico', 'Producto'],
  ['Guion de la demostración en 7 pasos', 'Ventas'], ['Cierre de venta y manejo de objeciones', 'Ventas'],
  ['Programa de referidos 4 en 14', 'Ventas'], ['Curado y cocinado: la segunda visita', 'Producto'],
  ['Cómo formar a tu primer equipo', 'Liderazgo'], ['Inducción: tu primera semana', 'Inducción'],
  ['Financiamiento y calidad de la venta', 'Ventas'],
]
export const sesiones: Sesion[] = TEMAS.map(([tema, tipo], k) => {
  const dia = [-16, -12, -9, -6, -3, -1, 0, 2, 5][k]
  const inscritos = vendedores.filter(() => prob(tipo === 'Liderazgo' ? 0.15 : 0.32)).map(p => p.id)
  return {
    id: 's' + (k + 1), tema, tipo, expositorId: uno(entrevistadores).id,
    fecha: masDias(HOY, dia), hora: uno(['09:00', '10:30', '16:00', '18:30']),
    oficina: uno(['Oficina principal', 'Oficina Norte']), inscritos,
    asistieron: dia < 0 ? inscritos.filter(() => prob(0.82)) : [],
  }
})

/* ---------- Telemarketing ---------- */

export const bases: BaseTm[] = [
  { id: 'b1', nombre: 'Referidos 4 en 14 · noviembre', origen: 'Programa de referidos', registros: 640, trabajados: 412, contactos: 231, citas: 58, porAsignar: 96 },
  { id: 'b2', nombre: 'Clientes con compra anterior', origen: 'Cartera propia', registros: 380, trabajados: 301, contactos: 196, citas: 41, porAsignar: 0 },
  { id: 'b3', nombre: 'Activación en ferias y puntos', origen: 'Marketing', registros: 920, trabajados: 388, contactos: 142, citas: 19, porAsignar: 340 },
]
const RESULTADOS: ResultadoLlamada[] = ['Cita agendada', 'No contesta', 'No contesta', 'Volver a llamar', 'No interesado', 'No contesta', 'Volver a llamar', 'Cita agendada', 'No interesado', 'No contesta', 'Número equivocado', 'No interesado']
export const contactos: Contacto[] = []
operadores.forEach((op, i) => {
  const total = entero(26, 34)
  const hechos = entero(11, 19) + i
  for (let k = 0; k < total; k++) {
    const hecho = k < hechos
    const baseId = uno(bases.slice(0, 3)).id
    const resultado = hecho ? uno(RESULTADOS) : null
    contactos.push({
      id: 't' + (contactos.length + 1), nombre: nombre(), tel: telefono(), distrito: uno(DISTRITOS),
      baseId, operadorId: op.id, intentos: hecho ? entero(1, 3) : entero(0, 2), resultado,
      hora: hecho ? `${String(9 + Math.floor((k / hechos) * 4)).padStart(2, '0')}:${String(entero(0, 59)).padStart(2, '0')}` : undefined,
      referente: baseId === 'b1' ? nombre() : undefined,
      rellamada: resultado === 'Volver a llamar' ? uno(['15:00', '15:30', '16:00', '17:00', '18:00']) : undefined,
      nota: resultado === 'Volver a llamar' ? uno(['Pidió que lo llamen en la tarde', 'Está en el trabajo, llamar después de las 3', 'Quiere consultarlo con su esposa']) : undefined,
    })
  }
})

/* ---------- Tendencias para el tablero ---------- */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** Ventas cerradas por mes, últimos 6 meses. El mes en curso sale de las ventas simuladas. */
export const ventasPorMes = (() => {
  // Los meses anteriores se estiman a partir del ritmo de los últimos 30 días.
  const ritmo30 = demos.filter(d => d.venta && diasEntre(d.fecha, HOY) <= 30).reduce((s, d) => s + d.monto, 0)
  const base = [0.81, 0.87, 0.79, 0.94, 1].map(f => Math.round((ritmo30 * f) / 1000) * 1000)
  const actual = demos.filter(d => d.venta && d.fecha.getMonth() === HOY.getMonth() && d.fecha.getFullYear() === HOY.getFullYear()).reduce((s, d) => s + d.monto, 0)
  return [...base, actual].map((valor, i) => ({ etiqueta: MESES[(HOY.getMonth() - 5 + i + 12) % 12], valor }))
})()
