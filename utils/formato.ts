// Utilidades de fecha y formato. "Hoy" es la fecha real del navegador:
// los datos simulados se generan alrededor de ese día para que la demo nunca se vea vieja.

export const HOY: Date = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export const masDias = (d: Date, n: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Días de a hasta b (positivo si b es posterior). */
const medianoche = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
export const diasEntre = (a: Date, b: Date): number => Math.round((medianoche(b) - medianoche(a)) / 864e5)

export const mismaFecha = (a: Date, b: Date): boolean => diasEntre(a, b) === 0

export const fCorta = (d: Date): string =>
  d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')

export const fDia = (d: Date): string =>
  d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

export const fSemana = (d: Date): string =>
  d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')

export const soles = (n: number): string =>
  'S/ ' + Math.round(n).toLocaleString('es-PE', { maximumFractionDigits: 0 })

export const solesCorto = (n: number): string =>
  n >= 1000 ? 'S/ ' + (n / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' mil' : soles(n)

export const pct = (n: number, d: number): string => (d ? Math.round((n / d) * 100) : 0) + '%'

export const relativo = (d: Date): string => {
  const n = diasEntre(HOY, d)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}

export const iniciales = (nombre: string): string =>
  nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

/** Enlace de WhatsApp con el mensaje ya redactado (modo "mensaje listo"). */
export const enlaceWhatsApp = (tel: string, mensaje: string): string =>
  `https://wa.me/51${tel.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
