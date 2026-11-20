# Millennials · Plataforma de gestión (demo)

Demo navegable para **Millennials Investments**, distribuidor Royal Prestige en Perú con nivel
Premier Network Leader (gerente general: Fernando Gambetta). La construye **Artisan Technology**
para acompañar una propuesta comercial. Hoy es solo interfaz con datos simulados: no hay base de
datos, API ni autenticación.

Lee `docs/` antes de cambiar algo que toque el negocio:

- `docs/contexto-negocio.md`: cómo opera Royal Prestige y Millennials, rangos, vocabulario.
- `docs/alcance-v1.md`: los nueve módulos, las tres fases con su inversión y lo que queda fuera.
- `docs/modelo-datos.md`: entidades simuladas y cómo pasarían a tablas reales.
- `docs/pendientes.md`: preguntas abiertas con el cliente y siguientes pasos de la demo.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compila para producción (Vercel lo detecta solo)
npm run vista-previa   # versión estática con rutas relativas en vista-previa/, para publicarla como página suelta
```

## Cómo está armado

- **Nuxt 3 + Vue 3 + TailwindCSS**, `ssr: false`. Todo corre en el navegador.
- `data/datos.ts` genera los datos con una semilla fija y fechas relativas a hoy. Mismos nombres
  y cifras en cada carga; la demo nunca se ve vieja. Nada de ese archivo es real salvo la gerencia.
- `composables/useDemo.ts` es el estado en memoria: perfil activo, menú por perfil, alcance
  (qué distribución ve cada quien) y las acciones (registrar pago, registrar contacto). Al recargar
  la página todo vuelve al inicio. Es el archivo que se reemplaza por llamadas al servidor.
- `utils/formato.ts`: fechas, soles, enlace de WhatsApp con mensaje listo.
- `pages/`: una página por módulo. `ventas.vue` registra ventas con montos, muestra ventas e ingresos
  del día y el cuadre manual contra Hy Cite (Hy Cite no tiene API). `layouts/default.vue`: menú lateral y selector de perfil.
- `components/`: piezas compartidas. `Riel.vue` es el recorrido de la venta
  (Demo → Cierre de venta → Producto entregado → Curado → Cocinado → Comisión) y se usa igual en
  listas, fichas y tablero. `Cajon.vue` es el panel lateral de detalle.

## Perfiles de la demo

El selector "Ver la plataforma como" cambia de perfil y lleva a su pantalla de inicio:
gerencia (ve toda la red), distribuidor a cargo (solo su equipo), gestor de cobranzas (su cartera),
emprendedor (su agenda y ventas), operador de telemarketing (su cola), administración y contabilidad
(ingresos del día y cuadre con Hy Cite).

## Entradas directas (#escena)

`plugins/escenas.client.ts` abre la demo en un perfil y una pantalla a partir de un `#nombre` en la URL
(por ejemplo `#cuadre`, `#mi-cola`, `#registrar-venta`). Funciona en Vercel y en la vista previa publicada,
donde solo viaja un `#nombre` simple (sin `/`). La página comercial usa estos nombres para sus enlaces.
Las páginas aceptan `?vista=` para abrir una pestaña, `?nueva=1` (ventas), `?nuevo=1` (reclutamiento)
y `?demo=ID` (ventas: abre el registro con los datos de esa demo).
La matriz de acceso está en `MENU` dentro de `useDemo.ts` y se muestra en Configuración.

## Reglas para trabajar aquí

- **Todo el texto de interfaz va en español de Perú**, en frases directas y sin tecnicismos.
  El cliente no es técnico. Nombres de variables y archivos también en español.
- **Marca**: azul marino `#021B49` y la llama ámbar `#FFAE00` → naranja `#FF8403`, tomados del
  logo. Tokens en `tailwind.config.ts` (`marino`, `llama`, `tinta`, `regla`, `ok`, `aviso`, `mora`).
  Tipografía Figtree. Paneles blancos con borde fino, sin sombras.
- La llama (naranja) se reserva para lo que es de hoy o pide una acción. No usarla como adorno.
- Los colores de estado siempre van con su palabra (`Chip.vue`), nunca solos.
- Cada página abre con una frase que resume el día (`Encabezado.vue`), no con una grilla de tarjetas.
- Las acciones de la demo deben cambiar el estado y confirmar con `avisar()`; evita botones que no hacen nada.
- Mutar siempre objetos que vienen de `estado.*` (son reactivos). `persona(id)` de `datos.ts`
  devuelve el objeto crudo: sirve para leer, no para modificar.
- No mencionar tecnología ni proveedores en pantallas que verá el cliente.
- Los parámetros de cuotas (`TRAMOS_RECARGO`, `INICIAL_MINIMA`) son de ejemplo y están rotulados
  así en la interfaz. No presentarlos como reales.

## Página comercial

`comercial/` tiene la presentación que acompaña la demo, con el diseño de Artisan. Sus enlaces usan las
escenas de arriba. Si cambias el nombre de una escena, actualízalo también ahí.

## Despliegue

Proyecto en Vercel (equipo `marcelo-calles-projects`), pendiente de conectar al repositorio de GitHub. El sitio lleva `noindex`.
Mientras tanto la demo está publicada como artifact (vista previa estática): https://claude.ai/artifact/GQQqDLe6AyR9HyReMeFGwg
