"""Propuesta comercial de la plataforma integral (un solo proyecto), con el formato de Artisan.

Uso:  python3 propuesta/generar_integral.py
Salida: propuesta/Propuesta-Millennials-Plataforma-Integral-Artisan.pdf (y su HTML).
Reutiliza los estilos de generar.py (propuesta anterior por fases).
"""
import base64, datetime as dt, pathlib, asyncio

AQUI = pathlib.Path(__file__).parent
LOGO = 'data:image/png;base64,' + base64.b64encode((AQUI / 'artisan-logo.png').read_bytes()).decode()
CSS = (AQUI / 'generar.py').read_text(encoding='utf-8').split('CSS = """')[1].split('"""')[0]
CSS += """
.gr { grid-template-columns: 196px 1fr; } .lineas { left: 196px; }
.mod .t span:last-child { font-size: 9.4pt; padding-top: 2px; }
.mod p { font-size: 9.8pt; margin-bottom: 6px; }
.cab { height: 32px; } .tk { line-height: 1.25; } .tk b { color: #0F2A44; }
"""

# ---------- Cronograma ----------
INICIO, FIN = dt.date(2026, 11, 30), dt.date(2027, 4, 2)
TOTAL = (FIN - INICIO).days + 1
MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
f = lambda d: dt.date.fromisoformat(d)
corto = lambda d: f'{d.day} {MESES[d.month - 1]}'
pos = lambda d: (d - INICIO).days / TOTAL * 100

FILAS = [  # etiqueta, semana inicial, semana final (None = hito al cierre de esa semana), tipo
    ('Migración del app y base de la red', 1, 4, 'f1'),
    ('Portal del emprendedor', 2, 6, 'f1'),
    ('Discovery y entrevistas', 3, 5, 'f1'),
    ('Portal en uso, app apagada', 6, None, 'hito'),
    ('Clientes, demos y calendario', 6, 9, 'f2'),
    ('Ventas, comisiones y cobranzas', 8, 12, 'f2'),
    ('Operación comercial validada', 12, None, 'hito'),
    ('WhatsApp y conversaciones', 11, 14, 'f2'),
    ('Captación de socios', 13, 15, 'f2'),
    ('Captación validada', 15, None, 'hito'),
    ('Tablero, reportes y migración', 15, 17, 'f2'),
    ('Pruebas y salida', 18, 18, 'f2'),
    ('Plataforma completa en uso', 18, None, 'final'),
]

lunes = lambda w: INICIO + dt.timedelta(weeks=w - 1)
viernes = lambda w: lunes(w) + dt.timedelta(days=4)

def gantt():
    ticks = ''.join(
        f'<span class="tk" style="left:{pos(lunes(w)):.2f}%"><b>Sem {w}</b><br>{corto(lunes(w))}</span>'
        for w in range(1, 19, 2))
    lineas = ''.join(f'<i style="left:{pos(lunes(w)):.2f}%"></i>' for w in range(1, 19, 2))
    filas = ''
    for etq, wa, wb, tipo in FILAS:
        if wb:
            da, db = lunes(wa), viernes(wb)
            izq, ancho = pos(da), ((db - da).days + 1) / TOTAL * 100
            txt = f'sem {wa}' if wa == wb else f'sem {wa} a {wb}'
            marca = f'<span class="bar {tipo}" style="left:{izq:.2f}%;width:{ancho:.2f}%"></span>'
            fin = izq + ancho
            nota = (f'<span class="lbl" style="left:{fin + 0.8:.2f}%">{txt}</span>' if fin < 80
                    else f'<span class="lbl izq" style="right:{100 - izq + 0.8:.2f}%">{txt}</span>')
        else:
            izq = pos(viernes(wa)) + 100 / TOTAL / 2
            marca = f'<span class="dia {tipo}" style="left:{izq:.2f}%"></span>'
            nota = f'<span class="lbl izq" style="right:{100 - izq + 1.4:.2f}%">fin sem {wa}</span>'
        cls = ' class="fuerte"' if tipo in ('hito', 'final') else ''
        filas += f'<div class="gr"><span{cls}>{etq}</span><div class="pista">{marca}{nota}</div></div>'
    return f'<div class="gantt"><div class="gr cab"><span></span><div class="pista">{ticks}</div></div><div class="cuerpo"><div class="lineas">{lineas}</div>{filas}</div></div>'

