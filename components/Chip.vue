<script setup lang="ts">
// Etiqueta de estado. El color nunca va solo: siempre acompaña a la palabra.
const props = defineProps<{ texto: string; tono?: 'ok' | 'aviso' | 'mora' | 'neutro' | 'marino' | 'llama' }>()
const AUTO: Record<string, string> = {
  'Al día': 'ok', 'Cancelado': 'ok', 'Por vencer': 'aviso', 'Vence hoy': 'llama', 'En mora': 'mora',
  'Realizada': 'ok', 'Confirmada': 'marino', 'Programada': 'neutro', 'Reprogramada': 'aviso', 'Cancelada': 'mora', 'Cliente ausente': 'mora',
  'Citado': 'marino', 'Apto': 'ok', 'Activo': 'ok', 'En inducción': 'llama', 'Segunda entrevista': 'aviso', 'No apto': 'mora', 'No asistió': 'mora',
  'Por cuadrar': 'aviso', 'Cuadrada': 'ok', 'Con diferencia': 'mora',
  'Contado': 'neutro', 'Crédito Hy Cite': 'marino', 'Cuotas Millennials': 'llama',
  'Referido': 'llama',
  'Cita agendada': 'ok', 'No contesta': 'neutro', 'Volver a llamar': 'aviso', 'No interesado': 'mora', 'Número equivocado': 'mora',
}
const CLASES: Record<string, string> = {
  ok: 'bg-ok-fondo text-ok', aviso: 'bg-aviso-fondo text-aviso', mora: 'bg-mora-fondo text-mora',
  neutro: 'bg-marino-50 text-tinta-suave', marino: 'bg-marino-100 text-marino-700', llama: 'bg-llama-100 text-llama-700',
}
const tono = computed(() => props.tono ?? AUTO[props.texto] ?? 'neutro')
</script>

<template>
  <span class="chip whitespace-nowrap" :class="CLASES[tono]">{{ texto }}</span>
</template>
