import { CAR, HEAT, SCORE } from '../config.js'
import { bumpVehicles } from './vehicle.js'
import { addHeat } from './heat.js'
import { playBump, playBananaSlip } from '../audio.js'


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

export function resolveBananas(world, dt) {
  const list = collectVehicles(world, vehicles)

  for (const b of world.bananas) {
    if (!b.active) continue

    // Chỉ tác động khi ở cùng độ cao y
    // Kiểm tra xe cán trúng vỏ chuối
    for (let v = 0; v < list.length; v++) {
      const car = list[v]
      if (Math.abs(b.y - car.y) > 1.8) continue
      const dx = b.x - car.x
      const dz = b.z - car.z
      const dist = Math.hypot(dx, dz)
      if (dist < CAR.radius + 0.5) {
        b.active = false
        car.heading += (Math.random() - 0.5) * 4.0
        car.speed *= 0.2
        car.steer = (Math.random() - 0.5) * 8.0
        world.score += 150
        world.camera.shake = 0.3
        playBananaSlip()
        break
      }
    }

    // Kiểm tra người đi bộ đạp trúng vỏ chuối
    if (!b.active) continue
    for (const ped of world.peds) {
      if (Math.abs(b.y - ped.y) > 1.8) continue
      const dist = Math.hypot(b.x - ped.x, b.z - ped.z)
      if (dist < 1.2) {
        b.active = false
        ped.state = 'flee'
        ped.fleeTimer = 4.0
        ped.heading += Math.PI
        world.score += 75
        playBananaSlip()
        break
      }
    }
  }

  // Xử lý vệt trơn trượt Kem Đánh Răng P/S Dâu
  if (world.toothpastePatches && world.toothpastePatches.length > 0) {
    const p = world.player
    for (let i = world.toothpastePatches.length - 1; i >= 0; i--) {
      const patch = world.toothpastePatches[i]
      patch.life -= dt
      if (patch.life <= 0) {
        world.toothpastePatches.splice(i, 1)
        continue
      }
      // Người chơi bước vào vệt dâu
      if (Math.abs(p.y - patch.y) < 1.5 && Math.hypot(p.x - patch.x, p.z - patch.z) < patch.radius) {
        p.vx *= 1.05
        p.vz *= 1.05
      }
      // NPC bước vào vệt dâu
      for (const ped of world.peds) {
        if (Math.abs(ped.y - patch.y) < 1.5 && Math.hypot(ped.x - patch.x, ped.z - patch.z) < patch.radius) {
          ped.vx = (Math.random() - 0.5) * 6
          ped.vz = (Math.random() - 0.5) * 6
          ped.state = 'flee'
          ped.fleeTimer = 2.0
        }
      }
    }
  }
}


