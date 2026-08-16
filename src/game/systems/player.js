import { PLAYER, CAMERA } from '../config.js'
import { resolveStatic } from '../collision.js'
import { supportHeight } from '../rail.js'
import { driveVehicle } from './vehicle.js'
import { findBoardableCar, boardTrain, rideTrain, leaveTrain } from './train.js'
import { input, keyDown, keyPressed } from './input.js'
import { playEngineStart } from '../audio.js'

const shortAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export function updateCamera(world, dt) {
  const cam = world.camera
  cam.yaw -= input.mouseDX * CAMERA.mouseSensitivity
  cam.pitch += input.mouseDY * CAMERA.mouseSensitivity
  cam.pitch = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, cam.pitch))

  // Arrow keys / Q-E turn the camera too, so a mouse is never required.
  const turn = (keyDown('ArrowLeft') || keyDown('KeyQ') ? 1 : 0) -
    (keyDown('ArrowRight') || keyDown('KeyR') ? 1 : 0)
  cam.yaw += turn * 2.2 * dt
  const tilt = (keyDown('ArrowUp') ? -1 : 0) + (keyDown('ArrowDown') ? 1 : 0)
  cam.pitch = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, cam.pitch + tilt * 1.4 * dt))

  if (cam.shake > 0) cam.shake = Math.max(0, cam.shake - dt * 2.2)
}

function tryExitCar(world, car) {
  const p = world.player
  const sideX = Math.cos(car.heading)
  const sideZ = -Math.sin(car.heading)
  const candidates = [
    { x: car.x + sideX * 3.2, z: car.z + sideZ * 3.2 },
    { x: car.x - sideX * 3.2, z: car.z - sideZ * 3.2 },
    { x: car.x - Math.sin(car.heading) * 4.5, z: car.z - Math.cos(car.heading) * 4.5 },
    { x: car.x, z: car.z },
  ]
  for (const c of candidates) {
    const probe = { x: c.x, z: c.z }
    const hit = resolveStatic(world.bp, probe, PLAYER.radius)
    if (hit.depth === 0) {
      p.x = probe.x
      p.z = probe.z
      return
    }
  }
  p.x = car.x
  p.z = car.z
}

function findNearestCar(world) {
  const p = world.player
  let best = -1
  let bestDist = PLAYER.enterRange * PLAYER.enterRange
  for (let i = 0; i < world.cars.length; i++) {
    const c = world.cars[i]
    if (c.driver === 'player') continue
    const dx = c.x - p.x
    const dz = c.z - p.z
    const d2 = dx * dx + dz * dz
    if (d2 < bestDist) {
      bestDist = d2
      best = i
    }
  }
  return best
}

