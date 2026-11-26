# Presentación comercial (pantalla completa con scroll)

Página para presentar la propuesta en reunión: una sección por pantalla, riel de estaciones a la derecha,
recorridos animados, calculadora de cuotas con la tabla real del app y la inversión por hitos.

- `plantilla.html`: la fuente. Todo el contenido que cambia entre clientes está en el objeto `P` al inicio del script
  (fuentes de hoy, frentes, recorridos de venta y de socio, módulos, cronograma en semanas, hitos de pago, compromisos y notas).
  Los textos fijos de cada sección están en el HTML.
- `construir.py`: incrusta los logos y genera `index.html` (`python3 presentacion/construir.py`).
- `logo-cliente-blanco.png` y `logo-artisan-blanco.png`: logos en blanco para fondo oscuro.

Teclas: ↓ / ↑ o barra espaciadora para avanzar, ← / → dentro de un recorrido, F pantalla completa, N notas para quien presenta.
Las notas solo se ven al pulsar N o el botón Notas.

Para otra propuesta: copia la carpeta, cambia el logo del cliente, el objeto `P`, los títulos de cada sección y, si no aplica,
quita la sección (el riel se arma solo con las secciones que existan).

Publicada como artifact: https://claude.ai/artifact/2RyWFUYBTHLHPSBkAyEmcm
