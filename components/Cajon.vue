<script setup lang="ts">
// Panel lateral para ver el detalle sin salir de la lista.
defineProps<{ abierto: boolean; titulo: string; subtitulo?: string }>()
const emit = defineEmits<{ cerrar: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="cajon">
      <div v-if="abierto" class="fixed inset-0 z-40 flex justify-end" @keydown.esc="emit('cerrar')">
        <button class="absolute inset-0 bg-marino-900/40" aria-label="Cerrar" @click="emit('cerrar')" />
        <aside class="panel-cajon relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" role="dialog" :aria-label="titulo">
          <header class="flex items-start justify-between gap-4 border-b border-regla px-6 py-5">
            <div>
              <h2 class="text-lg font-bold leading-tight">{{ titulo }}</h2>
              <p v-if="subtitulo" class="mt-0.5 text-sm text-tinta-suave">{{ subtitulo }}</p>
            </div>
            <button class="rounded-lg p-1.5 text-tinta-suave hover:bg-marino-50" aria-label="Cerrar" @click="emit('cerrar')">
              <Icono nombre="cerrar" />
            </button>
          </header>
          <div class="flex-1 overflow-y-auto px-6 py-5"><slot /></div>
          <footer v-if="$slots.pie" class="border-t border-regla bg-marino-50 px-6 py-4"><slot name="pie" /></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cajon-enter-active, .cajon-leave-active { transition: opacity .18s ease; }
.cajon-enter-active .panel-cajon, .cajon-leave-active .panel-cajon { transition: transform .22s ease; }
.cajon-enter-from, .cajon-leave-to { opacity: 0; }
.cajon-enter-from .panel-cajon, .cajon-leave-to .panel-cajon { transform: translateX(24px); }
</style>
