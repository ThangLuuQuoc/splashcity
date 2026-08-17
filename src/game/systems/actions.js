import { ACTIONS, HEAT, SCORE, PALETTE } from '../config.js'
import { nearbyBoxes } from '../collision.js'
import { isOnBlock } from '../city.js'
import { addHeat } from './heat.js'
import { input, keyDown } from './input.js'
import { playThrow, playPickup, playBeep } from '../audio.js'
import { findBoardableCar, dwellingStation } from './train.js'
import { nearHelicopter, toggleHeliTour, tourTarget } from './helicopter.js'
import { t } from '../i18n.js'

const STAMPS_PER_TAG = 6

function throwBalloon(world) {
  if (world.ammo <= 0 || world.throwCooldown > 0) return
  const b = world.balloons.find((x) => !x.active)
  if (!b) return

  const p = world.player
  const cam = world.camera
  // Aim where the camera is looking, with a slight upward arc.
  const cp = Math.cos(cam.pitch)
  const dirX = Math.sin(cam.yaw) * cp
  const dirZ = Math.cos(cam.yaw) * cp
  const dirY = ACTIONS.throwArc + Math.sin(cam.pitch) * 0.35

  const inCar = p.mode === 'car'
  b.active = true
  b.isMega = !!world.hasMegaBalloon
  if (world.hasMegaBalloon) {
    world.hasMegaBalloon = false
  }
  b.x = p.x + dirX * 1.4
  b.y = (inCar ? 1.5 : 1.45) + p.y
  b.z = p.z + dirZ * 1.4
  b.vx = dirX * ACTIONS.throwSpeed
  b.vy = dirY * ACTIONS.throwSpeed
  b.vz = dirZ * ACTIONS.throwSpeed

  // A moving car adds its own velocity to the throw.
  if (inCar) {
    const car = world.cars[p.car]
    b.vx += Math.sin(car.heading) * car.speed * 0.6
    b.vz += Math.cos(car.heading) * car.speed * 0.6
  }

  world.ammo--
  world.throwCooldown = ACTIONS.throwCooldown
  playThrow()
}


/** Walk a ray forward from the player looking for a wall to tag. */
function findSprayTarget(world) {
  const p = world.player
  const cam = world.camera
  const dirX = Math.sin(cam.yaw)
  const dirZ = Math.cos(cam.yaw)

  const step = 0.5
  for (let d = 1; d <= ACTIONS.sprayRange; d += step) {
    const x = p.x + dirX * d
    const z = p.z + dirZ * d
    const boxes = nearbyBoxes(world.bp, x, z, 0.3)
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]
      if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue

      // Which face did we come through? The one we are least deep into.
      const left = x - b.minX
      const right = b.maxX - x
      const back = z - b.minZ
      const front = b.maxZ - z
      const min = Math.min(left, right, back, front)
      let nx = 0, nz = 0, px = x, pz = z
      if (min === left) { nx = -1; px = b.minX }
      else if (min === right) { nx = 1; px = b.maxX }
      else if (min === back) { nz = -1; pz = b.minZ }
      else { nz = 1; pz = b.maxZ }

      return { x: px, z: pz, nx, nz, wall: true, height: b.height }
    }
  }

  // Nothing to tag? Paint the ground in front of you instead.
  return {
    x: p.x + dirX * 2.4,
    z: p.z + dirZ * 2.4,
    nx: 0, nz: 0, wall: false, height: 0,
  }
}

function stampDecal(world, target) {
  const jitterY = target.wall
    ? 0.8 + Math.random() * Math.min(3.2, Math.max(1, target.height - 1))
    : 0.04
  const decal = {
    x: target.x + target.nx * 0.06 + (target.wall ? (target.nx === 0 ? (Math.random() - 0.5) * 2.4 : 0) : (Math.random() - 0.5) * 2),
    y: jitterY,
    z: target.z + target.nz * 0.06 + (target.wall ? (target.nz === 0 ? (Math.random() - 0.5) * 2.4 : 0) : (Math.random() - 0.5) * 2),
    rotY: target.wall ? Math.atan2(target.nx, target.nz) : 0,
    flat: !target.wall,
    size: 0.9 + Math.random() * 0.9,
    color: PALETTE.paint[Math.floor((world.time * 2.4) % PALETTE.paint.length)],
  }

  world.decals.push(decal)
  if (world.decals.length > ACTIONS.sprayMaxDecals) world.decals.shift()
  world.decalsDirty = true

  world.sprayStamps = (world.sprayStamps || 0) + 1
  if (world.sprayStamps % STAMPS_PER_TAG === 0) {
    world.score += SCORE.sprayTick
    world.stats.tagged++
  }
}

function updateRefill(world, dt) {
  if (world.ammo >= ACTIONS.maxAmmo) return
  const p = world.player
  for (let i = 0; i < world.fountains.length; i++) {
    const f = world.fountains[i]
    if (Math.hypot(f.x - p.x, f.z - p.z) < ACTIONS.refillRadius) {
      world.refillProgress = (world.refillProgress || 0) + dt * 6
      while (world.refillProgress >= 1 && world.ammo < ACTIONS.maxAmmo) {
        world.refillProgress -= 1
        world.ammo++
        playPickup()
      }
      return
    }
  }
  world.refillProgress = 0
}

import { useInventoryItem } from './inventory.js'
import { keyPressed, uiCaptured } from './input.js'