def li(*xs): return '<ul>' + ''.join(f'<li>{x}</li>' for x in xs) + '</ul>'

def mod(titulo, entrega, intro, *items):
    return (f'<div class="mod"><div class="t"><span>{titulo}</span><span>{entrega}</span></div>'
            f'<p>{intro}</p>{li(*items)}</div>')

# ---------- Inversión ----------
PRECIO_LISTA = 29571.00
TOTAL_SOLES = 26600.00  # 10% de descuento por inicio inmediato, redondeado
HITOS = [  # hito, momento, monto por transferencia directa
    ('Inicio del proyecto: migración del app', '27 de noviembre', 5300.00),
    ('Inicio del discovery con las áreas', '14 de diciembre', 5000.00),
    ('Cierre del discovery: alcance funcional y prototipos aprobados', 'Semana 5', 3800.00),
    ('Portal del emprendedor en uso y app actual apagada', 'Semana 6', 3800.00),
    ('Operación comercial validada por Millennials', 'Semana 12', 3800.00),
    ('Captación de socios y conversaciones validadas', 'Semana 15', 2450.00),
    ('Plataforma completa en uso, con la migración terminada', 'Semana 18', 2450.00),
]
soles = lambda x: f'S/ {x:,.2f}'
pct = lambda x: f'{x / TOTAL_SOLES * 100:.1f}%'
filas_hitos = ''.join(
    f'<tr><td>{h}</td><td>{fe}</td><td class="n">{pct(m)}</td><td class="n">{soles(m)}</td></tr>'
    for h, fe, m in HITOS)
assert abs(sum(m for _, _, m in HITOS) - TOTAL_SOLES) < 0.005

HTML = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Propuesta comercial · Plataforma integral Millennials</title><style>{CSS}</style></head><body><div class="pg">

<p class="eyebrow">PROPUESTA COMERCIAL</p>
<h1>Millennials: plataforma integral para la venta y la expansión de la red</h1>
<p class="sub">Clientes, demostraciones, ventas, cobranzas, captación de socios, WhatsApp y el portal del emprendedor en un solo sistema</p>
<div class="ficha">
  <div><small>Cliente</small><b>Millennials Investments SAC</b></div>
  <div><small>Fecha</small><b>27 de noviembre de 2026</b></div>
  <div><small>Validez de la oferta</small><b>15 días calendario</b></div>
  <div><small>Plazo</small><b>18 semanas + 60 días de garantía</b></div>
</div>

<h2>1. Resumen</h2>
<p>Millennials necesita un solo sistema para dos trabajos que hoy viven en Drive, hojas de cálculo, WhatsApp y el App Millennials. El primero es <b>vender y cobrar</b>: cada cliente, su demostración, su venta y sus cuotas. El segundo es <b>hacer crecer la red</b>: cada persona interesada que llega desde redes sociales, su entrevista, su inducción y su primera venta.</p>
<p>Proponemos una plataforma única, hecha a la medida de Millennials, que cubre ambos trabajos y además reemplaza al App Millennials con un portal para toda la red: capacitación, catálogo, calculadora de financiamiento y multimedia. Cada dato se registra una sola vez: la demo trae al cliente, la venta trae la demo, y cobranzas recibe al cliente, al vendedor y sus cuotas sin volver a digitarlos. Las conversaciones de WhatsApp quedan en la plataforma, con los números oficiales de Millennials.</p>
<p>El proyecto arranca el lunes 30 de noviembre con la migración del App Millennials y la base de la red. El 14 de diciembre empiezan tres semanas de discovery para cerrar los procesos con cada área. El portal sale en la semana 6 para apagar el app actual, y la plataforma completa entra en uso en la semana 18, con 60 días de garantía y soporte.</p>
<div class="cards">
  <div class="card"><small>Inversión total</small><b>S/ 26,600</b></div>
  <div class="card"><small>Portal del emprendedor en uso</small><b>Semana 6</b></div>
  <div class="card n"><small>Plataforma completa · garantía</small><b>Semana 18 · 60 días</b></div>
</div>

