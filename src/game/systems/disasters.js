import { DISASTER, CITY, CAR } from '../config.js'
import { scarePed } from './pedestrians.js'
import { playThunder, playSplash } from '../audio.js'

// Two natural disasters, both played for laughs rather than danger: a tornado
// that picks cars up and spins them around, and a tsunami that rolls in off the
// sea and washes the whole city sideways. Nothing is destroyed and nobody is
// hurt - everything gets soaked, tumbles, lands and carries on.
//
// Each runs as a small state machine: idle -> warning -> active -> receding.
// The warning phase exists so the player gets a few seconds to react.

const EDGE = CITY.half + CITY.roadWidth / 2

export function createDisaster() {
  return {
    type: 'none', // none | tornado | tsunami
    phase: 'idle', // idle | warning | active | receding
    timer: 0,
    cooldown: DISASTER.minGap * 0.6,
    intensity: 0, // 0..1, drives audio and screen shake

    // tornado
    x: 0,
    z: 0,
    headX: 1,
    headZ: 0,
    spin: 0,

    // tsunami
    dirX: 1,
    dirZ: 0,
    front: 0, // distance travelled along dir, measured from the far edge
    span: 1,
    flood: 0, // 0..1 depth of the shallow water left behind
  }
}

/** Start a disaster now (after its warning). Used by the director and the HUD. */
export function triggerDisaster(world, type) {
  const d = world.disaster
  if (d.phase !== 'idle') return false

  d.type = type
  d.phase = 'warning'
  d.timer = DISASTER.warningTime
  d.intensity = 0

  if (type === 'tornado') {
    // Walk in from a random edge, heading roughly across the city.
    const angle = Math.random() * Math.PI * 2
    d.x = Math.cos(angle) * EDGE
    d.z = Math.sin(angle) * EDGE
    const toCentre = Math.atan2(-d.x, -d.z) + (Math.random() - 0.5) * 0.7
    d.headX = Math.sin(toCentre)
    d.headZ = Math.cos(toCentre)
  } else {
    // Pick one of the four coasts and roll straight inland.
    const side = Math.floor(Math.random() * 4)
    d.dirX = side === 0 ? 1 : side === 1 ? -1 : 0
    d.dirZ = side === 2 ? 1 : side === 3 ? -1 : 0
    d.span = EDGE * 2 + DISASTER.tsunami.thickness * 2
    d.front = 0
    d.flood = 0
  }
  playThunder()
  return true
}

/** Where the wave crest currently is, projected on the travel axis. */
function crestPosition(d) {
  return -EDGE - DISASTER.tsunami.thickness + d.front
}

/** Signed distance of a point along the tsunami's travel axis. */
function alongAxis(d, x, z) {
  return x * d.dirX + z * d.dirZ
}

// --- entity plumbing -----------------------------------------------------

function allVehicles(world, out) {
  out.length = 0
  for (let i = 0; i < world.cars.length; i++) out.push(world.cars[i])
  for (let i = 0; i < world.police.length; i++) {
    if (world.police[i].active) out.push(world.police[i])
  }
  return out
}

const vehicles = []

/** Throw a vehicle into the air; the ballistic integrator takes it from there. */
function launchVehicle(car, lift) {
  car.airborne = true
  car.vy = Math.max(car.vy || 0, lift)
  car.rollV = (car.rollV || 0) + (Math.random() - 0.5) * 7
  car.pitchV = (car.pitchV || 0) + (Math.random() - 0.5) * 5
  car.speed *= 0.5
}

/**
 * Ballistics for everything currently in the air. Airborne cars move by their
 * fling velocity rather than by direct position nudges, which is what lets one
 * carry on across the city after the funnel spits it out.
 */
