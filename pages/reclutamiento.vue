<script setup lang="ts">
import type { EstadoPostulante, Postulante } from '~/data/datos'
import { persona, distribucion } from '~/data/datos'
import { HOY, masDias, diasEntre, fCorta, relativo } from '~/utils/formato'

const { estado, yo, alcance, avisar } = useDemo()
const visibles = computed(() => estado.postulantes.filter(p => !alcance.value || p.distribucionId === alcance.value))
const hoy = computed(() => visibles.value.filter(p => diasEntre(p.fecha, HOY) === 0))
const proximos = computed(() => visibles.value.filter(p => diasEntre(HOY, p.fecha) > 0))
const pasados = computed(() => visibles.value.filter(p => diasEntre(p.fecha, HOY) > 0).reverse())
const pendientesHoy = computed(() => hoy.value.filter(p => p.estado === 'Citado'))
const oficinas = computed(() => new Set(hoy.value.map(p => p.oficina)).size)

const filtro = ref<EstadoPostulante | 'Todos'>('Todos')
const historial = computed(() => pasados.value.filter(p => filtro.value === 'Todos' || p.estado === filtro.value))

const cuenta = (...e: EstadoPostulante[]) => pasados.value.filter(p => e.includes(p.estado)).length
const embudo = computed(() => [
  { nombre: 'Citados', valor: pasados.value.length },
  { nombre: 'Entrevistados', valor: pasados.value.length - cuenta('No asistió') },
  { nombre: 'Aptos', valor: cuenta('Apto', 'En inducción', 'Activo') },
  { nombre: 'En inducción', valor: cuenta('En inducción', 'Activo') },
  { nombre: 'Activos en campo', valor: cuenta('Activo') },
])

const resultado = (p: Postulante, e: EstadoPostulante) => { p.estado = e; avisar(`${p.nombre.split(' ')[0]}: ${e.toLowerCase()}`) }

const nuevo = ref(false)
const form = reactive({ nombre: '', tel: '', origen: 'Aviso de empleo', dia: 1, hora: '10:00' })
const guardar = () => {
  if (!form.nombre.trim()) return avisar('Escribe el nombre del postulante')
  estado.postulantes.push({
    id: 'c' + (estado.postulantes.length + 1), nombre: form.nombre.trim(), tel: form.tel, origen: form.origen,
    distribucionId: yo.value.distribucionId, fecha: masDias(HOY, form.dia), hora: form.hora,
    entrevistadorId: yo.value.area === 'Ventas' || yo.value.area === 'Gerencia' ? yo.value.id : 'p2',
    oficina: distribucion(yo.value.distribucionId).oficina, estado: 'Citado', nota: '',
  })
  estado.postulantes.sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.localeCompare(b.hora))
  nuevo.value = false; form.nombre = ''
  avisar('Entrevista agendada. El postulante recibirá un recordatorio.')
}
</script>