<h2>2. Cómo funciona</h2>
<p>La plataforma ordena el trabajo de Millennials en tres frentes que comparten la misma información:</p>
<table>
<tr><th style="width:24%">Frente</th><th>Qué resuelve</th><th style="width:30%">Recorrido</th></tr>
<tr><td><b>Operación comercial</b></td><td>Que cada cliente, demo, venta y cuota esté en un solo lugar, con su historia completa, y que el cuadre con Hy Cite sea rápido.</td><td>Posible cliente → demo asignada → venta → comisión, cobranza y cuadre</td></tr>
<tr><td><b>Expansión de la red</b></td><td>Que cada persona interesada en ser emprendedor, llegue por publicidad o referida por alguien de la red, tenga seguimiento hasta su primera venta, con un responsable visible.</td><td>Lead → llamada → WhatsApp con información → entrevista → inducción → primera venta</td></tr>
<tr><td><b>Portal del emprendedor</b></td><td>Que toda la red tenga sus herramientas del día a día en el mismo sistema, desde el celular o la computadora.</td><td>Capacitación, catálogo, calculadora y multimedia</td></tr>
</table>
<p>Por encima de los tres frentes, la plataforma se conecta a la cuenta oficial de WhatsApp de Millennials: trae sus números aprobados por Meta y administración asigna cada uno a captación o a cobranzas. La plataforma se instala en cualquier celular, Android o iPhone, como una app, sin pasar por las tiendas, y avisa al usuario cuando le llega un mensaje.</p>

<h3>Quién accede a qué</h3>
<table>
<tr><th style="width:24%">Acceso</th><th style="width:38%">Para quién</th><th>Qué incluye</th></tr>
<tr><td><b>Plataforma completa</b></td><td>Los distribuidores que Millennials habilite y su red, y la red directa de Millennials.</td><td>Todos los módulos, según el rol de cada persona.</td></tr>
<tr><td><b>Portal del emprendedor</b></td><td>Todos los usuarios de la red.</td><td>Capacitación, catálogo, calculadora de financiamiento, multimedia y tarjeta digital.</td></tr>
</table>
<table>
<tr><th style="width:34%">Perfil</th><th>Qué hace en la plataforma</th></tr>
<tr><td>Gerencia general</td><td>Ve el tablero de toda la red y los reportes esenciales.</td></tr>
<tr><td>Distribuidores y coordinación</td><td>Aprueban los posibles clientes de su red, asignan demostraciones en el calendario de cada emprendedor, refieren invitados y siguen a su equipo.</td></tr>
<tr><td>Emprendedores</td><td>Registran posibles clientes e invitados referidos, ven su agenda, registran lo vendido desde el catálogo y suben la evidencia de curado y cocinado.</td></tr>
<tr><td>Telemarketing</td><td>Trabaja su base de leads, envía la información por WhatsApp, agenda entrevistas y sigue a cada ingresante.</td></tr>
<tr><td>Cobranzas</td><td>Trabaja su cartera, conversa con sus clientes desde el número de cobranzas y registra pagos.</td></tr>
<tr><td>Contabilidad</td><td>Ve los ingresos y los pagos de comisión del día, y cuadra cada venta contra Hy Cite.</td></tr>
<tr><td>Administración</td><td>Gestiona usuarios, accesos, números de WhatsApp, catálogo, capacitación y multimedia.</td></tr>
</table>

<h2 class="salto">3. Módulos y funciones</h2>
<p>Cada módulo se explica por lo que permite hacer. Los detalles finos de cada proceso se cierran en el discovery.</p>

{mod('Portal del emprendedor', 'Entrega 1 · semana 6',
     'Reemplaza al App Millennials con todas sus pantallas, dentro de la plataforma. Lo usa toda la red.',
     '<b>Capacitación:</b> talleres por categoría con módulos en video, exámenes con nota mínima de aprobación, avance de cada persona y ranking. Cada taller se muestra según el rango de quien lo ve. Se migran todos los talleres actuales.',
     '<b>Catálogo de productos:</b> productos por categoría, con fotos y videos, código, descripción, precio y los regalos que incluyen. Búsqueda, favoritos y lista de códigos, como en el app actual.',
     '<b>Calculadora de financiamiento:</b> monto, inicial por porcentaje o monto libre, y cuota según el número de cuotas. Administración configura los factores y el rango de cuotas (hoy de 2 a 31). Se usa sola o dentro del registro de una venta.',
     '<b>Multimedia compartida:</b> imágenes, videos y documentos para que la red los use y los comparta.',
     '<b>Tarjeta digital, perfil, requisitos y POS virtual:</b> las demás pantallas del app pasan igual.')}

