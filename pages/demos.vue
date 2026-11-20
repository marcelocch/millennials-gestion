<script setup lang="ts">
import type { Demo, Visita } from '~/data/datos'
import { ETAPAS, persona, vendedores } from '~/data/datos'
import { HOY, masDias, diasEntre, soles, fCorta, fSemana, relativo } from '~/utils/formato'

const { estado, yo, alcance, demosVisibles, avisar } = useDemo()
const soyVendedor = computed(() => estado.rol === 'vendedor')
const puedeValidar = computed(() => ['gerencia', 'distribuidor'].includes(estado.rol))

const vista = ref<'agenda' | 'ventas' | 'validar'>('agenda')
const equipo = computed(() => vendedores.filter(v => !alcance.value || v.distribucionId === alcance.value))
const trabajadorId = ref('')
const enSemana = (id: string) => estado.demos.filter(d => d.vendedorId === id && diasEntre(HOY, d.fecha) >= -1 && diasEntre(HOY, d.fecha) <= 5).length
watchEffect(() => {
  // Por defecto se muestra a quien tiene la semana más cargada.
  trabajadorId.value = soyVendedor.value ? yo.value.id : [...equipo.value].sort((a, b) => enSemana(b.id) - enSemana(a.id))[0].id
})

const hoy = computed(() => demosVisibles.value.filter(d => diasEntre(d.fecha, HOY) === 0).sort((a, b) => a.hora.localeCompare(b.hora)))
const semana = computed(() => Array.from({ length: 7 }, (_, i) => {
  const dia = masDias(HOY, i - 1)
  return { dia, demos: estado.demos.filter(d => d.vendedorId === trabajadorId.value && diasEntre(d.fecha, dia) === 0) }
}))

const ventas = computed(() => demosVisibles.value.filter(d => d.venta).sort((a, b) => a.etapa - b.etapa || b.diasEnEtapa - a.diasEnEtapa))
const enCurso = computed(() => ventas.value.filter(d => d.etapa < 5))
const porValidar = computed(() => ventas.value.filter(d => d.etapa === 4 && !d.validada))
const segundaVisita = computed(() => ventas.value.filter(d => d.etapa === 2 || d.etapa === 3))

/* ----- Acciones sobre una demo o venta ----- */
const abierta = ref<Demo | null>(null)
const marcar = (d: Demo, v: Visita) => { d.visita = v; avisar(`Visita marcada como ${v.toLowerCase()}`) }
const avanzar = (d: Demo, etapa: number, texto: string) => { d.etapa = etapa; d.diasEnEtapa = 0; avisar(texto) }
const cerrarVenta = (d: Demo) => { d.venta = true; d.visita = 'Realizada'; avanzar(d, 1, 'Venta registrada') }
const subir = (d: Demo, tipo: 'curado' | 'cocinado') => {
  if (tipo === 'curado') { d.evidenciaCurado = true; avanzar(d, 3, 'Evidencia de curado subida') }
  else { d.evidenciaCocinado = true; avanzar(d, 4, 'Evidencia de cocinado subida. Queda en revisión.') }
}
const validar = (d: Demo) => { d.validada = true; avanzar(d, 5, 'Evidencia validada. Comisión habilitada.') }

const siguiente = (d: Demo) => [
  null,
  { texto: 'Marcar producto entregado', hacer: () => avanzar(d, 2, 'Entrega registrada') },
  { texto: 'Subir evidencia de curado', hacer: () => subir(d, 'curado') },
  { texto: 'Subir evidencia de cocinado', hacer: () => subir(d, 'cocinado') },
  puedeValidar.value ? { texto: 'Validar y habilitar comisión', hacer: () => validar(d) } : null,
  null,
][d.etapa]

/* ----- Agendar ----- */
const agendar = ref(false)
const form = reactive({ cliente: '', tel: '', distrito: '', dia: 1, hora: '17:00', origen: 'Referido 4 en 14' })
const guardar = () => {
  if (!form.cliente.trim()) return avisar('Escribe el nombre del cliente')
  const v = persona(trabajadorId.value)
  estado.demos.push({
    id: 'v' + (estado.demos.length + 1), vendedorId: v.id, distribucionId: v.distribucionId,
    cliente: form.cliente.trim(), tel: form.tel, distrito: form.distrito || 'Lima', origen: form.origen,
    fecha: masDias(HOY, form.dia), hora: form.hora, visita: 'Programada', etapa: 0, venta: false,
    producto: 'Por definir', monto: 0, evidenciaCurado: false, evidenciaCocinado: false, validada: false, diasEnEtapa: 0,
  })
  agendar.value = false; form.cliente = ''
  avisar(`Demo agendada en el calendario de ${v.nombre.split(' ')[0]}`)
}
</script>