function integrateVehicles(world, dt) {
  const list = allVehicles(world, vehicles)
  const T = DISASTER.tornado
  for (let i = 0; i < list.length; i++) {
    const car = list[i]
    if (!car.airborne) continue

    car.vy -= T.gravity * dt
    car.y = (car.y || 0) + car.vy * dt

    car.x += (car.flingX || 0) * dt
    car.z += (car.flingZ || 0) * dt
    const drag = Math.max(0, 1 - T.airDrag * dt)
    car.flingX = (car.flingX || 0) * drag
    car.flingZ = (car.flingZ || 0) * drag

    // Airborne cars bypass the usual wall collision, so keep them on the island
    // instead of letting a big wave deposit the whole traffic system at sea.
    const limit = EDGE - CAR.radius - 1
    if (car.x > limit) { car.x = limit; car.flingX = -Math.abs(car.flingX) * 0.4 }
    else if (car.x < -limit) { car.x = -limit; car.flingX = Math.abs(car.flingX) * 0.4 }
    if (car.z > limit) { car.z = limit; car.flingZ = -Math.abs(car.flingZ) * 0.4 }
    else if (car.z < -limit) { car.z = -limit; car.flingZ = Math.abs(car.flingZ) * 0.4 }

    car.roll = (car.roll || 0) + (car.rollV || 0) * dt
    car.pitch = (car.pitch || 0) + (car.pitchV || 0) * dt

    if (car.y <= 0) {
      car.y = 0
      if (Math.abs(car.vy) > 4) {
        // Bounce, shedding most of the energy each time.
        car.vy = -car.vy * 0.32
        car.rollV *= 0.5
        car.pitchV *= 0.5
        car.flingX *= 0.55
        car.flingZ *= 0.55
      } else {
        car.vy = 0
        car.airborne = false
        car.flingX = 0
        car.flingZ = 0
        // Settle upright rather than leaving the car lying on its roof.
        car.roll = 0
        car.pitch = 0
        car.rollV = 0
        car.pitchV = 0
      }
    }
  }
}

// --- tornado -------------------------------------------------------------