{mod('Clientes y demostraciones', 'Entrega 2 · semana 12',
     'Un listado único de clientes con sus datos de contacto, y un calendario de demostraciones por emprendedor.',
     '<b>Posibles clientes:</b> emprendedores y distribuidores registran a las personas interesadas en una demo; el distribuidor las aprueba y pasan al listado de clientes.',
     '<b>Módulo de clientes:</b> cada cliente con sus datos de contacto, quién lo registró y su historial de demos, compras y cuotas.',
     '<b>Asignación de demos:</b> un distribuidor o coordinador elige al cliente y asigna la demo en el calendario del emprendedor, con fecha, hora y dirección.',
     '<b>Google Calendar:</b> cada demo asignada aparece en el calendario de Google del emprendedor.',
     '<b>Estado de la visita:</b> programada, realizada, reprogramada, cancelada o cliente ausente.',
     '<b>Recorrido de la venta:</b> demo, cierre, entrega, curado, cocinado y comisión. El emprendedor sube desde su celular la evidencia de curado y cocinado, su líder la valida y la comisión queda habilitada para pago.')}

{mod('Ventas e ingresos', 'Entrega 2 · semana 12',
     'El registro propio de cada venta, para el seguimiento interno de Millennials.',
     '<b>Venta desde la demo:</b> cuando el emprendedor marca su demo como vendida, la venta se abre con los datos del cliente ya cargados.',
     '<b>Lo vendido, desde el catálogo:</b> el emprendedor elige en el catálogo los productos que se vendieron, con sus regalos, y la plataforma calcula el precio final a cobrar.',
     '<b>Contado o cuotas, en el mismo paso:</b> si es en cuotas, la calculadora de financiamiento se abre ahí mismo con el precio final: inicial, número de cuotas y monto de cada una. El cronograma pasa solo a cobranzas.',
     '<b>Ventas e ingresos del día:</b> lo vendido y lo ingresado por medio de pago, separado entre iniciales, ventas al contado y cuotas cobradas.')}

{mod('Comisiones', 'Entrega 2 · semana 12',
     'El pago de comisiones, sustentado venta por venta.',
     '<b>Pagos de comisión del día:</b> las ventas cuya evidencia de curado y cocinado fue validada quedan listas para pago, con el vendedor, la venta y el monto de comisión.',
     '<b>Tabla de comisiones:</b> administración configura cuánto se paga por cada venta, según las reglas que se definan en el discovery. También cubre la comisión del operador de telemarketing por la primera venta de cada ingresante.',
     '<b>Pagado y pendiente:</b> se marca cada comisión como pagada, y queda el historial por vendedor y por fecha.')}

{mod('Cuadre con Hy Cite', 'Entrega 2 · semana 12',
     'Una revisión rápida y ordenada de las ventas registradas en la plataforma contra las de Hy Cite.',
     '<b>Comparación lado a lado:</b> cada venta de la plataforma junto a los datos de su orden en Hy Cite (número de orden, monto, inicial y productos), para marcarla como cuadrada o con diferencia.',
     '<b>Avisar al vendedor:</b> si hay una diferencia, contabilidad contacta al vendedor desde la misma pantalla y deja la nota de lo que hay que corregir.',
     '<b>Pendientes a la vista:</b> ventas cuadradas, por cuadrar y con diferencia de cada día, y quién las revisó.')}

{mod('Cobranzas', 'Entrega 2 · semana 12',
     'La cartera completa, heredada de las ventas, sin volver a digitar nada.',
     '<b>Cartera heredada:</b> cada cliente llega con sus datos de contacto, su vendedor y su financiamiento, en cuotas o al contado.',
     '<b>Mi día:</b> a quién contactar hoy, en qué orden y quién ya recibió aviso. Cada cuota con su estado: al día, por vencer, vence hoy o en mora.',
     '<b>Conversaciones desde el número de cobranzas:</b> el gestor escribe y responde a sus clientes desde la plataforma, con el número oficial asignado a cobranzas.',
     '<b>Recordatorios y enlace de pago:</b> mensajes con el monto, la cuota y el enlace de pago de Hy Cite. Registro del pago con su comprobante.')}

