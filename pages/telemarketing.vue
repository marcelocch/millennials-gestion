<script setup lang="ts">
// Telemarketing: cola de llamadas con guion y rellamadas, agendamiento de demos en el
// calendario del vendedor, monitoreo contra metas, carga y asignación de bases,
// y el resultado de las citas agendadas (si se realizaron y si vendieron).
import type { Contacto, ResultadoLlamada, BaseTm } from '~/data/datos'
import { operadores, vendedores, persona, META_LLAMADAS, META_CITAS } from '~/data/datos'
import { horaActual } from '~/composables/useDemo'
import { HOY, masDias, diasEntre, soles, solesCorto, fCorta, fSemana, pct } from '~/utils/formato'

type Vista = 'cola' | 'monitoreo' | 'bases' | 'citas'
const ruta = useRoute()
const { estado, yo, avisar } = useDemo()
const soyOperador = computed(() => estado.rol === 'telemarketing')
const vista = ref<Vista>((ruta.query.vista as Vista) || (soyOperador.value ? 'cola' : 'monitoreo'))
watch(() => ruta.query.vista, (v) => { if (v) vista.value = v as Vista })
watch(soyOperador, (s) => { vista.value = s ? 'cola' : 'monitoreo' })
const tabs = computed<[Vista, string][]>(() => soyOperador.value
  ? [['cola', 'Mi cola'], ['citas', 'Mis citas']]
  : [['monitoreo', 'Monitoreo'], ['cola', 'Cola por operador'], ['bases', 'Bases y asignación'], ['citas', 'Resultado de las citas']])

const operadorId = ref(operadores[0].id)
watchEffect(() => { if (soyOperador.value) operadorId.value = yo.value.id })
const base = (id: string) => estado.bases.find(b => b.id === id)!

/* ---------- Resúmenes ---------- */
const EFECTIVO: ResultadoLlamada[] = ['Cita agendada', 'Volver a llamar', 'No interesado']
const resumen = (cs: Contacto[]) => {
  const hechas = cs.filter(c => c.resultado)
  return {
    total: cs.length, llamadas: hechas.length,
    efectivos: hechas.filter(c => EFECTIVO.includes(c.resultado!)).length,
    citas: hechas.filter(c => c.resultado === 'Cita agendada').length,
    ultima: hechas.map(c => c.hora ?? '').sort().at(-1) ?? '',
  }
}
const mios = computed(() => estado.contactos.filter(c => c.operadorId === operadorId.value))
const mio = computed(() => resumen(mios.value))
const total = computed(() => resumen(estado.contactos))

/* ---------- Cola ---------- */
const actualId = ref<string | null>(null)
const cola = computed(() => mios.value.filter(c => !c.resultado))
const rellamadas = computed(() => mios.value.filter(c => c.resultado === 'Volver a llamar' && c.rellamada).sort((a, b) => a.rellamada!.localeCompare(b.rellamada!)))
const siguiente = computed(() => estado.contactos.find(c => c.id === actualId.value) ?? cola.value[0])
const hechas = computed(() => mios.value.filter(c => c.resultado && c.hora).sort((a, b) => b.hora!.localeCompare(a.hora!)))
const nota = ref('')
const pidiendoHora = ref(false)
watch(siguiente, () => { nota.value = ''; pidiendoHora.value = false })

const guion = computed(() => {
  const c = siguiente.value
  if (!c) return []
  const yoOp = persona(operadorId.value).nombre.split(' ')[0]
  const nombre = c.nombre.split(' ')[0]
  const motivo = c.referente
    ? `${c.referente.split(' ').slice(0, 2).join(' ')} nos dio su número porque cree que le puede interesar conocer nuestros productos.`
    : c.baseId === 'b2' ? 'Usted ya tiene productos Royal Prestige y queremos invitarle a conocer las novedades.'
      : 'Nos dejó sus datos en una de nuestras activaciones.'
  return [
    `Buenos días, ¿hablo con ${nombre}? Le saluda ${yoOp}, de Millennials, distribuidor de Royal Prestige.`,
    motivo,
    'Le ofrecemos una demostración gratuita en su casa: cocinamos juntos y le dejamos un obsequio por su tiempo.',
    '¿Qué día le acomoda más, entre semana o el fin de semana?',
  ]
})

