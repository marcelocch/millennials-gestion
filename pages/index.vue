<script setup lang="ts">
import { ETAPAS, ventasPorMes, distribuciones, vendedores } from '~/data/datos'
import { situacion, ingresosDel } from '~/composables/useDemo'
import { HOY, diasEntre, soles, solesCorto, pct } from '~/utils/formato'

const { estado, rol, yo, alcance, demosVisibles, carteraVisible, ventasVisibles } = useDemo()

// Solo gerencia y distribuidores tienen tablero; los demás perfiles empiezan en su módulo.
if (!['gerencia', 'distribuidor'].includes(estado.rol)) await navigateTo(rol.value.inicio)

// El día de hoy
const ventasHoy = computed(() => ventasVisibles.value.filter(v => diasEntre(v.fecha, HOY) === 0))
const vendidoHoy = computed(() => ventasHoy.value.reduce((s, v) => s + v.total, 0))
const ingresoHoy = computed(() => ingresosDel(ventasVisibles.value, carteraVisible.value).reduce((s, m) => s + m.monto, 0))
const demosHoy = computed(() => demosVisibles.value.filter(d => diasEntre(d.fecha, HOY) === 0))
const porCuadrar = computed(() => ventasVisibles.value.filter(v => v.cuadre !== 'Cuadrada').length)

const pasadas = computed(() => demosVisibles.value.filter(d => diasEntre(d.fecha, HOY) >= 0 && diasEntre(d.fecha, HOY) <= 30))
const realizadas = computed(() => pasadas.value.filter(d => d.visita === 'Realizada'))
const ventas = computed(() => realizadas.value.filter(d => d.venta))
const montoVentas = computed(() => ventas.value.reduce((s, d) => s + d.monto, 0))
const conteoEtapas = computed(() => ETAPAS.map((_, i) => i === 0
  ? realizadas.value.filter(d => !d.venta).length
  : ventas.value.filter(d => d.etapa === i).length))

const cartera = computed(() => carteraVisible.value.map(f => ({ f, s: situacion(f) })))
const porCobrarSemana = computed(() => cartera.value.filter(x => x.s.cuota && x.s.falta >= 0 && x.s.falta <= 7).reduce((s, x) => s + x.s.cuota!.monto, 0))
const enMora = computed(() => cartera.value.filter(x => x.s.estado === 'En mora'))
const montoMora = computed(() => enMora.value.reduce((s, x) => s + x.s.vencido, 0))
const saldoTotal = computed(() => cartera.value.reduce((s, x) => s + x.s.saldo, 0))

const porValidar = computed(() => demosVisibles.value.filter(d => d.venta && d.etapa === 4 && !d.validada))
const detenidas = computed(() => demosVisibles.value.filter(d => d.venta && d.etapa < 4 && d.diasEnEtapa > 7))
const moraGrave = computed(() => enMora.value.filter(x => x.s.atraso > 15))
const entrevistasHoy = computed(() => estado.postulantes.filter(p => diasEntre(p.fecha, HOY) === 0 && (!alcance.value || p.distribucionId === alcance.value)))

const pendientes = computed(() => [
  { n: porCuadrar.value, texto: 'ventas esperan su cuadre con Hy Cite', ruta: '/ventas?vista=cuadre', tono: 'llama' },
  { n: porValidar.value.length, texto: 'ventas con evidencia lista para validar y habilitar comisión', ruta: '/demos', tono: 'llama' },
  { n: detenidas.value.length, texto: 'ventas llevan más de 7 días detenidas en la misma etapa', ruta: '/demos', tono: 'aviso' },
  { n: moraGrave.value.length, texto: 'clientes superan los 15 días de atraso', ruta: '/cobranzas', tono: 'mora' },
  { n: entrevistasHoy.value.length, texto: 'entrevistas a postulantes están agendadas para hoy', ruta: '/reclutamiento', tono: 'marino' },
].filter(p => p.n > 0 && (estado.rol === 'gerencia' || !['/cobranzas', '/ventas?vista=cuadre'].includes(p.ruta))))

// Tendencia: la gerencia ve la red; un distribuidor ve su parte proporcional.
const parte = computed(() => {
  if (!alcance.value) return 1
  const total = estado.demos.filter(d => d.venta).reduce((s, d) => s + d.monto, 0)
  const mio = demosVisibles.value.filter(d => d.venta).reduce((s, d) => s + d.monto, 0)
  return total ? mio / total : 0
})
const tendencia = computed(() => ventasPorMes.map(m => ({ etiqueta: m.etiqueta, valor: Math.round(m.valor * parte.value) })))