{mod('Captación de socios', 'Entrega 3 · semana 15',
     'Telemarketing y reclutamiento en un solo flujo, para expandir la red con personas que llegan desde la publicidad en redes sociales.',
     '<b>Formulario de interés:</b> la persona que llega desde la publicidad deja sus datos en un formulario propio de Millennials y entra directo a la base de leads. Los campos se definen en el discovery.',
     '<b>Invitados referidos:</b> emprendedores y distribuidores registran a sus invitados, que entran a la base de leads con el nombre de quien los refiere.',
     '<b>Reparto entre operadores:</b> la base se distribuye entre los operadores de telemarketing, y cada uno ve su lista del día.',
     '<b>Envío de información por WhatsApp:</b> después de la llamada, el operador envía con un clic el mensaje con el PDF informativo, desde el número de captación. La conversación queda a su nombre.',
     '<b>Agenda de entrevistas:</b> fecha, hora, entrevistador y oficina, y el operador marca si la persona llegó.',
     '<b>Ruta hasta la primera venta:</b> entrevista, inducción, alta como emprendedor y primera venta, visibles para el operador que lo trajo, porque de esa venta depende su comisión.')}

{mod('Conversaciones de WhatsApp y app en el celular', 'Entrega 3 · semana 15',
     'Los números oficiales de Millennials, trabajados desde la plataforma y con permisos claros.',
     '<b>Hasta tres números oficiales:</b> la plataforma trae los números de la cuenta de Millennials y administración asigna cada uno a captación o a cobranzas.',
     '<b>Bandeja de conversaciones:</b> textos, imágenes y documentos. Cada operador ve solo las conversaciones que él inició, y cada gestor solo las de sus clientes.',
     '<b>Avisos en el celular:</b> el usuario recibe una notificación cuando le escriben, aunque no tenga la plataforma abierta.',
     '<b>Instalable en cualquier celular:</b> Android o iPhone, como una app, sin descargarla de una tienda.')}

{mod('Tablero gerencial y reportes', 'Entrega 3 · semana 17',
     'La vista de gerencia sobre toda la red.',
     '<b>Tablero:</b> lo vendido, lo ingresado, las comisiones, las demos del día, la cartera y la captación de socios, por distribuidor.',
     '<b>Reportes esenciales:</b> los que gerencia necesita para dirigir la red, definidos con ella en el discovery.')}

{mod('Base, accesos y migración de datos', 'En todas las entregas',
     'Lo que sostiene a la plataforma y trae la historia de Millennials.',
     '<b>Red, usuarios y accesos:</b> estructura de distribuidores y equipos, rangos Royal Prestige, áreas internas y permisos por rol. Los usuarios del app entran con su mismo código.',
     '<b>Migración del app:</b> usuarios, productos, talleres, avance de capacitación y multimedia.',
     '<b>Migración de la operación:</b> demos, ventas y cobranzas, con lo pendiente y el histórico, a partir de una plantilla única en Excel. Lo pendiente queda activo y con sus recordatorios.')}

<h2>4. Plan de trabajo</h2>
<h3>Migración del app y discovery</h3>
<p>Las dos primeras semanas migramos el App Millennials (usuarios, catálogo, talleres y multimedia) y armamos la base de la red, que no dependen de nuevas definiciones. Desde el 14 de diciembre, durante tres semanas, entrevistamos a cada área para aterrizar los procesos que hoy tienen vacíos. El discovery termina con un documento de alcance funcional y prototipos navegables que Millennials aprueba. Ahí se define, entre otros puntos:</p>
<div class="dos">
<div>{li('Los campos del formulario de interés y del registro de referidos.', 'Los reportes esenciales de gerencia.', 'El flujo de entrevistas, inducción y alta.', 'Las reglas de aprobación de clientes, asignación de demos y reparto de leads.')}</div>
<div>{li('Las plantillas de WhatsApp para captación y cobranzas.', 'La tabla de comisiones, los factores de cuotas y la inicial mínima.', 'La plantilla de Excel para la migración.', 'Qué distribuidores tienen acceso a la plataforma completa.')}</div>
</div>
<p class="mute">Lo que aparezca después del discovery se evalúa como evolutivo y se cotiza aparte.</p>

