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

## Fases e inversión

Total: **S/ 35,000 + IGV**, en tres fases según los dolores. Cada fase se paga 50% al iniciarla y 50% contra
entrega en uso; la siguiente se inicia con la conformidad de Millennials. Alcance evolutivo, al estilo de iTalk.

| Fase | Módulos | Plazo | Inversión |
| --- | --- | --- | --- |
| 1. Control de ventas y cobranzas | Base (usuarios, red, accesos), Ventas e ingresos con cuadre Hy Cite, Cobranzas con recordatorios, Notificaciones, tablero inicial. Valor agregado: usuarios del App Millennials unificados | 6 semanas | S/ 15,000 + IGV |
| 2. Demostraciones, comisiones y telemarketing | Demos con evidencia y comisión, Telemarketing (carga simple de bases), embudo comercial y comparativo | 5 semanas | S/ 11,000 + IGV |
| 3. Reclutamiento y formación | Reclutamiento con referidos, Inducción y capacitación, ficha de carrera. Valor agregado: intranet de talleres integrada | 4 semanas | S/ 9,000 + IGV |

Evolutivos (se cotizan aparte): editor de reglas y plantillas de notificación (en fase 1 las configura Artisan),
cálculo de comisiones, duplicados y lista de no llamar en telemarketing, cuadre semiautomático si Hy Cite exporta
reportes, reportes exportables.

Referencia interna de precio: equipo de líder (S/ 3,500/mes) y junior (S/ 1,700/mes), unas 15 semanas.

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
