<script setup lang="ts">
// Embudo: cada etapa mide su conteo contra la primera, así la caída se ve de un vistazo.
const props = defineProps<{ etapas: { nombre: string; valor: number }[] }>()
const base = computed(() => Math.max(props.etapas[0]?.valor ?? 1, 1))
</script>

<template>
  <ol class="space-y-3">
    <li v-for="(e, i) in etapas" :key="e.nombre">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate text-tinta-suave">{{ e.nombre }}</span>
        <span class="shrink-0"><b class="text-tinta">{{ e.valor }}</b>
          <span v-if="i > 0" class="ml-1 text-tinta-tenue">{{ Math.round((e.valor / base) * 100) }}%</span></span>
      </div>
      <div class="mt-1 h-3 rounded-[4px] bg-marino-50">
        <div class="h-full rounded-[4px] bg-marino-600" :style="{ width: Math.max((e.valor / base) * 100, 1.5) + '%' }" />
      </div>
    </li>
  </ol>
</template>
