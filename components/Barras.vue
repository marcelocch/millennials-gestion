<script setup lang="ts">
// Barras verticales de una sola serie. El último período se resalta con la llama.
// Al pasar el cursor (o enfocar con teclado) se muestra el valor exacto.
const props = defineProps<{ datos: { etiqueta: string; valor: number }[]; formato?: (n: number) => string; resaltarUltimo?: boolean; alto?: number }>()
const activo = ref<number | null>(null)
const max = computed(() => Math.max(...props.datos.map(d => d.valor), 1))
const f = (n: number) => (props.formato ? props.formato(n) : n.toLocaleString('es-PE'))
</script>

<template>
  <div>
    <div class="flex items-end gap-2 border-b border-regla" :style="{ height: (alto ?? 168) + 'px' }">
      <button v-for="(d, i) in datos" :key="d.etiqueta" type="button"
        class="group relative flex h-full flex-1 cursor-default items-end justify-center"
        :aria-label="`${d.etiqueta}: ${f(d.valor)}`"
        @mouseenter="activo = i" @mouseleave="activo = null" @focus="activo = i" @blur="activo = null">
        <span v-if="activo === i || (activo === null && resaltarUltimo && i === datos.length - 1)"
          class="absolute z-10 -translate-y-1 whitespace-nowrap rounded-md bg-marino px-2 py-1 text-xs font-semibold text-white"
          :style="{ bottom: (d.valor / max) * 100 + '%' }">{{ f(d.valor) }}</span>
        <span class="w-full max-w-[44px] rounded-t-[4px] transition-opacity"
          :class="[resaltarUltimo && i === datos.length - 1 ? 'bg-llama' : 'bg-marino-600', activo !== null && activo !== i ? 'opacity-50' : '']"
          :style="{ height: Math.max((d.valor / max) * 100, 1.5) + '%' }" />
      </button>
    </div>
    <div class="mt-2 flex gap-2">
      <span v-for="d in datos" :key="d.etiqueta" class="flex-1 text-center text-xs text-tinta-suave">{{ d.etiqueta }}</span>
    </div>
  </div>
</template>
