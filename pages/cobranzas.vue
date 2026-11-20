<script setup lang="ts">
import type { Financiamiento } from '~/data/datos'
import { ENLACE_PAGO, TRAMOS_RECARGO, INICIAL_MINIMA, calcularCuota, gestores, persona } from '~/data/datos'
import { situacion, mensajeCobro } from '~/composables/useDemo'
import type { EstadoCobro } from '~/composables/useDemo'
import { HOY, masDias, diasEntre, soles, solesCorto, fCorta, relativo, enlaceWhatsApp, pct } from '~/utils/formato'

const { estado, yo, carteraVisible, avisar, registrarPago, registrarContacto } = useDemo()
const soyGestor = computed(() => estado.rol === 'cobranzas')

const vista = ref<'dia' | 'cartera'>('dia')
const filtroEstado = ref<EstadoCobro | 'Todos'>('Todos')
const filtroGestor = ref('Todos')
const buscar = ref('')

const filas = computed(() => carteraVisible.value.map(f => ({ f, s: situacion(f) })).filter(x => x.s.cuota))

// Mi día: mora primero (la más antigua arriba), luego lo que vence hoy y mañana, y las promesas de pago.
const miDia = computed(() => filas.value
  .filter(x => x.s.estado === 'En mora' || x.s.falta <= 1 || (x.f.promesa && diasEntre(x.f.promesa, HOY) === 0))
  .sort((a, b) => b.s.atraso - a.s.atraso || b.s.cuota!.monto - a.s.cuota!.monto))
const porContactar = computed(() => miDia.value.filter(x => !x.f.contactadoHoy))
const notificadosAuto = computed(() => miDia.value.filter(x => ultimoAuto(x.f)).length)

const cartera = computed(() => filas.value
  .filter(x => filtroEstado.value === 'Todos' || x.s.estado === filtroEstado.value)
  .filter(x => filtroGestor.value === 'Todos' || x.f.gestorId === filtroGestor.value)
  .filter(x => !buscar.value || x.f.cliente.toLowerCase().includes(buscar.value.toLowerCase()))
  .sort((a, b) => b.s.atraso - a.s.atraso))

const cuenta = (e: EstadoCobro) => filas.value.filter(x => x.s.estado === e).length
const montoHoy = computed(() => filas.value.filter(x => x.s.estado === 'Vence hoy').reduce((s, x) => s + x.s.cuota!.monto, 0))
const montoMora = computed(() => filas.value.reduce((s, x) => s + x.s.vencido, 0))
const recuperado = computed(() => carteraVisible.value.flatMap(f => f.cuotas)
  .filter(c => c.pagada && c.pagadaEl && diasEntre(c.pagadaEl, HOY) <= 30).reduce((s, c) => s + c.monto, 0))

const ultimoAuto = (f: Financiamiento) => f.gestiones.find(g => g.auto)

/* ----- Ficha del cliente ----- */
const abierto = ref<Financiamiento | null>(null)
const sit = computed(() => (abierto.value ? situacion(abierto.value) : null))
const nota = ref('')

// El botón es un enlace a WhatsApp con el mensaje ya escrito; al usarlo queda registrado el contacto.
const abrirWhatsApp = (f: Financiamiento) => {
  registrarContacto(f, 'WhatsApp', 'Mensaje de cobro enviado por el gestor con el enlace de pago')
  avisar('Mensaje abierto en WhatsApp y registrado en el historial')
}
const copiarEnlace = async (f: Financiamiento) => {
  try { await navigator.clipboard.writeText(ENLACE_PAGO) } catch { /* sin permiso de portapapeles */ }
  avisar('Enlace de pago copiado')
}
const guardarNota = () => {
  if (!abierto.value || !nota.value.trim()) return
  registrarContacto(abierto.value, 'Llamada', nota.value.trim())
  nota.value = ''
  avisar('Gestión registrada')
}