function updateTornado(world, dt) {
  const d = world.disaster
  const T = DISASTER.tornado

  // Wander across town, bouncing off the coast so it stays in play.
  d.x += d.headX * T.moveSpeed * dt
  d.z += d.headZ * T.moveSpeed * dt
  if (Math.abs(d.x) > EDGE) d.headX *= -1
  if (Math.abs(d.z) > EDGE) d.headZ *= -1
  d.spin += dt * 5

  const r2 = T.radius * T.radius
  const list = allVehicles(world, vehicles)

  // Vehicles: dragged in, spun around, and thrown once they reach the core.
  for (let i = 0; i < list.length; i++) {
    const car = list[i]
    const dx = d.x - car.x
    const dz = d.z - car.z
    const dist2 = dx * dx + dz * dz
    if (dist2 > r2) continue

    const dist = Math.sqrt(dist2) || 0.01
    const falloff = (1 - dist / T.radius) * d.intensity
    const nx = dx / dist
    const nz = dz / dist

    if (car.airborne) {
      // Held in the funnel: orbit fast, drift inward, and keep climbing until
      // it tops out. Leaving the radius means it keeps this velocity and flies.
      const tangential = T.swirl * falloff * 1.3
      const inward = T.pull * falloff * 0.4
      car.flingX = -nz * tangential + nx * inward
      car.flingZ = nx * tangential + nz * inward
      if (car.y < T.maxHeight) car.vy += T.liftAccel * falloff * dt
      car.rollV += (Math.random() - 0.5) * 6 * falloff * dt
      car.pitchV += (Math.random() - 0.5) * 4 * falloff * dt
    } else {
      // Still on its wheels: dragged across the tarmac toward the funnel.
      car.x += (nx * T.pull + -nz * T.swirl) * falloff * dt
      car.z += (nz * T.pull + nx * T.swirl) * falloff * dt
      if (dist < T.core * 2.2) launchVehicle(car, T.carLift * falloff)
    }

    car.heading += 3.5 * falloff * dt
    car.soaked = Math.max(car.soaked, 4)
  }

  // Pedestrians: same treatment, but they always land on their feet.
  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) continue
    const dx = d.x - ped.x
    const dz = d.z - ped.z
    const dist2 = dx * dx + dz * dz
    if (dist2 > r2) continue

    const dist = Math.sqrt(dist2) || 0.01
    const falloff = (1 - dist / T.radius) * d.intensity
    const nx = dx / dist
    const nz = dz / dist
    ped.x += (nx * T.pull * 0.8 + -nz * T.swirl) * falloff * dt
    ped.z += (nz * T.pull * 0.8 + nx * T.swirl) * falloff * dt
    if (dist < T.core * 2 && ped.y <= 0.05) ped.vy = T.pedLift * falloff
    scarePed(ped, d.x, d.z)
  }

  // Street furniture goes flying, which sells the scale of it.
  for (let i = 0; i < world.props.length; i++) {
    const prop = world.props[i]
    const dx = d.x - prop.x
    const dz = d.z - prop.z
    const dist2 = dx * dx + dz * dz
    if (dist2 > r2) continue
    const dist = Math.sqrt(dist2) || 0.01
    const falloff = (1 - dist / T.radius) * d.intensity
    const nx = dx / dist
    const nz = dz / dist
    prop.vx += (nx * 12 + -nz * 26) * falloff * dt
    prop.vz += (nz * 12 + nx * 26) * falloff * dt
    if (prop.y <= 0.05) prop.vy = 9 * falloff
    prop.spin += 18 * falloff * dt
  }

  // The player on foot gets swept off their feet too.
  const p = world.player
  if (p.mode === 'foot') {
    const dx = d.x - p.x
    const dz = d.z - p.z
    const dist = Math.hypot(dx, dz)
    if (dist < T.radius) {
      const falloff = (1 - dist / T.radius) * d.intensity
      const nx = dx / (dist || 1)
      const nz = dz / (dist || 1)
      p.x += (nx * T.pull * 0.7 + -nz * T.swirl * 0.9) * falloff * dt
      p.z += (nz * T.pull * 0.7 + nx * T.swirl * 0.9) * falloff * dt
      if (dist < T.core * 2 && p.onGround) {
        p.vy = T.lift * 0.5 * falloff
        p.onGround = false
      }
      world.camera.shake = Math.min(1, world.camera.shake + falloff * dt * 3)
    }
  }
}

// --- tsunami -------------------------------------------------------------

function updateTsunami(world, dt) {
  const d = world.disaster
  const W = DISASTER.tsunami

  d.front += W.speed * dt
  const crest = crestPosition(d)

  const shove = (ent, strength) => {
    ent.x += d.dirX * W.push * strength * dt
    ent.z += d.dirZ * W.push * strength * dt
  }

  const list = allVehicles(world, vehicles)
  for (let i = 0; i < list.length; i++) {
    const car = list[i]
    const s = alongAxis(d, car.x, car.z)
    const behind = crest - s
    if (behind < 0 || behind > W.thickness) continue

    // Strongest right at the crest, tapering off through the churn behind it.
    const strength = (1 - behind / W.thickness) * d.intensity
    car.heading += (Math.random() - 0.5) * 2.4 * strength * dt
    car.soaked = 8
    if (car.airborne) {
      // Carried on the face of the wave rather than nudged along the ground.
      car.flingX = d.dirX * W.push * strength
      car.flingZ = d.dirZ * W.push * strength
    } else {
      shove(car, strength)
      if (strength > 0.45) launchVehicle(car, W.lift * strength)
    }
  }

  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) continue
    const s = alongAxis(d, ped.x, ped.z)
    const behind = crest - s
    if (behind < 0 || behind > W.thickness) continue
    const strength = (1 - behind / W.thickness) * d.intensity
    shove(ped, strength * 0.9)
    ped.soaked = 6
    if (ped.y <= 0.05 && strength > 0.4) ped.vy = 6 * strength
    scarePed(ped, ped.x - d.dirX, ped.z - d.dirZ)
  }

  for (let i = 0; i < world.props.length; i++) {
    const prop = world.props[i]
    const s = alongAxis(d, prop.x, prop.z)
    const behind = crest - s
    if (behind < 0 || behind > W.thickness) continue
    const strength = (1 - behind / W.thickness) * d.intensity
    prop.vx += d.dirX * 30 * strength * dt
    prop.vz += d.dirZ * 30 * strength * dt
    if (prop.y <= 0.05) prop.vy = 7 * strength
    prop.spin += 10 * strength * dt
  }

  const p = world.player
  const ps = alongAxis(d, p.x, p.z)
  const pBehind = crest - ps
  if (pBehind >= 0 && pBehind < W.thickness) {
    const strength = (1 - pBehind / W.thickness) * d.intensity
    if (p.mode === 'foot') {
      shove(p, strength)
      if (p.onGround && strength > 0.4) {
        p.vy = 7 * strength
        p.onGround = false
      }
    }
    p.soaked = 6
    world.camera.shake = Math.min(1, world.camera.shake + strength * dt * 4)
    if (pBehind < 3) playSplash()
  }

  // Shallow water lingers behind the wave, then drains away.
  d.flood = Math.min(1, d.flood + dt * 0.8)
}