const registrar = (c: Contacto, r: ResultadoLlamada, rellamada?: string) => {
  Object.assign(c, { resultado: r, intentos: c.intentos + 1, hora: horaActual(), rellamada, nota: nota.value.trim() || c.nota })
  if (actualId.value === c.id) actualId.value = null
  avisar(r === 'Volver a llamar' ? `Rellamada programada ${rellamada === 'mañana' ? 'para mañana' : `a las ${rellamada}`}` : `Gestión registrada: ${r.toLowerCase()}`)
}
const enUnaHora = () => { const d = new Date(Date.now() + 3600e3); return d.toTimeString().slice(0, 5) }

/* ---------- Agendar demo ---------- */
const agendando = ref<Contacto | null>(null)
const ag = reactive({ vendedorId: '', dia: 1, hora: '17:00', direccion: '', nota: '' })
const demosDel = (vId: string, dia: number) => estado.demos.filter(d => d.vendedorId === vId && diasEntre(masDias(HOY, dia), d.fecha) === 0).length
const vendedoresDisponibles = computed(() => vendedores
  .map(v => ({ v, n: demosDel(v.id, ag.dia) }))
  .sort((a, b) => a.n - b.n || a.v.nombre.localeCompare(b.v.nombre)))
const abrirAgenda = (c: Contacto) => {
  agendando.value = c
  Object.assign(ag, { vendedorId: '', dia: 1, hora: '17:00', direccion: '', nota: nota.value })
  ag.vendedorId = vendedoresDisponibles.value[0].v.id
}
const guardarCita = () => {
  const c = agendando.value!
  const v = persona(ag.vendedorId)
  estado.demos.push({
    id: 'v' + (estado.demos.length + 1), vendedorId: v.id, distribucionId: v.distribucionId, cliente: c.nombre, tel: c.tel,
    distrito: c.distrito, origen: c.referente ? 'Referido 4 en 14' : 'Telemarketing', fecha: masDias(HOY, ag.dia), hora: ag.hora,
    visita: 'Programada', etapa: 0, venta: false, producto: 'Por definir', monto: 0,
    evidenciaCurado: false, evidenciaCocinado: false, validada: false, diasEnEtapa: 0, operadorId: operadorId.value,
  })
  registrar(c, 'Cita agendada')
  agendando.value = null
  avisar(`Demo agendada con ${v.nombre.split(' ').slice(0, 2).join(' ')} ${ag.dia === 0 ? 'hoy' : ag.dia === 1 ? 'mañana' : 'el ' + fCorta(masDias(HOY, ag.dia))} a las ${ag.hora}`)
}

/* ---------- Monitoreo ---------- */
const equipo = computed(() => operadores.map(o => ({ o, r: resumen(estado.contactos.filter(c => c.operadorId === o.id)) })).sort((a, b) => b.r.citas - a.r.citas || b.r.llamadas - a.r.llamadas))
const porHora = computed(() => [9, 10, 11, 12, 13, 14, 15, 16, 17].map(h => ({
  etiqueta: `${h}h`, valor: estado.contactos.filter(c => c.hora && Number(c.hora.slice(0, 2)) === h).length,
})).filter((x, i, arr) => x.valor > 0 || arr.slice(i).some(y => y.valor > 0) || i < 5))
const RESULTADOS: ResultadoLlamada[] = ['Cita agendada', 'Volver a llamar', 'No interesado', 'No contesta', 'Número equivocado']
const porResultado = computed(() => RESULTADOS.map(r => ({ r, n: estado.contactos.filter(c => c.resultado === r).length })))
const maxResultado = computed(() => Math.max(...porResultado.value.map(x => x.n), 1))
const rellamadasEquipo = computed(() => estado.contactos.filter(c => c.resultado === 'Volver a llamar' && c.rellamada && c.rellamada !== 'mañana').length)
const verCola = (id: string) => { operadorId.value = id; vista.value = 'cola' }