export function updateActions(world, dt) {
  if (world.throwCooldown > 0) world.throwCooldown -= dt

  // Toggle Phone
  if (keyPressed('KeyP')) {
    world.phoneOpen = !world.phoneOpen
  }

  // Mở / đóng bản đồ chọn khu vực để tự động chạy tới
  if (keyPressed('KeyM')) {
    world.mapOpen = !world.mapOpen
  }

  // Esc đóng overlay đang mở. Trình duyệt cũng dùng Esc để nhả pointer lock, nên
  // trước đây người chơi phải bấm Esc chỉ để lấy lại con trỏ chuột; giờ con trỏ đã
  // được nhả ngay khi overlay mở, Esc chuyển thành phím đóng overlay cho đúng phản xạ.
  if (keyPressed('Escape') && uiCaptured(world)) {
    world.phoneOpen = false
    world.mapOpen = false
  }

  // Overlay đang mở thì các hành động trong game đều nghỉ - phím và chuột thuộc về
  // giao diện. Chỉ các phím đóng/mở overlay ở trên là còn tác dụng.
  if (uiCaptured(world)) {
    world.spraying = false
    world.sprayTarget = null
    return
  }

  // X là công tắc "chế độ tự động" theo ngữ cảnh: đi bộ thì bật chạy dính, đang bay thì
  // bật bay tự động ngắm cảnh. Chạy dính lúc bay vô nghĩa nên không có xung đột, và
  // người chơi chỉ phải nhớ một phím. (Dùng X vì R đã là phím quay camera, cặp với Q.)
  if (keyPressed('KeyX')) {
    if (world.player.mode === 'heli') {
      // Không đặt prompt ở đây: updatePrompt chạy sau trong cùng frame và sẽ ghi đè.
      // Trạng thái tour được chính updatePrompt diễn đạt bên dưới.
      toggleHeliTour(world)
    } else {
      world.autoRun = !world.autoRun
    }
    playBeep()
  }

  // Quick slot 1, 2, 3, 4 to use inventory items
  if (keyPressed('Digit1') && world.inventory[0]) useInventoryItem(world, world.inventory[0].id)
  if (keyPressed('Digit2') && world.inventory[1]) useInventoryItem(world, world.inventory[1].id)
  if (keyPressed('Digit3') && world.inventory[2]) useInventoryItem(world, world.inventory[2].id)
  if (keyPressed('Digit4') && world.inventory[3]) useInventoryItem(world, world.inventory[3].id)

  if (input.fire || keyDown('KeyB')) throwBalloon(world)

  // --- spray paint -----------------------------------------------------
  const wantSpray = keyDown('KeyF') && world.player.mode === 'foot'
  world.spraying = wantSpray
  if (wantSpray) {
    const target = findSprayTarget(world)
    world.sprayTarget = target
    world.sprayTimer -= dt
    if (world.sprayTimer <= 0) {
      world.sprayTimer = ACTIONS.sprayInterval
      stampDecal(world, target)
    }
    addHeat(world, HEAT.sprayPerSec * dt)
  } else {
    world.sprayTarget = null
    world.sprayTimer = 0
  }

  // --- reckless driving ------------------------------------------------
  const p = world.player
  if (p.mode === 'car') {
    const car = world.cars[p.car]
    if (car && Math.abs(car.speed) > 5 && isOnBlock(car.x, car.z)) {
      addHeat(world, HEAT.sidewalkPerSec * dt)
      world.onSidewalk = true
    } else {
      world.onSidewalk = false
    }
  } else {
    world.onSidewalk = false
  }

  updateRefill(world, dt)
}

/** Contextual hint shown at the bottom of the screen. */
export function updatePrompt(world) {
  const p = world.player
  const set = (text, kind) => {
    world.prompt = text
    world.promptKind = kind
  }

  // Nếu đang trong nội thất hoặc đã có prompt đặc biệt từ interior, giữ nguyên
  if (world.interior !== 'none' || world.promptKind === 'interior' || world.promptKind === 'shopping' || world.promptKind === 'police') {
    return
  }

  if (p.mode === 'train') {
    const train = world.trains[p.train]
    const station = train && dwellingStation(world, train)
    return station
      ? set(t('prompt.trainStation', { name: station.name }), 'hint')
      : set(t('prompt.trainRiding'), 'hint')
  }

  if (p.mode === 'heli') {
    const target = tourTarget(world)
    if (target) {
      // Kind 'hint' để dòng này hiện cả trên tablet - Prompt() lọc bỏ 'controls' ở touch.
      return set(t('prompt.heliTour', { icon: target.icon, place: target.name }), 'hint')
    }
    const alt = Math.round(world.heli.y)
    return set(t('prompt.heliControls', { alt }), 'controls')
  }

  if (p.mode === 'car') {
    return set(t('prompt.carControls'), 'controls')
  }

  if (nearHelicopter(world)) {
    return set(t('prompt.boardHeli'), 'hint')
  }

  if (findBoardableCar(world)) {
    return set(t('prompt.boardTrain'), 'hint')
  }
  for (let i = 0; i < world.cars.length; i++) {
    const c = world.cars[i]
    if (Math.hypot(c.x - p.x, c.z - p.z) < 4.2) {
      return set(t('prompt.boardCar'), 'hint')
    }
  }
  for (let i = 0; i < world.fountains.length; i++) {
    const f = world.fountains[i]
    if (Math.hypot(f.x - p.x, f.z - p.z) < ACTIONS.refillRadius + 1) {
      return set(t(world.ammo < ACTIONS.maxAmmo ? 'prompt.refilling' : 'prompt.refillFull'), 'hint')
    }
  }
  set(t(world.autoRun ? 'prompt.footControlsRunning' : 'prompt.footControls'), 'controls')
}

