<script setup lang="ts">
// Íconos de trazo propio: un solo componente, sin dependencias.
const props = defineProps<{ nombre: string; size?: number }>()
const TRAZOS: Record<string, string> = {
  tablero: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  cobranza: 'M3 7h18v11H3zM3 11h18M7 15h4',
  venta: 'M4 4h2l2.4 10.5a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L20 8H7M10 20h.01M17 20h.01',
  cuadre: 'M9 5H5v14h14v-4M9 12l3 3 8-8',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  demo: 'M5 4h14v16H5zM9 2v4M15 2v4M5 10h14M9 14h2M13 14h2',
  personas: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M17 11a3 3 0 1 0-1-5.8M18 14.5a5.5 5.5 0 0 1 3.5 5.5',
  libro: 'M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 2h14v-4M9 8h7',
  telefono: 'M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z',
  red: 'M12 3v5M12 8H6v4M12 8h6v4M6 12v0M4 12h4v4H4zM16 12h4v4h-4zM10 3h4v0M10 17h4v4h-4zM12 8v9',
  ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  whatsapp: 'M4 20l1.4-4.2A8 8 0 1 1 8.3 18.6zM9 9.5c0 3 2.5 5.5 5.5 5.5',
  correo: 'M3 6h18v12H3zM3 7l9 6 9-6',
  enlace: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cerrar: 'M6 6l12 12M18 6L6 18',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3z',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  alerta: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  mas: 'M12 5v14M5 12h14',
  flecha: 'M9 6l6 6-6 6',
  subir: 'M12 16V5M7 10l5-5 5 5M5 19h14',
}
</script>

<template>
  <svg :width="props.size ?? 18" :height="props.size ?? 18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="TRAZOS[props.nombre] ?? ''" />
  </svg>
</template>