const comparativo = computed(() => distribuciones
  .filter(d => !alcance.value || d.id === alcance.value)
  .map((d) => {
    const ds = estado.demos.filter(x => x.distribucionId === d.id && diasEntre(x.fecha, HOY) >= 0 && diasEntre(x.fecha, HOY) <= 30)
    const hechas = ds.filter(x => x.visita === 'Realizada')
    const vs = hechas.filter(x => x.venta)
    const cs = estado.financiamientos.filter(f => f.distribucionId === d.id).map(situacion)
    return {
      d, equipo: vendedores.filter(v => v.distribucionId === d.id).length,
      demos: hechas.length, ventas: vs.length, monto: vs.reduce((s, x) => s + x.monto, 0),
      mora: cs.filter(s => s.estado === 'En mora').length, cartera: cs.length,
    }
  }).sort((a, b) => b.monto - a.monto))
const mayorMonto = computed(() => Math.max(...comparativo.value.map(c => c.monto), 1))

const ESTADOS = ['Al día', 'Por vencer', 'Vence hoy', 'En mora'] as const
const COLOR = { 'Al día': 'bg-ok', 'Por vencer': 'bg-[#E0A21B]', 'Vence hoy': 'bg-llama', 'En mora': 'bg-mora' }
const mezcla = computed(() => ESTADOS.map(e => ({ e, n: cartera.value.filter(x => x.s.estado === e).length })))

const embudoComercial = computed(() => [
  { nombre: 'Demos agendadas', valor: pasadas.value.length },
  { nombre: 'Demos realizadas', valor: realizadas.value.length },
  { nombre: 'Ventas cerradas', valor: ventas.value.length },
  { nombre: 'Producto entregado', valor: ventas.value.filter(d => d.etapa >= 2).length },
  { nombre: 'Comisión habilitada', valor: ventas.value.filter(d => d.etapa === 5).length },
])
const postulantes = computed(() => estado.postulantes.filter(p => diasEntre(p.fecha, HOY) > 0 && (!alcance.value || p.distribucionId === alcance.value)))
const embudoReclutamiento = computed(() => {
  const ps = postulantes.value
  const paso = (...e: string[]) => ps.filter(p => e.includes(p.estado)).length
  return [
    { nombre: 'Citados', valor: ps.length },
    { nombre: 'Entrevistados', valor: ps.length - paso('No asistió') },
    { nombre: 'Aptos', valor: paso('Apto', 'En inducción', 'Activo') },
    { nombre: 'En inducción', valor: paso('En inducción', 'Activo') },
    { nombre: 'Activos en campo', valor: paso('Activo') },
  ]
})
</script>

