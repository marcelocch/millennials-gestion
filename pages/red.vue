<script setup lang="ts">
import type { Persona, Rango } from '~/data/datos'
import { distribuciones, distribucion, PASOS_INDUCCION } from '~/data/datos'
import { HOY, diasEntre, soles, fCorta } from '~/utils/formato'

const { estado, yo, alcance, equipoVisible, avisar } = useDemo()

const ESCALERA: Rango[] = ['Emprendedor', 'Distribuidor Junior', 'Distribuidor', 'Blue Network', 'Royal Network', 'Premier Network Leader']
const ventasDe = (p: Persona) => estado.demos.filter(d => d.vendedorId === p.id)
const filtroDist = ref('Todas')
const filtroRango = ref('Todos')

const nodos = computed(() => distribuciones.filter(d => !alcance.value || d.id === alcance.value).map((d) => {
  const gente = estado.personas.filter(p => p.distribucionId === d.id && p.area === 'Ventas')
  return { d, total: gente.length, emprendedores: gente.filter(p => p.rango === 'Emprendedor').length, juniors: gente.filter(p => p.rango === 'Distribuidor Junior').length }
}))
const equipo = computed(() => equipoVisible.value
  .filter(p => filtroDist.value === 'Todas' || p.distribucionId === filtroDist.value)
  .filter(p => filtroRango.value === 'Todos' || (p.rango ?? p.area) === filtroRango.value)
  .sort((a, b) => ESCALERA.indexOf(b.rango ?? 'Emprendedor') - ESCALERA.indexOf(a.rango ?? 'Emprendedor') || a.nombre.localeCompare(b.nombre)))
const areas = computed(() => [...new Set(equipoVisible.value.map(p => p.rango ?? p.area))])

const ficha = ref<Persona | null>(null)
const resumen = computed(() => {
  if (!ficha.value) return null
  const ds = ventasDe(ficha.value).filter(d => diasEntre(d.fecha, HOY) >= 0)
  const vs = ds.filter(d => d.venta)
  return { demos: ds.filter(d => d.visita === 'Realizada').length, ventas: vs.length, monto: vs.reduce((s, d) => s + d.monto, 0), comisiones: vs.filter(d => d.etapa === 5).length }
})

const nuevo = ref(false)
const form = reactive({ nombre: '', tel: '' })
const guardar = () => {
  if (!form.nombre.trim()) return avisar('Escribe el nombre del trabajador')
  estado.personas.push({
    id: 'p' + (estado.personas.length + 1), nombre: form.nombre.trim(), tel: form.tel, area: 'Ventas', rango: 'Emprendedor',
    distribucionId: yo.value.distribucionId, ingreso: new Date(HOY), induccion: 0,
  })
  nuevo.value = false; form.nombre = ''; form.tel = ''
  avisar('Trabajador registrado. Inicia su ruta de inducción.')
}
</script>