<div class="junto"><h3>Cronograma</h3>
<p>El plan dura 18 semanas desde el lunes 30 de noviembre de 2026. El discovery empieza el 14 de diciembre, el portal entra en uso al cierre de la semana 6 para apagar el app actual, y la plataforma completa al cierre de la semana 18.</p>
{gantt()}
<p class="mute">Con ese inicio, el plan ya considera los feriados de diciembre, el 1 de enero y Semana Santa. Las entregas 2 y 3 se validan con el equipo de Millennials en un ambiente de pruebas y salen a producción juntas, con la migración completa.</p></div>

<div class="junto"><h3>Garantía y soporte: 60 días</h3>
<p>Desde la salida a producción de la plataforma completa, Artisan acompaña a Millennials durante 60 días calendario:</p>
{li('Corrección sin costo de cualquier falla de lo construido.', 'Atención de consultas del equipo en horario laboral.', 'Ajustes menores de textos, plantillas y configuraciones.', 'Acompañamiento en las primeras semanas de uso de cada área.')}
<p class="mute">Las funciones nuevas no forman parte de la garantía. El soporte mensual posterior se cotiza aparte.</p></div>

<h2 class="salto">5. Inversión</h2>
<table>
<tr><th>Concepto</th><th class="n">Monto</th></tr>
<tr><td>Plataforma integral Millennials: discovery, construcción, migración, salida a producción y 60 días de garantía y soporte. Precio de lista {soles(PRECIO_LISTA)}, con 10% de descuento por inicio inmediato.</td><td class="n">{soles(TOTAL_SOLES)}</td></tr>
</table>

<h3>Forma de pago</h3>
<table>
<tr><th>Hito</th><th>Momento estimado</th><th class="n">%</th><th class="n">Monto</th></tr>
{filas_hitos}
<tr class="tot"><td>Total</td><td></td><td class="n">100%</td><td class="n">{soles(TOTAL_SOLES)}</td></tr>
</table>
<p class="mute">Pagos por transferencia directa. Cada hito se paga cuando se cumple; si el avance se mueve, el pago se mueve con él.</p>

<div class="junto"><h3>Costos mensuales de operación</h3>
<table>
<tr><th>Servicio</th><th>Para qué sirve</th><th class="n">Costo mensual</th></tr>
<tr><td>Vercel Pro</td><td>Alojamiento de la plataforma</td><td class="n">US$ 20</td></tr>
<tr><td>Supabase Pro</td><td>Base de datos, archivos, evidencias y respaldos diarios</td><td class="n">US$ 25</td></tr>
<tr><td>Resend Pro</td><td>Envío de correos, hasta 50,000 al mes</td><td class="n">US$ 20</td></tr>
<tr><td>WhatsApp: mensaje de captación</td><td>Primer mensaje con el PDF a cada lead</td><td class="n">≈ US$ 0.0703 c/u</td></tr>
<tr><td>WhatsApp: recordatorio de cobranza</td><td>Aviso de cuota fuera de una conversación abierta</td><td class="n">≈ US$ 0.03 c/u</td></tr>
<tr><td>WhatsApp: respuestas en conversación</td><td>Las primeras 1,000 al mes por número no se cobran</td><td class="n">≈ US$ 0.03 c/u</td></tr>
<tr class="tot"><td>Base fija</td><td>Antes del consumo de WhatsApp</td><td class="n">US$ 65</td></tr>
</table>
<p class="mute">Tarifas de referencia de Meta para números de Perú y precios de lista de los demás servicios a noviembre de 2026; pueden variar. Como referencia, contactar a 1,000 leads al mes cuesta unos US$ 70. Los avisos en el celular y Google Calendar no tienen costo.</p></div>

<h3>No incluido</h3>
{li('Integración automática con el sistema de Hy Cite, que no ofrece conexión con otros sistemas: el cuadre se hace en la plataforma, venta por venta.', 'Bonos y comisiones de red por rango o por equipo. La plataforma paga la comisión de cada venta y la de telemarketing con la tabla que Millennials configure.', 'Chatbot o respuestas automáticas en WhatsApp, y telefonía integrada para las llamadas.', 'Pasarela de pagos propia, facturación electrónica y contabilidad.', 'La pauta publicitaria en redes sociales y el diseño del PDF informativo.')}

