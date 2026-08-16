import { CAR, HEAT, SCORE } from '../config.js'
import { bumpVehicles } from './vehicle.js'
import { addHeat } from './heat.js'
import { playBump } from '../audio.js'

const PROP_RADIUS = 0.6

/** Every vehicle in the world, player / traffic / police alike. */
function collectVehicles(world, out) {
  out.length = 0
  for (let i = 0; i < world.cars.length; i++) out.push(world.cars[i])
  for (let i = 0; i < world.police.length; i++) {
    if (world.police[i].active) out.push(world.police[i])
  }
  return out
}

const vehicles = []

export function resolveVehicleCollisions(world, dt) {
  const list = collectVehicles(world, vehicles)
  const playerCar = world.player.mode === 'car' ? world.cars[world.player.car] : null

  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    if (a.bumpCooldown > 0) a.bumpCooldown -= dt
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]
      const impact = bumpVehicles(a, b, CAR.radius, CAR.radius)
      if (impact <= 0) continue

      const playerInvolved = a === playerCar || b === playerCar
      if (playerInvolved && impact > 5) {
        const other = a === playerCar ? b : a
        if ((other.bumpCooldown || 0) <= 0) {
          other.bumpCooldown = 1.2
          world.score += SCORE.bumpCar
          world.stats.bumped++
          addHeat(world, HEAT.bumpCar)
          world.camera.shake = Math.min(1, world.camera.shake + impact / 45)
          playBump()
        }
      }
    }
  }
}

export function updateProps(world, dt) {
  const list = collectVehicles(world, vehicles)
  const playerCar = world.player.mode === 'car' ? world.cars[world.player.car] : null

  for (let i = 0; i < world.props.length; i++) {
    const prop = world.props[i]

    for (let v = 0; v < list.length; v++) {
      const car = list[v]
      const dx = prop.x - car.x
      const dz = prop.z - car.z
      const d2 = dx * dx + dz * dz
      const r = CAR.radius + PROP_RADIUS
      if (d2 > r * r) continue
      const d = Math.sqrt(d2) || 1
      const power = Math.abs(car.speed)
      if (power < 2) continue

      prop.vx = (dx / d) * (power * 0.8 + 3)
      prop.vz = (dz / d) * (power * 0.8 + 3)
      prop.vy = 3 + power * 0.2
      prop.spin = (Math.random() - 0.5) * 12

      if (car === playerCar && (prop.cooldown || 0) <= 0) {
        prop.cooldown = 1.5
        world.score += SCORE.hitProp
        addHeat(world, HEAT.hitProp)
      }
    }
    if (prop.cooldown > 0) prop.cooldown -= dt

    // Tumble and settle.
    if (prop.y > 0 || prop.vy !== 0 || prop.vx !== 0 || prop.vz !== 0) {
      prop.vy -= 22 * dt
      prop.y += prop.vy * dt
      prop.x += prop.vx * dt
      prop.z += prop.vz * dt
      prop.tilt += prop.spin * dt

      if (prop.y <= 0) {
        prop.y = 0
        prop.vy = Math.abs(prop.vy) > 2 ? -prop.vy * 0.35 : 0
        const f = Math.max(0, 1 - 5 * dt)
        prop.vx *= f
        prop.vz *= f
        prop.spin *= f
        if (Math.abs(prop.vx) < 0.05 && Math.abs(prop.vz) < 0.05) {
          prop.vx = 0
          prop.vz = 0
          prop.spin = 0
        }
      }
    }
  }
}
