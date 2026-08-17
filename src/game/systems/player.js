import { PLAYER, CAMERA, NAV } from '../config.js'
import { resolveStatic } from '../collision.js'
import { supportHeight } from '../rail.js'
import { driveVehicle } from './vehicle.js'
import { findBoardableCar, boardTrain, rideTrain, leaveTrain } from './train.js'
import { input, keyDown, keyPressed, axisForward, axisRight, uiCaptured } from './input.js'
import { playEngineStart } from '../audio.js'
import { nearHelicopter, enterHelicopter, updateHelicopter } from './helicopter.js'

const shortAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export function updateCamera(world, dt) {
  const cam = world.camera

  // Overlay đang mở: chuột và phím mũi tên thuộc về giao diện, không phải camera.
  if (!uiCaptured(world)) {
    cam.yaw -= input.mouseDX * CAMERA.mouseSensitivity
    cam.pitch += input.mouseDY * CAMERA.mouseSensitivity
    cam.pitch = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, cam.pitch))

    // Arrow keys / Q-R turn the camera too, so a mouse is never required.
    const turn = (keyDown('ArrowLeft') || keyDown('KeyQ') ? 1 : 0) -
      (keyDown('ArrowRight') || keyDown('KeyR') ? 1 : 0)
    cam.yaw += turn * 2.2 * dt
    const tilt = (keyDown('ArrowUp') ? -1 : 0) + (keyDown('ArrowDown') ? 1 : 0)
    cam.pitch = Math.max(CAMERA.pitchMin, Math.min(CAMERA.pitchMax, cam.pitch + tilt * 1.4 * dt))
  }

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

  // Overlay đang mở thì input điều khiển bị bỏ qua - nhân vật không tự đi lại phía sau
  // tấm overlay nữa. Chế độ tự động chạy thì vẫn tiếp tục: đó là autopilot chứ không
  // phải input, và người chơi mở bản đồ giữa đường là để theo dõi lộ trình.
  const uiBlocked = uiCaptured(world)
  const enterPressed = keyPressed('KeyE') && p.enterCooldown <= 0 && !uiBlocked

  if (p.mode === 'heli') {
    const note = updateHelicopter(world, dt, enterPressed)
    if (note) {
      world.prompt = note
      world.promptKind = 'hint'
    }
    return
  }

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

    const impact = driveVehicle(world, car, dt, {
      throttle: uiBlocked ? 0 : axisForward(),
      steer: uiBlocked ? 0 : -axisRight(), // steering is positive-left, the axis is positive-right
      handbrake: !uiBlocked && keyDown('Space'),
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
    // Trực thăng đứng yên một chỗ nên xét trước: nếu người chơi đã đi tới sát nó thì
    // chắc chắn là muốn bay, không phải muốn lên chiếc xe chạy ngang.
    if (nearHelicopter(world)) {
      enterHelicopter(world)
      return
    }
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

  const fwd = uiBlocked ? 0 : axisForward()
  const right = uiBlocked ? 0 : axisRight()

  // Movement is relative to where the camera is looking. The camera looks along
  // (sin yaw, cos yaw), and in a Y-up right-handed frame its screen-right is
  // (-cos yaw, sin yaw) - hence the minus on the strafe term. Getting this sign
  // wrong mirrors A and D, which is exactly what it used to do.
  const sin = Math.sin(cam.yaw)
  const cos = Math.cos(cam.yaw)
  let dx = fwd * sin - right * cos
  let dz = fwd * cos + right * sin

  // Đang tự động chạy tới khu vực đã chọn: hướng do navigation.js quyết định, còn
  // gia tốc / va chạm / trượt dọc tường vẫn dùng chung đoạn code bên dưới.
  const travel = world.travel
  const autoTravelling = travel && travel.active
  if (autoTravelling) {
    dx = travel.dirX
    dz = travel.dirZ
  }

  const len = Math.hypot(dx, dz)

  // Ba đường vào chế độ chạy:
  //  - Thumbstick đẩy sát vành: chạy (analog tự phân biệt đi / chạy).
  //  - Giữ Shift: chạy tức thời, cách cũ, vẫn giữ nguyên.
  //  - Chế độ chạy dính (R / nút 🏃): chạy liên tục mà không phải giữ phím. Khi
  //    đang bật thì Shift đảo vai, giữ Shift để đi bộ chậm lại - nhờ vậy Shift vẫn
  //    có nghĩa và người chơi luôn có cách đi chậm khi cần né chướng ngại vật.
  const deflection = Math.min(1, len)
  const holdRun = keyDown('ShiftLeft') || keyDown('ShiftRight')
  p.sprinting = autoTravelling || (world.autoRun
    ? !holdRun
    : holdRun || (input.touchActive && deflection > 0.85))

  let speedMultiplier = (world.activeBuffs && world.activeBuffs.timer > 0) ? world.activeBuffs.speedBoost : 1
  if (autoTravelling) speedMultiplier *= NAV.speedBoost
  const speed = (p.sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed) * deflection * speedMultiplier
  if (len > 0.001 && speed > 0.01) {
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

  if (!uiBlocked && keyDown('Space') && p.onGround) {
    p.vy = PLAYER.jumpSpeed
    p.onGround = false
  }
  p.vy -= PLAYER.gravity * dt
  p.y += p.vy * dt

  p.x += p.vx * dt
  p.z += p.vz * dt

  if (world.interior === 'none') {
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
  } else {
    // Trong phòng nội thất
    const floorY = p.supportY || 0
    if (p.y <= floorY) {
      p.y = floorY
      p.vy = 0
      p.onGround = true
    } else {
      p.onGround = false
    }
  }

  const moving = Math.hypot(p.vx, p.vz)
  p.walkPhase += moving * dt * 1.5
}

/** Where the camera should sit this frame. */
export function cameraTarget(world) {
  const p = world.player
  const inInterior = world.interior !== 'none'
  const inCar = p.mode === 'car'
  const onTrain = p.mode === 'train'
  const inHeli = p.mode === 'heli'
  const dist = inInterior ? 6.5
    : inHeli ? CAMERA.heliDistance
      : (inCar ? CAMERA.carDistance : onTrain ? CAMERA.trainDistance : CAMERA.footDistance)
  const height = inInterior ? 2.8
    : inHeli ? CAMERA.heliHeight
      : (inCar ? CAMERA.carHeight : onTrain ? CAMERA.trainHeight : CAMERA.footHeight)
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