export function updatePlayer(world, dt) {
  const p = world.player
  const cam = world.camera

  if (p.invuln > 0) p.invuln -= dt
  if (p.enterCooldown > 0) p.enterCooldown -= dt
  if (p.soaked > 0) p.soaked -= dt

  const enterPressed = keyPressed('KeyE') && p.enterCooldown <= 0

  if (p.mode === 'train') {
    if (enterPressed) {
      leaveTrain(world)
      return
    }
    if (!rideTrain(world, dt)) {
      p.mode = 'foot'
      p.train = -1
    }
    return
  }

  if (p.mode === 'car') {
    const car = world.cars[p.car]
    if (!car) {
      p.mode = 'foot'
      p.car = -1
      return
    }
    if (enterPressed) {
      car.driver = 'none'
      car.speed *= 0.3
      p.mode = 'foot'
      p.car = -1
      p.enterCooldown = 0.4
      p.vx = 0
      p.vz = 0
      tryExitCar(world, car)
      return
    }

    const throttle = (keyDown('KeyW') ? 1 : 0) - (keyDown('KeyS') ? 1 : 0)
    const steer = (keyDown('KeyA') ? 1 : 0) - (keyDown('KeyD') ? 1 : 0)
    const impact = driveVehicle(world, car, dt, {
      throttle,
      steer,
      handbrake: keyDown('Space'),
    })
    if (impact > 6) cam.shake = Math.min(1, cam.shake + impact / 40)

    p.x = car.x
    p.z = car.z
    p.heading = car.heading
    p.y = 0
    world.playerImpact = impact
    return
  }

  world.playerImpact = 0

  // --- on foot ---------------------------------------------------------
  if (enterPressed) {
    // A waiting train takes priority - you are standing right next to it.
    const boardable = findBoardableCar(world)
    if (boardable) {
      boardTrain(world, boardable)
      return
    }
    const idx = findNearestCar(world)
    if (idx >= 0) {
      const car = world.cars[idx]
      car.driver = 'player'
      car.kind = car.kind === 'parked' ? 'parked' : car.kind
      p.mode = 'car'
      p.car = idx
      p.enterCooldown = 0.4
      playEngineStart()
      return
    }
  }

  const fwd = (keyDown('KeyW') ? 1 : 0) - (keyDown('KeyS') ? 1 : 0)
  const right = (keyDown('KeyD') ? 1 : 0) - (keyDown('KeyA') ? 1 : 0)
  p.sprinting = keyDown('ShiftLeft') || keyDown('ShiftRight')

  // Movement is relative to where the camera is looking.
  const sin = Math.sin(cam.yaw)
  const cos = Math.cos(cam.yaw)
  let dx = fwd * sin + right * cos
  let dz = fwd * cos - right * sin
  const len = Math.hypot(dx, dz)

  const speed = p.sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed
  if (len > 0.001) {
    dx /= len
    dz /= len
    p.vx += (dx * speed - p.vx) * Math.min(1, PLAYER.accel * dt / speed)
    p.vz += (dz * speed - p.vz) * Math.min(1, PLAYER.accel * dt / speed)
    const target = Math.atan2(dx, dz)
    p.heading += shortAngle(target - p.heading) * Math.min(1, PLAYER.turnLerp * dt)
  } else {
    const f = Math.max(0, 1 - PLAYER.friction * dt)
    p.vx *= f
    p.vz *= f
  }

  if (keyDown('Space') && p.onGround) {
    p.vy = PLAYER.jumpSpeed
    p.onGround = false
  }
  p.vy -= PLAYER.gravity * dt
  p.y += p.vy * dt

  p.x += p.vx * dt
  p.z += p.vz * dt

  // Station platforms and their ramps are walkable surfaces above the street.
  const support = supportHeight(world.city.rail.surfaces, p.x, p.z, p.y)
  p.supportY = support
  if (p.y <= support) {
    p.y = support
    p.vy = 0
    p.onGround = true
  } else {
    p.onGround = false
  }

  const hit = resolveStatic(world.bp, p, PLAYER.radius, p.y)
  if (hit.depth > 0) {
    // Cancel only the component pushing into the wall so we slide along it.
    const into = p.vx * hit.x + p.vz * hit.z
    if (into < 0) {
      p.vx -= hit.x * into
      p.vz -= hit.z * into
    }
  }

  const moving = Math.hypot(p.vx, p.vz)
  p.walkPhase += moving * dt * 1.5
}

/** Where the camera should sit this frame. */
export function cameraTarget(world) {
  const p = world.player
  const inCar = p.mode === 'car'
  const onTrain = p.mode === 'train'
  const dist = inCar ? CAMERA.carDistance : onTrain ? CAMERA.trainDistance : CAMERA.footDistance
  const height = inCar ? CAMERA.carHeight : onTrain ? CAMERA.trainHeight : CAMERA.footHeight
  const cam = world.camera
  const cp = Math.cos(cam.pitch)
  return {
    x: p.x - Math.sin(cam.yaw) * dist * cp,
    y: p.y + height + Math.sin(cam.pitch) * dist,
    z: p.z - Math.cos(cam.yaw) * dist * cp,
    lookX: p.x,
    lookY: p.y + (inCar ? 1.4 : 1.3),
    lookZ: p.z,
  }
}
