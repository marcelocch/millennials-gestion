"""Genera la propuesta comercial en PDF con el formato de las propuestas de Artisan.

Uso:  python3 propuesta/generar.py
Salida: propuesta/Propuesta-Millennials-Artisan.pdf (y el HTML intermedio junto a él).
Necesita Playwright y Chrome; usa las fuentes Carlito y Liberation Sans del sistema.
"""
import base64, datetime as dt, pathlib, asyncio

AQUI = pathlib.Path(__file__).parent
LOGO = 'data:image/png;base64,' + base64.b64encode((AQUI / 'artisan-logo.png').read_bytes()).decode()

# ---------- Cronograma ----------
INICIO, FIN = dt.date(2026, 12, 7), dt.date(2027, 4, 2)
TOTAL = (FIN - INICIO).days + 1
MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
f = lambda d: dt.date.fromisoformat(d)
corto = lambda d: f'{d.day} {MESES[d.month - 1]}'
pos = lambda d: (d - INICIO).days / TOTAL * 100

FILAS = [  # etiqueta, desde, hasta, tipo
    ('Levantamiento y accesos', '2026-12-07', '2026-12-11', 'f1'),
    ('Base: usuarios, red y accesos', '2026-12-09', '2026-12-18', 'f1'),
    ('Ventas e ingresos y cuadre', '2026-12-14', '2027-01-08', 'f1'),
    ('Cobranzas y recordatorios', '2026-12-21', '2027-01-15', 'f1'),
    ('Migración de cartera y usuarios', '2027-01-11', '2027-01-15', 'f1'),
    ('Pruebas con el equipo', '2027-01-18', '2027-01-22', 'f1'),
    ('Fase 1 en uso', '2027-01-22', None, 'hito'),
    ('Fase 2: demos y telemarketing', '2027-01-25', '2027-02-26', 'f2'),
    ('Fase 3: reclutamiento y formación', '2027-03-01', '2027-04-02', 'f2'),
    ('Plataforma completa', '2027-04-02', None, 'final'),
]

def gantt():
    ticks = ''.join(
        f'<span class="tk" style="left:{pos(INICIO + dt.timedelta(days=d)):.2f}%">{corto(INICIO + dt.timedelta(days=d))}</span>'
        for d in range(0, TOTAL, 14))
    lineas = ''.join(f'<i style="left:{pos(INICIO + dt.timedelta(days=d)):.2f}%"></i>' for d in range(0, TOTAL, 14))
    filas = ''
    for etq, a, b, tipo in FILAS:
        da = f(a)
        if b:
            db = f(b)
            izq, ancho = pos(da), (db - da).days / TOTAL * 100 + 100 / TOTAL
            txt = f'{corto(da)} a {corto(db)}'
            marca = f'<span class="bar {tipo}" style="left:{izq:.2f}%;width:{ancho:.2f}%"></span>'
            fin = izq + ancho
            nota = (f'<span class="lbl" style="left:{fin + 0.8:.2f}%">{txt}</span>' if fin < 80
                    else f'<span class="lbl izq" style="right:{100 - izq + 0.8:.2f}%">{txt}</span>')
        else:
            izq = pos(da) + 100 / TOTAL / 2
            marca = f'<span class="dia {tipo}" style="left:{izq:.2f}%"></span>'
            nota = f'<span class="lbl izq" style="right:{100 - izq + 1.4:.2f}%">{corto(da)}</span>'
        cls = ' class="fuerte"' if tipo in ('hito', 'final') else ''
        filas += f'<div class="gr"><span{cls}>{etq}</span><div class="pista">{marca}{nota}</div></div>'
    return f'<div class="gantt"><div class="gr cab"><span></span><div class="pista">{ticks}</div></div><div class="cuerpo"><div class="lineas">{lineas}</div>{filas}</div></div>'

