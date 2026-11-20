<script setup lang="ts">
import type { Contacto, ResultadoLlamada } from '~/data/datos'
import { bases, operadores, vendedores, persona } from '~/data/datos'
import { HOY, masDias, pct } from '~/utils/formato'

const { estado, yo, avisar } = useDemo()
const soyOperador = computed(() => estado.rol === 'telemarketing')
const operadorId = ref(operadores[0].id)
watchEffect(() => { if (soyOperador.value) operadorId.value = yo.value.id })

const EFECTIVO: ResultadoLlamada[] = ['Cita agendada', 'Volver a llamar', 'No interesado']
const resumen = (cs: Contacto[]) => {
  const hechas = cs.filter(c => c.resultado)
  return {
    total: cs.length, llamadas: hechas.length,
    efectivos: hechas.filter(c => EFECTIVO.includes(c.resultado!)).length,
    citas: hechas.filter(c => c.resultado === 'Cita agendada').length,
  }
}
const mios = computed(() => estado.contactos.filter(c => c.operadorId === operadorId.value))
const cola = computed(() => mios.value.filter(c => !c.resultado))
const hechas = computed(() => mios.value.filter(c => c.resultado).sort((a, b) => (b.hora ?? '').localeCompare(a.hora ?? '')))
const mio = computed(() => resumen(mios.value))
const siguiente = computed(() => cola.value[0])
const equipo = computed(() => operadores.map(o => ({ o, r: resumen(estado.contactos.filter(c => c.operadorId === o.id)) })).sort((a, b) => b.r.citas - a.r.citas))
const total = computed(() => resumen(estado.contactos))
const base = (id: string) => bases.find(b => b.id === id)!

const registrar = (c: Contacto, r: ResultadoLlamada) => {
  c.resultado = r; c.intentos++
  c.hora = new Date().toTimeString().slice(0, 5)
  if (r !== 'Cita agendada') return avisar(`Gestión registrada: ${r.toLowerCase()}`)
  // Una cita efectiva crea la demo en el calendario del vendedor.
  const v = vendedores[(estado.demos.length * 7) % vendedores.length]
  estado.demos.push({
    id: 'v' + (estado.demos.length + 1), vendedorId: v.id, distribucionId: v.distribucionId, cliente: c.nombre, tel: c.tel,
    distrito: c.distrito, origen: 'Telemarketing', fecha: masDias(HOY, 1), hora: '17:00', visita: 'Programada', etapa: 0, venta: false,
    producto: 'Por definir', monto: 0, evidenciaCurado: false, evidenciaCocinado: false, validada: false, diasEnEtapa: 0,
  })
  avisar(`Demo agendada para mañana con ${v.nombre.split(' ').slice(0, 2).join(' ')}`)
}
const OPCIONES: ResultadoLlamada[] = ['No contesta', 'Volver a llamar', 'No interesado', 'Número equivocado']
</script>

