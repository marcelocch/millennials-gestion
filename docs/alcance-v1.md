# Alcance de la versión 1

Cubre los dolores identificados en la reunión de diagnóstico. Lo que surja en entrevistas
posteriores por área entra a una segunda fase, cotizada aparte.

| # | Módulo | Página de la demo | Qué resuelve |
| --- | --- | --- | --- |
| 1 | Ventas e ingresos | `/ventas` | Registro de venta con productos, montos, forma de pago e inicial; ventas e ingresos del día; cuadre manual contra Hy Cite |
| 2 | Cobranzas | `/cobranzas` | Cuotas centralizadas, "Mi día", recordatorios automáticos, enlace de pago, registro de pagos |
| 3 | Demostraciones y comisiones | `/demos` | Calendario por trabajador, recorrido de la venta, evidencia de curado y cocinado, validación |
| 4 | Reclutamiento y entrevistas | `/reclutamiento` | Postulantes registrados por un distribuidor o usuario, quién lo refiere, entrevistador, resultado, alta en el equipo, ranking de quién trae gente |
| 5 | Inducción y capacitación | `/capacitacion` | Sesiones, asistencia, ruta de inducción, vínculo con la intranet de talleres |
| 6 | Telemarketing | `/telemarketing` | Cola con guion y referente, rellamadas, agendamiento en el calendario del vendedor, metas, carga y asignación de bases, calidad de las citas (realizadas y vendidas) |
| 7 | Tablero gerencial | `/` | Indicadores, comparativo por distribuidor, embudos, alertas |
| 8 | Red, usuarios y accesos | `/red` | Estructura Premier → distribuidores → equipos, registro de trabajadores, ficha y carrera |
| 9 | Notificaciones | `/configuracion` | Reglas por días antes o después del vencimiento, plantillas, canales |

## Decisiones tomadas

- **WhatsApp**: API oficial de WhatsApp Business. Mientras Meta aprueba el servicio, el mensaje
  se abre redactado en el WhatsApp del gestor ("mensaje listo"). La demo muestra ambos modos;
  se alterna en Configuración → Servicios conectados.
- **Accesos**: cada distribuidor a cargo registra y ve solo a su equipo; la gerencia ve el consolidado.
- **Ventas**: se siguen registrando en el sistema de Hy Cite. La plataforma lleva un registro práctico
  para seguimiento interno, y contabilidad las contrasta a mano con Hy Cite (no hay API).
- **Referidos**: cada postulante guarda quién lo refirió y quién lo registró.
- **Comisiones**: la versión 1 valida la evidencia y marca la comisión como habilitada. No calcula montos.
- **Telemarketing**: registro de gestiones, sin telefonía integrada.
- **CRM de Hy Cite**: no se integra ni se reemplaza.
- **Pagos**: se usa el enlace de pago de Hy Cite. La plataforma lo envía y registra el pago; no lo procesa.
- **Valor agregado**: actualización, integración y migración de datos del App Millennials,
  la intranet de talleres y su panel administrativo.

## Fuera del alcance

Pasarela de pagos propia, conciliación bancaria automática, facturación electrónica,
contabilidad, cálculo de comisiones, telefonía.

## Infraestructura prevista para el sistema real

Aplicación web en Vercel, base de datos PostgreSQL y archivos en Supabase, correo con Resend,
WhatsApp Business API de Meta. Los costos mensuales están en la propuesta.