# ---------- Documento ----------
CSS = """
@page { size: Letter; margin: 92px 0 74px 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Carlito, Lato, Calibri, sans-serif; font-size: 10.4pt; line-height: 1.55; color: #1D2733; }
.pg { padding: 0 64px; }
h1 { font-size: 22pt; line-height: 1.15; color: #0F2A44; margin: 6px 0 8px; }
h2 { font-size: 14pt; color: #0F2A44; margin: 26px 0 10px; break-after: avoid; }
h3 { font-size: 11pt; color: #0F2A44; margin: 16px 0 6px; break-after: avoid; }
p { margin: 0 0 9px; }
ul { margin: 4px 0 10px; padding-left: 18px; } li { margin: 0 0 3px; }
.eyebrow { font-family: 'Liberation Sans', Arial, sans-serif; color: #F08A1C; font-weight: 700; letter-spacing: .06em; font-size: 9.5pt; margin-top: 4px; }
.sub { color: #5D6B78; font-size: 12pt; margin-bottom: 16px; }
.ficha { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #C9D1D9; border-radius: 6px; }
.ficha div { padding: 10px 12px; border-left: 1px solid #C9D1D9; } .ficha div:first-child { border-left: 0; }
.ficha small, .card small { display: block; font-size: 8pt; letter-spacing: .04em; color: #5D6B78; text-transform: uppercase; }
.ficha b { font-size: 10.5pt; color: #0F2A44; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0 6px; break-inside: avoid; }
.card { background: #F2F5F8; border-radius: 5px; border-top: 4px solid #0F2A44; padding: 12px 14px 14px; }
.card.n { border-top-color: #F08A1C; }
.card small { text-transform: none; letter-spacing: 0; font-size: 9pt; margin-bottom: 4px; }
.card b { font-size: 15pt; color: #0F2A44; } .card em { font-style: normal; font-size: 8.5pt; color: #5D6B78; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9.6pt; }
th { background: #0F2A44; color: #fff; text-align: left; font-weight: 700; padding: 7px 8px; }
td { border-bottom: 1px solid #C9D1D9; padding: 7px 8px; vertical-align: top; }
tr { break-inside: avoid; }
td:first-child, th:first-child { border-left: 1px solid #C9D1D9; } td:last-child, th:last-child { border-right: 1px solid #C9D1D9; }
td.n, th.n { text-align: right; white-space: nowrap; }
tr.tot td { background: #F2F5F8; font-weight: 700; }
.chip { display: inline-block; padding: 0 8px; border-radius: 10px; font-size: 8.4pt; background: #E3EDF5; color: #0F2A44; white-space: nowrap; }
.chip.o { background: #FDEAD2; color: #B4610C; }
.nota { border-left: 4px solid #0F2A44; background: #F2F5F8; padding: 10px 14px; font-size: 9.6pt; margin: 8px 0 12px; break-inside: avoid; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 26px; }
.dos > div { break-inside: avoid; }
.dos ul { font-size: 9.6pt; }
.mod { border: 1px solid #C9D1D9; border-radius: 6px; padding: 12px 16px 6px; margin: 0 0 12px; }
.mod li { break-inside: avoid; } .mod .t { break-after: avoid; }
.mod .t { display: flex; justify-content: space-between; gap: 12px; font-weight: 700; color: #0F2A44; font-size: 11pt; margin-bottom: 4px; }
.mod .t span:last-child { color: #F08A1C; white-space: nowrap; }
.mod ul { font-size: 9.6pt; } .mute { color: #5D6B78; font-size: 9.2pt; }
.gantt { border: 1px solid #C9D1D9; border-radius: 6px; padding: 10px 12px 12px; font-size: 8.4pt; margin: 6px 0 6px; break-inside: avoid; }
.gr { display: grid; grid-template-columns: 170px 1fr; align-items: center; height: 19px; }
.gr > span { color: #1D2733; white-space: nowrap; } .gr > span.fuerte { font-weight: 700; }
.pista { position: relative; height: 100%; }
.cab { height: 22px; } .tk { position: absolute; transform: translateX(-2px); color: #5D6B78; top: 2px; white-space: nowrap; }
.cuerpo { position: relative; } .lineas { position: absolute; left: 170px; right: 0; top: 0; bottom: 0; }
.lineas i { position: absolute; top: 0; bottom: 0; border-left: 1px dashed #DCE1E6; }
.bar { position: absolute; top: 5px; height: 9px; border-radius: 5px; background: #CFE3F1; border: 1px solid #8DB8D6; }
.bar.f2 { background: #FDE3C2; border-color: #F2B56B; }
.dia { position: absolute; top: 4px; width: 10px; height: 10px; transform: translateX(-5px) rotate(45deg); background: #1F8FB8; }
.dia.final { background: #F08A1C; }
.lbl { position: absolute; top: 2px; color: #5D6B78; white-space: nowrap; } .lbl.izq { left: auto; }
.check { list-style: none; padding: 0; } .check li { padding-left: 22px; position: relative; margin-bottom: 5px; }
.check li::before { content: ""; position: absolute; left: 0; top: 3px; width: 11px; height: 11px; border: 1.2px solid #1D2733; border-radius: 2px; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 46px; break-inside: avoid; }
.firmas div { border-top: 1px solid #1D2733; padding-top: 6px; font-weight: 700; font-size: 9.6pt; }
.firmas small { display: block; font-weight: 400; color: #5D6B78; font-size: 8.4pt; }
.salto { break-before: page; }
.junto { break-inside: avoid; }
"""

