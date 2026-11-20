<script setup lang="ts">
import { iniciales } from '~/utils/formato'
defineProps<{ nombre: string; claro?: boolean }>()
</script>

<template>
  <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
    :class="claro ? 'bg-white/15 text-white' : 'bg-marino-100 text-marino-700'">{{ iniciales(nombre) }}</span>
</template>