<template>
  <div>
    <Encabezado :titulo="soyOperador ? 'Mi cola de llamadas' : 'Telemarketing'">
      <template v-if="soyOperador">
        Llevas <b class="text-tinta">{{ mio.llamadas }} llamadas y {{ mio.citas }} citas agendadas</b> hoy. Te quedan {{ cola.length }} contactos en cola.
      </template>
      <template v-else>
        El equipo lleva <b class="text-tinta">{{ total.llamadas }} llamadas y {{ total.citas }} citas agendadas</b> hoy,
        con {{ pct(total.efectivos, total.llamadas) }} de contacto efectivo. Quedan {{ total.total - total.llamadas }} contactos en cola.
      </template>
    </Encabezado>

    <!-- Monitoreo por operador (gerencia) -->
    <section v-if="!soyOperador" class="panel mb-5 overflow-x-auto">
      <h2 class="panel-titulo px-5 pb-3 pt-5">Monitoreo de hoy por operador</h2>
      <table class="w-full min-w-[760px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Operador</th><th class="th w-[26%]">Avance de su cola</th><th class="th">Llamadas</th><th class="th">Contacto efectivo</th><th class="th">Citas</th><th class="th">Citas por llamada</th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="e in equipo" :key="e.o.id" class="cursor-pointer hover:bg-marino-50/70" :class="operadorId === e.o.id ? 'bg-llama-50' : ''" @click="operadorId = e.o.id">
            <td class="td font-semibold">{{ e.o.nombre }}</td>
            <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-marino-600" :style="{ width: (e.r.llamadas / e.r.total) * 100 + '%' }" /></div><span class="w-14 text-right text-xs text-tinta-suave">{{ e.r.llamadas }}/{{ e.r.total }}</span></div></td>
            <td class="td">{{ e.r.llamadas }}</td>
            <td class="td">{{ pct(e.r.efectivos, e.r.llamadas) }}</td>
            <td class="td font-bold">{{ e.r.citas }}</td>
            <td class="td">{{ pct(e.r.citas, e.r.llamadas) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <!-- Siguiente llamada -->
      <section class="rounded-panel bg-marino p-6 text-white">
        <p class="text-sm text-marino-300">Siguiente llamada{{ soyOperador ? '' : ` de ${persona(operadorId).nombre.split(' ')[0]}` }}</p>
        <template v-if="siguiente">
          <h2 class="mt-2 text-2xl font-extrabold leading-tight text-white">{{ siguiente.nombre }}</h2>
          <a :href="`tel:+51${siguiente.tel}`" class="mt-1 inline-block text-xl font-semibold text-llama-ambar">{{ siguiente.tel.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') }}</a>
          <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div><dt class="text-marino-300">Distrito</dt><dd class="font-semibold">{{ siguiente.distrito }}</dd></div>
            <div><dt class="text-marino-300">Base</dt><dd class="font-semibold">{{ base(siguiente.baseId).origen }}</dd></div>
            <div><dt class="text-marino-300">Intentos previos</dt><dd class="font-semibold">{{ siguiente.intentos }}</dd></div>
          </dl>
          <button class="btn-llama mt-6 w-full py-3 text-base" @click="registrar(siguiente, 'Cita agendada')"><Icono nombre="demo" />Agendar demo</button>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button v-for="o in OPCIONES" :key="o" class="btn bg-white/10 text-white hover:bg-white/20" @click="registrar(siguiente, o)">{{ o }}</button>
          </div>
        </template>
        <p v-else class="mt-3 text-lg font-semibold">Cola terminada por hoy.</p>
        <div class="mt-6 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-center">
          <div><p class="text-2xl font-extrabold">{{ mio.llamadas }}</p><p class="text-xs text-marino-300">llamadas</p></div>
          <div><p class="text-2xl font-extrabold">{{ mio.efectivos }}</p><p class="text-xs text-marino-300">contactos efectivos</p></div>
          <div><p class="text-2xl font-extrabold text-llama-ambar">{{ mio.citas }}</p><p class="text-xs text-marino-300">citas</p></div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Gestiones de hoy</h2>
        <ul class="max-h-[440px] divide-y divide-regla overflow-y-auto border-t border-regla">
          <li v-for="c in hechas" :key="c.id" class="flex items-center gap-4 px-5 py-2.5 text-sm">
            <span class="w-11 text-tinta-tenue">{{ c.hora }}</span>
            <span class="min-w-0 flex-1 truncate">{{ c.nombre }}</span>
            <span class="hidden w-40 truncate text-xs text-tinta-suave sm:block">{{ base(c.baseId).origen }}</span>
            <Chip :texto="c.resultado!" />
          </li>
        </ul>
      </section>
    </div>

    <section v-if="!soyOperador" class="panel mt-5 overflow-x-auto">
      <h2 class="panel-titulo px-5 pb-3 pt-5">Bases de datos</h2>
      <table class="w-full min-w-[760px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Base</th><th class="th">Registros</th><th class="th w-[24%]">Trabajados</th><th class="th">Contacto efectivo</th><th class="th">Citas</th><th class="th">Citas por contacto</th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="b in bases" :key="b.id">
            <td class="td"><p class="font-semibold">{{ b.nombre }}</p><p class="text-xs text-tinta-suave">{{ b.origen }}</p></td>
            <td class="td">{{ b.registros }}</td>
            <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-marino-50"><div class="h-2 rounded-full bg-marino-600" :style="{ width: (b.trabajados / b.registros) * 100 + '%' }" /></div><span class="w-10 text-right text-xs text-tinta-suave">{{ pct(b.trabajados, b.registros) }}</span></div></td>
            <td class="td">{{ pct(b.contactos, b.trabajados) }}</td>
            <td class="td font-bold">{{ b.citas }}</td>
            <td class="td">{{ pct(b.citas, b.contactos) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