def li(*xs): return '<ul>' + ''.join(f'<li>{x}</li>' for x in xs) + '</ul>'

HTML = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Propuesta comercial · Millennials Investments</title><style>{CSS}</style></head><body><div class="pg">

<p class="eyebrow">PROPUESTA COMERCIAL</p>
<h1>Millennials: plataforma de gestión para la red de distribución</h1>
<p class="sub">Ventas, cobranzas, demostraciones, telemarketing, reclutamiento y capacitación en un solo sistema, en tres fases</p>
<div class="ficha">
  <div><small>Cliente</small><b>Millennials Investments SAC</b></div>
  <div><small>Fecha</small><b>23 de noviembre de 2026</b></div>
  <div><small>Validez de la oferta</small><b>15 días calendario</b></div>
  <div><small>Fase 1 en uso</small><b>22 de enero de 2027</b></div>
</div>

<h2>1. Resumen</h2>
<p>Millennials lidera una red de distribuidores Royal Prestige que comparten oficinas, cada uno con su propio equipo. El sistema de Hy Cite cubre la relación con la marca, pero los procesos internos viven en Drive, Calendar, hojas de cálculo y WhatsApp. Cobranzas dedica de 3 a 4 horas al día a revisar y notificar cuotas, la evidencia para pagar comisiones viaja por chat, y las entrevistas y las llamadas no dejan registro.</p>
<p>Proponemos una sola plataforma de gestión donde cada persona ve su día y la gerencia ve toda la red. Se construye en tres fases, una por cada grupo de dolores, empezando por ventas y cobranzas, que es donde más se nota en la caja. Cada fase se entrega en uso y se verifica antes de pasar a la siguiente. Incluye, sin costo, la integración del App Millennials y de la intranet de talleres que ya construimos con ustedes.</p>
<div class="cards">
  <div class="card"><small>Inversión total (tres fases)</small><b>S/ 35,000</b> <em>+ IGV</em></div>
  <div class="card"><small>Fase 1: control de ventas y cobranzas</small><b>S/ 15,000</b> <em>+ IGV</em></div>
  <div class="card n"><small>Inicio / fase 1 en uso</small><b>7 dic / 22 ene</b></div>
</div>

<h2>2. Dolores y enfoque por área</h2>
<table>
<tr><th style="width:24px">#</th><th style="width:17%">Área</th><th style="width:30%">Cómo se trabaja hoy</th><th>Qué hace la plataforma</th><th style="width:58px">Fase</th></tr>
<tr><td>1</td><td>Ventas</td><td>Las ventas se ingresan en el sistema de Hy Cite, sin una vista propia del día.</td><td>Registro de cada venta con productos, montos, forma de pago e inicial. Ventas e ingresos del día y cuadre manual contra Hy Cite, venta por venta.</td><td><span class="chip">Fase 1</span></td></tr>
<tr><td>2</td><td>Cobranzas</td><td>Las cuotas se siguen en un Drive. Notificar a mano toma de 3 a 4 horas al día.</td><td>Cartera centralizada, lista diaria de a quién contactar, recordatorios automáticos por WhatsApp y correo con el enlace de pago, y registro de pagos.</td><td><span class="chip">Fase 1</span></td></tr>
<tr><td>3</td><td>Gerencia</td><td>La información está repartida en varias herramientas.</td><td>Tablero con lo vendido e ingresado hoy, cartera, mora y desempeño de cada distribuidor. Crece en cada fase.</td><td><span class="chip">Fase 1</span></td></tr>
<tr><td>4</td><td>Demostraciones</td><td>No hay control de las demos. La evidencia de curado y cocinado se envía como video por WhatsApp.</td><td>Calendario por trabajador y recorrido de la venta en seis etapas, de la demo a la comisión. El vendedor sube la evidencia y su líder la valida.</td><td><span class="chip">Fase 2</span></td></tr>
<tr><td>5</td><td>Telemarketing</td><td>Se llama sobre bases curadas, sin registro ni monitoreo.</td><td>Cola con guion y referente, rellamadas, agenda directa en el calendario del vendedor, metas por operador y resultado de cada cita.</td><td><span class="chip">Fase 2</span></td></tr>
<tr><td>6</td><td>Entrevistas</td><td>No queda registro de horarios, entrevistadores ni de quién refirió al postulante.</td><td>Postulantes con quién los refiere y quién los registró, agenda de entrevistas, resultado y alta en el equipo.</td><td><span class="chip">Fase 3</span></td></tr>
<tr><td>7</td><td>Inducción y capacitación</td><td>Las sesiones no se registran ni se miden.</td><td>Sesiones, asistencia, ruta de inducción de seis pasos y avance en la intranet de talleres.</td><td><span class="chip">Fase 3</span></td></tr>
</table>
<div class="nota"><b>Sobre Hy Cite:</b> la plataforma no reemplaza al sistema de Hy Cite; cubre los procesos internos que ese sistema no contempla. Como Hy Cite no ofrece conexión con otros sistemas, el cuadre de ventas es manual pero ordenado: número de orden, monto, inicial y productos, venta por venta.</div>

