import { ACTIONS, HEAT, SCORE, CAR, WEATHER, POLICE_HELI } from '../config.js'
import { nearbyBoxes } from '../collision.js'
import { addHeat } from './heat.js'
import { scarePed } from './pedestrians.js'
import { playSplash } from '../audio.js'

function spawnSplash(world, x, y, z, isMega = false) {
  let slot = world.splashes.find((s) => !s.active)
  if (!slot) slot = world.splashes[0]
  slot.active = true
  slot.x = x
  slot.y = y
  slot.z = z
  slot.life = 0
  slot.max = isMega ? 0.9 : 0.55
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
function applySplash(world, x, z, fromPlayer, isMega = false) {
  let heat = 0
  let score = 0
  const radius = isMega ? ACTIONS.splashRadius * 2.0 : ACTIONS.splashRadius
  const r2 = radius * radius

  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) continue
    const dx = ped.x - x
    const dz = ped.z - z
    if (dx * dx + dz * dz > r2) continue
    if (ped.soaked <= 0) {
      heat += HEAT.splashPed
      score += isMega ? SCORE.splashPed * 2 : SCORE.splashPed
      world.stats.splashed++
    }
    ped.soaked = isMega ? 10 : 6
    scarePed(ped, x, z)
    ped.vy = Math.max(ped.vy, isMega ? 6 : 3)
  }

  for (let i = 0; i < world.cars.length; i++) {
    const car = world.cars[i]
    if (car.driver === 'player') continue
    const dx = car.x - x
    const dz = car.z - z
    if (dx * dx + dz * dz > r2 + CAR.radius * CAR.radius) continue
    if (car.soaked <= 0) {
      heat += HEAT.splashCar
      score += isMega ? SCORE.splashCar * 2 : SCORE.splashCar
      world.stats.splashed++
    }
    car.soaked = isMega ? 12 : 8
  }

  for (let i = 0; i < world.police.length; i++) {
    const cop = world.police[i]
    if (!cop.active) continue
    const dx = cop.x - x
    const dz = cop.z - z
    if (dx * dx + dz * dz > r2 + CAR.radius * CAR.radius) continue
    if (cop.soaked <= 0) {
      heat += HEAT.splashCop
      score += isMega ? SCORE.splashCop * 2 : SCORE.splashCop
      world.stats.splashed++
    }
    cop.soaked = isMega ? 12 : 8
  }

  for (let i = 0; i < world.footCops.length; i++) {
    const cop = world.footCops[i]
    if (!cop.active) continue
    const dx = cop.x - x
    const dz = cop.z - z
    if (dx * dx + dz * dz > r2) continue
    if (cop.soaked <= 0) {
      heat += HEAT.splashCop
      score += isMega ? SCORE.splashCop * 2 : SCORE.splashCop
      world.stats.splashed++
    }
    cop.soaked = isMega ? 12 : 8
    // A soaked cop stops to wipe their face, which is your chance to run.
    cop.vx *= 0.1
    cop.vz *= 0.1
  }

  if (fromPlayer) {
    world.score += score
    if (isMega) world.camera.shake = Math.min(1, world.camera.shake + 0.45)
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
    // Trực thăng cảnh sát xử lý riêng: applySplash chỉ tính bán kính phẳng, mà mục tiêu
    // này thì nằm cách mặt đất mấy chục mét.
    let hitHeli = null

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
      const r = b.isMega ? ACTIONS.balloonRadius * 1.8 : ACTIONS.balloonRadius
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
      // Bán kính rộng tay hơn hẳn: ném trúng một mục tiêu đang bay vòng quanh mình ở
      // 20m là việc khó, mà đây lại là đường phản đòn duy nhất khi đang bị vòi rồng dí.
      for (let j = 0; j < world.policeHelis.length && !hit; j++) {
        const ph = world.policeHelis[j]
        if (!ph.active || ph.soaked > 0) continue
        const dx = ph.x - nx
        const dy = ph.y + 1.6 - ny
        const dz = ph.z - nz
        const reach = POLICE_HELI.bodyRadius + 1.2 + r
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          hit = true
          hitHeli = ph
        }
      }
    }

    if (hit || b.life > 5) {
      b.active = false
      if (hit) {
        spawnSplash(world, hx, hy + 0.2, hz, b.isMega)
        if (hitHeli) {
          // Kính buồng lái nhoè nước: phi công phải lùi ra lau, ngừng phun vòi rồng.
          hitHeli.soaked = POLICE_HELI.soakedRecoil * (b.isMega ? 1.6 : 1)
          hitHeli.cannonOn = false
          hitHeli.spotOn = false
          world.score += b.isMega ? SCORE.splashCop * 2 : SCORE.splashCop
          world.stats.splashed++
          addHeat(world, HEAT.splashCop)
        } else {
          applySplash(world, hx, hz, true, b.isMega)
        }
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