<h2>6. Supuestos y riesgos</h2>
<h3>Supuestos</h3>
{li('Millennials designa un responsable por área para el discovery, las validaciones y las pruebas.', 'Millennials tiene su cuenta de empresa verificada en Meta y hasta tres números para WhatsApp. La aprobación de las plantillas depende de Meta.', 'Las ventas se siguen ingresando en el sistema de Hy Cite; la plataforma lleva el registro interno y el cuadre.', 'Millennials entrega el histórico de demos, ventas y cobranzas en la plantilla de Excel acordada en el discovery.', 'Los emprendedores usan una cuenta de Google para recibir sus demos en Google Calendar.', 'En iPhone, los avisos en el celular requieren instalar la plataforma en la pantalla de inicio. Lo incluimos en la capacitación.')}
<h3>Riesgos y mitigación</h3>
<table>
<tr><th style="width:30%">Riesgo</th><th style="width:26%">Impacto</th><th>Mitigación</th></tr>
<tr><td>Meta demora la aprobación de las plantillas o las clasifica como marketing</td><td>Retrasa los envíos o sube su costo</td><td>Tramitar las plantillas en el discovery, con textos que respeten las reglas de cada categoría.</td></tr>
<tr><td>El histórico en Excel viene incompleto o con formatos distintos</td><td>Retrasa la migración</td><td>Plantilla única desde el discovery, una carga de prueba y una carga final.</td></tr>
<tr><td>Procesos que todavía no están definidos</td><td>El alcance crece durante el desarrollo</td><td>El discovery los cierra con un documento aprobado; lo nuevo se trabaja como evolutivo.</td></tr>
<tr><td>Poca disponibilidad del equipo en fiestas de fin de año</td><td>Se alarga el discovery</td><td>Agenda de entrevistas cerrada antes del 14 de diciembre y sesiones fijas cada semana.</td></tr>
<tr><td>El equipo sigue usando el app o el Drive</td><td>Información partida en dos lugares</td><td>El app se apaga al salir el portal, y cada área recibe capacitación antes de cada salida.</td></tr>
</table>

<div class="junto"><h2>7. Para empezar</h2>
<ul class="check">
<li>Primer pago de S/ 5,300 para iniciar la migración del app el lunes 30 de noviembre.</li>
<li>Un responsable por área y la agenda de entrevistas del discovery, desde el 14 de diciembre.</li>
<li>Acceso a la cuenta de empresa de Millennials en Meta y los números que se usarán para WhatsApp.</li>
<li>El histórico actual de demos, ventas y cobranzas, en el formato en que esté hoy.</li>
<li>Lista de distribuidores con acceso a la plataforma completa.</li>
<li>Dominio para la plataforma y los correos (por ejemplo, millennials.pe) y acceso a su configuración.</li>
</ul>
<div class="firmas"><div>Artisan Technology EIRL<small>Marcelo Calle Chávez</small></div><div>Millennials Investments SAC<small>Fernando Gambetta Ching</small></div></div></div>
</div></body></html>"""

CABECERA = f"""<div style="width:100%;padding:0 64px;display:flex;justify-content:space-between;align-items:flex-start;font-family:'Liberation Sans',Arial,sans-serif;-webkit-print-color-adjust:exact">
<div style="padding-top:6px"><div style="font-size:9px;font-weight:700;letter-spacing:.06em;color:#1D2733">ARTISAN TECHNOLOGY</div><div style="font-size:9px;color:#1A5FB4;text-decoration:underline">artisan.pe</div></div>
<img src="{LOGO}" style="height:40px"></div>"""
PIE = """<div style="width:100%;padding:0 64px;position:relative;font-family:'Liberation Sans',Arial,sans-serif;font-size:8.5px">
<div style="text-align:center;color:#F08A1C;line-height:1.45">Creamos alianzas para trabajar juntos<br>todas tus necesidades tecnológicas</div>
<div style="position:absolute;right:64px;bottom:2px;color:#9AA5B1;font-size:7px"><span class="pageNumber"></span> / <span class="totalPages"></span></div></div>"""

async def main():
    from playwright.async_api import async_playwright
    html = AQUI / 'propuesta-millennials-integral.html'
    html.write_text(HTML, encoding='utf-8')
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page()
        await pg.goto(html.as_uri())
        await pg.pdf(path=str(AQUI / 'Propuesta-Millennials-Plataforma-Integral-Artisan.pdf'), format='Letter', print_background=True,
                     display_header_footer=True, header_template=CABECERA, footer_template=PIE,
                     margin={'top': '92px', 'bottom': '74px', 'left': '0', 'right': '0'})
        await b.close()

asyncio.run(main())