/* ----- Nuevo financiamiento ----- */
const nuevo = ref(false)
const form = reactive({ cliente: '', tel: '', producto: 'Juego de ollas 7 piezas', total: 4100, inicial: 500, n: 12, frecuencia: 'Mensual' as Financiamiento['frecuencia'] })
const calculo = computed(() => calcularCuota(form.total, form.inicial, form.n))
const PERIODO = { Semanal: 7, Quincenal: 15, Mensual: 30 }
const cronograma = computed(() => Array.from({ length: form.n }, (_, i) => ({ n: i + 1, vence: masDias(HOY, PERIODO[form.frecuencia] * (i + 1)), monto: calculo.value.cuota })))
const inicialMinima = computed(() => Math.round(form.total * INICIAL_MINIMA))
const guardarFinanciamiento = () => {
  if (!form.cliente.trim()) return avisar('Escribe el nombre del cliente')
  estado.financiamientos.unshift({
    id: 'f' + (estado.financiamientos.length + 1), cliente: form.cliente.trim(), tel: form.tel || '999000000', email: '', distrito: 'Lima',
    vendedorId: 'p2', distribucionId: 'd0', gestorId: soyGestor.value ? yo.value.id : gestores[0].id,
    producto: form.producto, total: form.total, inicial: form.inicial, frecuencia: form.frecuencia,
    cuotas: cronograma.value.map(c => ({ ...c, pagada: false })), contactadoHoy: false,
    gestiones: [{ fecha: new Date(), tipo: 'Nota', texto: `Financiamiento registrado: inicial ${soles(form.inicial)} y ${form.n} cuotas de ${soles(calculo.value.cuota)}`, auto: false }],
  })
  nuevo.value = false
  vista.value = 'cartera'; filtroEstado.value = 'Todos'; buscar.value = form.cliente.trim()
  avisar('Financiamiento registrado con su cronograma')
}

const ICONO = { WhatsApp: 'whatsapp', Correo: 'correo', Llamada: 'telefono', Nota: 'check', Pago: 'cobranza' }
</script>

