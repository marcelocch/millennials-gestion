<script setup lang="ts">
// El riel de la venta: Demo → Cierre → Entrega → Curado → Cocinado → Comisión.
// Es la pieza que identifica a la plataforma; se usa igual en listas, fichas y tablero.
import { ETAPAS } from '~/data/datos'
const props = defineProps<{ etapa: number; compacto?: boolean; conteos?: number[] }>()
</script>

<template>
  <ol class="flex w-full" :class="compacto ? 'gap-1' : 'gap-1.5'" :aria-label="`Etapa actual: ${ETAPAS[props.etapa]}`">
    <li v-for="(nombre, i) in ETAPAS" :key="nombre" class="min-w-0 flex-1">
      <div class="rounded-full" :class="[compacto ? 'h-1.5' : 'h-2', i <= props.etapa ? 'riel-hecho' : 'bg-regla']"
        :style="i <= props.etapa ? { '--paso': i } : undefined" />
      <template v-if="!compacto">
        <p class="mt-2 truncate text-xs" :class="i === props.etapa ? 'font-bold text-tinta' : i < props.etapa ? 'text-tinta-suave' : 'text-tinta-tenue'">{{ nombre }}</p>
        <p v-if="conteos" class="text-lg font-bold leading-tight text-tinta">{{ conteos[i] }}</p>
      </template>
    </li>
  </ol>
</template>

<style scoped>
/* La llama del logo recorre el riel: de ámbar al inicio a naranja en la comisión. */
.riel-hecho { background: color-mix(in srgb, #FFAE00, #FF7A00 calc(var(--paso) * 20%)); }
</style>
