<script setup lang="ts">
// Ventas e ingresos: registro práctico de cada venta con sus montos, vista del día
// y cuadre manual contra el sistema de Hy Cite (Hy Cite no ofrece conexión directa).
import type { Venta, LineaVenta, FormaPago, MedioPago, Financiamiento } from '~/data/datos'
import { CATALOGO, MEDIOS, persona, distribucion, distribuciones, vendedores, calcularCuota, INICIAL_MINIMA } from '~/data/datos'
import { ingresosDel } from '~/composables/useDemo'
import { HOY, masDias, diasEntre, soles, solesCorto, fCorta, fSemana, pct } from '~/utils/formato'

type Vista = 'hoy' | 'registro' | 'cuadre'
const ruta = useRoute()
const { estado, yo, alcance, ventasVisibles, carteraVisible, demosVisibles, avisar, registrarVenta } = useDemo()
const soyVendedor = computed(() => estado.rol === 'vendedor')
const puedeCuadrar = computed(() => ['gerencia', 'contabilidad'].includes(estado.rol))

const vista = ref<Vista>((ruta.query.vista as Vista) || 'hoy')
watch(() => ruta.query.vista, (v) => { if (v) vista.value = v as Vista })

/* ---------- Hoy ---------- */
const deHoy = computed(() => ventasVisibles.value.filter(v => diasEntre(v.fecha, HOY) === 0).sort((a, b) => b.hora.localeCompare(a.hora)))
const vendidoHoy = computed(() => deHoy.value.reduce((s, v) => s + v.total, 0))
const movimientos = computed(() => ingresosDel(ventasVisibles.value, soyVendedor.value ? [] : carteraVisible.value))
const ingresoHoy = computed(() => movimientos.value.reduce((s, m) => s + m.monto, 0))
const financiadoHy = computed(() => deHoy.value.filter(v => v.forma === 'Crédito Hy Cite').reduce((s, v) => s + v.total - v.inicial, 0))
const financiadoMil = computed(() => deHoy.value.filter(v => v.forma === 'Cuotas Millennials').reduce((s, v) => s + v.total - v.inicial, 0))
const porMedio = computed(() => MEDIOS.map(m => ({ m, monto: movimientos.value.filter(x => x.medio === m).reduce((s, x) => s + x.monto, 0) })))
const maxMedio = computed(() => Math.max(...porMedio.value.map(x => x.monto), 1))
const CONCEPTOS = ['Inicial de venta', 'Venta al contado', 'Cuota cobrada']
const porConcepto = computed(() => CONCEPTOS.map(c => ({ c, monto: movimientos.value.filter(x => x.concepto === c).reduce((s, x) => s + x.monto, 0), n: movimientos.value.filter(x => x.concepto === c).length })))
const verTodos = ref(false)

const semana = computed(() => Array.from({ length: 7 }, (_, i) => {
  const dia = masDias(HOY, i - 6)
  return { etiqueta: i === 6 ? 'hoy' : fSemana(dia), valor: ventasVisibles.value.filter(v => diasEntre(v.fecha, dia) === 0).reduce((s, v) => s + v.total, 0) }
}))
const porEquipo = computed(() => distribuciones.filter(d => !alcance.value || d.id === alcance.value).map(d => ({
  d, n: deHoy.value.filter(v => v.distribucionId === d.id).length, monto: deHoy.value.filter(v => v.distribucionId === d.id).reduce((s, v) => s + v.total, 0),
})).sort((a, b) => b.monto - a.monto))
const maxEquipo = computed(() => Math.max(...porEquipo.value.map(x => x.monto), 1))

/* ---------- Registro ---------- */
const buscar = ref('')
const filtroForma = ref<FormaPago | 'Todas'>('Todas')
const filtroCuadre = ref<Venta['cuadre'] | 'Todos'>('Todos')
const registro = computed(() => ventasVisibles.value
  .filter(v => filtroForma.value === 'Todas' || v.forma === filtroForma.value)
  .filter(v => filtroCuadre.value === 'Todos' || v.cuadre === filtroCuadre.value)
  .filter(v => !buscar.value || `${v.cliente} ${v.codigo} ${v.ordenHyCite}`.toLowerCase().includes(buscar.value.toLowerCase()))
  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || b.hora.localeCompare(a.hora)))
const totalRegistro = computed(() => registro.value.reduce((s, v) => s + v.total, 0))

/* ---------- Cuadre con Hy Cite ---------- */
const pendientes = computed(() => ventasVisibles.value.filter(v => v.cuadre !== 'Cuadrada')
  .sort((a, b) => (a.cuadre === 'Con diferencia' ? 0 : 1) - (b.cuadre === 'Con diferencia' ? 0 : 1) || a.fecha.getTime() - b.fecha.getTime()))
