import { ACTIONS, HEAT, SCORE, CAR, WEATHER } from '../config.js'
import { nearbyBoxes } from '../collision.js'
import { addHeat } from './heat.js'
import { scarePed } from './pedestrians.js'
import { playSplash } from '../audio.js'

function spawnSplash(world, x, y, z) {
  let slot = world.splashes.find((s) => !s.active)
  if (!slot) slot = world.splashes[0]
  slot.active = true
  slot.x = x
  slot.y = y
  slot.z = z
  slot.life = 0
  slot.max = 0.55
  playSplash()
}

function pointInsideBuilding(world, x, y, z) {
  if (y > 60) return false
  const boxes = nearbyBoxes(world.bp, x, z, 0.4)
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ && y <= b.height) return true
  }
  return false
}

/** Everything within the splash radius gets soaked and runs off laughing. */
function applySplash(world, x, z, fromPlayer) {
  let heat = 0
  let score = 0
  const r2 = ACTIONS.splashRadius * ACTIONS.splashRadius

  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) continue
    const dx = ped.x - x
    const dz = ped.z - z
    if (dx * dx + dz * dz > r2) continue
    if (ped.soaked <= 0) {
      heat += HEAT.splashPed
      score += SCORE.splashPed
      world.stats.splashed++
    }
    ped.soaked = 6
    scarePed(ped, x, z)
    ped.vy = Math.max(ped.vy, 3)
  }

  for (let i = 0; i < world.cars.length; i++) {
    const car = world.cars[i]
    if (car.driver === 'player') continue
    const dx = car.x - x
    const dz = car.z - z
    if (dx * dx + dz * dz > r2 + CAR.radius * CAR.radius) continue
    if (car.soaked <= 0) {
      heat += HEAT.splashCar
      score += SCORE.splashCar
      world.stats.splashed++
    }
    car.soaked = 8
  }

  for (let i = 0; i < world.police.length; i++) {
    const cop = world.police[i]
    if (!cop.active) continue
    const dx = cop.x - x
    const dz = cop.z - z
    if (dx * dx + dz * dz > r2 + CAR.radius * CAR.radius) continue
    if (cop.soaked <= 0) {
      heat += HEAT.splashCop
      score += SCORE.splashCop
      world.stats.splashed++
    }
    cop.soaked = 8
  }

  for (let i = 0; i < world.footCops.length; i++) {
    const cop = world.footCops[i]
    if (!cop.active) continue
    const dx = cop.x - x
    const dz = cop.z - z
    if (dx * dx + dz * dz > r2) continue
    if (cop.soaked <= 0) {
      heat += HEAT.splashCop
      score += SCORE.splashCop
      world.stats.splashed++
    }
    cop.soaked = 8
    // A soaked cop stops to wipe their face, which is your chance to run.
    cop.vx *= 0.1
    cop.vz *= 0.1
  }

  if (fromPlayer) {
    world.score += score
    if (heat > 0) addHeat(world, heat)
  }
}

export function updateProjectiles(world, dt) {
  for (let i = 0; i < world.balloons.length; i++) {
    const b = world.balloons[i]
    if (!b.active) continue

    b.life += dt
    b.vy -= ACTIONS.balloonGravity * dt
    // A gust pushes the balloon off course - aiming into the wind is a real skill.
    if (world.weather) {
      b.vx += world.weather.windX * WEATHER.windBalloonForce * dt
      b.vz += world.weather.windZ * WEATHER.windBalloonForce * dt
    }
    const nx = b.x + b.vx * dt
    const ny = b.y + b.vy * dt
    const nz = b.z + b.vz * dt

    let hit = false
    let hx = nx, hy = ny, hz = nz

    if (ny <= 0.15) {
      hit = true
      hy = 0.12
    } else if (pointInsideBuilding(world, nx, ny, nz)) {
      hit = true
      // Back off to the last free point so the splash sits on the wall.
      hx = b.x
      hy = b.y
      hz = b.z
    } else {
      const r = ACTIONS.balloonRadius
      for (let j = 0; j < world.peds.length && !hit; j++) {
        const ped = world.peds[j]
        if (ped.indoors) continue
        if (Math.abs(ny - (ped.y + 0.9)) > 1.4) continue
        const dx = ped.x - nx
        const dz = ped.z - nz
        if (dx * dx + dz * dz < (0.6 + r) * (0.6 + r)) hit = true
      }
      for (let j = 0; j < world.cars.length && !hit; j++) {
        const car = world.cars[j]
        if (car.driver === 'player') continue
        if (ny > 2.6) continue
        const dx = car.x - nx
        const dz = car.z - nz
        if (dx * dx + dz * dz < (CAR.radius + r) * (CAR.radius + r)) hit = true
      }
      for (let j = 0; j < world.police.length && !hit; j++) {
        const cop = world.police[j]
        if (!cop.active || ny > 2.8) continue
        const dx = cop.x - nx
        const dz = cop.z - nz
        if (dx * dx + dz * dz < (CAR.radius + r) * (CAR.radius + r)) hit = true
      }
      for (let j = 0; j < world.footCops.length && !hit; j++) {
        const cop = world.footCops[j]
        if (!cop.active || Math.abs(ny - 1) > 1.5) continue
        const dx = cop.x - nx
        const dz = cop.z - nz
        if (dx * dx + dz * dz < (0.65 + r) * (0.65 + r)) hit = true
      }
    }

    if (hit || b.life > 5) {
      b.active = false
      if (hit) {
        spawnSplash(world, hx, hy + 0.2, hz)
        applySplash(world, hx, hz, true)
      }
      continue
    }

    b.x = nx
    b.y = ny
    b.z = nz
  }

  for (let i = 0; i < world.splashes.length; i++) {
    const s = world.splashes[i]
    if (!s.active) continue
    s.life += dt
    if (s.life >= s.max) s.active = false
  }
}