// --- director ------------------------------------------------------------

export function updateDisasters(world, dt) {
  const d = world.disaster
  integrateVehicles(world, dt)

  if (d.phase === 'idle') {
    d.intensity = Math.max(0, d.intensity - dt)
    if (d.flood > 0) d.flood = Math.max(0, d.flood - dt / DISASTER.tsunami.floodTime)
    if (d.locked) return

    d.cooldown -= dt
    if (d.cooldown <= 0) {
      const stormy = world.weather.params.lightning > 0.4
      const wantsTsunami = Math.random() < 0.5
      if (stormy || Math.random() < DISASTER.stormChance) {
        triggerDisaster(world, wantsTsunami ? 'tsunami' : 'tornado')
      }
      d.cooldown = DISASTER.minGap + Math.random() * (DISASTER.maxGap - DISASTER.minGap)
    }
    return
  }

  if (d.phase === 'warning') {
    d.timer -= dt
    // Ramp the effect in so nothing snaps into motion.
    d.intensity = Math.min(1, 1 - d.timer / DISASTER.warningTime)
    if (d.timer <= 0) {
      d.phase = 'active'
      d.timer = d.type === 'tornado'
        ? DISASTER.tornado.duration
        : (d.span / DISASTER.tsunami.speed)
      d.intensity = 1
    }
    // The tornado is already visible and churning during the warning.
    if (d.type === 'tornado') updateTornado(world, dt)
    return
  }

  if (d.phase === 'active') {
    d.timer -= dt
    if (d.type === 'tornado') updateTornado(world, dt)
    else updateTsunami(world, dt)
    if (d.timer <= 0) {
      d.phase = 'receding'
      d.timer = 6
    }
    return
  }

  // receding
  d.timer -= dt
  d.intensity = Math.max(0, d.timer / 6)
  if (d.type === 'tornado') updateTornado(world, dt)
  if (d.timer <= 0) {
    d.phase = 'idle'
    d.type = 'none'
    d.intensity = 0
    d.cooldown = DISASTER.minGap + Math.random() * (DISASTER.maxGap - DISASTER.minGap)
  }
}

/** Height of standing flood water at a point, or 0. Used by the renderer. */
export function floodDepth(world) {
  const d = world.disaster
  return d.flood * 0.9
}

export function disasterLabel(world) {
  const d = world.disaster
  if (d.phase === 'idle') return null
  const name = d.type === 'tornado' ? 'TORNADO' : 'TSUNAMI'
  if (d.phase === 'warning') return `${name} INCOMING — ${Math.ceil(d.timer)}`
  if (d.phase === 'active') return name
  return `${name} passing`
}