const cuadrePorDia = computed(() => Array.from({ length: 7 }, (_, i) => {
  const dia = masDias(HOY, i - 6)
  const vs = ventasVisibles.value.filter(v => diasEntre(v.fecha, dia) === 0)
  return { dia, total: vs.length, ok: vs.filter(v => v.cuadre === 'Cuadrada').length, dif: vs.filter(v => v.cuadre === 'Con diferencia').length }
}))
const cuenta = (e: Venta['cuadre']) => ventasVisibles.value.filter(v => v.cuadre === e).length

const cuadrando = ref<Venta | null>(null)
const cq = reactive({ orden: '', monto: '' as number | '', inicial: '' as number | '', productos: false, nota: '' })
const abrirCuadre = (v: Venta) => {
  cuadrando.value = v
  Object.assign(cq, { orden: v.ordenHyCite, monto: v.montoHyCite ?? '', inicial: v.inicialHyCite ?? '', productos: v.cuadre === 'Con diferencia', nota: '' })
}
const difMonto = computed(() => cuadrando.value && cq.monto !== '' ? Number(cq.monto) - cuadrando.value.total : null)
const difInicial = computed(() => cuadrando.value && cq.inicial !== '' ? Number(cq.inicial) - cuadrando.value.inicial : null)
const coincide = computed(() => !!cq.orden.trim() && difMonto.value === 0 && difInicial.value === 0 && cq.productos)
const cerrarCuadre = (estadoFinal: 'Cuadrada' | 'Con diferencia') => {
  const v = cuadrando.value!
  Object.assign(v, {
    ordenHyCite: cq.orden.trim(), montoHyCite: cq.monto === '' ? undefined : Number(cq.monto), inicialHyCite: cq.inicial === '' ? undefined : Number(cq.inicial),
    cuadre: estadoFinal, cuadradoPorId: yo.value.id, cuadradoEl: new Date(),
    notaCuadre: estadoFinal === 'Con diferencia' ? cq.nota.trim() : v.cuadre === 'Con diferencia' ? `Resuelta. ${v.notaCuadre ?? ''}`.trim() : undefined,
  })
  avisar(estadoFinal === 'Cuadrada' ? `${v.codigo} cuadrada con Hy Cite` : `Diferencia registrada en ${v.codigo}`)
  cuadrando.value = null
}

/* ---------- Ficha ---------- */
const ficha = ref<Venta | null>(null)
const demoDe = (v: Venta) => estado.demos.find(d => d.id === v.demoId)

/* ---------- Registrar venta ---------- */
const nueva = ref(false)
const vacio = () => ({
  demoId: '', cliente: '', tel: '', dni: '', distrito: '', vendedorId: soyVendedor.value ? yo.value.id : '',
  lineas: [] as LineaVenta[], descuento: 0, forma: 'Crédito Hy Cite' as FormaPago, inicial: 0,
  medio: 'Efectivo' as MedioPago, ordenHyCite: '', cuotas: 12, frecuencia: 'Mensual' as Financiamiento['frecuencia'],
})
const form = reactive(vacio())
const demosSinVenta = computed(() => demosVisibles.value
  .filter(d => !d.venta && d.visita === 'Realizada' && diasEntre(d.fecha, HOY) <= 3)
  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))
const equipoVentas = computed(() => vendedores.filter(v => !alcance.value || v.distribucionId === alcance.value))
const bruto = computed(() => form.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0))
const total = computed(() => Math.max(bruto.value - form.descuento, 0))
const cuotaMil = computed(() => calcularCuota(total.value, form.inicial, form.cuotas))
const inicialMinima = computed(() => Math.round(total.value * INICIAL_MINIMA))

const abrirNueva = (demoId = '') => {
  Object.assign(form, vacio())
  const d = estado.demos.find(x => x.id === demoId)
  if (d) Object.assign(form, { demoId: d.id, cliente: d.cliente, tel: d.tel, distrito: d.distrito, vendedorId: d.vendedorId })
  nueva.value = true
}
const elegirDemo = () => {
  const d = estado.demos.find(x => x.id === form.demoId)
  if (d) Object.assign(form, { cliente: d.cliente, tel: d.tel, distrito: d.distrito, vendedorId: d.vendedorId })
}
const agregar = (p: { producto: string; precio: number }) => {
  const l = form.lineas.find(x => x.producto === p.producto)
  l ? l.cantidad++ : form.lineas.push({ ...p, cantidad: 1 })
  if (form.forma !== 'Contado') form.inicial = Math.round((total.value * 0.15) / 10) * 10
}
const quitar = (l: LineaVenta) => { l.cantidad > 1 ? l.cantidad-- : form.lineas.splice(form.lineas.indexOf(l), 1) }
watch(() => form.forma, (f) => { if (f !== 'Contado' && !form.inicial) form.inicial = Math.round((total.value * 0.15) / 10) * 10 })