<template>
  <div>
    <Encabezado titulo="Cobranzas">
      <template v-if="porContactar.length">
        {{ soyGestor ? 'Hoy tienes' : 'Hoy hay' }} <b class="text-tinta">{{ porContactar.length }} clientes por contactar</b>:
        {{ cuenta('En mora') }} en mora y {{ cuenta('Vence hoy') }} que vencen hoy.
        {{ notificadosAuto }} ya recibieron un aviso automático.
      </template>
      <template v-else>Lista del día completa. No quedan clientes por contactar.</template>
      <template #acciones>
        <button class="btn-llama" @click="nuevo = true"><Icono nombre="mas" :size="16" />Nuevo financiamiento</button>
      </template>
    </Encabezado>

    <section class="panel grid grid-cols-2 gap-6 p-6 md:grid-cols-4 md:divide-x md:divide-regla">
      <Cifra nombre="Vence hoy" :valor="soles(montoHoy)" tono="llama" :nota="`${cuenta('Vence hoy')} cuotas`" />
      <Cifra class="md:pl-6" nombre="Monto en mora" :valor="soles(montoMora)" tono="mora" :nota="`${cuenta('En mora')} clientes, ${pct(cuenta('En mora'), filas.length)} de la cartera`" />
      <Cifra class="md:pl-6" nombre="Por vencer en 7 días" :valor="cuenta('Por vencer')" nota="con recordatorio programado" />
      <Cifra class="md:pl-6" nombre="Recuperado en 30 días" :valor="solesCorto(recuperado)" tono="ok" nota="pagos registrados" />
    </section>

    <div v-if="!estado.whatsappOficial" class="mt-4 flex items-start gap-3 rounded-panel border border-llama/40 bg-llama-50 px-4 py-3 text-sm">
      <Icono nombre="alerta" class="mt-0.5 shrink-0 text-llama-700" />
      <p><b>WhatsApp oficial en aprobación.</b> Los recordatorios automáticos salen por correo. Por WhatsApp, cada mensaje se abre ya redactado para enviarlo con un clic.</p>
    </div>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-lg border border-regla bg-white p-1" role="tablist">
        <button role="tab" :aria-selected="vista === 'dia'" class="rounded-md px-4 py-1.5 text-sm font-semibold" :class="vista === 'dia' ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = 'dia'">Mi día <span class="opacity-70">{{ porContactar.length }}</span></button>
        <button role="tab" :aria-selected="vista === 'cartera'" class="rounded-md px-4 py-1.5 text-sm font-semibold" :class="vista === 'cartera' ? 'bg-marino text-white' : 'text-tinta-suave'" @click="vista = 'cartera'">Cartera completa <span class="opacity-70">{{ filas.length }}</span></button>
      </div>
      <div v-if="vista === 'cartera'" class="flex flex-wrap gap-2">
        <input v-model="buscar" class="campo w-48" placeholder="Buscar cliente" aria-label="Buscar cliente" />
        <select v-model="filtroEstado" class="campo w-auto" aria-label="Estado">
          <option>Todos</option><option>En mora</option><option>Vence hoy</option><option>Por vencer</option><option>Al día</option>
        </select>
        <select v-if="!soyGestor" v-model="filtroGestor" class="campo w-auto" aria-label="Gestor">
          <option value="Todos">Todos los gestores</option>
          <option v-for="g in gestores" :key="g.id" :value="g.id">{{ g.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- Mi día -->
    <section v-if="vista === 'dia'" class="panel mt-3 divide-y divide-regla">
      <article v-for="x in miDia" :key="x.f.id" class="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4" :class="x.f.contactadoHoy ? 'bg-marino-50/60' : ''">
        <button class="min-w-0 flex-1 basis-56 text-left" @click="abierto = x.f">
          <p class="truncate font-semibold hover:underline">{{ x.f.cliente }}</p>
          <p class="truncate text-xs text-tinta-suave">Cuota {{ x.s.cuota!.n }} de {{ x.f.cuotas.length }} · {{ x.f.producto }}</p>
        </button>
        <div class="w-32 text-right">
          <p class="font-bold">{{ soles(x.s.cuota!.monto) }}</p>
          <p v-if="x.s.vencido > x.s.cuota!.monto" class="text-xs text-mora">{{ soles(x.s.vencido) }} vencido</p>
        </div>
        <div class="w-36">
          <Chip :texto="x.s.estado" />
          <p class="mt-1 text-xs text-tinta-suave">{{ x.s.atraso > 0 ? `${x.s.atraso} días de atraso` : x.s.atraso === 0 ? 'vence hoy' : 'vence ' + relativo(x.s.cuota!.vence) }}</p>
        </div>
        <div class="w-44 text-xs text-tinta-suave">
          <p v-if="ultimoAuto(x.f)" class="flex items-center gap-1.5 text-ok"><Icono nombre="check" :size="14" class="shrink-0" />Aviso automático {{ relativo(ultimoAuto(x.f)!.fecha) }}</p>
          <p v-else class="text-tinta-tenue">Aún sin aviso automático</p>
          <p v-if="x.f.promesa" class="mt-0.5 text-aviso">Prometió pagar {{ relativo(x.f.promesa) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="x.f.contactadoHoy" class="chip bg-ok-fondo text-ok"><Icono nombre="check" :size="13" />Contactado</span>
          <a class="btn-wa px-3" :href="enlaceWhatsApp(x.f.tel, mensajeCobro(x.f))" target="_blank" rel="noopener" @click="abrirWhatsApp(x.f)"><Icono nombre="whatsapp" :size="16" />Enviar</a>
          <button class="btn-linea px-2.5" title="Copiar enlace de pago" aria-label="Copiar enlace de pago" @click="copiarEnlace(x.f)"><Icono nombre="enlace" :size="16" /></button>
          <button class="btn-linea" @click="registrarPago(x.f, x.s.cuota!)">Registrar pago</button>
        </div>
      </article>
      <p v-if="!miDia.length" class="px-5 py-10 text-center text-sm text-tinta-suave">No hay clientes por contactar hoy.</p>
    </section>

    <!-- Cartera -->
    <section v-else class="panel mt-3 overflow-x-auto">
      <table class="w-full min-w-[860px]">
        <thead class="border-b border-regla bg-marino-50"><tr>
          <th class="th">Cliente</th><th class="th">Próxima cuota</th><th class="th">Vence</th><th class="th">Estado</th><th class="th">Saldo</th><th class="th">Gestor</th><th class="th">Vendedor</th>
        </tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="x in cartera" :key="x.f.id" class="cursor-pointer hover:bg-marino-50/70" @click="abierto = x.f">
            <td class="td"><p class="font-semibold">{{ x.f.cliente }}</p><p class="text-xs text-tinta-suave">{{ x.f.distrito }}</p></td>
            <td class="td"><b>{{ soles(x.s.cuota!.monto) }}</b> <span class="text-tinta-tenue">· {{ x.s.cuota!.n }}/{{ x.f.cuotas.length }}</span></td>
            <td class="td">{{ fCorta(x.s.cuota!.vence) }}</td>
            <td class="td"><Chip :texto="x.s.estado" /><span v-if="x.s.atraso > 0" class="ml-2 text-xs text-mora">{{ x.s.atraso }} d</span></td>
            <td class="td">{{ soles(x.s.saldo) }}</td>
            <td class="td text-tinta-suave">{{ persona(x.f.gestorId).nombre.split(' ').slice(0, 2).join(' ') }}</td>
            <td class="td text-tinta-suave">{{ persona(x.f.vendedorId).nombre.split(' ').slice(0, 2).join(' ') }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!cartera.length" class="px-5 py-10 text-center text-sm text-tinta-suave">Ningún cliente coincide con el filtro.</p>
    </section>

    <!-- Ficha del cliente -->
    <Cajon :abierto="!!abierto" :titulo="abierto?.cliente ?? ''" :subtitulo="abierto ? `${abierto.producto} · ${abierto.distrito}` : ''" @cerrar="abierto = null">
      <template v-if="abierto && sit">
        <div class="grid grid-cols-3 gap-4 rounded-panel bg-marino-50 p-4">
          <Cifra nombre="Saldo pendiente" :valor="soles(sit.saldo)" />
          <Cifra nombre="Vencido" :valor="soles(sit.vencido)" :tono="sit.vencido ? 'mora' : undefined" />
          <Cifra nombre="Plan" :valor="`${abierto.cuotas.length} cuotas`" :nota="`${abierto.frecuencia}, inicial ${soles(abierto.inicial)}`" />
        </div>

        <h3 class="mb-2 mt-6 text-sm font-bold">Mensaje listo para enviar</h3>
        <p v-if="sit.cuota" class="rounded-panel border border-regla bg-white p-3 text-sm leading-relaxed text-tinta-suave">{{ mensajeCobro(abierto) }}</p>
        <p v-else class="text-sm text-ok">Financiamiento cancelado. No hay cuotas pendientes.</p>
        <div v-if="sit.cuota" class="mt-3 flex flex-wrap gap-2">
          <a class="btn-wa" :href="enlaceWhatsApp(abierto.tel, mensajeCobro(abierto))" target="_blank" rel="noopener" @click="abrirWhatsApp(abierto)"><Icono nombre="whatsapp" :size="16" />Enviar por WhatsApp</a>
          <button class="btn-linea" @click="registrarContacto(abierto, 'Correo', 'Recordatorio enviado por correo con el enlace de pago'); avisar('Correo enviado')"><Icono nombre="correo" :size="16" />Enviar correo</button>
          <button class="btn-linea" @click="copiarEnlace(abierto)"><Icono nombre="enlace" :size="16" />Copiar enlace de pago</button>
        </div>

        <h3 class="mb-2 mt-7 text-sm font-bold">Cronograma de cuotas</h3>
        <ul class="max-h-64 divide-y divide-regla overflow-y-auto rounded-panel border border-regla">
          <li v-for="c in abierto.cuotas" :key="c.n" class="flex items-center gap-3 px-3 py-2 text-sm">
            <span class="w-7 text-tinta-tenue">{{ c.n }}</span>
            <span class="w-20">{{ fCorta(c.vence) }}</span>
            <span class="w-20 font-semibold">{{ soles(c.monto) }}</span>
            <span class="flex-1">
              <Chip v-if="c.pagada" texto="Pagada" tono="ok" />
              <Chip v-else-if="diasEntre(c.vence, HOY) > 0" texto="Vencida" tono="mora" />
              <Chip v-else-if="diasEntre(c.vence, HOY) === 0" texto="Vence hoy" />
              <span v-else class="text-xs text-tinta-tenue">Pendiente</span>
            </span>
            <button v-if="!c.pagada && c === sit.cuota" class="text-xs font-bold text-marino-600 hover:underline" @click="registrarPago(abierto, c)">Registrar pago</button>
          </li>
        </ul>

        <h3 class="mb-2 mt-7 text-sm font-bold">Historial de gestiones</h3>
        <div class="flex gap-2">
          <input v-model="nota" class="campo" placeholder="Registrar llamada o acuerdo con el cliente" @keydown.enter="guardarNota" />
          <button class="btn-primario shrink-0" @click="guardarNota">Guardar</button>
        </div>
        <ul class="mt-3 space-y-3">
          <li v-for="(g, i) in abierto.gestiones" :key="i" class="flex gap-3 text-sm">
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" :class="g.tipo === 'Pago' ? 'bg-ok-fondo text-ok' : 'bg-marino-50 text-marino-600'"><Icono :nombre="ICONO[g.tipo]" :size="14" /></span>
            <div><p class="leading-snug">{{ g.texto }}</p><p class="text-xs text-tinta-tenue">{{ g.tipo }} · {{ relativo(g.fecha) }}{{ g.auto ? ' · automático' : '' }}</p></div>
          </li>
        </ul>
      </template>
    </Cajon>

    <!-- Nuevo financiamiento -->
    <Cajon :abierto="nuevo" titulo="Nuevo financiamiento" subtitulo="La cuota se calcula con los parámetros configurados" @cerrar="nuevo = false">
      <div class="grid grid-cols-2 gap-4">
        <label class="col-span-2 text-sm font-semibold">Cliente<input v-model="form.cliente" class="campo mt-1 font-normal" placeholder="Nombres y apellidos" /></label>
        <label class="text-sm font-semibold">Celular<input v-model="form.tel" class="campo mt-1 font-normal" placeholder="9XX XXX XXX" inputmode="tel" /></label>
        <label class="text-sm font-semibold">Producto<input v-model="form.producto" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Precio de venta (S/)<input v-model.number="form.total" type="number" min="0" step="50" class="campo mt-1 font-normal" /></label>
        <label class="text-sm font-semibold">Pago inicial (S/)<input v-model.number="form.inicial" type="number" min="0" step="50" class="campo mt-1 font-normal" />
          <span v-if="form.inicial < inicialMinima" class="mt-1 block text-xs font-normal text-mora">La inicial mínima es {{ soles(inicialMinima) }}</span></label>
        <label class="col-span-2 text-sm font-semibold">Número de cuotas: {{ form.n }}
          <input v-model.number="form.n" type="range" min="2" max="31" class="mt-2 w-full accent-[#FF8403]" />
          <span class="flex justify-between text-xs font-normal text-tinta-tenue"><span>2</span><span>31</span></span></label>
        <label class="col-span-2 text-sm font-semibold">Frecuencia
          <select v-model="form.frecuencia" class="campo mt-1 font-normal"><option>Semanal</option><option>Quincenal</option><option>Mensual</option></select></label>
      </div>

      <div class="mt-6 rounded-panel bg-marino p-5 text-white">
        <p class="text-sm text-marino-300">Cuota {{ form.frecuencia.toLowerCase() }}</p>
        <p class="text-4xl font-extrabold tracking-tight">{{ soles(calculo.cuota) }}</p>
        <p class="mt-2 text-sm text-marino-300">{{ form.n }} cuotas. Monto financiado {{ soles(calculo.financiado) }}{{ calculo.recargo ? `, incluye ${Math.round(calculo.recargo * 100)}% por plazo` : ', sin recargo por plazo' }}.</p>
      </div>
      <p class="mt-3 text-xs text-tinta-tenue">Tramos de ejemplo: {{ TRAMOS_RECARGO.map(t => `hasta ${t.hasta} cuotas ${Math.round(t.recargo * 100)}%`).join(', ') }}. En el sistema real se cargan los parámetros de Millennials.</p>

      <h3 class="mb-2 mt-6 text-sm font-bold">Cronograma</h3>
      <ul class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <li v-for="c in cronograma" :key="c.n" class="flex justify-between border-b border-regla py-1"><span class="text-tinta-suave">{{ c.n }}. {{ fCorta(c.vence) }}</span><b>{{ soles(c.monto) }}</b></li>
      </ul>
      <template #pie>
        <div class="flex justify-end gap-2">
          <button class="btn-linea" @click="nuevo = false">Cancelar</button>
          <button class="btn-primario" @click="guardarFinanciamiento">Registrar financiamiento</button>
        </div>
      </template>
    </Cajon>
  </div>
</template>
