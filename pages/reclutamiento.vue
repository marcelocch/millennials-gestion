<script setup lang="ts">
// Reclutamiento: agenda de entrevistas, registro de postulantes con quién los refiere
// y quién los registró, y seguimiento hasta que ingresan al equipo.
import type { EstadoPostulante, OrigenPostulante, Postulante, Persona } from '~/data/datos'
import { persona, distribucion, distribuciones } from '~/data/datos'
import { HOY, masDias, diasEntre, fCorta, fSemana, relativo, pct } from '~/utils/formato'

type Vista = 'agenda' | 'postulantes' | 'referidos'
const ruta = useRoute()
const { estado, yo, alcance, equipoVisible, postulantesVisibles, avisar } = useDemo()
const vista = ref<Vista>((ruta.query.vista as Vista) || 'agenda')
watch(() => ruta.query.vista, (v) => { if (v) vista.value = v as Vista })

const hoy = computed(() => postulantesVisibles.value.filter(p => diasEntre(p.fecha, HOY) === 0))
const proximos = computed(() => postulantesVisibles.value
  .flatMap(p => [
    ...(diasEntre(HOY, p.fecha) > 0 ? [{ p, fecha: p.fecha, hora: p.hora, segunda: false }] : []),
    ...(p.segunda && p.estado === 'Segunda entrevista' && diasEntre(HOY, p.segunda.fecha) >= 0 ? [{ p, fecha: p.segunda.fecha, hora: p.segunda.hora, segunda: true }] : []),
  ])
  .sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.localeCompare(b.hora)))
const pasados = computed(() => postulantesVisibles.value.filter(p => diasEntre(p.fecha, HOY) > 0))
const pendientesHoy = computed(() => hoy.value.filter(p => p.estado === 'Citado'))
const referidosMes = computed(() => postulantesVisibles.value.filter(p => p.origen === 'Referido').length)

const cuenta = (...e: EstadoPostulante[]) => pasados.value.filter(p => e.includes(p.estado)).length
const embudo = computed(() => [
  { nombre: 'Citados', valor: pasados.value.length },
  { nombre: 'Entrevistados', valor: pasados.value.length - cuenta('No asistió') },
  { nombre: 'Aptos', valor: cuenta('Apto', 'En inducción', 'Activo') },
  { nombre: 'En inducción', valor: cuenta('En inducción', 'Activo') },
  { nombre: 'Activos en campo', valor: cuenta('Activo') },
])

/* ----- Lista completa ----- */
const buscar = ref('')
const filtroEstado = ref<EstadoPostulante | 'Todos'>('Todos')
const filtroOrigen = ref<OrigenPostulante | 'Todos'>('Todos')
const filtroEquipo = ref('Todos')
const lista = computed(() => postulantesVisibles.value
  .filter(p => filtroEstado.value === 'Todos' || p.estado === filtroEstado.value)
  .filter(p => filtroOrigen.value === 'Todos' || p.origen === filtroOrigen.value)
  .filter(p => filtroEquipo.value === 'Todos' || p.distribucionId === filtroEquipo.value)
  .filter(p => !buscar.value || `${p.nombre} ${p.referidoPorId ? persona(p.referidoPorId).nombre : ''}`.toLowerCase().includes(buscar.value.toLowerCase()))
  .slice().sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))

/* ----- Quién trae gente ----- */
const ranking = computed(() => {
  const mapa = new Map<string, Postulante[]>()
  postulantesVisibles.value.filter(p => p.referidoPorId).forEach(p => mapa.set(p.referidoPorId!, [...(mapa.get(p.referidoPorId!) ?? []), p]))
  return [...mapa.entries()].map(([id, ps]) => ({
    p: persona(id), total: ps.length,
    entrevistados: ps.filter(x => diasEntre(x.fecha, HOY) > 0 && x.estado !== 'No asistió' && x.estado !== 'Citado').length,
    ingresaron: ps.filter(x => x.estado === 'En inducción' || x.estado === 'Activo').length,
  })).sort((a, b) => b.ingresaron - a.ingresaron || b.total - a.total)
})
const ORIGENES: OrigenPostulante[] = ['Referido', 'Aviso de empleo', 'Redes sociales', 'Volanteo', 'Feria laboral']
const porOrigen = computed(() => ORIGENES.map(o => {
  const ps = postulantesVisibles.value.filter(p => p.origen === o)
  return { o, total: ps.length, ingresaron: ps.filter(p => p.estado === 'En inducción' || p.estado === 'Activo').length }
}))
const maxOrigen = computed(() => Math.max(...porOrigen.value.map(x => x.total), 1))