/* ---------- Bases ---------- */
const NO_LLAMAR = 37
const cargando = ref(false)
const carga = reactive({ nombre: '', origen: 'Programa de referidos', archivo: '', revisado: false })
const RESUMEN_CARGA = { registros: 250, duplicados: 18, invalidos: 6, noLlamar: 4 }
const listos = RESUMEN_CARGA.registros - RESUMEN_CARGA.duplicados - RESUMEN_CARGA.invalidos - RESUMEN_CARGA.noLlamar
const abrirCarga = () => { Object.assign(carga, { nombre: `Referidos 4 en 14 · semana del ${fCorta(HOY)}`, origen: 'Programa de referidos', archivo: '', revisado: false }); cargando.value = true }
const elegirArchivo = (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { carga.archivo = f.name; carga.revisado = true } }
const usarEjemplo = () => { carga.archivo = 'referidos-noviembre.xlsx'; carga.revisado = true }
const cargar = () => {
  estado.bases.push({ id: 'b' + (estado.bases.length + 1), nombre: carga.nombre, origen: carga.origen, registros: listos, trabajados: 0, contactos: 0, citas: 0, porAsignar: listos })
  cargando.value = false
  avisar(`${listos} contactos cargados. Ya puedes asignarlos.`)
}
const asignando = ref<BaseTm | null>(null)
const elegidos = ref<string[]>([])
const abrirAsignar = (b: BaseTm) => { asignando.value = b; elegidos.value = operadores.map(o => o.id) }
const porOperador = computed(() => asignando.value && elegidos.value.length ? Math.floor(asignando.value.porAsignar / elegidos.value.length) : 0)
const asignar = () => {
  const b = asignando.value!
  const n = porOperador.value * elegidos.value.length
  b.porAsignar -= n
  asignando.value = null
  avisar(`${n} contactos asignados a ${elegidos.value.length} operadores`)
}

/* ---------- Resultado de las citas ---------- */
const citas = computed(() => estado.demos.filter(d => d.operadorId && diasEntre(d.fecha, HOY) >= 0 && diasEntre(d.fecha, HOY) <= 30))
const efectividad = (ds: typeof citas.value) => {
  const realizadas = ds.filter(d => d.visita === 'Realizada')
  const ventas = realizadas.filter(d => d.venta)
  return { agendadas: ds.length, realizadas: realizadas.length, ventas: ventas.length, monto: ventas.reduce((s, d) => s + d.monto, 0) }
}
const efTotal = computed(() => efectividad(citas.value))
const efPorOperador = computed(() => operadores
  .filter(o => !soyOperador.value || o.id === yo.value.id)
  .map(o => ({ o, e: efectividad(citas.value.filter(d => d.operadorId === o.id)) }))
  .sort((a, b) => b.e.monto - a.e.monto))
const misCitas = computed(() => estado.demos.filter(d => d.operadorId === operadorId.value && diasEntre(d.fecha, HOY) <= 30).sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).slice(0, 14))
</script>