<h2>3. Quiénes la usan</h2>
<p>Los perfiles siguen los rangos de Royal Prestige y suman las áreas internas de Millennials. Cada distribuidor a cargo administra a su equipo y solo ve a su gente; la gerencia ve toda la red.</p>
<table>
<tr><th style="width:34%">Perfil</th><th>Qué hace en la plataforma</th></tr>
<tr><td>Gerencia general</td><td>Ve el tablero consolidado y el desempeño de cada distribuidor.</td></tr>
<tr><td>Distribuidores de la red</td><td>Registran a su equipo y siguen sus demos, ventas y reclutamiento.</td></tr>
<tr><td>Emprendedores</td><td>Registran sus ventas, gestionan su calendario de demos y suben la evidencia de la segunda visita.</td></tr>
<tr><td>Cobranzas</td><td>Trabajan su lista diaria, notifican y registran pagos.</td></tr>
<tr><td>Contabilidad</td><td>Ve los ingresos del día y cuadra cada venta contra Hy Cite.</td></tr>
<tr><td>Telemarketing</td><td>Llaman sobre las bases asignadas y agendan demos.</td></tr>
<tr><td>Administración y secretaría</td><td>Coordinan entrevistas, inducciones y la agenda de las oficinas.</td></tr>
</table>

<h2 class="salto">4. Entregables de la fase 1: control de ventas y cobranzas</h2>
<p>Seis semanas de trabajo. Se verifica cuando el gestor trabaja su día sin abrir el Drive, la gerencia ve lo vendido e ingresado cada día y contabilidad cuadra las ventas contra Hy Cite.</p>
<div class="dos">
  <div><h3>A. Base de la plataforma</h3>{li('Usuarios con su rango o área y permisos según su rol.', 'Estructura de la red: Premier, distribuidores a cargo y sus equipos.', 'Cada distribuidor registra y administra a sus trabajadores.', 'Ficha de cada persona: ingreso, rango y actividad.', 'Valor agregado: los usuarios del App Millennials y su panel se unifican con la plataforma.')}</div>
  <div><h3>B. Ventas e ingresos</h3>{li('Registro de venta en un minuto: cliente, DNI, vendedor, productos, descuento, forma de pago (contado, crédito Hy Cite o cuotas Millennials), inicial y medio de pago.', 'Si la venta se financia con Millennials, su cronograma pasa solo a cobranzas.', 'Ventas e ingresos del día por medio de pago, separados entre iniciales, ventas al contado y cuotas cobradas.', 'Cuadre contra Hy Cite: número de orden, monto, inicial y productos; cada venta queda cuadrada o con diferencia, con su nota.')}</div>
  <div><h3>C. Cobranzas y notificaciones</h3>{li('Cartera centralizada: cada cuota con su estado (al día, por vencer, vence hoy, en mora) y filtros por gestor, distribuidor y días de atraso.', 'Mi día: a quién contactar, en qué orden y quién ya recibió aviso.', 'Recordatorios automáticos por WhatsApp oficial y correo, con el enlace de pago de Hy Cite. Reglas configuradas por Artisan con Millennials.', 'Mientras Meta aprueba el WhatsApp oficial, el mensaje se abre listo en el WhatsApp del gestor.', 'Registro de pagos con comprobante e historial por cliente.')}</div>
  <div><h3>D. Tablero inicial y puesta en marcha</h3>{li('Franja de hoy: lo vendido, lo ingresado y lo que vence.', 'Indicadores de ventas, cartera por cobrar y mora.', 'Migración de la cartera vigente desde el Drive.', 'Pruebas con ventas, contabilidad y cobranzas, y capacitación por área.', 'Documentación de uso por perfil.')}</div>