/* ----- Ficha del postulante ----- */
const ficha = ref<Postulante | null>(null)
const nota = ref('')
watch(ficha, (p) => { nota.value = p?.nota ?? '' })
const resultado = (p: Postulante, e: EstadoPostulante) => {
  p.estado = e
  if (e === 'Segunda entrevista') p.segunda = { fecha: masDias(HOY, 1), hora: '10:00' }
  avisar(e === 'Segunda entrevista' ? `Segunda entrevista agendada para mañana, 10:00` : `${p.nombre.split(' ')[0]}: ${e.toLowerCase()}`)
}
const darDeAlta = (p: Postulante) => {
  const nuevo: Persona = {
    id: 'p' + (estado.personas.length + 1), nombre: p.nombre, tel: p.tel, area: 'Ventas', rango: 'Emprendedor',
    distribucionId: p.distribucionId, ingreso: new Date(HOY), induccion: 1,
  }
  estado.personas.push(nuevo)
  p.estado = 'Activo'
  avisar(`${p.nombre.split(' ')[0]} ya es Emprendedor del equipo de ${distribucion(p.distribucionId).lider.split(' ')[0]}`)
}
const guardarNota = () => { if (ficha.value) { ficha.value.nota = nota.value.trim(); avisar('Nota guardada') } }

const vienePor = (p: Postulante) => p.referidoPorId ? persona(p.referidoPorId).nombre : p.origen
const nombreCorto = (id: string) => persona(id).nombre.split(' ').slice(0, 2).join(' ')

/* ----- Registrar postulante ----- */
const nuevo = ref(false)
const entrevistadores = computed(() => estado.personas.filter(p =>
  ((p.area === 'Ventas' && p.rango !== 'Emprendedor') || ['Gerencia', 'Administración', 'Secretaría'].includes(p.area))
  && (!alcance.value || p.distribucionId === alcance.value || p.area !== 'Ventas')))
const gruposReferentes = computed(() => distribuciones
  .filter(d => !alcance.value || d.id === alcance.value)
  .map(d => ({ d, gente: equipoVisible.value.filter(p => p.distribucionId === d.id && (p.area === 'Ventas' || p.area === 'Gerencia')) }))
  .filter(g => g.gente.length))
const internos = computed(() => alcance.value ? [] : estado.personas.filter(p => !['Ventas', 'Gerencia'].includes(p.area)))
const liderDe = (dId: string) => estado.personas.find(p => p.nombre === distribucion(dId).lider)?.id ?? ''
const vacio = () => ({
  nombre: '', tel: '', distrito: '', referido: true, referidoPorId: '', origen: 'Aviso de empleo' as OrigenPostulante,
  distribucionId: alcance.value ?? yo.value.distribucionId, dia: 0, hora: '16:00',
  entrevistadorId: liderDe(alcance.value ?? yo.value.distribucionId),
})
const form = reactive(vacio())
const abrirNuevo = () => { Object.assign(form, vacio()); nuevo.value = true }
// Al elegir quién refiere, el postulante se propone para el equipo de esa persona.
watch(() => form.referidoPorId, (id) => { if (id && !alcance.value) form.distribucionId = persona(id).distribucionId })
// Por defecto entrevista el líder del equipo al que postula.
watch(() => form.distribucionId, (d) => { form.entrevistadorId = liderDe(d) })
const guardar = () => {
  if (!form.nombre.trim()) return avisar('Escribe el nombre del postulante')
  if (form.referido && !form.referidoPorId) return avisar('Indica quién lo refiere')
  if (!form.entrevistadorId) return avisar('Elige quién lo entrevista')
  estado.postulantes.push({
    id: 'c' + (estado.postulantes.length + 1), nombre: form.nombre.trim(), tel: form.tel, distrito: form.distrito,
    origen: form.referido ? 'Referido' : form.origen, referidoPorId: form.referido ? form.referidoPorId : undefined,
    distribucionId: form.distribucionId, fecha: masDias(HOY, form.dia), hora: form.hora,
    entrevistadorId: form.entrevistadorId, oficina: distribucion(form.distribucionId).oficina,
    registradoPorId: yo.value.id, estado: 'Citado', nota: '',
  })
  estado.postulantes.sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora.localeCompare(b.hora))
  nuevo.value = false
  avisar(form.referido ? `Postulante registrado, referido por ${nombreCorto(form.referidoPorId)}` : 'Postulante registrado. Recibirá un recordatorio de su entrevista.')
}
onMounted(() => { if (ruta.query.nuevo) abrirNuevo() })
</script>

