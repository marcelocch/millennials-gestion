// Deja la versión estática lista para abrirse desde cualquier carpeta:
// copia lo necesario a vista-previa/ y vuelve relativas las rutas de index.html.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs'

const origen = '.output/public'
const destino = 'vista-previa'
rmSync(destino, { recursive: true, force: true })
mkdirSync(destino)
cpSync(`${origen}/_nuxt`, `${destino}/_nuxt`, { recursive: true })
for (const f of readdirSync(origen).filter(f => f.endsWith('.png'))) cpSync(`${origen}/${f}`, `${destino}/${f}`)

const html = readFileSync(`${origen}/index.html`, 'utf8')
  .replaceAll('"/_nuxt/', '"./_nuxt/')
  .replace('baseURL:"/"', 'baseURL:"./"')
writeFileSync(`${destino}/index.html`, html)
console.log(`Vista previa lista en ${destino}/`)
