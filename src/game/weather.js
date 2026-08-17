// Weather is a set of named target states that the director cross-fades
// between. Everything downstream - sky colours, particles, tyre grip, how far
// the police can see - reads the *blended* numbers in `world.weather.params`,
// never the named state, so transitions are smooth by construction.

export const WEATHER_TYPES = {
  clear: {
    key: 'clear', labelKey: 'weather.clear', icon: '☀️',
    cloud: 0.05, precip: 0, kind: 'none', wind: 0.12,
    fog: 1, grip: 1, lightning: 0,
  },
  cloudy: {
    key: 'cloudy', labelKey: 'weather.cloudy', icon: '☁️',
    cloud: 0.68, precip: 0, kind: 'none', wind: 0.3,
    fog: 0.86, grip: 0.97, lightning: 0,
  },
  windy: {
    key: 'windy', labelKey: 'weather.windy', icon: '🍃',
    cloud: 0.35, precip: 0, kind: 'none', wind: 1,
    fog: 0.95, grip: 0.94, lightning: 0,
  },
  rain: {
    key: 'rain', labelKey: 'weather.rain', icon: '🌧️',
    cloud: 0.88, precip: 0.75, kind: 'rain', wind: 0.45,
    fog: 0.6, grip: 0.78, lightning: 0,
  },
  storm: {
    key: 'storm', labelKey: 'weather.storm', icon: '⛈️',
    cloud: 1, precip: 1, kind: 'rain', wind: 0.92,
    fog: 0.44, grip: 0.66, lightning: 1,
  },
  snow: {
    key: 'snow', labelKey: 'weather.snow', icon: '🌨️',
    cloud: 0.8, precip: 0.72, kind: 'snow', wind: 0.34,
    fog: 0.52, grip: 0.52, lightning: 0,
  },
}

/** Order used by the "change the weather" key, so cycling feels progressive. */
export const WEATHER_ORDER = ['clear', 'cloudy', 'windy', 'rain', 'storm', 'snow']

// Plausible successors: sun clouds over before it rains, storms rain themselves
// out rather than snapping straight back to blue sky.
const TRANSITIONS = {
  clear: ['cloudy', 'cloudy', 'windy', 'clear'],
  cloudy: ['clear', 'rain', 'rain', 'windy', 'snow'],
  windy: ['cloudy', 'clear', 'storm'],
  rain: ['storm', 'cloudy', 'cloudy', 'rain'],
  storm: ['rain', 'rain', 'windy'],
  snow: ['cloudy', 'snow', 'clear'],
}

export function pickNextWeather(current, random = Math.random) {
  const options = TRANSITIONS[current] || WEATHER_ORDER
  return options[Math.floor(random() * options.length)]
}

const NUMERIC = ['cloud', 'precip', 'wind', 'fog', 'grip', 'lightning']

export function blankParams() {
  const p = {}
  for (const k of NUMERIC) p[k] = 0
  p.kind = 'none'
  p.rain = 0
  p.snow = 0
  return p
}

/**
 * Blend two states into `out`. Rain and snow are tracked separately so a
 * rain-to-snow change fades one out while the other fades in, instead of
 * teleporting the particle system between shapes.
 */
export function blendParams(out, from, to, t) {
  for (const k of NUMERIC) out[k] = from[k] + (to[k] - from[k]) * t
  const fromRain = from.kind === 'rain' ? from.precip : 0
  const toRain = to.kind === 'rain' ? to.precip : 0
  const fromSnow = from.kind === 'snow' ? from.precip : 0
  const toSnow = to.kind === 'snow' ? to.precip : 0
  out.rain = fromRain + (toRain - fromRain) * t
  out.snow = fromSnow + (toSnow - fromSnow) * t
  out.kind = out.snow > out.rain ? 'snow' : out.rain > 0.01 ? 'rain' : 'none'
  return out
}

/** Smooth 0..1 ramp, used all over the sky and lighting maths. */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function formatClock(hour) {
  const h = Math.floor(hour) % 24
  const m = Math.floor((hour - Math.floor(hour)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