<template>
  <div>
    <Encabezado titulo="Reclutamiento">
      Hoy hay <b class="text-tinta">{{ hoy.length }} entrevistas</b>; {{ pendientesHoy.length }} aún sin resultado.
      {{ referidosMes }} de {{ postulantesVisibles.length }} postulantes del mes llegaron referidos por alguien del equipo.
      <template #acciones><button class="btn-llama" @click="abrirNuevo"><Icono nombre="mas" :size="16" />Registrar postulante</button></template>
    </Encabezado>

    <div class="mb-4 inline-flex rounded-lg border border-regla bg-white p-1" role="tablist">
      <button v-for="t in ([['agenda', 'Agenda', hoy.length], ['postulantes', 'Postulantes', postulantesVisibles.length], ['referidos', 'Quién trae gente', ranking.length]] as [Vista, string, number][])" :key="t[0]"
        role="tab" :aria-selected="vista === t[0]" class="rounded-md px-4 py-1.5 text-sm font-semibold"
        :class="vista === t[0] ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = t[0]">{{ t[1] }} <span class="opacity-70">{{ t[2] }}</span></button>
    </div>

    <!-- Agenda -->
    <div v-if="vista === 'agenda'" class="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <section class="panel">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Entrevistas de hoy</h2>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="p in hoy" :key="p.id" class="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
            <span class="w-12 text-sm font-bold">{{ p.hora }}</span>
            <button class="min-w-0 flex-1 basis-44 text-left" @click="ficha = p">
              <span class="block truncate font-semibold hover:underline">{{ p.nombre }}</span>
              <span class="block truncate text-xs" :class="p.referidoPorId ? 'text-llama-700' : 'text-tinta-suave'">{{ p.referidoPorId ? `Referido por ${nombreCorto(p.referidoPorId)}` : p.origen }} · Entrevista {{ nombreCorto(p.entrevistadorId) }}</span>
            </button>
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
            <li v-for="x in proximos.slice(0, 7)" :key="x.p.id + x.segunda" class="flex items-baseline justify-between gap-3 text-sm">
              <button class="truncate text-left hover:underline" @click="ficha = x.p">{{ x.p.nombre }}<span v-if="x.segunda" class="ml-1.5 text-xs text-aviso">2.ª entrevista</span></button>
              <span class="shrink-0 text-tinta-suave">{{ relativo(x.fecha) }}, {{ x.hora }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Postulantes -->
    <section v-else-if="vista === 'postulantes'" class="panel overflow-x-auto">
      <div class="flex flex-wrap items-center justify-end gap-2 px-5 pb-3 pt-5">
        <input v-model="buscar" class="campo w-52" placeholder="Postulante o quién refiere" aria-label="Buscar" />
        <select v-model="filtroOrigen" class="campo w-auto" aria-label="Cómo llegó"><option>Todos</option><option v-for="o in ORIGENES" :key="o">{{ o }}</option></select>
        <select v-if="!alcance" v-model="filtroEquipo" class="campo w-auto" aria-label="Equipo"><option value="Todos">Todos los equipos</option><option v-for="d in distribuciones" :key="d.id" :value="d.id">{{ d.lider }}</option></select>
        <select v-model="filtroEstado" class="campo w-auto" aria-label="Estado"><option>Todos</option><option>Citado</option><option>Apto</option><option>Segunda entrevista</option><option>En inducción</option><option>Activo</option><option>No apto</option><option>No asistió</option></select>
      </div>
      <table class="w-full min-w-[960px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Postulante</th><th class="th">Viene por</th><th class="th">Equipo</th><th class="th">Entrevista</th><th class="th">Entrevistó</th><th class="th">Registró</th><th class="th">Estado</th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="p in lista" :key="p.id" class="cursor-pointer hover:bg-marino-50/70" @click="ficha = p">
            <td class="td"><p class="font-semibold">{{ p.nombre }}</p><p class="text-xs text-tinta-suave">{{ p.distrito }}</p></td>
            <td class="td"><template v-if="p.referidoPorId"><p class="font-semibold text-llama-700">{{ nombreCorto(p.referidoPorId) }}</p><p class="text-xs text-tinta-suave">{{ persona(p.referidoPorId).rango ?? persona(p.referidoPorId).area }}</p></template><span v-else class="text-tinta-suave">{{ p.origen }}</span></td>
            <td class="td text-tinta-suave">{{ distribucion(p.distribucionId).lider.split(' ').slice(0, 2).join(' ') }}</td>
            <td class="td text-tinta-suave">{{ diasEntre(p.fecha, HOY) === 0 ? 'Hoy' : fCorta(p.fecha) }}, {{ p.hora }}</td>
            <td class="td text-tinta-suave">{{ nombreCorto(p.entrevistadorId) }}</td>
            <td class="td text-tinta-suave">{{ nombreCorto(p.registradoPorId) }}</td>
            <td class="td"><Chip :texto="p.estado" /></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!lista.length" class="px-5 py-10 text-center text-sm text-tinta-suave">Ningún postulante coincide con el filtro.</p>
    </section>

    <!-- Quién trae gente -->
    <div v-else class="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <section class="panel overflow-x-auto">
        <h2 class="panel-titulo px-5 pb-1 pt-5">Quién refiere postulantes</h2>
        <p class="px-5 pb-3 text-sm text-tinta-suave">Cada postulante queda asociado a la persona que lo recomendó.</p>
        <table class="w-full min-w-[560px]">
          <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Persona</th><th class="th">Equipo</th><th class="th text-right">Referidos</th><th class="th text-right">Entrevistados</th><th class="th text-right">Ingresaron</th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="r in ranking" :key="r.p.id">
              <td class="td"><div class="flex items-center gap-3"><Avatar :nombre="r.p.nombre" /><div><p class="font-semibold">{{ r.p.nombre }}</p><p class="text-xs text-tinta-suave">{{ r.p.rango ?? r.p.area }}</p></div></div></td>
              <td class="td text-tinta-suave">{{ distribucion(r.p.distribucionId).lider.split(' ').slice(0, 2).join(' ') }}</td>
              <td class="td text-right font-bold">{{ r.total }}</td>
              <td class="td text-right">{{ r.entrevistados }}</td>
              <td class="td text-right"><b class="text-ok">{{ r.ingresaron }}</b></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="panel p-5">
        <h2 class="panel-titulo">Cómo llegan los postulantes</h2>
        <p class="mt-1 text-sm text-tinta-suave">Y cuántos terminan ingresando al equipo.</p>
        <ul class="mt-4 space-y-3.5">
          <li v-for="x in porOrigen" :key="x.o">
            <div class="flex justify-between text-sm"><span class="text-tinta-suave">{{ x.o }}</span><span><b>{{ x.total }}</b> <span class="text-tinta-tenue">· {{ pct(x.ingresaron, x.total) }} ingresa</span></span></div>
            <div class="mt-1 h-2.5 rounded-[4px] bg-marino-50"><div class="h-full rounded-[4px]" :class="x.o === 'Referido' ? 'bg-llama' : 'bg-marino-600'" :style="{ width: (x.total / maxOrigen) * 100 + '%' }" /></div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Ficha del postulante -->
    <Cajon :abierto="!!ficha" :titulo="ficha?.nombre ?? ''" :subtitulo="ficha ? `Postula al equipo de ${distribucion(ficha.distribucionId).lider}` : ''" @cerrar="ficha = null">
      <template v-if="ficha">
        <div class="rounded-panel p-4" :class="ficha.referidoPorId ? 'bg-llama-50' : 'bg-marino-50'">
          <p class="text-sm text-tinta-suave">Viene por</p>
          <p class="text-lg font-bold">{{ vienePor(ficha) }}</p>
          <p v-if="ficha.referidoPorId" class="text-sm text-tinta-suave">{{ persona(ficha.referidoPorId).rango ?? persona(ficha.referidoPorId).area }} · equipo de {{ distribucion(persona(ficha.referidoPorId).distribucionId).lider }}</p>
        </div>
        <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-tinta-suave">Entrevista</dt><dd class="font-semibold">{{ diasEntre(ficha.fecha, HOY) === 0 ? 'Hoy' : fCorta(ficha.fecha) }}, {{ ficha.hora }}</dd></div>
          <div><dt class="text-tinta-suave">Entrevista a cargo de</dt><dd class="font-semibold">{{ persona(ficha.entrevistadorId).nombre }}</dd></div>
          <div><dt class="text-tinta-suave">Oficina</dt><dd class="font-semibold">{{ ficha.oficina }}</dd></div>
          <div><dt class="text-tinta-suave">Registrado por</dt><dd class="font-semibold">{{ persona(ficha.registradoPorId).nombre }}</dd></div>
          <div><dt class="text-tinta-suave">Celular</dt><dd class="font-semibold">{{ ficha.tel || 'Sin registrar' }}</dd></div>
          <div v-if="ficha.segunda"><dt class="text-tinta-suave">Segunda entrevista</dt><dd class="font-semibold">{{ fCorta(ficha.segunda.fecha) }}, {{ ficha.segunda.hora }}</dd></div>
        </dl>

        <div class="mb-2 mt-6 flex items-center justify-between"><h3 class="text-sm font-bold">Resultado</h3><Chip :texto="ficha.estado" /></div>
        <div class="flex flex-wrap gap-2">
          <template v-if="ficha.estado === 'Citado' || ficha.estado === 'Segunda entrevista'">
            <button class="btn-linea" @click="resultado(ficha, 'Apto')">Apto</button>
            <button v-if="ficha.estado === 'Citado'" class="btn-linea" @click="resultado(ficha, 'Segunda entrevista')">Segunda entrevista</button>
            <button class="btn-linea" @click="resultado(ficha, 'No apto')">No apto</button>
            <button v-if="ficha.estado === 'Citado'" class="btn-linea" @click="resultado(ficha, 'No asistió')">No asistió</button>
          </template>
          <button v-else-if="ficha.estado === 'Apto'" class="btn-llama" @click="resultado(ficha, 'En inducción')">Pasar a inducción</button>
          <button v-else-if="ficha.estado === 'En inducción'" class="btn-llama" @click="darDeAlta(ficha)">Dar de alta en el equipo</button>
          <p v-else-if="ficha.estado === 'Activo'" class="text-sm text-ok">Ya forma parte del equipo como Emprendedor.</p>
        </div>

        <label class="mt-6 block text-sm font-bold">Notas de la entrevista
          <textarea v-model="nota" rows="3" class="campo mt-1 font-normal" placeholder="Disponibilidad, experiencia, actitud" /></label>
        <button class="btn-linea mt-2" @click="guardarNota">Guardar nota</button>
      </template>
    </Cajon>

    <!-- Registrar postulante -->
    <Cajon :abierto="nuevo" titulo="Registrar postulante" :subtitulo="`Lo registra ${yo.nombre}`" @cerrar="nuevo = false">
      <div class="grid grid-cols-2 gap-4">
        <label class="col-span-2 text-sm font-semibold">Nombres y apellidos<input v-model="form.nombre" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" inputmode="tel" /></label>
        <label class="text-sm font-semibold">Distrito<input v-model="form.distrito" class="campo mt-1 font-normal" /></label>
      </div>

      <h3 class="mb-2 mt-6 text-sm font-bold">¿Cómo llegó?</h3>
      <div class="grid grid-cols-2 gap-1 rounded-lg bg-marino-50 p-1">
        <button class="rounded-md px-2 py-2 text-sm font-semibold" :class="form.referido ? 'bg-white text-tinta shadow-sm' : 'text-tinta-suave'" :aria-pressed="form.referido" @click="form.referido = true">Lo refiere alguien</button>
        <button class="rounded-md px-2 py-2 text-sm font-semibold" :class="!form.referido ? 'bg-white text-tinta shadow-sm' : 'text-tinta-suave'" :aria-pressed="!form.referido" @click="form.referido = false">Llegó por su cuenta</button>
      </div>
      <label v-if="form.referido" class="mt-3 block text-sm font-semibold">¿Quién lo refiere?
        <select v-model="form.referidoPorId" class="campo mt-1 font-normal">
          <option value="" disabled>Elige a la persona</option>
          <optgroup v-for="g in gruposReferentes" :key="g.d.id" :label="`Equipo de ${g.d.lider}`">
            <option v-for="p in g.gente" :key="p.id" :value="p.id">{{ p.nombre }} · {{ p.rango }}</option>
          </optgroup>
          <optgroup v-if="internos.length" label="Áreas de Millennials">
            <option v-for="p in internos" :key="p.id" :value="p.id">{{ p.nombre }} · {{ p.area }}</option>
          </optgroup>
        </select>
        <span class="mt-1 block text-xs font-normal text-tinta-suave">Pregúntale: ¿quién te recomendó venir?</span></label>
      <label v-else class="mt-3 block text-sm font-semibold">Por dónde se enteró
        <select v-model="form.origen" class="campo mt-1 font-normal"><option v-for="o in ORIGENES.slice(1)" :key="o">{{ o }}</option></select></label>

      <h3 class="mb-2 mt-6 text-sm font-bold">Entrevista</h3>
      <div class="grid grid-cols-2 gap-4">
        <label class="col-span-2 text-sm font-semibold">Se suma al equipo de
          <select v-model="form.distribucionId" class="campo mt-1 font-normal" :disabled="!!alcance"><option v-for="d in distribuciones" :key="d.id" :value="d.id">{{ d.lider }} ({{ d.rango }})</option></select></label>
        <label class="text-sm font-semibold">Día<select v-model.number="form.dia" class="campo mt-1 font-normal"><option v-for="i in 6" :key="i" :value="i - 1">{{ i === 1 ? 'Hoy' : `${fSemana(masDias(HOY, i - 1))} ${fCorta(masDias(HOY, i - 1))}` }}</option></select></label>
        <label class="text-sm font-semibold">Hora<input v-model="form.hora" type="time" class="campo mt-1 font-normal" /></label>
        <label class="col-span-2 text-sm font-semibold">Entrevista a cargo de
          <select v-model="form.entrevistadorId" class="campo mt-1 font-normal"><option value="" disabled>Elige a quién entrevista</option><option v-for="p in entrevistadores" :key="p.id" :value="p.id">{{ p.nombre }} · {{ p.rango ?? p.area }}</option></select></label>
      </div>
      <p class="mt-3 text-xs text-tinta-suave">Oficina: {{ distribucion(form.distribucionId).oficina }}. El postulante recibe un recordatorio por WhatsApp antes de su entrevista.</p>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="nuevo = false">Cancelar</button><button class="btn-primario" @click="guardar">Registrar postulante</button></div></template>
    </Cajon>
  </div>
</template>
