<script setup lang="ts">
// Encabezado de página: el título y, debajo, el día dicho en una frase.
defineProps<{ titulo: string }>()
</script>

<template>
  <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div class="max-w-3xl">
      <h1 class="text-[28px] font-extrabold leading-tight tracking-tight">{{ titulo }}</h1>
      <p class="mt-1.5 text-[15px] leading-relaxed text-tinta-suave"><slot /></p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot name="acciones" /></div>
  </header>
</template>
