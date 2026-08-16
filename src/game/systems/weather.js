import { TIME, WEATHER } from '../config.js'
import {
  WEATHER_TYPES, WEATHER_ORDER, pickNextWeather,
  blankParams, blendParams, smoothstep,
} from '../weather.js'
import { playThunder, updateWeatherAmbience } from '../audio.js'

// Advances the clock, runs the weather director, and derives the handful of
// numbers everything else keys off: how bright it is, how hard the wind is
// blowing right now, how much snow has settled.

export function createWeather() {
  return {
    current: 'clear',
    target: 'clear',
    blend: 1,
    timer: WEATHER.minDuration,
    locked: false, // set when the player picks the weather by hand
    params: blendParams(blankParams(), WEATHER_TYPES.clear, WEATHER_TYPES.clear, 1),

    windDir: Math.PI * 0.25,
    gustPhase: 0,
    gust: 0,
    windX: 0,
    windZ: 0,

    snowCover: 0,
    flash: 0,
    strikeTimer: WEATHER.lightningMin,
    pendingThunder: -1,

    // Derived lighting values, refreshed every frame.
    sunHeight: 0,
    sunX: 0,
    sunY: 1,
    sunZ: 0,
    day: 1,
    night: 0,
    twilight: 0,
  }
}

export function setWeather(world, key, instant = false) {
  const w = world.weather
  if (!WEATHER_TYPES[key]) return
  if (instant) {
    w.current = key
    w.target = key
    w.blend = 1
  } else {
    // Start the fade from wherever the blend currently sits.
    w.current = w.blend >= 1 ? w.current : w.current
    w.target = key
    w.blend = 0
  }
  w.timer = WEATHER.minDuration + Math.random() * (WEATHER.maxDuration - WEATHER.minDuration)
}

/** Cycle to the next state in the display order - bound to a key for the player. */
export function cycleWeather(world) {
  const w = world.weather
  const from = w.blend >= 1 ? w.current : w.target
  const next = WEATHER_ORDER[(WEATHER_ORDER.indexOf(from) + 1) % WEATHER_ORDER.length]
  setWeather(world, next)
  w.locked = true
  return next
}

// Dawn, noon, dusk, night - in ascending order so the "next one up" search
// below reaches all four before wrapping round to dawn again.
const PHASES = [6.2, 12, 19.4, 23]

/** Jump the clock to the next interesting time of day. */
export function skipTimePhase(world) {
  const now = world.timeOfDay
  for (const h of PHASES) {
    if (h > now + 0.05) {
      world.timeOfDay = h
      return h
    }
  }
  world.timeOfDay = PHASES[0]
  return PHASES[0]
}

export function updateWeather(world, dt) {
  const w = world.weather

  // --- clock ------------------------------------------------------------
  world.timeOfDay = (world.timeOfDay + (24 / TIME.dayLength) * dt) % 24

  // The sun rises in the east at 06:00 and sets in the west at 18:00.
  const angle = ((world.timeOfDay - 6) / 24) * Math.PI * 2
  w.sunHeight = Math.sin(angle)
  w.sunX = Math.cos(angle)
  w.sunY = w.sunHeight
  w.sunZ = -0.35

  w.day = smoothstep(-0.14, 0.2, w.sunHeight)
  w.night = 1 - w.day
  // Peaks while the sun sits on the horizon, for the orange hour.
  w.twilight = 1 - smoothstep(0, 0.32, Math.abs(w.sunHeight))

  // --- director ---------------------------------------------------------
  if (w.blend < 1) {
    w.blend = Math.min(1, w.blend + dt / WEATHER.blendTime)
    if (w.blend >= 1) w.current = w.target
  } else if (!w.locked) {
    w.timer -= dt
    if (w.timer <= 0) setWeather(world, pickNextWeather(w.current))
  }

  blendParams(w.params, WEATHER_TYPES[w.current], WEATHER_TYPES[w.target], w.blend)

  // --- wind -------------------------------------------------------------
  w.windDir += dt * 0.045
  w.gustPhase += dt * (0.6 + w.params.wind * 1.4)
  const gustShape = 0.68 + 0.24 * Math.sin(w.gustPhase * 1.7) + 0.12 * Math.sin(w.gustPhase * 0.43)
  w.gust = w.params.wind * gustShape
  w.windX = Math.cos(w.windDir) * w.gust
  w.windZ = Math.sin(w.windDir) * w.gust

  // --- settled snow -----------------------------------------------------
  const settling = w.params.snow > 0.2 ? 1 : -1
  w.snowCover = Math.max(0, Math.min(1,
    w.snowCover + settling * WEATHER.snowCoverRate * dt * (settling > 0 ? w.params.snow : 1)))

  // --- lightning --------------------------------------------------------
  if (w.params.lightning > 0.35) {
    w.strikeTimer -= dt * w.params.lightning
    if (w.strikeTimer <= 0) {
      w.strikeTimer = WEATHER.lightningMin +
        Math.random() * (WEATHER.lightningMax - WEATHER.lightningMin)
      w.flash = 1
      // Thunder lags the flash, the way it does at distance.
      w.pendingThunder = 0.4 + Math.random() * 2.2
    }
  }
  w.flash = Math.max(0, w.flash - dt * 3.4)
  if (w.pendingThunder > 0) {
    w.pendingThunder -= dt
    if (w.pendingThunder <= 0) {
      playThunder()
      w.pendingThunder = -1
    }
  }

  updateWeatherAmbience(w.params.rain + w.params.snow * 0.35, w.gust)
}

/** Multiplier on how far the police can see, given the weather and the hour. */
export function visibilityFactor(world) {
  const w = world.weather
  return (1 - WEATHER.nightSightPenalty * w.night) *
    (1 - WEATHER.rainSightPenalty * Math.min(1, w.params.rain + w.params.snow))
}