<template>
  <div>
    <Encabezado :titulo="alcance ? 'Mi equipo' : 'Red y equipo'">
      <template v-if="!alcance">La red de Millennials reúne <b class="text-tinta">{{ estado.personas.filter(p => p.area === 'Ventas').length }} personas en ventas</b> dentro de {{ distribuciones.length }} distribuciones, más las áreas internas. Cada distribuidor administra a su propio equipo.</template>
      <template v-else>Tu distribución tiene <b class="text-tinta">{{ equipoVisible.length }} personas</b>. Aquí registras a tus trabajadores y sigues su avance.</template>
      <template #acciones><button class="btn-llama" @click="nuevo = true"><Icono nombre="mas" :size="16" />Registrar trabajador</button></template>
    </Encabezado>

    <!-- Estructura de la red -->
    <section v-if="!alcance" class="panel p-6">
      <div class="mx-auto max-w-sm rounded-panel bg-marino p-4 text-center text-white">
        <p class="text-xs text-marino-300">Premier Network Leader</p>
        <p class="text-lg font-bold">Millennials Investments</p>
        <p class="text-sm text-marino-300">Fernando Gambetta · {{ nodos[0].total }} en su equipo directo</p>
      </div>
      <div class="mx-auto h-6 w-px bg-regla" />
      <div class="grid gap-3 border-t border-regla pt-6 sm:grid-cols-2 lg:grid-cols-5">
        <button v-for="n in nodos.slice(1)" :key="n.d.id" class="rounded-panel border border-regla p-4 text-left hover:border-marino-300" @click="filtroDist = n.d.id">
          <p class="text-xs font-semibold text-llama-700">{{ n.d.rango }}</p>
          <p class="mt-0.5 font-bold leading-tight">{{ n.d.lider }}</p>
          <p class="mt-2 text-sm text-tinta-suave">{{ n.total }} personas</p>
          <p class="text-xs text-tinta-tenue">{{ n.emprendedores }} emprendedores, {{ n.juniors }} junior</p>
          <p class="mt-1 text-xs text-tinta-tenue">{{ n.d.oficina }}</p>
        </button>
      </div>
    </section>

    <section class="panel mt-5 overflow-x-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h2 class="panel-titulo">Personas</h2>
        <div class="flex gap-2">
          <select v-if="!alcance" v-model="filtroDist" class="campo w-auto" aria-label="Distribución"><option value="Todas">Todas las distribuciones</option><option v-for="d in distribuciones" :key="d.id" :value="d.id">{{ d.lider }}</option></select>
          <select v-model="filtroRango" class="campo w-auto" aria-label="Rango o área"><option value="Todos">Todos los rangos y áreas</option><option v-for="a in areas" :key="a">{{ a }}</option></select>
        </div>
      </div>
      <table class="w-full min-w-[760px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Persona</th><th class="th">Rango o área</th><th class="th">Distribución</th><th class="th">Ingreso</th><th class="th">Inducción</th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="p in equipo" :key="p.id" class="cursor-pointer hover:bg-marino-50/70" @click="ficha = p">
            <td class="td"><div class="flex items-center gap-3"><Avatar :nombre="p.nombre" /><span class="font-semibold">{{ p.nombre }}</span></div></td>
            <td class="td">{{ p.rango ?? p.area }}</td>
            <td class="td text-tinta-suave">{{ distribucion(p.distribucionId).lider }}</td>
            <td class="td text-tinta-suave">{{ fCorta(p.ingreso) }} {{ p.ingreso.getFullYear() }}</td>
            <td class="td"><Chip v-if="p.area === 'Ventas'" :texto="p.induccion >= PASOS_INDUCCION.length ? 'Completa' : `Paso ${p.induccion} de ${PASOS_INDUCCION.length}`" :tono="p.induccion >= PASOS_INDUCCION.length ? 'ok' : 'llama'" /></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Ficha de la persona: su recorrido en la carrera -->
    <Cajon :abierto="!!ficha" :titulo="ficha?.nombre ?? ''" :subtitulo="ficha ? `${ficha.rango ?? ficha.area} · Equipo de ${distribucion(ficha.distribucionId).lider}` : ''" @cerrar="ficha = null">
      <template v-if="ficha && resumen">
        <template v-if="ficha.area === 'Ventas' || ficha.area === 'Gerencia'">
          <h3 class="mb-3 text-sm font-bold">Carrera Royal Prestige</h3>
          <ol class="relative ml-1.5 border-l-2 border-regla">
            <li v-for="r in [...ESCALERA].reverse()" :key="r" class="relative pb-4 pl-5 text-sm last:pb-0"
              :class="r === ficha.rango ? 'font-bold text-tinta' : 'text-tinta-suave'">
              <i class="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2"
                :class="r === ficha.rango ? 'border-llama bg-llama' : ESCALERA.indexOf(r) < ESCALERA.indexOf(ficha.rango!) ? 'border-marino-600 bg-marino-600' : 'border-regla bg-white'" />
              {{ r }}<span v-if="r === ficha.rango" class="ml-2 text-xs font-semibold text-llama-700">rango actual</span>
            </li>
          </ol>
          <h3 class="mb-3 mt-7 text-sm font-bold">Últimos 30 días</h3>
          <div class="grid grid-cols-2 gap-4 rounded-panel bg-marino-50 p-4">
            <Cifra nombre="Demos realizadas" :valor="resumen.demos" />
            <Cifra nombre="Ventas cerradas" :valor="resumen.ventas" :nota="soles(resumen.monto)" />
            <Cifra nombre="Comisiones habilitadas" :valor="resumen.comisiones" tono="ok" />
            <Cifra nombre="Inducción" :valor="`${Math.min(ficha.induccion, 6)} de 6`" />
          </div>
        </template>
        <p v-else class="text-sm text-tinta-suave">Área interna de Millennials. Accede a los módulos que corresponden a {{ ficha.area.toLowerCase() }}.</p>
        <dl class="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-tinta-suave">Celular</dt><dd class="font-semibold">{{ ficha.tel || 'Sin registrar' }}</dd></div>
          <div><dt class="text-tinta-suave">Fecha de ingreso</dt><dd class="font-semibold">{{ fCorta(ficha.ingreso) }} {{ ficha.ingreso.getFullYear() }}</dd></div>
        </dl>
      </template>
    </Cajon>

    <Cajon :abierto="nuevo" titulo="Registrar trabajador" :subtitulo="`Se suma al equipo de ${distribucion(yo.distribucionId).lider}`" @cerrar="nuevo = false">
      <div class="grid gap-4">
        <label class="text-sm font-semibold">Nombres y apellidos<input v-model="form.nombre" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" inputmode="tel" /></label>
        <p class="text-sm text-tinta-suave">Ingresa como Emprendedor y empieza su ruta de inducción de 6 pasos.</p>
      </div>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="nuevo = false">Cancelar</button><button class="btn-primario" @click="guardar">Registrar trabajador</button></div></template>
    </Cajon>
  </div>
</template>