</div>

<h2>5. Fases 2 y 3</h2>
<p>Cada fase se inicia cuando Millennials da su conformidad a la anterior, y reutiliza la base, los usuarios y las notificaciones de la fase 1.</p>
<div class="mod"><div class="t"><span>Fase 2: demostraciones, comisiones y telemarketing (5 semanas)</span><span>S/ 11,000 + IGV</span></div>
{li('Calendario de demos por trabajador, con estado de cada visita y origen del prospecto.', 'Recorrido de la venta en seis etapas: demo, cierre, entrega, curado, cocinado y comisión. La venta se registra desde la demo con los datos del cliente.', 'Evidencia de la segunda visita desde el celular; el líder la valida y la comisión queda habilitada.', 'Telemarketing: carga de bases desde Excel y reparto entre operadores, cola con guion y referente, rellamadas y agenda directa en el calendario del vendedor, con los de agenda más libre primero.', 'Monitoreo por operador contra su meta y calidad de las citas: cuántas se realizaron y cuántas vendieron.', 'Tablero: embudo comercial y comparativo por distribuidor.')}
<p class="mute">Se verifica cuando una venta recorre de la llamada a la comisión sin pasar por WhatsApp ni por hojas de cálculo.</p></div>
<div class="mod"><div class="t"><span>Fase 3: reclutamiento y formación (4 semanas)</span><span>S/ 9,000 + IGV</span></div>
{li('Registro de postulantes por un distribuidor o cualquier usuario autorizado, con quién lo refiere («¿quién te recomendó venir?») o el canal por el que llegó.', 'Agenda de entrevistas con entrevistador y oficina, recordatorio al postulante, resultado y notas.', 'Alta en el equipo como Emprendedor y ranking de quién trae gente.', 'Inducción y capacitación: sesiones, asistencia y ruta de seis pasos antes de salir a campo.', 'Valor agregado: la intranet de talleres por video se integra con la plataforma, con la migración de sus datos.', 'Tablero: embudo de reclutamiento y ficha de carrera de cada persona.')}
<p class="mute">Se verifica cuando cada ingresante tiene su registro desde que alguien lo refiere hasta su primera demo.</p></div>
<div class="nota"><b>Después, evolutivos:</b> con la plataforma en uso, cada área propone mejoras que se cotizan aparte. Por ejemplo: editor de reglas y plantillas de notificación, cálculo de montos de comisión, detección de duplicados y lista de no llamar en telemarketing, cuadre semiautomático si Hy Cite exporta reportes, y reportes a Excel y PDF.</div>

<div class="junto"><h2>6. Cronograma</h2>
<p>El plan arranca el lunes 7 de diciembre de 2026 y la fase 1 queda en uso el 22 de enero de 2027. Si cada fase empieza al día siguiente de la conformidad de la anterior, la plataforma completa queda el 2 de abril.</p>
{gantt()}
<p class="mute">Se consideran los feriados del 8 y 25 de diciembre, del 1 de enero y de Semana Santa. Las fechas asumen la aceptación de la propuesta y la entrega de lo indicado en la sección 10 durante la primera semana.</p></div>

