<script setup lang="ts">
import type { Sesion, Persona } from '~/data/datos'
import { PASOS_INDUCCION, persona } from '~/data/datos'
import { HOY, diasEntre, fCorta, relativo, pct } from '~/utils/formato'

const { estado, yo, equipoVisible, avisar } = useDemo()
const soyVendedor = computed(() => estado.rol === 'vendedor')

const sesiones = computed(() => estado.sesiones.filter(s => !soyVendedor.value || s.inscritos.includes(yo.value.id)))
const proximas = computed(() => sesiones.value.filter(s => diasEntre(HOY, s.fecha) >= 0))
const pasadas = computed(() => sesiones.value.filter(s => diasEntre(HOY, s.fecha) < 0).reverse())
const deHoy = computed(() => proximas.value.find(s => diasEntre(s.fecha, HOY) === 0))

const ingresantes = computed(() => equipoVisible.value
  .filter(p => p.area === 'Ventas' && p.induccion < PASOS_INDUCCION.length && (!soyVendedor.value || p.id === yo.value.id))
  .sort((a, b) => a.induccion - b.induccion))
const asistenciaMedia = computed(() => {
  const ins = pasadas.value.reduce((s, x) => s + x.inscritos.length, 0)
  return pct(pasadas.value.reduce((s, x) => s + x.asistieron.length, 0), ins)
})

const abierta = ref<Sesion | null>(null)
const alternar = (s: Sesion, id: string) => {
  const i = s.asistieron.indexOf(id)
  i >= 0 ? s.asistieron.splice(i, 1) : s.asistieron.push(id)
}
const avanzar = (p: Persona) => {
  p.induccion++
  avisar(p.induccion === PASOS_INDUCCION.length ? `${p.nombre.split(' ')[0]} completó su inducción` : 'Paso de inducción completado')
}
const TONO = { Inducción: 'llama', Producto: 'marino', Ventas: 'ok', Liderazgo: 'aviso' } as const
</script>

<template>
  <div>
    <Encabezado titulo="Inducción y capacitación">
      <template v-if="deHoy">Hoy a las {{ deHoy.hora }} hay sesión: <b class="text-tinta">{{ deHoy.tema }}</b>, con {{ deHoy.inscritos.length }} inscritos. </template>
      <template v-else>Hoy no hay sesiones programadas. </template>
      <template v-if="!soyVendedor">{{ ingresantes.length }} ingresantes siguen en su ruta de inducción y la asistencia promedio es {{ asistenciaMedia }}.</template>
    </Encabezado>

    <div class="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section class="panel">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Sesiones</h2>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="s in [...proximas, ...pasadas]" :key="s.id">
            <button class="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 text-left hover:bg-marino-50/70" @click="abierta = s">
              <div class="w-20 shrink-0">
                <p class="text-sm font-bold" :class="diasEntre(s.fecha, HOY) === 0 ? 'text-llama-700' : ''">{{ diasEntre(s.fecha, HOY) === 0 ? 'Hoy' : fCorta(s.fecha) }}</p>
                <p class="text-xs text-tinta-suave">{{ s.hora }}</p>
              </div>
              <div class="min-w-0 flex-1 basis-48">
                <p class="truncate font-semibold">{{ s.tema }}</p>
                <p class="truncate text-xs text-tinta-suave">{{ persona(s.expositorId).nombre }} · {{ s.oficina }}</p>
              </div>
              <Chip :texto="s.tipo" :tono="TONO[s.tipo]" />
              <p class="w-36 text-right text-sm">
                <template v-if="diasEntre(HOY, s.fecha) >= 0"><b>{{ s.inscritos.length }}</b> <span class="text-tinta-suave">inscritos</span></template>
                <template v-else><b>{{ s.asistieron.length }}</b> <span class="text-tinta-suave">de {{ s.inscritos.length }} asistieron</span></template>
              </p>
            </button>
          </li>
        </ul>
      </section>

      <div class="space-y-5">
        <section class="panel p-5">
          <h2 class="panel-titulo">{{ soyVendedor ? 'Mi ruta de inducción' : 'Ruta de inducción de ingresantes' }}</h2>
          <p class="mt-1 text-sm text-tinta-suave">Seis pasos antes de salir a campo sin acompañamiento.</p>
          <ul class="mt-4 space-y-4">
            <li v-for="p in ingresantes" :key="p.id">
              <div class="flex items-baseline justify-between gap-3">
                <p class="truncate text-sm font-semibold">{{ p.nombre }}</p>
                <p class="shrink-0 text-xs text-tinta-suave">ingresó {{ relativo(p.ingreso) }}</p>
              </div>
              <div class="mt-1.5 flex gap-1">
                <i v-for="(paso, i) in PASOS_INDUCCION" :key="paso" class="h-1.5 flex-1 rounded-full" :class="i < p.induccion ? 'bg-llama' : 'bg-regla'" :title="paso" />
              </div>
              <div class="mt-1.5 flex items-center justify-between gap-3 text-xs">
                <span class="truncate text-tinta-suave">Sigue: {{ PASOS_INDUCCION[p.induccion] }}</span>
                <button v-if="!soyVendedor" class="shrink-0 font-bold text-marino-600 hover:underline" @click="avanzar(p)">Marcar completado</button>
              </div>
            </li>
            <li v-if="!ingresantes.length" class="text-sm text-tinta-suave">{{ soyVendedor ? 'Completaste tu inducción.' : 'No hay ingresantes en inducción.' }}</li>
          </ul>
        </section>

        <section class="rounded-panel bg-marino p-5 text-white">
          <h2 class="text-[15px] font-semibold">Talleres por video</h2>
          <p class="mt-1 text-sm leading-relaxed text-marino-300">La intranet de talleres queda integrada: el avance de cada persona en los videos aparece en su ficha, junto a sus sesiones presenciales.</p>
          <div class="mt-4 flex gap-6">
            <div><p class="text-2xl font-extrabold">12</p><p class="text-xs text-marino-300">talleres publicados</p></div>
            <div><p class="text-2xl font-extrabold">68%</p><p class="text-xs text-marino-300">avance promedio del equipo</p></div>
          </div>
        </section>
      </div>
    </div>

    <Cajon :abierto="!!abierta" :titulo="abierta?.tema ?? ''" :subtitulo="abierta ? `${fCorta(abierta.fecha)}, ${abierta.hora} · ${abierta.oficina}` : ''" @cerrar="abierta = null">
      <template v-if="abierta">
        <p class="text-sm text-tinta-suave">Expositor: <b class="text-tinta">{{ persona(abierta.expositorId).nombre }}</b></p>
        <div class="mb-2 mt-6 flex items-baseline justify-between">
          <h3 class="text-sm font-bold">Asistencia</h3>
          <p class="text-sm text-tinta-suave">{{ abierta.asistieron.length }} de {{ abierta.inscritos.length }}</p>
        </div>
        <ul class="divide-y divide-regla rounded-panel border border-regla">
          <li v-for="id in abierta.inscritos" :key="id">
            <label class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-marino-50/70">
              <input type="checkbox" class="h-4 w-4 accent-[#021B49]" :checked="abierta.asistieron.includes(id)" :disabled="soyVendedor" @change="alternar(abierta, id)" />
              <span class="flex-1">{{ persona(id).nombre }}</span>
              <span class="text-xs text-tinta-tenue">{{ persona(id).rango }}</span>
            </label>
          </li>
        </ul>
      </template>
    </Cajon>
  </div>
</template>