<template>
  <div>
    <Encabezado :titulo="soyVendedor ? 'Mis demostraciones' : 'Demostraciones'">
      {{ soyVendedor ? 'Hoy tienes' : 'Hoy hay' }} <b class="text-tinta">{{ hoy.length }} {{ hoy.length === 1 ? 'demo' : 'demos' }} en agenda</b>.
      {{ segundaVisita.length }} {{ segundaVisita.length === 1 ? 'venta espera' : 'ventas esperan' }} su segunda visita de curado y cocinado.
      <template v-if="puedeValidar"><b class="text-llama-700">{{ porValidar.length }} tienen evidencia lista para validar.</b></template>
      <template #acciones>
        <button class="btn-llama" @click="agendar = true"><Icono nombre="mas" :size="16" />Agendar demo</button>
      </template>
    </Encabezado>

    <div class="mb-4 inline-flex rounded-lg border border-regla bg-white p-1" role="tablist">
      <button v-for="t in [['agenda', 'Agenda', hoy.length], ['ventas', 'Ventas en curso', enCurso.length], ['validar', 'Evidencia por validar', porValidar.length]]" :key="t[0]"
        role="tab" :aria-selected="vista === t[0]" class="rounded-md px-4 py-1.5 text-sm font-semibold"
        :class="vista === t[0] ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = t[0] as typeof vista">
        {{ t[1] }} <span class="opacity-70">{{ t[2] }}</span>
      </button>
    </div>

    <!-- Agenda -->
    <template v-if="vista === 'agenda'">
      <section class="panel p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="panel-titulo">Calendario de la semana</h2>
          <select v-if="!soyVendedor" v-model="trabajadorId" class="campo w-auto" aria-label="Trabajador">
            <option v-for="v in equipo" :key="v.id" :value="v.id">{{ v.nombre }} ({{ v.rango }})</option>
          </select>
        </div>
        <div class="grid gap-2 md:grid-cols-7">
          <div v-for="s in semana" :key="s.dia.getTime()" class="min-h-[150px] rounded-lg border p-2"
            :class="diasEntre(s.dia, HOY) === 0 ? 'border-llama bg-llama-50' : 'border-regla bg-papel/50'">
            <p class="mb-2 flex items-baseline justify-between px-1 text-xs">
              <span class="font-bold capitalize" :class="diasEntre(s.dia, HOY) === 0 ? 'text-llama-700' : 'text-tinta-suave'">{{ diasEntre(s.dia, HOY) === 0 ? 'Hoy' : fSemana(s.dia) }}</span>
              <span class="text-tinta-tenue">{{ fCorta(s.dia) }}</span>
            </p>
            <button v-for="d in s.demos" :key="d.id" class="mb-1.5 block w-full rounded-md border border-regla bg-white p-2 text-left hover:border-marino-300" @click="abierta = d">
              <p class="text-xs font-bold">{{ d.hora }}</p>
              <p class="truncate text-xs">{{ d.cliente }}</p>
              <p class="truncate text-[11px] text-tinta-tenue">{{ d.distrito }}</p>
              <Chip :texto="d.visita" class="mt-1" />
            </button>
            <p v-if="!s.demos.length" class="px-1 pt-2 text-xs text-tinta-tenue">Sin demos</p>
          </div>
        </div>
      </section>

      <section v-if="!soyVendedor" class="panel mt-5 overflow-x-auto">
        <h2 class="panel-titulo px-5 pb-3 pt-5">Demos de hoy en {{ alcance ? 'tu equipo' : 'toda la red' }}</h2>
        <table class="w-full min-w-[720px]">
          <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Hora</th><th class="th">Vendedor</th><th class="th">Cliente</th><th class="th">Distrito</th><th class="th">Origen</th><th class="th">Visita</th></tr></thead>
          <tbody class="divide-y divide-regla">
            <tr v-for="d in hoy" :key="d.id" class="cursor-pointer hover:bg-marino-50/70" @click="abierta = d">
              <td class="td font-bold">{{ d.hora }}</td>
              <td class="td">{{ persona(d.vendedorId).nombre }}</td>
              <td class="td">{{ d.cliente }}</td>
              <td class="td text-tinta-suave">{{ d.distrito }}</td>
              <td class="td text-tinta-suave">{{ d.origen }}</td>
              <td class="td"><Chip :texto="d.visita" /></td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <!-- Ventas en curso y evidencia por validar -->
    <section v-else class="panel divide-y divide-regla">
      <article v-for="d in (vista === 'ventas' ? enCurso : porValidar)" :key="d.id" class="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <button class="min-w-0 flex-1 basis-52 text-left" @click="abierta = d">
          <p class="truncate font-semibold hover:underline">{{ d.cliente }}</p>
          <p class="truncate text-xs text-tinta-suave">{{ d.producto }} · {{ soles(d.monto) }}</p>
        </button>
        <p v-if="!soyVendedor" class="w-40 truncate text-sm text-tinta-suave">{{ persona(d.vendedorId).nombre }}</p>
        <div class="w-56">
          <Riel :etapa="d.etapa" compacto />
          <p class="mt-1.5 text-xs"><b>{{ ETAPAS[d.etapa] }}</b>
            <span :class="d.diasEnEtapa > 7 ? 'text-mora' : 'text-tinta-tenue'"> · {{ d.diasEnEtapa }} {{ d.diasEnEtapa === 1 ? 'día' : 'días' }} en esta etapa</span></p>
        </div>
        <div class="flex w-64 justify-end">
          <button v-if="siguiente(d)" :class="d.etapa === 4 ? 'btn-llama' : 'btn-linea'" @click="siguiente(d)!.hacer()">
            <Icono :nombre="d.etapa === 4 ? 'check' : d.etapa >= 2 ? 'subir' : 'flecha'" :size="16" />{{ siguiente(d)!.texto }}
          </button>
          <span v-else-if="d.etapa === 4" class="chip bg-aviso-fondo text-aviso">Evidencia en revisión</span>
        </div>
      </article>
      <p v-if="!(vista === 'ventas' ? enCurso : porValidar).length" class="px-5 py-10 text-center text-sm text-tinta-suave">
        {{ vista === 'ventas' ? 'No hay ventas en curso.' : 'No hay evidencia pendiente de validar.' }}
      </p>
    </section>

    <!-- Ficha de la demo o venta -->
    <Cajon :abierto="!!abierta" :titulo="abierta?.cliente ?? ''" :subtitulo="abierta ? `${abierta.distrito} · ${abierta.origen}` : ''" @cerrar="abierta = null">
      <template v-if="abierta">
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-tinta-suave">Fecha y hora</dt><dd class="font-semibold">{{ fCorta(abierta.fecha) }}, {{ abierta.hora }} ({{ relativo(abierta.fecha) }})</dd></div>
          <div><dt class="text-tinta-suave">Vendedor</dt><dd class="font-semibold">{{ persona(abierta.vendedorId).nombre }}</dd></div>
          <div><dt class="text-tinta-suave">Celular</dt><dd class="font-semibold">{{ abierta.tel || 'Sin registrar' }}</dd></div>
          <div><dt class="text-tinta-suave">Estado de la visita</dt><dd><Chip :texto="abierta.visita" /></dd></div>
        </dl>

        <template v-if="!abierta.venta">
          <h3 class="mb-2 mt-7 text-sm font-bold">Resultado de la visita</h3>
          <div class="flex flex-wrap gap-2">
            <button v-for="v in (['Confirmada', 'Realizada', 'Reprogramada', 'Cliente ausente', 'Cancelada'] as Visita[])" :key="v"
              class="btn-linea" :class="abierta.visita === v ? '!border-marino !bg-marino-50' : ''" @click="marcar(abierta, v)">{{ v }}</button>
          </div>
          <button v-if="abierta.visita === 'Realizada'" class="btn-llama mt-4" @click="cerrarVenta(abierta)">Registrar cierre de venta</button>
        </template>

        <template v-else>
          <div class="mt-6 rounded-panel bg-marino-50 p-4">
            <p class="text-sm text-tinta-suave">{{ abierta.producto }}</p>
            <p class="text-2xl font-extrabold">{{ soles(abierta.monto) }}</p>
          </div>
          <h3 class="mb-3 mt-7 text-sm font-bold">Recorrido de la venta</h3>
          <Riel :etapa="abierta.etapa" />

          <h3 class="mb-3 mt-7 text-sm font-bold">Evidencia de la segunda visita</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="e in [{ k: 'curado', nombre: 'Curado', ok: abierta.evidenciaCurado, min: 2 }, { k: 'cocinado', nombre: 'Cocinado', ok: abierta.evidenciaCocinado, min: 3 }]" :key="e.k"
              class="rounded-panel border p-4" :class="e.ok ? 'border-ok/40 bg-ok-fondo/50' : 'border-dashed border-regla'">
              <p class="flex items-center gap-2 text-sm font-bold"><Icono nombre="video" :size="16" />{{ e.nombre }}</p>
              <p v-if="e.ok" class="mt-2 flex items-center gap-1.5 text-sm text-ok"><Icono nombre="check" :size="14" />Video subido por el vendedor</p>
              <template v-else>
                <p class="mt-2 text-xs text-tinta-suave">Video testimonial del cliente, grabado en la visita.</p>
                <button class="btn-linea mt-3" :disabled="abierta.etapa < e.min" :class="abierta.etapa < e.min ? 'cursor-not-allowed opacity-50' : ''" @click="subir(abierta, e.k as 'curado' | 'cocinado')">
                  <Icono nombre="subir" :size="16" />Subir video</button>
              </template>
            </div>
          </div>

          <div class="mt-6 rounded-panel p-4" :class="abierta.validada ? 'bg-ok-fondo' : 'bg-llama-50'">
            <template v-if="abierta.validada">
              <p class="flex items-center gap-2 font-bold text-ok"><Icono nombre="check" />Comisión habilitada</p>
              <p class="mt-1 text-sm text-tinta-suave">La evidencia fue validada. Contabilidad ya puede procesar el pago.</p>
            </template>
            <template v-else-if="abierta.etapa === 4">
              <p class="font-bold">Evidencia completa, pendiente de validación</p>
              <button v-if="puedeValidar" class="btn-llama mt-3" @click="validar(abierta)"><Icono nombre="check" :size="16" />Validar y habilitar comisión</button>
              <p v-else class="mt-1 text-sm text-tinta-suave">Tu líder revisará los videos para habilitar tu comisión.</p>
            </template>
            <template v-else>
              <p class="font-bold">Comisión aún no habilitada</p>
              <p class="mt-1 text-sm text-tinta-suave">Se habilita cuando el curado y el cocinado tengan su evidencia validada.</p>
              <button v-if="siguiente(abierta) && abierta.etapa < 2" class="btn-linea mt-3" @click="siguiente(abierta)!.hacer()">{{ siguiente(abierta)!.texto }}</button>
            </template>
          </div>
        </template>
      </template>
    </Cajon>

    <!-- Agendar demo -->
    <Cajon :abierto="agendar" titulo="Agendar demo" :subtitulo="`En el calendario de ${persona(trabajadorId).nombre}`" @cerrar="agendar = false">
      <div class="grid grid-cols-2 gap-4">
        <label class="col-span-2 text-sm font-semibold">Cliente<input v-model="form.cliente" class="campo mt-1 font-normal" placeholder="Nombres y apellidos" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" inputmode="tel" /></label>
        <label class="text-sm font-semibold">Distrito<input v-model="form.distrito" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Día
          <select v-model.number="form.dia" class="campo mt-1 font-normal"><option v-for="i in 6" :key="i" :value="i - 1">{{ i === 1 ? 'Hoy' : fSemana(masDias(HOY, i - 1)) + ' ' + fCorta(masDias(HOY, i - 1)) }}</option></select></label>
        <label class="text-sm font-semibold">Hora<input v-model="form.hora" type="time" class="campo mt-1 font-normal" /></label>
        <label class="col-span-2 text-sm font-semibold">Origen del prospecto
          <select v-model="form.origen" class="campo mt-1 font-normal"><option>Referido 4 en 14</option><option>Telemarketing</option><option>Prospección propia</option><option>Cliente recurrente</option></select></label>
      </div>
      <template #pie>
        <div class="flex justify-end gap-2"><button class="btn-linea" @click="agendar = false">Cancelar</button><button class="btn-primario" @click="guardar">Agendar demo</button></div>
      </template>
    </Cajon>
  </div>
</template>
