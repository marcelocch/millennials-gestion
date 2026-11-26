"""Arma index.html a partir de plantilla.html, incrustando los logos (la página no puede cargar imágenes externas).

Uso: python3 presentacion/construir.py
Para otra propuesta: cambia logo-cliente-blanco.png y el objeto P dentro de plantilla.html.
"""
import base64, pathlib
aqui = pathlib.Path(__file__).parent
uri = lambda f: 'data:image/png;base64,' + base64.b64encode((aqui / f).read_bytes()).decode()
html = (aqui / 'plantilla.html').read_text(encoding='utf-8')
html = html.replace('{{LOGO_ARTISAN}}', uri('logo-artisan-blanco.png')).replace('{{LOGO_CLIENTE}}', uri('logo-cliente-blanco.png'))
(aqui / 'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html), 'bytes')