<h2>7. Tecnología</h2>
<p>Una aplicación web en la nube, hecha a la medida de la operación de Millennials. No requiere instalación y funciona desde computadora y celular.</p>
<ul>
<li><b>Tiempo real:</b> un pago registrado o una venta cuadrada se reflejan al instante en los paneles y en el tablero.</li>
<li><b>Automatización por reglas:</b> los recordatorios y las alertas se programan una vez y salen solos todos los días.</li>
<li><b>WhatsApp oficial y correo propio:</b> número verificado de Millennials con plantillas aprobadas por Meta, y correos a nombre de Millennials con registro de entrega.</li>
<li><b>Permisos por rol y por equipo:</b> cada persona ve solo lo que le corresponde según su rango, su área y su distribuidor.</li>
<li><b>Evidencia segura:</b> videos, fotos y comprobantes se guardan en la nube, asociados a la venta o a la cuota que sustentan.</li>
<li><b>Trazabilidad y respaldo:</b> queda registro de quién hizo cada cambio, y la base de datos se respalda todos los días.</li>
<li><b>Los datos son de Millennials:</b> la información se puede exportar en cualquier momento.</li>
<li><b>Preparada para crecer:</b> la estructura por módulos permite sumar fases y evolutivos sin rehacer lo construido.</li>
</ul>

<h2 class="salto">8. Inversión</h2>
<table>
<tr><th>Fase</th><th class="n">Precio</th><th class="n">IGV (18%)</th><th class="n">Total</th></tr>
<tr><td>Fase 1: control de ventas y cobranzas</td><td class="n">S/ 15,000</td><td class="n">S/ 2,700</td><td class="n">S/ 17,700</td></tr>
<tr><td>Fase 2: demostraciones, comisiones y telemarketing</td><td class="n">S/ 11,000</td><td class="n">S/ 1,980</td><td class="n">S/ 12,980</td></tr>
<tr><td>Fase 3: reclutamiento y formación</td><td class="n">S/ 9,000</td><td class="n">S/ 1,620</td><td class="n">S/ 10,620</td></tr>
<tr class="tot"><td>Plataforma completa: tres fases</td><td class="n">S/ 35,000</td><td class="n">S/ 6,300</td><td class="n">S/ 41,300</td></tr>
</table>
<p class="mute">La actualización e integración del App Millennials, la intranet de talleres y su panel administrativo se incluye sin costo.</p>

<h3>Forma de pago</h3>
<p>Cada fase se paga 50% al iniciarla y 50% cuando queda en uso. La siguiente fase empieza cuando Millennials da su conformidad a la anterior.</p>
<table>
<tr><th>Fase</th><th>Al iniciar (50%)</th><th>En uso (50%)</th><th class="n">Monto por hito</th></tr>
<tr><td>Fase 1</td><td>7 de diciembre</td><td>22 de enero</td><td class="n">S/ 7,500</td></tr>
<tr><td>Fase 2</td><td>25 de enero</td><td>26 de febrero</td><td class="n">S/ 5,500</td></tr>
<tr><td>Fase 3</td><td>1 de marzo</td><td>2 de abril</td><td class="n">S/ 4,500</td></tr>
</table>
<p class="mute">Montos sin IGV. Las fechas de las fases 2 y 3 son estimadas y se ajustan a la fecha de conformidad.</p>

<div class="junto"><h3>Costos mensuales de operación</h3>
<table>
<tr><th>Servicio</th><th>Para qué sirve</th><th class="n">Costo mensual</th></tr>
<tr><td>Vercel Pro</td><td>Alojamiento de la aplicación</td><td class="n">US$ 20</td></tr>
<tr><td>Supabase Pro</td><td>Base de datos, archivos de evidencia y respaldos diarios</td><td class="n">US$ 25</td></tr>
<tr><td>Resend Pro</td><td>Envío de correos, hasta 50,000 al mes</td><td class="n">US$ 20</td></tr>
<tr><td>WhatsApp Business (Meta)</td><td>Recordatorios y avisos por WhatsApp</td><td class="n">≈ US$ 0.03 por mensaje</td></tr>
<tr class="tot"><td>Base fija</td><td>Antes del consumo de WhatsApp</td><td class="n">US$ 65</td></tr>
</table>
<p class="mute">Precios de lista a noviembre de 2026; los paga Millennials directamente a cada proveedor o a través de Artisan. Como referencia, 2,000 recordatorios por WhatsApp al mes cuestan unos US$ 60.</p></div>

<h3>No incluido</h3>
{li('Integración automática con el sistema de Hy Cite, que no ofrece conexión con otros sistemas.', 'Pasarela de pagos propia y conciliación bancaria automática: el enlace de pago sigue siendo el de Hy Cite.', 'Cálculo de montos de comisión, telefonía integrada para telemarketing, facturación electrónica y contabilidad.', 'Los evolutivos descritos en la sección 5.')}

