<script setup lang="ts">
import { TRAMOS_RECARGO, INICIAL_MINIMA, ENLACE_PAGO } from '~/data/datos'
import type { Regla } from '~/data/datos'
import { MENU, ROLES } from '~/composables/useDemo'

const { estado, avisar } = useDemo()
const cuando = (r: Regla) => r.dias === 0 ? 'El mismo día' : r.dias < 0 ? `${-r.dias} ${r.dias === -1 ? 'día' : 'días'} antes` : `${r.dias} días después`
const ejemplo = (r: Regla) => r.plantilla
  .replace('{nombre}', 'María').replace('{cuota}', '4 de 12').replace('{monto}', 'S/ 320')
  .replace('{fecha}', '28 nov').replace('{atraso}', String(Math.max(r.dias, 1))).replace('{enlace}', ENLACE_PAGO)
const abierta = ref<string | null>('r1')

const integraciones = computed(() => [
  { nombre: 'WhatsApp oficial para empresas', detalle: 'Recordatorios y avisos automáticos con plantillas aprobadas por Meta.', estado: estado.whatsappOficial ? 'Activo' : 'En aprobación', conmutable: true },
  { nombre: 'Correo con dominio de Millennials', detalle: 'Recordatorios por correo con registro de entrega.', estado: 'Activo' },
  { nombre: 'Enlace de pago de Hy Cite', detalle: 'Se adjunta a cada mensaje de cobro. El pago se confirma en Cobranzas.', estado: 'Configurado' },
  { nombre: 'App Millennials', detalle: 'Mismo usuario y mismos datos que la plataforma.', estado: 'Integrado' },
  { nombre: 'Intranet de talleres por video', detalle: 'El avance de cada persona aparece en su ficha.', estado: 'Integrado' },
  { nombre: 'CRM de Hy Cite', detalle: 'Se sigue usando para la relación con la marca. La plataforma lo complementa.', estado: 'Sin integración' },
])
const TONO: Record<string, 'ok' | 'aviso' | 'neutro'> = { Activo: 'ok', Configurado: 'ok', Integrado: 'ok', 'En aprobación': 'aviso', 'Sin integración': 'neutro' }
</script>

<template>
  <div>
    <Encabezado titulo="Configuración">
      Aquí se define qué avisos salen solos, por qué canal y con qué mensaje. Hay
      <b class="text-tinta">{{ estado.reglas.filter(r => r.activa).length }} reglas de cobranza activas</b>.
    </Encabezado>

    <div class="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section class="panel">
        <h2 class="panel-titulo px-5 pb-1 pt-5">Reglas de recordatorio de pago</h2>
        <p class="px-5 pb-4 text-sm text-tinta-suave">Se aplican a cada cuota según su fecha de vencimiento.</p>
        <ul class="divide-y divide-regla border-t border-regla">
          <li v-for="r in estado.reglas" :key="r.id" class="px-5 py-4">
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button class="min-w-0 flex-1 basis-48 text-left" @click="abierta = abierta === r.id ? null : r.id">
                <p class="font-semibold" :class="r.activa ? '' : 'text-tinta-tenue'">{{ cuando(r) }}</p>
                <p class="text-xs text-tinta-suave">{{ r.nombre }}</p>
              </button>
              <label class="flex items-center gap-1.5 text-sm"><input v-model="r.whatsapp" type="checkbox" class="h-4 w-4 accent-[#128C7E]" />WhatsApp</label>
              <label class="flex items-center gap-1.5 text-sm"><input v-model="r.correo" type="checkbox" class="h-4 w-4 accent-[#021B49]" />Correo</label>
              <button role="switch" :aria-checked="r.activa" :aria-label="`Regla ${r.nombre}`" class="relative h-6 w-11 rounded-full transition-colors" :class="r.activa ? 'bg-ok' : 'bg-regla'" @click="r.activa = !r.activa; avisar(r.activa ? 'Regla activada' : 'Regla pausada')">
                <i class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" :class="r.activa ? 'left-[22px]' : 'left-0.5'" />
              </button>
            </div>
            <div v-if="abierta === r.id" class="mt-3">
              <label class="text-xs font-semibold text-tinta-suave">Plantilla del mensaje
                <textarea v-model="r.plantilla" rows="2" class="campo mt-1 font-normal text-tinta" /></label>
              <p class="mt-2 text-xs text-tinta-suave">Así lo recibe el cliente:</p>
              <p class="mt-1 max-w-md rounded-xl rounded-tl-sm bg-[#E7F8E9] px-3 py-2 text-sm leading-relaxed text-tinta">{{ ejemplo(r) }}</p>
            </div>
          </li>
        </ul>
      </section>

      <div class="space-y-5">
        <section class="panel p-5">
          <h2 class="panel-titulo mb-3">Servicios conectados</h2>
          <ul class="divide-y divide-regla">
            <li v-for="i in integraciones" :key="i.nombre" class="py-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold">{{ i.nombre }}</p>
                <Chip :texto="i.estado" :tono="TONO[i.estado]" />
              </div>
              <p class="mt-0.5 text-xs leading-relaxed text-tinta-suave">{{ i.detalle }}</p>
              <button v-if="i.conmutable" class="mt-1.5 text-xs font-bold text-marino-600 hover:underline" @click="estado.whatsappOficial = !estado.whatsappOficial">
                {{ estado.whatsappOficial ? 'Ver cómo opera mientras Meta aprueba el servicio' : 'Ver cómo opera con el servicio aprobado' }}
              </button>
            </li>
          </ul>
        </section>

        <section class="panel p-5">
          <h2 class="panel-titulo">Parámetros de financiamiento</h2>
          <p class="mt-1 text-sm text-tinta-suave">De 2 a 31 cuotas. Inicial mínima: {{ INICIAL_MINIMA * 100 }}% del precio. Valores de ejemplo.</p>
          <table class="mt-3 w-full text-sm">
            <tbody class="divide-y divide-regla">
              <tr v-for="(t, k) in TRAMOS_RECARGO" :key="t.hasta"><td class="py-2 text-tinta-suave">De {{ k ? TRAMOS_RECARGO[k - 1].hasta + 1 : 2 }} a {{ t.hasta }} cuotas</td><td class="py-2 text-right font-semibold">{{ t.recargo ? `${Math.round(t.recargo * 100)}% por plazo` : 'Sin recargo' }}</td></tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>

    <section class="panel mt-5 overflow-x-auto">
      <h2 class="panel-titulo px-5 pb-3 pt-5">Qué ve cada perfil</h2>
      <table class="w-full min-w-[760px]">
        <thead class="border-y border-regla bg-marino-50"><tr><th class="th">Módulo</th><th v-for="r in ROLES" :key="r.id" class="th text-center">{{ r.nombre }}</th></tr></thead>
        <tbody class="divide-y divide-regla">
          <tr v-for="m in MENU" :key="m.ruta">
            <td class="td font-semibold">{{ m.nombre }}</td>
            <td v-for="r in ROLES" :key="r.id" class="td text-center">
              <Icono v-if="m.roles.includes(r.id)" nombre="check" :size="16" class="mx-auto text-ok" />
              <span v-else class="text-tinta-tenue" aria-label="Sin acceso">–</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="px-5 py-3 text-xs text-tinta-suave">Un distribuidor a cargo y su equipo ven solo la información de su distribución. La gerencia ve toda la red.</p>
    </section>
  </div>
</template>
