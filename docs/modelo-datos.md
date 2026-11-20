# Modelo de datos

Las interfaces están en `data/datos.ts`. Esta tabla las relaciona con las tablas que tendría
el sistema real.

| Entidad (demo) | Tabla prevista | Campos clave | Notas |
| --- | --- | --- | --- |
| `Distribucion` | `distribuciones` | líder, rango, oficina, distribución padre | Árbol: Premier → distribuidores a cargo |
| `Persona` | `personas` + `usuarios` | nombre, área, rango, distribución, ingreso, paso de inducción | El rango solo aplica al área de ventas |
| `Demo` | `demos` y `ventas` | vendedor, cliente, fecha, hora, origen, estado de visita, etapa, evidencias | En el sistema real conviene separar la demo de la venta |
| `Financiamiento` | `financiamientos` | cliente, venta, total, inicial, frecuencia, gestor | Uno por venta financiada por Millennials |
| `Cuota` | `cuotas` | número, vencimiento, monto, pagada, fecha de pago, comprobante | El estado se calcula, no se guarda |
| `Gestion` | `gestiones_cobranza` | fecha, tipo, texto, automática | Incluye envíos de las reglas y acciones del gestor |
| `Regla` | `reglas_notificacion` | días respecto al vencimiento, canales, plantilla, activa | |
| `Postulante` | `postulantes` y `entrevistas` | origen, fecha, hora, entrevistador, oficina, estado | |
| `Sesion` | `sesiones` y `asistencias` | tema, tipo, expositor, fecha, inscritos, asistentes | |
| `Contacto` | `contactos_tm` y `llamadas` | base, operador, intentos, resultado, hora | |
| `BaseTm` | `bases_tm` | nombre, origen, registros | Los avances se calculan desde las llamadas |

## Estados calculados

- **Estado de cobro** (`situacion()` en `useDemo.ts`): toma la primera cuota sin pagar.
  Vencida → "En mora"; vence hoy → "Vence hoy"; vence en 7 días o menos → "Por vencer"; el resto → "Al día".
- **Mi día** del gestor: clientes en mora, los que vencen hoy o mañana, y las promesas de pago para hoy.
  Orden: más días de atraso primero.
- **Etapa de la venta** (`Demo.etapa`): índice de la última etapa completada en
  `ETAPAS = [Demo, Cierre de venta, Producto entregado, Curado, Cocinado, Comisión]`.
  La etapa 4 con `validada = false` es "evidencia por validar"; al validar pasa a 5.

## Reglas de visibilidad

- Gerencia y áreas internas: toda la red.
- Distribuidor a cargo: solo registros de su `distribucionId`.
- Emprendedor: solo sus demos y ventas.
- Gestor de cobranzas: solo los financiamientos que tiene asignados.
- Operador de telemarketing: solo su cola.

En el sistema real esto se resuelve en la base de datos (políticas por fila), no en la interfaz.