<template>
  <div>
    <Encabezado titulo="Reclutamiento">
      Hoy hay <b class="text-tinta">{{ hoy.length }} entrevistas</b> en {{ oficinas }} {{ oficinas === 1 ? 'oficina' : 'oficinas' }};
      {{ pendientesHoy.length }} aún sin resultado. En los próximos días hay {{ proximos.length }} postulantes citados.
      <template #acciones><button class="btn-llama" @click="nuevo = true"><Icono nombre="mas" :size="16" />Agendar entrevista</button></template>
    </Encabezado>

    <div class="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <section class="panel">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Entrevistas de hoy</h2>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="p in hoy" :key="p.id" class="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
            <span class="w-12 text-sm font-bold">{{ p.hora }}</span>
            <div class="min-w-0 flex-1 basis-40">
              <p class="truncate font-semibold">{{ p.nombre }}</p>
              <p class="truncate text-xs text-tinta-suave">{{ p.origen }} · {{ p.oficina }}</p>
            </div>
            <p class="w-40 truncate text-sm text-tinta-suave">Entrevista {{ persona(p.entrevistadorId).nombre.split(' ').slice(0, 2).join(' ') }}</p>
            <div v-if="p.estado === 'Citado'" class="flex flex-wrap gap-1.5">
              <button class="btn-linea px-2.5 py-1.5 text-xs" @click="resultado(p, 'Apto')">Apto</button>
              <button class="btn-linea px-2.5 py-1.5 text-xs" @click="resultado(p, 'Segunda entrevista')">2.ª entrevista</button>
              <button class="btn-linea px-2.5 py-1.5 text-xs" @click="resultado(p, 'No apto')">No apto</button>
              <button class="btn-linea px-2.5 py-1.5 text-xs" @click="resultado(p, 'No asistió')">No asistió</button>
            </div>
            <Chip v-else :texto="p.estado" />
          </li>
          <li v-if="!hoy.length" class="px-5 py-10 text-center text-sm text-tinta-suave">No hay entrevistas agendadas para hoy.</li>
        </ul>
      </section>

      <div class="space-y-5">
        <section class="panel p-5">
          <h2 class="panel-titulo mb-4">Embudo de los últimos 30 días</h2>
          <Embudo :etapas="embudo" />
        </section>
        <section class="panel p-5">
          <h2 class="panel-titulo mb-3">Próximas entrevistas</h2>
          <ul class="space-y-2.5">
            <li v-for="p in proximos.slice(0, 6)" :key="p.id" class="flex items-baseline justify-between gap-3 text-sm">
              <span class="truncate">{{ p.nombre }}</span>
              <span class="shrink-0 text-tinta-suave">{{ relativo(p.fecha) }}, {{ p.hora }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <section class="panel mt-5 overflow-x-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h2 class="panel-titulo">Historial de postulantes</h2>
        <select v-model="filtro" class="campo w-auto" aria-label="Estado">
          <option>Todos</option><option>Apto</option><option>En inducción</option><option>Activo</option><option>Segunda entrevista</option><option>No apto</option><option>No asistió</option>
        </select>
      </div>
      <table class="w-full min-w-[820px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Postulante</th><th class="th">Entrevista</th><th class="th">Entrevistó</th><th class="th">Origen</th><th class="th">Resultado</th><th class="th"></th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="p in historial" :key="p.id">
            <td class="td"><p class="font-semibold">{{ p.nombre }}</p><p class="text-xs text-tinta-suave">{{ p.nota }}</p></td>
            <td class="td text-tinta-suave">{{ fCorta(p.fecha) }}, {{ p.hora }}</td>
            <td class="td text-tinta-suave">{{ persona(p.entrevistadorId).nombre }}</td>
            <td class="td text-tinta-suave">{{ p.origen }}</td>
            <td class="td"><Chip :texto="p.estado" /></td>
            <td class="td text-right"><button v-if="p.estado === 'Apto'" class="text-xs font-bold text-marino-600 hover:underline" @click="resultado(p, 'En inducción')">Pasar a inducción</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <Cajon :abierto="nuevo" titulo="Agendar entrevista" subtitulo="Queda registrado quién entrevista y en qué oficina" @cerrar="nuevo = false">
      <div class="grid grid-cols-2 gap-4">
        <label class="col-span-2 text-sm font-semibold">Postulante<input v-model="form.nombre" class="campo mt-1 font-normal" placeholder="Nombres y apellidos" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" inputmode="tel" /></label>
        <label class="text-sm font-semibold">Origen<select v-model="form.origen" class="campo mt-1 font-normal"><option>Aviso de empleo</option><option>Referido del equipo</option><option>Redes sociales</option><option>Volanteo</option></select></label>
        <label class="text-sm font-semibold">Día<select v-model.number="form.dia" class="campo mt-1 font-normal"><option v-for="i in 6" :key="i" :value="i - 1">{{ i === 1 ? 'Hoy' : fCorta(masDias(HOY, i - 1)) }}</option></select></label>
        <label class="text-sm font-semibold">Hora<input v-model="form.hora" type="time" class="campo mt-1 font-normal" /></label>
      </div>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="nuevo = false">Cancelar</button><button class="btn-primario" @click="guardar">Agendar entrevista</button></div></template>
    </Cajon>
  </div>
</template>
