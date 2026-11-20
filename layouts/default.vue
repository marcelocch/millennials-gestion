<script setup lang="ts">
import { ROLES } from '~/composables/useDemo'
import type { RolId } from '~/composables/useDemo'
import { HOY, fDia } from '~/utils/formato'

const { estado, rol, yo, menu, datos } = useDemo()
const ruta = useRoute()
const logo = useRuntimeConfig().app.baseURL + 'logo-blanco.png'
const activa = (r: string) => (r === '/' ? ruta.path === '/' : ruta.path.startsWith(r))

// Al cambiar de perfil, la demo lleva a la pantalla con la que esa persona empieza su día.
const cambiarRol = async (id: RolId) => {
  estado.rol = id
  await navigateTo(ROLES.find(r => r.id === id)!.inicio)
}
const cargo = computed(() => yo.value.rango ?? yo.value.area)
const equipo = computed(() => datos.distribucion(yo.value.distribucionId))
</script>

<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <!-- Navegación -->
    <aside class="bg-marino text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div class="flex items-center justify-between px-5 pb-4 pt-5">
        <img :src="logo" alt="Millennials" class="h-8 w-auto" />
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible" aria-label="Secciones">
        <NuxtLink v-for="m in menu" :key="m.ruta" :to="m.ruta"
          class="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="activa(m.ruta) ? 'bg-white text-marino' : 'text-marino-300 hover:bg-white/10 hover:text-white'">
          <Icono :nombre="m.icono" />
          <span class="whitespace-nowrap">{{ m.nombre }}</span>
        </NuxtLink>
      </nav>
      <div class="hidden border-t border-white/10 px-5 py-4 lg:block">
        <div class="flex items-center gap-3">
          <Avatar :nombre="yo.nombre" claro />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ yo.nombre }}</p>
            <p class="truncate text-xs text-marino-300">{{ cargo }}</p>
          </div>
        </div>
      </div>
    </aside>

    <div class="min-w-0">
      <!-- Barra superior: fecha y selector de perfil de la demo -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-regla bg-white px-5 py-3 lg:px-8">
        <p class="text-sm text-tinta-suave"><span class="inline-block first-letter:uppercase">{{ fDia(HOY) }}</span>
          <span v-if="rol.id !== 'gerencia'" class="text-tinta-tenue"> · Equipo de {{ equipo.lider }}</span></p>
        <label class="flex items-center gap-2 text-sm">
          <span class="text-tinta-suave">Ver la plataforma como</span>
          <select class="campo w-auto py-1.5 font-semibold" :value="estado.rol" @change="cambiarRol(($event.target as HTMLSelectElement).value as RolId)">
            <option v-for="r in ROLES" :key="r.id" :value="r.id">{{ r.nombre }}</option>
          </select>
        </label>
      </div>

      <main class="mx-auto max-w-[1240px] px-5 py-7 lg:px-8">
        <slot />
      </main>

      <footer class="px-5 pb-8 text-xs text-tinta-tenue lg:px-8">
        Demo con datos simulados. Los nombres, clientes y montos no son reales.
      </footer>
    </div>

    <!-- Confirmación de acciones -->
    <Transition name="aviso">
      <div v-if="estado.aviso" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-marino px-4 py-2.5 text-sm font-semibold text-white shadow-lg" role="status">
        <Icono nombre="check" :size="16" class="text-llama-ambar" /> {{ estado.aviso }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.aviso-enter-active, .aviso-leave-active { transition: opacity .2s ease, transform .2s ease; }
.aviso-enter-from, .aviso-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