const guardar = () => {
  if (!form.cliente.trim()) return avisar('Escribe el nombre del cliente')
  if (!form.vendedorId) return avisar('Elige al vendedor que cerró la venta')
  if (!form.lineas.length) return avisar('Agrega al menos un producto')
  const v = registrarVenta({ ...form, demoId: form.demoId || undefined, cliente: form.cliente.trim(), lineas: form.lineas.map(l => ({ ...l })) })
  nueva.value = false
  vista.value = 'hoy'
  avisar(form.forma === 'Cuotas Millennials'
    ? `Venta ${v.codigo} registrada. Su cronograma ya está en Cobranzas.`
    : `Venta ${v.codigo} registrada por ${soles(v.total)}. Queda por cuadrar con Hy Cite.`)
}

// Entradas directas: ?demo=ID abre el registro desde una demo; ?nueva=1 abre el formulario vacío.
onMounted(() => {
  if (ruta.query.demo) abrirNueva(String(ruta.query.demo))
  else if (ruta.query.nueva) abrirNueva()
})

const nombreCorto = (id: string) => persona(id).nombre.split(' ').slice(0, 2).join(' ')
</script>

<template>
  <div>
    <Encabezado :titulo="soyVendedor ? 'Mis ventas' : 'Ventas e ingresos'">
      <template v-if="soyVendedor">
        Hoy registraste <b class="text-tinta">{{ deHoy.length }} {{ deHoy.length === 1 ? 'venta' : 'ventas' }} por {{ soles(vendidoHoy) }}</b>.
        {{ cuenta('Por cuadrar') === 1 ? '1 de tus ventas aún no se cuadra' : `${cuenta('Por cuadrar')} de tus ventas aún no se cuadran` }} con Hy Cite.
      </template>
      <template v-else>
        Hoy se registraron <b class="text-tinta">{{ deHoy.length }} ventas por {{ soles(vendidoHoy) }}</b>
        e ingresaron <b class="text-tinta">{{ soles(ingresoHoy) }}</b> entre iniciales, ventas al contado y cuotas.
        <template v-if="puedeCuadrar"><b class="text-llama-700">{{ cuenta('Por cuadrar') + cuenta('Con diferencia') }} ventas esperan su cuadre con Hy Cite.</b></template>
      </template>
      <template #acciones>
        <button class="btn-llama" @click="abrirNueva()"><Icono nombre="mas" :size="16" />Registrar venta</button>
      </template>
    </Encabezado>

    <div class="mb-4 inline-flex flex-wrap rounded-lg border border-regla bg-white p-1" role="tablist">
      <button v-for="t in ([['hoy', 'Hoy', deHoy.length], ['registro', soyVendedor ? 'Mis ventas' : 'Registro de ventas', ventasVisibles.length], ...(puedeCuadrar ? [['cuadre', 'Cuadre con Hy Cite', pendientes.length]] : [])] as [Vista, string, number][])" :key="t[0]"
        role="tab" :aria-selected="vista === t[0]" class="rounded-md px-4 py-1.5 text-sm font-semibold"
        :class="vista === t[0] ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = t[0]">
        {{ t[1] }} <span class="opacity-70">{{ t[2] }}</span>
      </button>
    </div>

    <!-- ================= Hoy ================= -->
    <template v-if="vista === 'hoy'">
      <section class="panel grid grid-cols-2 gap-6 p-6 md:grid-cols-4 md:divide-x md:divide-regla">
        <Cifra nombre="Vendido hoy" :valor="soles(vendidoHoy)" :nota="`${deHoy.length} ventas registradas`" />
        <Cifra class="md:pl-6" nombre="Ingresó hoy" :valor="soles(ingresoHoy)" tono="ok" :nota="`${movimientos.length} cobros entre ventas y cuotas`" />
        <Cifra class="md:pl-6" nombre="Financiado hoy" :valor="soles(financiadoHy + financiadoMil)" :nota="`${solesCorto(financiadoHy)} Hy Cite · ${solesCorto(financiadoMil)} Millennials`" />
        <Cifra class="md:pl-6" nombre="Por cuadrar con Hy Cite" :valor="cuenta('Por cuadrar')" tono="llama" :nota="`${cuenta('Con diferencia')} con diferencia por resolver`" />
      </section>

      <div class="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section class="panel">
          <h2 class="panel-titulo px-5 pb-3 pt-5">Ventas de hoy</h2>
          <ul class="divide-y divide-regla border-t border-regla">
            <li v-for="v in deHoy" :key="v.id">
              <button class="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-marino-50/70" @click="ficha = v">
                <span class="w-11 text-sm text-tinta-tenue">{{ v.hora }}</span>
                <span class="min-w-0 flex-1 basis-44">
                  <span class="block truncate font-semibold">{{ v.cliente }}</span>
                  <span class="block truncate text-xs text-tinta-suave">{{ v.lineas.map(l => l.producto).join(' + ') }} · {{ nombreCorto(v.vendedorId) }}</span>
                </span>
                <Chip :texto="v.forma" />
                <span class="w-24 text-right">
                  <b class="block">{{ soles(v.total) }}</b>
                  <span class="block text-xs text-ok">{{ v.forma === 'Contado' ? 'pagado' : `inicial ${soles(v.inicial)}` }}</span>
                </span>
              </button>
            </li>
            <li v-if="!deHoy.length" class="px-5 py-10 text-center text-sm text-tinta-suave">Aún no hay ventas registradas hoy.</li>
          </ul>
        </section>

        <section class="panel p-5">
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="panel-titulo">Ingresos de hoy</h2>
            <b class="text-lg">{{ soles(ingresoHoy) }}</b>
          </div>
          <ul class="mt-4 space-y-3">
            <li v-for="x in porMedio" :key="x.m">
              <div class="flex justify-between text-sm"><span class="text-tinta-suave">{{ x.m }}</span><b>{{ soles(x.monto) }}</b></div>
              <div class="mt-1 h-2.5 rounded-[4px] bg-marino-50"><div class="h-full rounded-[4px] bg-marino-600" :style="{ width: (x.monto / maxMedio) * 100 + '%' }" /></div>
            </li>
          </ul>
          <dl class="mt-5 grid grid-cols-3 gap-3 border-t border-regla pt-4 text-sm">
            <div v-for="x in porConcepto" :key="x.c"><dt class="text-xs text-tinta-suave">{{ x.c === 'Cuota cobrada' ? 'Cuotas cobradas' : x.c === 'Inicial de venta' ? 'Iniciales' : 'Al contado' }}</dt><dd class="font-bold">{{ soles(x.monto) }}</dd><dd class="text-xs text-tinta-tenue">{{ x.n }} {{ x.n === 1 ? 'cobro' : 'cobros' }}</dd></div>
          </dl>
          <h3 class="mt-5 text-sm font-bold">Movimientos</h3>
          <ul class="mt-2 divide-y divide-regla text-sm">
            <li v-for="(m, i) in (verTodos ? movimientos : movimientos.slice(0, 6))" :key="i" class="flex items-center gap-3 py-2">
              <span class="w-11 text-tinta-tenue">{{ m.hora }}</span>
              <span class="min-w-0 flex-1"><span class="block truncate">{{ m.detalle }}</span><span class="block text-xs text-tinta-tenue">{{ m.concepto }} · {{ m.medio }}</span></span>
              <b>{{ soles(m.monto) }}</b>
            </li>
          </ul>
          <button v-if="movimientos.length > 6" class="mt-2 text-sm font-semibold text-marino-600 hover:underline" @click="verTodos = !verTodos">{{ verTodos ? 'Ver menos' : `Ver los ${movimientos.length} movimientos` }}</button>
        </section>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <section class="panel p-6">
          <div class="mb-4 flex items-baseline justify-between"><h2 class="panel-titulo">Vendido en los últimos 7 días</h2><p class="text-sm text-tinta-suave">Soles</p></div>
          <Barras :datos="semana" :formato="solesCorto" resaltar-ultimo :alto="150" />
        </section>
        <section v-if="!soyVendedor" class="panel p-6">
          <h2 class="panel-titulo mb-4">Ventas de hoy por distribuidor</h2>
          <ul class="space-y-3">
            <li v-for="x in porEquipo" :key="x.d.id">
              <div class="flex justify-between gap-3 text-sm"><span class="truncate text-tinta-suave">{{ x.d.lider }}</span><span><b>{{ soles(x.monto) }}</b> <span class="text-tinta-tenue">· {{ x.n }}</span></span></div>
              <div class="mt-1 h-2.5 rounded-[4px] bg-marino-50"><div class="h-full rounded-[4px] bg-marino-600" :style="{ width: (x.monto / maxEquipo) * 100 + '%' }" /></div>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- ================= Registro ================= -->
    <section v-else-if="vista === 'registro'" class="panel overflow-x-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
        <p class="text-sm text-tinta-suave"><b class="text-tinta">{{ registro.length }} ventas</b> por {{ soles(totalRegistro) }}</p>
        <div class="flex flex-wrap gap-2">
          <input v-model="buscar" class="campo w-56" placeholder="Cliente, código u orden Hy Cite" aria-label="Buscar venta" />
          <select v-model="filtroForma" class="campo w-auto" aria-label="Forma de pago"><option>Todas</option><option>Contado</option><option>Crédito Hy Cite</option><option>Cuotas Millennials</option></select>
          <select v-model="filtroCuadre" class="campo w-auto" aria-label="Cuadre"><option>Todos</option><option>Por cuadrar</option><option>Cuadrada</option><option>Con diferencia</option></select>
        </div>
      </div>
      <table class="w-full min-w-[980px]">
        <thead class="border-y border-regla bg-marino-50"><tr>
          <th class="th">Fecha</th><th class="th">Venta</th><th class="th">Cliente</th><th class="th">Vendedor</th><th class="th text-right">Total</th><th class="th text-right">Inicial</th><th class="th">Forma de pago</th><th class="th">Cuadre Hy Cite</th>
        </tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="v in registro" :key="v.id" class="cursor-pointer hover:bg-marino-50/70" @click="ficha = v">
            <td class="td text-tinta-suave">{{ diasEntre(v.fecha, HOY) === 0 ? 'Hoy' : fCorta(v.fecha) }}, {{ v.hora }}</td>
            <td class="td"><b>{{ v.codigo }}</b><p class="text-xs text-tinta-tenue">{{ v.ordenHyCite || 'Sin orden Hy Cite' }}</p></td>
            <td class="td"><p class="font-semibold">{{ v.cliente }}</p><p class="max-w-[220px] truncate text-xs text-tinta-suave">{{ v.lineas.map(l => l.producto).join(' + ') }}</p></td>
            <td class="td text-tinta-suave">{{ nombreCorto(v.vendedorId) }}</td>
            <td class="td text-right font-bold">{{ soles(v.total) }}</td>
            <td class="td text-right">{{ soles(v.inicial) }}</td>
            <td class="td"><Chip :texto="v.forma" /></td>
            <td class="td"><Chip :texto="v.cuadre" /></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!registro.length" class="px-5 py-10 text-center text-sm text-tinta-suave">Ninguna venta coincide con el filtro.</p>
    </section>

    <!-- ================= Cuadre ================= -->
    <template v-else>
      <div class="flex items-start gap-3 rounded-panel border border-marino-100 bg-marino-50 px-4 py-3 text-sm">
        <Icono nombre="cuadre" class="mt-0.5 shrink-0 text-marino-600" />
        <p>Hy Cite no se conecta con otros sistemas, así que el cuadre es manual: busca cada venta en el sistema de Hy Cite por su número de orden y compara
          el monto total, la inicial y los productos. Lo que no coincide queda marcado hasta resolverlo.</p>
      </div>

      <section class="panel mt-5 p-5">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="panel-titulo">Avance del cuadre, últimos 7 días</h2>
          <p class="text-sm text-tinta-suave">{{ cuenta('Cuadrada') }} cuadradas · {{ cuenta('Por cuadrar') }} por cuadrar · {{ cuenta('Con diferencia') }} con diferencia</p>
        </div>
        <div class="grid grid-cols-7 gap-2">
          <div v-for="d in cuadrePorDia" :key="d.dia.getTime()" class="rounded-lg border p-2.5" :class="diasEntre(d.dia, HOY) === 0 ? 'border-llama bg-llama-50' : 'border-regla'">
            <p class="text-xs font-bold capitalize" :class="diasEntre(d.dia, HOY) === 0 ? 'text-llama-700' : 'text-tinta-suave'">{{ diasEntre(d.dia, HOY) === 0 ? 'Hoy' : fSemana(d.dia) }}</p>
            <p class="mt-1 text-lg font-bold leading-none">{{ d.ok }}<span class="text-sm font-normal text-tinta-tenue">/{{ d.total }}</span></p>
            <div class="mt-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-regla">
              <i class="bg-ok" :style="{ width: pct(d.ok, d.total) }" /><i class="bg-mora" :style="{ width: pct(d.dif, d.total) }" />
            </div>
          </div>
        </div>
      </section>

      <section class="panel mt-5">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Ventas por revisar</h2>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="v in pendientes" :key="v.id" class="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
            <span class="w-20 text-sm text-tinta-suave">{{ diasEntre(v.fecha, HOY) === 0 ? 'Hoy' : fCorta(v.fecha) }}</span>
            <span class="min-w-0 flex-1 basis-48">
              <span class="block truncate font-semibold">{{ v.codigo }} · {{ v.cliente }}</span>
              <span class="block truncate text-xs" :class="v.cuadre === 'Con diferencia' ? 'text-mora' : 'text-tinta-suave'">{{ v.cuadre === 'Con diferencia' ? v.notaCuadre : `${v.forma} · ${nombreCorto(v.vendedorId)}` }}</span>
            </span>
            <span class="w-32 text-xs text-tinta-suave">{{ v.ordenHyCite || 'Sin orden Hy Cite' }}</span>
            <b class="w-24 text-right">{{ soles(v.total) }}</b>
            <Chip :texto="v.cuadre" />
            <button class="btn-linea" @click="abrirCuadre(v)">{{ v.cuadre === 'Con diferencia' ? 'Resolver' : 'Cuadrar' }}</button>
          </li>
          <li v-if="!pendientes.length" class="px-5 py-10 text-center text-sm text-tinta-suave">Todo cuadrado con Hy Cite.</li>
        </ul>
      </section>
    </template>

    <!-- Ficha de la venta -->
    <Cajon :abierto="!!ficha" :titulo="ficha ? `${ficha.codigo} · ${ficha.cliente}` : ''" :subtitulo="ficha ? `${diasEntre(ficha.fecha, HOY) === 0 ? 'Hoy' : fCorta(ficha.fecha)}, ${ficha.hora} · ${ficha.distrito}` : ''" @cerrar="ficha = null">
      <template v-if="ficha">
        <ul class="divide-y divide-regla rounded-panel border border-regla text-sm">
          <li v-for="l in ficha.lineas" :key="l.producto" class="flex justify-between px-4 py-2.5"><span>{{ l.cantidad }} × {{ l.producto }}</span><b>{{ soles(l.precio * l.cantidad) }}</b></li>
          <li v-if="ficha.descuento" class="flex justify-between px-4 py-2.5 text-tinta-suave"><span>Descuento</span><span>− {{ soles(ficha.descuento) }}</span></li>
          <li class="flex justify-between bg-marino-50 px-4 py-3"><span class="font-bold">Total</span><b class="text-lg">{{ soles(ficha.total) }}</b></li>
        </ul>
        <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-tinta-suave">Forma de pago</dt><dd class="mt-0.5"><Chip :texto="ficha.forma" /></dd></div>
          <div><dt class="text-tinta-suave">{{ ficha.forma === 'Contado' ? 'Pagado' : 'Inicial' }}</dt><dd class="font-semibold">{{ soles(ficha.inicial) }} · {{ ficha.medio }}</dd></div>
          <div v-if="ficha.forma !== 'Contado'"><dt class="text-tinta-suave">Saldo financiado</dt><dd class="font-semibold">{{ soles(ficha.total - ficha.inicial) }}</dd></div>
          <div><dt class="text-tinta-suave">Vendedor</dt><dd class="font-semibold">{{ persona(ficha.vendedorId).nombre }}</dd></div>
          <div><dt class="text-tinta-suave">Equipo</dt><dd class="font-semibold">{{ distribucion(ficha.distribucionId).lider }}</dd></div>
          <div><dt class="text-tinta-suave">Cliente</dt><dd class="font-semibold">DNI {{ ficha.dni || '—' }} · {{ ficha.tel || 'sin celular' }}</dd></div>
          <div><dt class="text-tinta-suave">Registró</dt><dd class="font-semibold">{{ persona(ficha.registradoPorId).nombre }}</dd></div>
        </dl>

        <div class="mt-6 rounded-panel p-4" :class="ficha.cuadre === 'Cuadrada' ? 'bg-ok-fondo' : ficha.cuadre === 'Con diferencia' ? 'bg-mora-fondo' : 'bg-llama-50'">
          <p class="flex items-center justify-between gap-3"><b>Cuadre con Hy Cite</b><Chip :texto="ficha.cuadre" /></p>
          <p class="mt-1 text-sm text-tinta-suave">Orden en Hy Cite: <b class="text-tinta">{{ ficha.ordenHyCite || 'aún sin registrar' }}</b></p>
          <p v-if="ficha.notaCuadre" class="mt-1 text-sm">{{ ficha.notaCuadre }}</p>
          <p v-if="ficha.cuadradoPorId" class="mt-1 text-xs text-tinta-suave">Revisó {{ persona(ficha.cuadradoPorId).nombre }}</p>
          <button v-if="puedeCuadrar && ficha.cuadre !== 'Cuadrada'" class="btn-primario mt-3" @click="abrirCuadre(ficha); ficha = null">{{ ficha.cuadre === 'Con diferencia' ? 'Resolver diferencia' : 'Cuadrar ahora' }}</button>
        </div>

        <template v-if="demoDe(ficha)">
          <h3 class="mb-3 mt-6 text-sm font-bold">Recorrido de la venta</h3>
          <Riel :etapa="demoDe(ficha)!.etapa" />
          <p class="mt-3 text-xs text-tinta-suave">Viene de la demo del {{ fCorta(demoDe(ficha)!.fecha) }} ({{ demoDe(ficha)!.origen.toLowerCase() }}).</p>
        </template>
      </template>
    </Cajon>

    <!-- Cuadre de una venta -->
    <Cajon :abierto="!!cuadrando" :titulo="cuadrando ? `Cuadrar ${cuadrando.codigo}` : ''" :subtitulo="cuadrando ? `${cuadrando.cliente} · vendida el ${fCorta(cuadrando.fecha)} por ${nombreCorto(cuadrando.vendedorId)}` : ''" @cerrar="cuadrando = null">
      <template v-if="cuadrando">
        <p v-if="cuadrando.cuadre === 'Con diferencia'" class="mb-4 rounded-panel bg-mora-fondo px-4 py-3 text-sm text-mora"><b>Diferencia anotada:</b> {{ cuadrando.notaCuadre }}</p>
        <label class="text-sm font-semibold">N.º de orden en Hy Cite
          <input v-model="cq.orden" class="campo mt-1 font-normal" placeholder="Ej. HC48210377" /></label>
        <p class="mt-1 text-xs text-tinta-suave">Búscala en el sistema de Hy Cite y compara con lo registrado aquí.</p>

        <table class="mt-5 w-full text-sm">
          <thead><tr class="border-b border-regla"><th class="py-2 text-left font-semibold text-tinta-suave">Dato</th><th class="py-2 text-left font-semibold text-tinta-suave">En Millennials</th><th class="py-2 text-left font-semibold text-tinta-suave">En Hy Cite</th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr>
              <td class="py-3">Monto total</td><td class="py-3 font-bold">{{ soles(cuadrando.total) }}</td>
              <td class="py-3"><input v-model.number="cq.monto" type="number" class="campo w-32" placeholder="S/" aria-label="Monto total en Hy Cite" />
                <span v-if="difMonto !== null" class="ml-2 text-xs font-semibold" :class="difMonto === 0 ? 'text-ok' : 'text-mora'">{{ difMonto === 0 ? 'Coincide' : `Diferencia ${soles(Math.abs(difMonto))}` }}</span></td>
            </tr>
            <tr>
              <td class="py-3">{{ cuadrando.forma === 'Contado' ? 'Pagado' : 'Inicial' }}</td><td class="py-3 font-bold">{{ soles(cuadrando.inicial) }}</td>
              <td class="py-3"><input v-model.number="cq.inicial" type="number" class="campo w-32" placeholder="S/" aria-label="Inicial en Hy Cite" />
                <span v-if="difInicial !== null" class="ml-2 text-xs font-semibold" :class="difInicial === 0 ? 'text-ok' : 'text-mora'">{{ difInicial === 0 ? 'Coincide' : `Diferencia ${soles(Math.abs(difInicial))}` }}</span></td>
            </tr>
            <tr>
              <td class="py-3 align-top">Productos</td><td class="py-3"><p v-for="l in cuadrando.lineas" :key="l.producto">{{ l.cantidad }} × {{ l.producto }}</p></td>
              <td class="py-3 align-top"><label class="flex items-center gap-2"><input v-model="cq.productos" type="checkbox" class="h-4 w-4 accent-[#12805C]" />Son los mismos</label></td>
            </tr>
          </tbody>
        </table>

        <label class="mt-5 block text-sm font-semibold">Nota
          <textarea v-model="cq.nota" rows="2" class="campo mt-1 font-normal" placeholder="Qué no coincide y qué se hará para corregirlo" /></label>
      </template>
      <template #pie>
        <div class="flex flex-wrap justify-end gap-2">
          <button class="btn-linea" :disabled="!cq.orden.trim() || !cq.nota.trim()" :class="!cq.orden.trim() || !cq.nota.trim() ? 'cursor-not-allowed opacity-50' : ''" @click="cerrarCuadre('Con diferencia')">Registrar diferencia</button>
          <button class="btn-primario" :disabled="!coincide" :class="!coincide ? 'cursor-not-allowed opacity-50' : ''" @click="cerrarCuadre('Cuadrada')"><Icono nombre="check" :size="16" />Coincide con Hy Cite</button>
        </div>
      </template>
    </Cajon>

    <!-- Registrar venta -->
    <Cajon :abierto="nueva" titulo="Registrar venta" subtitulo="Registro interno para seguimiento. La orden se ingresa también en el sistema de Hy Cite." @cerrar="nueva = false">
      <div class="grid grid-cols-2 gap-4">
        <label v-if="demosSinVenta.length" class="col-span-2 text-sm font-semibold">Viene de la demo
          <select v-model="form.demoId" class="campo mt-1 font-normal" @change="elegirDemo">
            <option value="">Sin demo asociada</option>
            <option v-for="d in demosSinVenta" :key="d.id" :value="d.id">{{ d.cliente }} · {{ diasEntre(d.fecha, HOY) === 0 ? 'hoy' : fCorta(d.fecha) }} {{ d.hora }} · {{ nombreCorto(d.vendedorId) }}</option>
          </select></label>
        <label class="col-span-2 text-sm font-semibold">Cliente<input v-model="form.cliente" class="campo mt-1 font-normal" placeholder="Nombres y apellidos" /></label>
        <label class="text-sm font-semibold">DNI<input v-model="form.dni" class="campo mt-1 font-normal" inputmode="numeric" maxlength="8" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" inputmode="tel" /></label>
        <label class="text-sm font-semibold">Distrito<input v-model="form.distrito" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Vendedor
          <select v-model="form.vendedorId" class="campo mt-1 font-normal" :disabled="soyVendedor">
            <option value="" disabled>Elige al vendedor</option>
            <option v-for="v in equipoVentas" :key="v.id" :value="v.id">{{ v.nombre }}</option>
          </select></label>
      </div>

      <h3 class="mb-2 mt-6 text-sm font-bold">Productos</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="p in CATALOGO" :key="p.producto" class="rounded-lg border border-regla px-3 py-1.5 text-left text-xs hover:border-marino-300 hover:bg-marino-50" @click="agregar(p)">
          <span class="block font-semibold">{{ p.producto }}</span><span class="text-tinta-suave">{{ soles(p.precio) }}</span>
        </button>
      </div>
      <ul v-if="form.lineas.length" class="mt-3 divide-y divide-regla rounded-panel border border-regla text-sm">
        <li v-for="l in form.lineas" :key="l.producto" class="flex items-center gap-3 px-3 py-2">
          <span class="flex-1">{{ l.producto }}</span>
          <span class="inline-flex items-center rounded-md border border-regla">
            <button class="px-2 py-0.5 text-tinta-suave" :aria-label="`Quitar uno de ${l.producto}`" @click="quitar(l)">−</button>
            <b class="w-6 text-center">{{ l.cantidad }}</b>
            <button class="px-2 py-0.5 text-tinta-suave" :aria-label="`Agregar uno de ${l.producto}`" @click="l.cantidad++">+</button>
          </span>
          <b class="w-20 text-right">{{ soles(l.precio * l.cantidad) }}</b>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-tinta-tenue">Toca un producto para agregarlo.</p>
      <label class="mt-3 flex items-center justify-between gap-3 text-sm font-semibold">Descuento (S/)
        <input v-model.number="form.descuento" type="number" min="0" step="50" class="campo w-32 font-normal" /></label>

      <h3 class="mb-2 mt-6 text-sm font-bold">Forma de pago</h3>
      <div class="grid grid-cols-3 gap-1 rounded-lg bg-marino-50 p-1">
        <button v-for="f in (['Contado', 'Crédito Hy Cite', 'Cuotas Millennials'] as FormaPago[])" :key="f" class="rounded-md px-2 py-2 text-sm font-semibold" :class="form.forma === f ? 'bg-white text-tinta shadow-sm' : 'text-tinta-suave'" :aria-pressed="form.forma === f" @click="form.forma = f">{{ f }}</button>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-4">
        <label v-if="form.forma !== 'Contado'" class="text-sm font-semibold">Inicial cobrada (S/)
          <input v-model.number="form.inicial" type="number" min="0" step="10" class="campo mt-1 font-normal" />
          <span v-if="form.forma === 'Cuotas Millennials' && form.inicial < inicialMinima" class="mt-1 block text-xs font-normal text-mora">La inicial mínima es {{ soles(inicialMinima) }}</span></label>
        <label class="text-sm font-semibold">Medio de pago
          <select v-model="form.medio" class="campo mt-1 font-normal"><option v-for="m in MEDIOS" :key="m">{{ m }}</option></select></label>
        <template v-if="form.forma === 'Cuotas Millennials'">
          <label class="text-sm font-semibold">Número de cuotas: {{ form.cuotas }}<input v-model.number="form.cuotas" type="range" min="2" max="31" class="mt-2 w-full accent-[#FF8403]" /></label>
          <label class="text-sm font-semibold">Frecuencia<select v-model="form.frecuencia" class="campo mt-1 font-normal"><option>Semanal</option><option>Quincenal</option><option>Mensual</option></select></label>
        </template>
      </div>
      <p v-if="form.forma === 'Crédito Hy Cite'" class="mt-2 text-xs text-tinta-suave">Hy Cite evalúa y aprueba el crédito en su sistema. Aquí queda el registro para el seguimiento interno.</p>

      <div class="mt-5 rounded-panel bg-marino p-5 text-white">
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-sm text-marino-300">Total de la venta</span><span class="text-3xl font-extrabold tracking-tight">{{ soles(total) }}</span>
        </div>
        <div class="mt-2 flex items-baseline justify-between gap-3 text-sm">
          <span class="text-marino-300">Ingresa hoy</span><b class="text-llama-ambar">{{ soles(form.forma === 'Contado' ? total : form.inicial) }}</b>
        </div>
        <div v-if="form.forma === 'Cuotas Millennials' && total" class="mt-1 flex items-baseline justify-between gap-3 text-sm">
          <span class="text-marino-300">{{ form.cuotas }} cuotas {{ form.frecuencia.toLowerCase() }}es de</span><b>{{ soles(cuotaMil.cuota) }}</b>
        </div>
        <div v-else-if="form.forma === 'Crédito Hy Cite' && total" class="mt-1 flex items-baseline justify-between gap-3 text-sm">
          <span class="text-marino-300">Financia Hy Cite</span><b>{{ soles(total - form.inicial) }}</b>
        </div>
      </div>

      <label class="mt-5 block text-sm font-semibold">N.º de orden en Hy Cite <span class="font-normal text-tinta-tenue">(opcional)</span>
        <input v-model="form.ordenHyCite" class="campo mt-1 font-normal" placeholder="Si ya la ingresaste en Hy Cite" /></label>
      <p class="mt-1 text-xs text-tinta-suave">Con el número de orden, contabilidad encuentra la venta más rápido al cuadrar.</p>

      <template #pie>
        <div class="flex justify-end gap-2"><button class="btn-linea" @click="nueva = false">Cancelar</button><button class="btn-primario" @click="guardar">Registrar venta</button></div>
      </template>
    </Cajon>
  </div>
</template>