<template>
  <div>
    <Encabezado :titulo="soyOperador ? 'Mi cola de llamadas' : 'Telemarketing'">
      <template v-if="soyOperador">
        Llevas <b class="text-tinta">{{ mio.llamadas }} de {{ META_LLAMADAS }} llamadas</b> y <b class="text-tinta">{{ mio.citas }} de {{ META_CITAS }} citas</b> de tu meta de hoy.
        Tienes {{ rellamadas.length }} rellamadas programadas.
      </template>
      <template v-else>
        El equipo lleva <b class="text-tinta">{{ total.llamadas }} llamadas y {{ total.citas }} citas agendadas</b> hoy, con {{ pct(total.efectivos, total.llamadas) }} de contacto efectivo.
        De las citas de los últimos 30 días, {{ pct(efTotal.realizadas, efTotal.agendadas) }} se realizaron y {{ efTotal.ventas }} terminaron en venta.
      </template>
      <template v-if="!soyOperador" #acciones>
        <button class="btn-linea" @click="abrirCarga"><Icono nombre="subir" :size="16" />Cargar base</button>
      </template>
    </Encabezado>

    <div class="mb-4 inline-flex flex-wrap rounded-lg border border-regla bg-white p-1" role="tablist">
      <button v-for="t in tabs" :key="t[0]" role="tab" :aria-selected="vista === t[0]" class="rounded-md px-4 py-1.5 text-sm font-semibold"
        :class="vista === t[0] ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = t[0]">{{ t[1] }}</button>
    </div>

    <!-- ================= Cola ================= -->
    <template v-if="vista === 'cola'">
      <div v-if="!soyOperador" class="mb-4 flex items-center gap-3">
        <label class="text-sm text-tinta-suave" for="op">Operador</label>
        <select id="op" v-model="operadorId" class="campo w-auto"><option v-for="o in operadores" :key="o.id" :value="o.id">{{ o.nombre }}</option></select>
      </div>
      <div class="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section class="rounded-panel bg-marino p-6 text-white">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-marino-300">{{ actualId ? 'Rellamada' : 'Siguiente llamada' }} · {{ cola.length }} en cola</p>
            <span v-if="siguiente" class="text-xs text-marino-300">{{ base(siguiente.baseId).origen }}</span>
          </div>
          <template v-if="siguiente">
            <h2 class="mt-2 text-2xl font-extrabold leading-tight text-white">{{ siguiente.nombre }}</h2>
            <a :href="`tel:+51${siguiente.tel}`" class="mt-1 inline-block text-xl font-semibold text-llama-ambar">{{ siguiente.tel.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') }}</a>
            <p v-if="siguiente.referente" class="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">Referido por <b>{{ siguiente.referente }}</b>, cliente del programa 4 en 14</p>
            <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><dt class="text-marino-300">Distrito</dt><dd class="font-semibold">{{ siguiente.distrito }}</dd></div>
              <div><dt class="text-marino-300">Intentos previos</dt><dd class="font-semibold">{{ siguiente.intentos }}</dd></div>
              <div v-if="siguiente.nota"><dt class="text-marino-300">Última nota</dt><dd class="font-semibold">{{ siguiente.nota }}</dd></div>
            </dl>

            <details class="mt-4 rounded-lg bg-white/5 px-3 py-2 text-sm" open>
              <summary class="cursor-pointer font-semibold">Guion de la llamada</summary>
              <ol class="mt-2 list-decimal space-y-1.5 pl-5 text-marino-100">
                <li v-for="(l, i) in guion" :key="i">{{ l }}</li>
              </ol>
            </details>

            <textarea v-model="nota" rows="2" class="mt-4 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-marino-300 focus:border-llama focus:outline-none" placeholder="Nota de la llamada (opcional)" aria-label="Nota de la llamada" />

            <button class="btn-llama mt-3 w-full py-3 text-base" @click="abrirAgenda(siguiente)"><Icono nombre="demo" />Agendar demo</button>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button class="btn bg-white/10 text-white hover:bg-white/20" @click="registrar(siguiente, 'No contesta')">No contesta</button>
              <button class="btn bg-white/10 text-white hover:bg-white/20" :aria-expanded="pidiendoHora" @click="pidiendoHora = !pidiendoHora">Volver a llamar</button>
              <button class="btn bg-white/10 text-white hover:bg-white/20" @click="registrar(siguiente, 'No interesado')">No interesado</button>
              <button class="btn bg-white/10 text-white hover:bg-white/20" @click="registrar(siguiente, 'Número equivocado')">Número equivocado</button>
            </div>
            <div v-if="pidiendoHora" class="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-white/5 p-2 text-sm">
              <span class="px-1 text-marino-300">¿Cuándo?</span>
              <button v-for="h in [enUnaHora(), '16:00', '18:00', 'mañana']" :key="h" class="rounded-md bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25" @click="registrar(siguiente, 'Volver a llamar', h)">{{ h === 'mañana' ? 'Mañana' : h }}</button>
            </div>
          </template>
          <p v-else class="mt-3 text-lg font-semibold">Cola terminada por hoy.</p>

          <div class="mt-6 space-y-3 border-t border-white/15 pt-4 text-sm">
            <div>
              <div class="flex justify-between"><span class="text-marino-300">Llamadas</span><b>{{ mio.llamadas }} de {{ META_LLAMADAS }}</b></div>
              <div class="mt-1 h-2 rounded-full bg-white/10"><div class="h-2 rounded-full bg-marino-300" :style="{ width: Math.min(mio.llamadas / META_LLAMADAS, 1) * 100 + '%' }" /></div>
            </div>
            <div>
              <div class="flex justify-between"><span class="text-marino-300">Citas agendadas</span><b class="text-llama-ambar">{{ mio.citas }} de {{ META_CITAS }}</b></div>
              <div class="mt-1 h-2 rounded-full bg-white/10"><div class="h-2 rounded-full bg-llama" :style="{ width: Math.min(mio.citas / META_CITAS, 1) * 100 + '%' }" /></div>
            </div>
          </div>
        </section>

        <div class="space-y-5">
          <section class="panel">
            <h2 class="panel-titulo px-5 pb-3 pt-5">Rellamadas programadas</h2>
            <ul class="divide-y divide-regla border-t border-regla">
              <li v-for="c in rellamadas" :key="c.id" class="flex items-center gap-4 px-5 py-2.5 text-sm" :class="actualId === c.id ? 'bg-llama-50' : ''">
                <span class="w-14 font-bold" :class="c.rellamada === 'mañana' ? 'text-tinta-tenue' : ''">{{ c.rellamada === 'mañana' ? 'Mañana' : c.rellamada }}</span>
                <span class="min-w-0 flex-1"><span class="block truncate font-semibold">{{ c.nombre }}</span><span class="block truncate text-xs text-tinta-suave">{{ c.nota || base(c.baseId).origen }}</span></span>
                <button class="text-xs font-bold text-marino-600 hover:underline" @click="actualId = c.id">Llamar ahora</button>
              </li>
              <li v-if="!rellamadas.length" class="px-5 py-6 text-center text-sm text-tinta-suave">Sin rellamadas pendientes.</li>
            </ul>
          </section>
          <section class="panel">
            <h2 class="panel-titulo px-5 pb-3 pt-5">Gestiones de hoy</h2>
            <ul class="max-h-[340px] divide-y divide-regla overflow-y-auto border-t border-regla">
              <li v-for="c in hechas" :key="c.id" class="flex items-center gap-4 px-5 py-2.5 text-sm">
                <span class="w-11 text-tinta-tenue">{{ c.hora }}</span>
                <span class="min-w-0 flex-1 truncate">{{ c.nombre }}</span>
                <Chip :texto="c.resultado!" />
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>

    <!-- ================= Monitoreo ================= -->
    <template v-else-if="vista === 'monitoreo'">
      <section class="panel grid grid-cols-2 gap-6 p-6 md:grid-cols-4 md:divide-x md:divide-regla">
        <Cifra nombre="Llamadas de hoy" :valor="total.llamadas" :nota="`meta del equipo: ${META_LLAMADAS * operadores.length}`" />
        <Cifra class="md:pl-6" nombre="Contacto efectivo" :valor="pct(total.efectivos, total.llamadas)" nota="contestó y dio una respuesta" />
        <Cifra class="md:pl-6" nombre="Citas agendadas" :valor="total.citas" tono="llama" :nota="`meta del equipo: ${META_CITAS * operadores.length}`" />
        <Cifra class="md:pl-6" nombre="Rellamadas para hoy" :valor="rellamadasEquipo" nota="programadas por los operadores" />
      </section>

      <section class="panel mt-5 overflow-x-auto">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Avance de cada operador contra su meta</h2>
        <table class="w-full min-w-[820px]">
          <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Operador</th><th class="th w-[24%]">Llamadas</th><th class="th w-[20%]">Citas</th><th class="th">Contacto efectivo</th><th class="th">Última llamada</th><th class="th"></th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="e in equipo" :key="e.o.id">
              <td class="td font-semibold">{{ e.o.nombre }}</td>
              <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-marino-600" :style="{ width: Math.min(e.r.llamadas / META_LLAMADAS, 1) * 100 + '%' }" /></div><span class="w-14 text-right text-xs text-tinta-suave">{{ e.r.llamadas }}/{{ META_LLAMADAS }}</span></div></td>
              <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-llama" :style="{ width: Math.min(e.r.citas / META_CITAS, 1) * 100 + '%' }" /></div><span class="w-10 text-right text-xs text-tinta-suave">{{ e.r.citas }}/{{ META_CITAS }}</span></div></td>
              <td class="td">{{ pct(e.r.efectivos, e.r.llamadas) }}</td>
              <td class="td text-tinta-suave">{{ e.r.ultima || '—' }}</td>
              <td class="td text-right"><button class="text-xs font-bold text-marino-600 hover:underline" @click="verCola(e.o.id)">Ver su cola</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <section class="panel p-6">
          <div class="mb-4 flex items-baseline justify-between"><h2 class="panel-titulo">Llamadas por hora</h2><p class="text-sm text-tinta-suave">Todo el equipo, hoy</p></div>
          <Barras :datos="porHora" :alto="150" />
        </section>
        <section class="panel p-6">
          <h2 class="panel-titulo mb-4">Resultado de las llamadas de hoy</h2>
          <ul class="space-y-3">
            <li v-for="x in porResultado" :key="x.r">
              <div class="flex justify-between text-sm"><span class="text-tinta-suave">{{ x.r }}</span><b>{{ x.n }}</b></div>
              <div class="mt-1 h-2.5 rounded-[4px] bg-marino-50"><div class="h-full rounded-[4px]" :class="x.r === 'Cita agendada' ? 'bg-llama' : 'bg-marino-600'" :style="{ width: (x.n / maxResultado) * 100 + '%' }" /></div>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- ================= Bases ================= -->
    <template v-else-if="vista === 'bases'">
      <section class="panel overflow-x-auto">
        <div class="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-3 pt-5">
          <h2 class="panel-titulo">Bases de datos</h2>
          <p class="text-sm text-tinta-suave">{{ NO_LLAMAR }} números en la lista de no llamar se excluyen de todas las bases.</p>
        </div>
        <table class="w-full min-w-[900px]">
          <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Base</th><th class="th">Registros</th><th class="th w-[22%]">Trabajados</th><th class="th">Contacto efectivo</th><th class="th">Citas</th><th class="th">Por asignar</th><th class="th"></th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="b in estado.bases" :key="b.id">
              <td class="td"><p class="font-semibold">{{ b.nombre }}</p><p class="text-xs text-tinta-suave">{{ b.origen }}</p></td>
              <td class="td">{{ b.registros }}</td>
              <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-marino-600" :style="{ width: (b.trabajados / b.registros) * 100 + '%' }" /></div><span class="w-10 text-right text-xs text-tinta-suave">{{ pct(b.trabajados, b.registros) }}</span></div></td>
              <td class="td">{{ pct(b.contactos, b.trabajados) }}</td>
              <td class="td font-bold">{{ b.citas }}</td>
              <td class="td"><span :class="b.porAsignar ? 'font-semibold text-llama-700' : 'text-tinta-tenue'">{{ b.porAsignar }}</span></td>
              <td class="td text-right"><button v-if="b.porAsignar" class="btn-linea px-3 py-1.5 text-xs" @click="abrirAsignar(b)">Asignar</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <!-- ================= Resultado de las citas ================= -->
    <template v-else>
      <section class="panel grid grid-cols-2 gap-6 p-6 md:grid-cols-4 md:divide-x md:divide-regla">
        <Cifra nombre="Citas agendadas" :valor="efTotal.agendadas" nota="por telemarketing, últimos 30 días" />
        <Cifra class="md:pl-6" nombre="Se realizaron" :valor="pct(efTotal.realizadas, efTotal.agendadas)" :nota="`${efTotal.realizadas} demos hechas`" />
        <Cifra class="md:pl-6" nombre="Terminaron en venta" :valor="efTotal.ventas" tono="ok" :nota="`${pct(efTotal.ventas, efTotal.realizadas)} de las realizadas`" />
        <Cifra class="md:pl-6" nombre="Vendido" :valor="solesCorto(efTotal.monto)" nota="en citas de telemarketing" />
      </section>
      <section class="panel mt-5 overflow-x-auto">
        <h2 class="panel-titulo px-5 pb-1 pt-5">Calidad de las citas por operador</h2>
        <p class="px-5 pb-3 text-sm text-tinta-suave">No basta con agendar: aquí se ve cuántas citas se realizaron y cuántas vendieron.</p>
        <table class="w-full min-w-[760px]">
          <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Operador</th><th class="th text-right">Agendadas</th><th class="th text-right">Realizadas</th><th class="th text-right">Ventas</th><th class="th text-right">Citas que venden</th><th class="th text-right">Vendido</th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="x in efPorOperador" :key="x.o.id" class="cursor-pointer hover:bg-marino-50/70" @click="operadorId = x.o.id">
              <td class="td font-semibold">{{ x.o.nombre }}</td>
              <td class="td text-right">{{ x.e.agendadas }}</td>
              <td class="td text-right">{{ x.e.realizadas }} <span class="text-xs text-tinta-tenue">{{ pct(x.e.realizadas, x.e.agendadas) }}</span></td>
              <td class="td text-right font-bold">{{ x.e.ventas }}</td>
              <td class="td text-right">{{ pct(x.e.ventas, x.e.agendadas) }}</td>
              <td class="td text-right font-semibold">{{ soles(x.e.monto) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="panel mt-5">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Citas recientes de {{ persona(operadorId).nombre.split(' ')[0] }}</h2>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="d in misCitas" :key="d.id" class="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-2.5 text-sm">
            <span class="w-24 text-tinta-suave">{{ diasEntre(d.fecha, HOY) === 0 ? 'Hoy' : diasEntre(d.fecha, HOY) < 0 ? `${fSemana(d.fecha)} ${fCorta(d.fecha)}` : fCorta(d.fecha) }}</span>
            <span class="min-w-0 flex-1 basis-40 truncate font-semibold">{{ d.cliente }}</span>
            <span class="w-40 truncate text-tinta-suave">con {{ persona(d.vendedorId).nombre.split(' ').slice(0, 2).join(' ') }}</span>
            <Chip :texto="d.visita" />
            <span class="w-24 text-right">{{ d.venta ? soles(d.monto) : '' }}</span>
          </li>
          <li v-if="!misCitas.length" class="px-5 py-6 text-center text-sm text-tinta-suave">Sin citas en los últimos 30 días.</li>
        </ul>
      </section>
    </template>

    <!-- Agendar demo desde la llamada -->
    <Cajon :abierto="!!agendando" titulo="Agendar demo" :subtitulo="agendando ? `${agendando.nombre} · ${agendando.distrito}` : ''" @cerrar="agendando = null">
      <div class="grid grid-cols-2 gap-4">
        <label class="text-sm font-semibold">Día<select v-model.number="ag.dia" class="campo mt-1 font-normal"><option v-for="i in 6" :key="i" :value="i - 1">{{ i === 1 ? 'Hoy' : i === 2 ? 'Mañana' : `${fSemana(masDias(HOY, i - 1))} ${fCorta(masDias(HOY, i - 1))}` }}</option></select></label>
        <label class="text-sm font-semibold">Hora<input v-model="ag.hora" type="time" class="campo mt-1 font-normal" /></label>
        <label class="col-span-2 text-sm font-semibold">Vendedor
          <select v-model="ag.vendedorId" class="campo mt-1 font-normal">
            <option v-for="x in vendedoresDisponibles" :key="x.v.id" :value="x.v.id">{{ x.v.nombre }} · {{ x.n === 0 ? 'libre' : `${x.n} ${x.n === 1 ? 'demo' : 'demos'}` }} ese día</option>
          </select>
          <span class="mt-1 block text-xs font-normal text-tinta-suave">Primero aparecen quienes tienen la agenda más libre ese día.</span></label>
        <label class="col-span-2 text-sm font-semibold">Dirección<input v-model="ag.direccion" class="campo mt-1 font-normal" placeholder="Calle, número y referencia" /></label>
        <label class="col-span-2 text-sm font-semibold">Nota para el vendedor<textarea v-model="ag.nota" rows="2" class="campo mt-1 font-normal" placeholder="Qué le interesa, quién estará en casa" /></label>
      </div>
      <p class="mt-3 text-sm text-tinta-suave">La demo aparece al instante en el calendario del vendedor y queda asociada a esta llamada.</p>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="agendando = null">Cancelar</button><button class="btn-primario" @click="guardarCita">Agendar demo</button></div></template>
    </Cajon>

    <!-- Cargar base -->
    <Cajon :abierto="cargando" titulo="Cargar base de contactos" subtitulo="Excel o CSV con nombre y celular" @cerrar="cargando = false">
      <div class="grid gap-4">
        <label class="text-sm font-semibold">Nombre de la base<input v-model="carga.nombre" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Origen<select v-model="carga.origen" class="campo mt-1 font-normal"><option>Programa de referidos</option><option>Cartera propia</option><option>Marketing</option><option>Ferias y activaciones</option></select></label>
        <div class="rounded-panel border-2 border-dashed border-regla p-5 text-center">
          <Icono nombre="subir" :size="22" class="mx-auto text-tinta-tenue" />
          <label class="mt-2 inline-block cursor-pointer text-sm font-semibold text-marino-600 hover:underline">Elegir archivo<input type="file" accept=".csv,.xlsx,.xls" class="sr-only" @change="elegirArchivo" /></label>
          <p class="mt-1 text-xs text-tinta-suave">o <button class="font-semibold text-marino-600 hover:underline" @click="usarEjemplo">usar un archivo de ejemplo</button></p>
          <p v-if="carga.archivo" class="mt-2 text-sm"><b>{{ carga.archivo }}</b></p>
        </div>
      </div>
      <div v-if="carga.revisado" class="mt-5 rounded-panel bg-marino-50 p-4 text-sm">
        <p class="font-bold">Revisión del archivo</p>
        <ul class="mt-2 space-y-1.5">
          <li class="flex justify-between"><span class="text-tinta-suave">Registros en el archivo</span><b>{{ RESUMEN_CARGA.registros }}</b></li>
          <li class="flex justify-between"><span class="text-tinta-suave">Ya están en otra base o son clientes</span><b class="text-aviso">− {{ RESUMEN_CARGA.duplicados }}</b></li>
          <li class="flex justify-between"><span class="text-tinta-suave">Números incompletos o inválidos</span><b class="text-mora">− {{ RESUMEN_CARGA.invalidos }}</b></li>
          <li class="flex justify-between"><span class="text-tinta-suave">En la lista de no llamar</span><b class="text-mora">− {{ RESUMEN_CARGA.noLlamar }}</b></li>
          <li class="flex justify-between border-t border-regla pt-1.5"><span class="font-semibold">Listos para llamar</span><b class="text-ok">{{ listos }}</b></li>
        </ul>
      </div>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="cargando = false">Cancelar</button><button class="btn-primario" :disabled="!carga.revisado" :class="!carga.revisado ? 'cursor-not-allowed opacity-50' : ''" @click="cargar">Cargar {{ carga.revisado ? listos : '' }} contactos</button></div></template>
    </Cajon>

    <!-- Asignar contactos -->
    <Cajon :abierto="!!asignando" titulo="Asignar contactos" :subtitulo="asignando ? `${asignando.nombre} · ${asignando.porAsignar} por asignar` : ''" @cerrar="asignando = null">
      <p class="text-sm font-semibold">Repartir entre</p>
      <ul class="mt-2 divide-y divide-regla rounded-panel border border-regla">
        <li v-for="o in operadores" :key="o.id">
          <label class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-marino-50/70">
            <input v-model="elegidos" type="checkbox" :value="o.id" class="h-4 w-4 accent-[#021B49]" />
            <span class="flex-1">{{ o.nombre }}</span>
            <span class="text-xs text-tinta-suave">{{ estado.contactos.filter(c => c.operadorId === o.id && !c.resultado).length }} en cola</span>
          </label>
        </li>
      </ul>
      <p class="mt-4 text-sm">Cada operador recibe <b>{{ porOperador }} contactos</b>.</p>
      <template #pie><div class="flex justify-end gap-2"><button class="btn-linea" @click="asignando = null">Cancelar</button><button class="btn-primario" :disabled="!elegidos.length" @click="asignar">Asignar contactos</button></div></template>
    </Cajon>
  </div>
</template>