<template>
  <div>
    <Encabezado :titulo="estado.rol === 'gerencia' ? `Buen día, ${yo.nombre.split(' ')[0]}` : `Equipo de ${yo.nombre.split(' ')[0]}`">
      En los últimos 30 días {{ estado.rol === 'gerencia' ? 'la red' : 'tu equipo' }} cerró
      <b class="text-tinta">{{ ventas.length }} ventas por {{ solesCorto(montoVentas) }}</b>.
      Esta semana vencen cuotas por <b class="text-tinta">{{ soles(porCobrarSemana) }}</b>
      y hay <b class="text-mora">{{ enMora.length }} clientes en mora</b>.
    </Encabezado>

    <!-- El día de hoy -->
    <NuxtLink to="/ventas" class="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-panel bg-marino px-6 py-4 text-white hover:bg-marino-700">
      <p class="text-sm font-semibold text-llama-ambar">Hoy</p>
      <p><span class="text-2xl font-extrabold">{{ soles(vendidoHoy) }}</span> <span class="text-sm text-marino-300">vendidos en {{ ventasHoy.length }} ventas</span></p>
      <p><span class="text-2xl font-extrabold">{{ soles(ingresoHoy) }}</span> <span class="text-sm text-marino-300">ingresados</span></p>
      <p><span class="text-2xl font-extrabold">{{ demosHoy.length }}</span> <span class="text-sm text-marino-300">demos en agenda</span></p>
      <span class="ml-auto flex items-center gap-1 text-sm font-semibold">Ver ventas e ingresos <Icono nombre="flecha" :size="16" /></span>
    </NuxtLink>

    <!-- Cifras principales, en una sola franja -->
    <section class="panel grid grid-cols-2 gap-x-6 gap-y-6 p-6 md:grid-cols-5 md:divide-x md:divide-regla">
      <Cifra nombre="Ventas cerradas" :valor="solesCorto(montoVentas)" :nota="`${ventas.length} ventas en 30 días`" />
      <Cifra class="md:pl-6" nombre="Demos realizadas" :valor="realizadas.length" :nota="`de ${pasadas.length} agendadas`" />
      <Cifra class="md:pl-6" nombre="Tasa de cierre" :valor="pct(ventas.length, realizadas.length)" nota="ventas sobre demos realizadas" />
      <Cifra class="md:pl-6" nombre="Cartera por cobrar" :valor="solesCorto(saldoTotal)" :nota="`${cartera.length} financiamientos activos`" />
      <Cifra class="md:pl-6" nombre="Monto en mora" :valor="soles(montoMora)" tono="mora" :nota="`${pct(enMora.length, cartera.length)} de los clientes`" />
    </section>

    <!-- El recorrido de la venta -->
    <section class="panel mt-5 p-6">
      <div class="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="panel-titulo">Dónde está cada venta</h2>
        <p class="text-sm text-tinta-suave">Demos realizadas en los últimos 30 días, según la última etapa completada</p>
      </div>
      <Riel :etapa="5" :conteos="conteoEtapas" />
      <p class="mt-4 text-sm text-tinta-suave">
        {{ conteoEtapas[0] }} demos no cerraron venta. La comisión se habilita cuando el curado y el cocinado tienen evidencia validada.
      </p>
    </section>

    <div class="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
      <section class="panel p-6">
        <div class="mb-4 flex items-baseline justify-between">
          <h2 class="panel-titulo">Ventas cerradas por mes</h2>
          <p class="text-sm text-tinta-suave">Soles. El mes en curso va resaltado.</p>
        </div>
        <Barras :datos="tendencia" :formato="solesCorto" resaltar-ultimo />
      </section>

      <section class="panel p-6">
        <h2 class="panel-titulo mb-3">Requiere tu atención</h2>
        <ul class="divide-y divide-regla">
          <li v-for="p in pendientes" :key="p.texto">
            <NuxtLink :to="p.ruta" class="group flex items-center gap-4 py-3">
              <span class="w-10 shrink-0 text-right text-2xl font-extrabold"
                :class="{ 'text-mora': p.tono === 'mora', 'text-llama-700': p.tono === 'llama', 'text-aviso': p.tono === 'aviso', 'text-marino-600': p.tono === 'marino' }">{{ p.n }}</span>
              <span class="flex-1 text-sm leading-snug text-tinta-suave group-hover:text-tinta">{{ p.texto }}</span>
              <Icono nombre="flecha" :size="16" class="text-tinta-tenue" />
            </NuxtLink>
          </li>
          <li v-if="!pendientes.length" class="py-6 text-sm text-tinta-suave">Nada pendiente por ahora.</li>
        </ul>
      </section>
    </div>

    <!-- Comparativo de la red -->
    <section class="panel mt-5 overflow-hidden">
      <div class="flex flex-wrap items-baseline justify-between gap-2 px-6 pb-3 pt-5">
        <h2 class="panel-titulo">{{ alcance ? 'Tu distribución' : 'Desempeño por distribuidor' }}</h2>
        <p class="text-sm text-tinta-suave">Últimos 30 días</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead class="border-y border-regla bg-marino-50">
            <tr><th class="th">Distribuidor</th><th class="th">Equipo</th><th class="th">Demos</th><th class="th">Ventas</th><th class="th">Cierre</th><th class="th w-[30%]">Monto vendido</th><th class="th">Clientes en mora</th></tr>
          </thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="c in comparativo" :key="c.d.id">
              <td class="td"><p class="font-semibold">{{ c.d.lider }}</p><p class="text-xs text-tinta-suave">{{ c.d.rango }}</p></td>
              <td class="td">{{ c.equipo }}</td>
              <td class="td">{{ c.demos }}</td>
              <td class="td font-semibold">{{ c.ventas }}</td>
              <td class="td">{{ pct(c.ventas, c.demos) }}</td>
              <td class="td">
                <div class="flex items-center gap-3">
                  <div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-marino-600" :style="{ width: (c.monto / mayorMonto) * 100 + '%' }" /></div>
                  <span class="w-24 text-right font-semibold">{{ soles(c.monto) }}</span>
                </div>
              </td>
              <td class="td"><span :class="c.mora > 2 ? 'font-semibold text-mora' : ''">{{ c.mora }}</span> <span class="text-tinta-tenue">de {{ c.cartera }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="mt-5 grid gap-5 lg:grid-cols-3">
      <section class="panel p-6">
        <h2 class="panel-titulo mb-4">Embudo comercial</h2>
        <Embudo :etapas="embudoComercial" />
      </section>
      <section class="panel p-6">
        <h2 class="panel-titulo mb-4">Embudo de reclutamiento</h2>
        <Embudo :etapas="embudoReclutamiento" />
      </section>
      <section class="panel p-6">
        <h2 class="panel-titulo mb-4">Estado de la cartera</h2>
        <div class="flex h-6 gap-0.5 overflow-hidden rounded-[4px]">
          <div v-for="m in mezcla" :key="m.e" :class="COLOR[m.e]" :style="{ width: (m.n / Math.max(cartera.length, 1)) * 100 + '%' }" :title="`${m.e}: ${m.n}`" />
        </div>
        <ul class="mt-4 space-y-2.5">
          <li v-for="m in mezcla" :key="m.e" class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2 text-tinta-suave"><i class="h-2.5 w-2.5 rounded-sm" :class="COLOR[m.e]" />{{ m.e }}</span>
            <span><b>{{ m.n }}</b> <span class="text-tinta-tenue">clientes</span></span>
          </li>
        </ul>
        <NuxtLink v-if="estado.rol === 'gerencia'" to="/cobranzas" class="mt-4 inline-block text-sm font-semibold text-marino-600 hover:underline">Ver cartera completa</NuxtLink>
      </section>
    </div>
  </div>
</template>
