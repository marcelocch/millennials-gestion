<script setup lang="ts">
// Una cifra con su nombre y, si aplica, una nota de contexto debajo.
defineProps<{ nombre: string; valor: string | number; nota?: string; tono?: 'mora' | 'ok' | 'llama' }>()
</script>

<template>
  <div class="min-w-0">
    <p class="truncate text-sm text-tinta-suave">{{ nombre }}</p>
    <p class="mt-1 text-[26px] font-bold leading-none tracking-tight"
      :class="{ 'text-mora': tono === 'mora', 'text-ok': tono === 'ok', 'text-llama-700': tono === 'llama' }">{{ valor }}</p>
    <p v-if="nota" class="mt-1.5 text-xs text-tinta-tenue">{{ nota }}</p>
  </div>
</template>