<h2>9. Supuestos y riesgos</h2>
<h3>Supuestos</h3>
{li('Millennials designa un responsable por área para validar los flujos y probar cada entrega.', 'Millennials entrega la cartera actual, las bases de telemarketing y los parámetros de cálculo de cuotas (inicial mínima y recargo según el número de cuotas, de 2 a 31).', 'Las ventas se siguen ingresando en el sistema de Hy Cite; la plataforma lleva el registro interno y el cuadre.', 'Millennials cuenta con un número de teléfono y una cuenta de empresa en Meta para el WhatsApp oficial. La aprobación depende de Meta.')}
<h3>Riesgos y mitigación</h3>
<table>
<tr><th style="width:30%">Riesgo</th><th style="width:28%">Impacto</th><th>Mitigación</th></tr>
<tr><td>Meta demora la aprobación del WhatsApp oficial</td><td>Los recordatorios por WhatsApp no salen solos al inicio</td><td>Iniciar el trámite la primera semana. Mientras tanto, correo automático y mensaje listo para el gestor.</td></tr>
<tr><td>La cartera del Drive tiene datos incompletos o formatos distintos</td><td>Retrasa la migración</td><td>Revisar el archivo la primera semana y acordar una plantilla de carga con cobranzas.</td></tr>
<tr><td>Hy Cite no ofrece conexión</td><td>El cuadre depende de una revisión manual</td><td>Cuadre ordenado por número de orden. Si Hy Cite exporta reportes, cuadre semiautomático como evolutivo.</td></tr>
<tr><td>Poca disponibilidad del equipo en fiestas de fin de año</td><td>Se retrasan las validaciones de la fase 1</td><td>Sesiones de validación fijas cada semana y pruebas con el equipo en la semana del 18 de enero.</td></tr>
</table>

<div class="junto"><h2>10. Para empezar el 7 de diciembre</h2>
<ul class="check">
<li>Aceptación de la propuesta y pago del primer hito.</li>
<li>Un responsable por área para la fase 1: ventas, contabilidad y cobranzas.</li>
<li>Archivo actual de la cartera y parámetros de cálculo de cuotas.</li>
<li>Lista de distribuidores, equipos y usuarios, con su rango o área.</li>
<li>Número de teléfono y acceso al Business Manager de Meta para tramitar el WhatsApp oficial.</li>
<li>Dominio para los correos (por ejemplo, millennials.pe) y acceso a su configuración.</li>
<li>Enlace de pago de Hy Cite que usa cobranzas.</li>
</ul>
<div class="firmas"><div>Artisan Technology<small>Nombre, firma y fecha</small></div><div>Millennials Investments SAC<small>Nombre, firma y fecha</small></div></div></div>
</div></body></html>"""

CABECERA = f"""<div style="width:100%;padding:0 64px;display:flex;justify-content:space-between;align-items:flex-start;font-family:'Liberation Sans',Arial,sans-serif;-webkit-print-color-adjust:exact">
<div style="padding-top:6px"><div style="font-size:9px;font-weight:700;letter-spacing:.06em;color:#1D2733">ARTISAN TECHNOLOGY</div><div style="font-size:9px;color:#1A5FB4;text-decoration:underline">artisan.pe</div></div>
<img src="{LOGO}" style="height:40px"></div>"""
PIE = """<div style="width:100%;padding:0 64px;position:relative;font-family:'Liberation Sans',Arial,sans-serif;font-size:8.5px">
<div style="text-align:center;color:#F08A1C;line-height:1.45">Creamos alianzas para trabajar juntos<br>todas tus necesidades tecnológicas</div>
<div style="position:absolute;right:64px;bottom:2px;color:#9AA5B1;font-size:7px"><span class="pageNumber"></span> / <span class="totalPages"></span></div></div>"""

async def main():
    from playwright.async_api import async_playwright
    html = AQUI / 'propuesta-millennials.html'
    html.write_text(HTML, encoding='utf-8')
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page()
        await pg.goto(html.as_uri())
        await pg.pdf(path=str(AQUI / 'Propuesta-Millennials-Artisan.pdf'), format='Letter', print_background=True,
                     display_header_footer=True, header_template=CABECERA, footer_template=PIE,
                     margin={'top': '92px', 'bottom': '74px', 'left': '0', 'right': '0'})
        await b.close()

asyncio.run(main())
