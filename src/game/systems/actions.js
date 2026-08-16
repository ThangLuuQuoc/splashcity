import { ACTIONS, HEAT, SCORE, PALETTE } from '../config.js'
import { nearbyBoxes } from '../collision.js'
import { isOnBlock } from '../city.js'
import { addHeat } from './heat.js'
import { input, keyDown } from './input.js'
import { playThrow, playPickup } from '../audio.js'
import { findBoardableCar, dwellingStation } from './train.js'

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

export function updateActions(world, dt) {
  if (world.throwCooldown > 0) world.throwCooldown -= dt

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
  // `kind` separates hints about the world ("a train is here, board it") from
  // ones that merely list the controls. On a touchscreen the on-screen buttons
  // are already labelled, so only the former are worth showing.
  const set = (text, kind) => {
    world.prompt = text
    world.promptKind = kind
  }

  if (p.mode === 'train') {
    const train = world.trains[p.train]
    const station = train && dwellingStation(world, train)
    return station
      ? set(`${station.name} — this is your stop`, 'hint')
      : set('Riding the Skyline', 'hint')
  }

  if (p.mode === 'car') {
    return set('E get out • Space handbrake • Click throw', 'controls')
  }

  if (findBoardableCar(world)) {
    return set('Board the train', 'hint')
  }
  for (let i = 0; i < world.cars.length; i++) {
    const c = world.cars[i]
    if (Math.hypot(c.x - p.x, c.z - p.z) < 4.2) {
      return set('Get in the car', 'hint')
    }
  }
  for (let i = 0; i < world.fountains.length; i++) {
    const f = world.fountains[i]
    if (Math.hypot(f.x - p.x, f.z - p.z) < ACTIONS.refillRadius + 1) {
      return set(
        world.ammo < ACTIONS.maxAmmo ? 'Refilling balloons...' : 'Balloons full!',
        'hint',
      )
    }
  }
  set('Click throw • F spray • Shift run', 'controls')
}
