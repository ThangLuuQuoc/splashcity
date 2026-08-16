// A tiny WebAudio synth so the game ships with zero binary assets.

let ctx = null
let master = null
let siren = null
let muted = false

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.35
  master.connect(ctx.destination)
  return ctx
}

export function unlockAudio() {
  const c = ensure()
  if (c && c.state === 'suspended') c.resume()
}

export function setMuted(value) {
  muted = value
  if (master) master.gain.value = value ? 0 : 0.35
}

function noiseBuffer(duration) {
  const len = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function blip({ type = 'sine', freq = 440, to = freq, dur = 0.15, gain = 0.3 }) {
  const c = ensure()
  if (!c || muted) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), c.currentTime + dur)
  g.gain.setValueAtTime(gain, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  osc.connect(g).connect(master)
  osc.start()
  osc.stop(c.currentTime + dur + 0.02)
}

export function playSplash() {
  const c = ensure()
  if (!c || muted) return
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(0.25)
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1800, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.25)
  const g = c.createGain()
  g.gain.setValueAtTime(0.45, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
  src.connect(filter).connect(g).connect(master)
  src.start()
}

export function playThrow() {
  blip({ type: 'triangle', freq: 620, to: 300, dur: 0.1, gain: 0.12 })
}

export function playBump() {
  const c = ensure()
  if (!c || muted) return
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(0.18)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 500
  const g = c.createGain()
  g.gain.setValueAtTime(0.5, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18)
  src.connect(filter).connect(g).connect(master)
  src.start()
  blip({ type: 'square', freq: 140, to: 70, dur: 0.12, gain: 0.1 })
}

export function playPickup() {
  blip({ type: 'sine', freq: 660, to: 1320, dur: 0.18, gain: 0.2 })
}

export function playStar() {
  blip({ type: 'square', freq: 440, to: 880, dur: 0.22, gain: 0.15 })
}

export function playBusted() {
  blip({ type: 'sawtooth', freq: 300, to: 90, dur: 0.9, gain: 0.25 })
}

export function playEngineStart() {
  blip({ type: 'sawtooth', freq: 90, to: 180, dur: 0.35, gain: 0.14 })
}

export function playThunder() {
  const c = ensure()
  if (!c || muted) return
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(2.2)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(900, c.currentTime)
  filter.frequency.exponentialRampToValueAtTime(90, c.currentTime + 2.0)
  const g = c.createGain()
  // A sharp crack that decays into a long rumble.
  g.gain.setValueAtTime(0.001, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.75, c.currentTime + 0.05)
  g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.5)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.2)
  src.connect(filter).connect(g).connect(master)
  src.start()
}

// A single looping noise bed, filtered two ways: bright hiss for rain, a low
// moan for wind. Cheaper and steadier than retriggering one-shots.
let ambience = null

function ensureAmbience() {
  const c = ensure()
  if (!c || ambience) return ambience

  const src = c.createBufferSource()
  src.buffer = noiseBuffer(3)
  src.loop = true

  const rainFilter = c.createBiquadFilter()
  rainFilter.type = 'highpass'
  rainFilter.frequency.value = 1400
  const rainGain = c.createGain()
  rainGain.gain.value = 0

  const windFilter = c.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = 340
  const windGain = c.createGain()
  windGain.gain.value = 0

  src.connect(rainFilter).connect(rainGain).connect(master)
  src.connect(windFilter).connect(windGain).connect(master)
  src.start()

  ambience = { rainGain, windGain, windFilter }
  return ambience
}

/** Rain hiss and wind moan, both 0..1. */
export function updateWeatherAmbience(rain, wind) {
  const c = ctx
  if (muted) {
    if (ambience) {
      ambience.rainGain.gain.value = 0
      ambience.windGain.gain.value = 0
    }
    return
  }
  if (rain < 0.01 && wind < 0.05 && !ambience) return
  const a = ensureAmbience()
  if (!a || !c) return
  a.rainGain.gain.setTargetAtTime(Math.min(1, rain) * 0.16, c.currentTime, 0.5)
  a.windGain.gain.setTargetAtTime(Math.min(1, wind) * 0.3, c.currentTime, 0.7)
  a.windFilter.frequency.setTargetAtTime(240 + wind * 320, c.currentTime, 0.6)
}

/** Continuous two-tone siren; intensity 0 stops it. */
export function updateSiren(intensity) {
  const c = ensure()
  if (!c) return
  if (intensity <= 0 || muted) {
    if (siren) {
      siren.gain.gain.setTargetAtTime(0, c.currentTime, 0.1)
    }
    return
  }
  if (!siren) {
    const osc = c.createOscillator()
    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    const gain = c.createGain()
    osc.type = 'square'
    osc.frequency.value = 640
    lfo.type = 'sine'
    lfo.frequency.value = 1.7
    lfoGain.gain.value = 180
    lfo.connect(lfoGain).connect(osc.frequency)
    gain.gain.value = 0
    osc.connect(gain).connect(master)
    osc.start()
    lfo.start()
    siren = { osc, lfo, gain }
  }
  siren.gain.gain.setTargetAtTime(0.06 * intensity, c.currentTime, 0.15)
  siren.lfo.frequency.setTargetAtTime(1.3 + intensity * 1.2, c.currentTime, 0.2)
}
