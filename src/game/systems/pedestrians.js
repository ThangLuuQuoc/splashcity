import { CROWD, CAR, HEAT, SCORE } from '../config.js'
import { resolveStatic } from '../collision.js'
import { ringPoint } from '../world.js'
import { addHeat } from './heat.js'
import { playBump } from '../audio.js'

const PED_RADIUS = 0.42

export function scarePed(ped, fromX, fromZ) {
  ped.state = 'flee'
  ped.fleeTimer = CROWD.fleeTime
  const dx = ped.x - fromX
  const dz = ped.z - fromZ
  const d = Math.hypot(dx, dz) || 1
  ped.fleeX = dx / d
  ped.fleeZ = dz / d
}

export function updatePedestrians(world, dt) {
  const player = world.player
  const playerCar = player.mode === 'car' ? world.cars[player.car] : null
  const playerSpeed = playerCar ? Math.abs(playerCar.speed) : 0

  // Rain and snow send people indoors, and the ones still out walk briskly.
  const w = world.weather
  const badWeather = w ? Math.min(1, w.params.rain + w.params.snow) : 0
  const hurry = 1 + badWeather * 0.5

  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    ped.indoors = badWeather > ped.shy
    if (ped.indoors) continue
    if (ped.soaked > 0) ped.soaked -= dt

    // Scared by a fast car nearby, or by anyone with a wanted level.
    const dxp = ped.x - player.x
    const dzp = ped.z - player.z
    const distToPlayer = Math.hypot(dxp, dzp)
    if (ped.state !== 'flee') {
      const scary = (playerSpeed > 14 && distToPlayer < CROWD.fleeRadius) ||
        (world.stars > 0 && distToPlayer < CROWD.fleeRadius * 0.6)
      if (scary) scarePed(ped, player.x, player.z)
    }

    let tx, tz, speed
    if (ped.state === 'flee') {
      ped.fleeTimer -= dt
      if (ped.fleeTimer <= 0) ped.state = 'walk'
      // Keep running away from the player, refreshing the direction as they move.
      if (distToPlayer < CROWD.fleeRadius * 1.5 && distToPlayer > 0.01) {
        ped.fleeX = dxp / distToPlayer
        ped.fleeZ = dzp / distToPlayer
      }
      tx = ped.x + ped.fleeX * 6
      tz = ped.z + ped.fleeZ * 6
      speed = CROWD.pedFleeSpeed
    } else {
      ped.t += ped.dir * ped.speed * hurry * dt
      const target = ringPoint(ped.block, ped.ring, ped.t)
      tx = target.x
      tz = target.z
      speed = ped.speed * hurry
    }

    let dx = tx - ped.x
    let dz = tz - ped.z
    const d = Math.hypot(dx, dz)
    if (d > 0.001) {
      dx /= d
      dz /= d
      ped.vx += (dx * speed - ped.vx) * Math.min(1, dt * 6)
      ped.vz += (dz * speed - ped.vz) * Math.min(1, dt * 6)
    }

    // A knock from a car sends them hopping.
    if (ped.y > 0 || ped.vy > 0) {
      ped.vy -= 22 * dt
      ped.y += ped.vy * dt
      if (ped.y <= 0) {
        ped.y = 0
        ped.vy = 0
      }
    }

    ped.x += ped.vx * dt
    ped.z += ped.vz * dt
    resolveStatic(world.bp, ped, PED_RADIUS)

    const moving = Math.hypot(ped.vx, ped.vz)
    if (moving > 0.05) ped.heading = Math.atan2(ped.vx, ped.vz)
    ped.phase += moving * dt * 2.2
  }
}

/** Cars knock pedestrians into a comic tumble - no damage, just a hop and a run. */
export function carsVersusPedestrians(world, dt) {
  const all = world.cars
  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) continue
    for (let c = 0; c < all.length; c++) {
      const car = all[c]
      const dx = ped.x - car.x
      const dz = ped.z - car.z
      const d2 = dx * dx + dz * dz
      const r = CAR.radius + PED_RADIUS
      if (d2 > r * r) continue
      const d = Math.sqrt(d2) || 1
      const nx = dx / d
      const nz = dz / d
      const push = (r - d) + Math.abs(car.speed) * 0.12
      ped.x += nx * push
      ped.z += nz * push
      ped.vx = nx * (6 + Math.abs(car.speed) * 0.5)
      ped.vz = nz * (6 + Math.abs(car.speed) * 0.5)
      if (ped.y <= 0 && Math.abs(car.speed) > 6) ped.vy = 4.5
      scarePed(ped, car.x, car.z)

      if (car.driver === 'player' && Math.abs(car.speed) > 8 && ped.bumpCooldown === undefined) {
        ped.bumpCooldown = 0
      }
      if (car.driver === 'player' && Math.abs(car.speed) > 8 && (ped.bumpCooldown || 0) <= 0) {
        ped.bumpCooldown = 1.5
        world.score += SCORE.bumpCar
        world.stats.bumped++
        addHeat(world, HEAT.bumpCar * 0.6)
        playBump()
      }
    }
    if (ped.bumpCooldown > 0) ped.bumpCooldown -= dt
  }
}
