import { CITY, CROWD, ACTIONS, PALETTE, POLICE } from './config.js'
import { generateCity } from './city.js'
import { buildBroadphase } from './collision.js'
import { makeRng } from './rng.js'
import { createTrains } from './systems/train.js'
import { createWeather } from './systems/weather.js'
import { createDisaster } from './systems/disasters.js'
import { createTravel } from './systems/navigation.js'
import { createHelicopter } from './systems/helicopter.js'
import { createPoliceHelis, clearPoliceHelis, createRubberShots } from './systems/policeHeli.js'
import { buildLandmarks } from './landmarks.js'
import { TIME } from './config.js'

// The whole simulation lives in this one mutable object. Nothing here is React
// state - systems mutate it in place every frame and the renderers read from it.
// Only the handful of numbers the HUD shows are mirrored into the zustand store.

export const MAX_POLICE = 8
export const MAX_FOOT_COPS = 8
export const MAX_BALLOONS = 40
export const MAX_SPLASHES = 28
export const MAX_BANANAS = 24

function laneOffset(dirX, dirZ) {
  // Drive on the right: offset perpendicular to travel direction.
  const off = CITY.roadWidth / 4
  return { x: -dirZ * off, z: dirX * off }
}

function spawnParkedCars(rng, city, cars) {
  for (const block of city.blocks) {
    if (rng.chance(0.45)) continue
    const count = rng.int(1, 2)
    for (let k = 0; k < count; k++) {
      const side = rng.int(0, 3)
      const edge = CITY.blockSize / 2 + CITY.roadWidth / 4
      const t = rng.range(-14, 14)
      let x, z, heading
      if (side === 0) { x = block.cx + t; z = block.cz - edge; heading = Math.PI / 2 }
      else if (side === 1) { x = block.cx + edge; z = block.cz + t; heading = 0 }
      else if (side === 2) { x = block.cx + t; z = block.cz + edge; heading = -Math.PI / 2 }
      else { x = block.cx - edge; z = block.cz + t; heading = Math.PI }

      cars.push({
        x, z, y: 0, heading, speed: 0, steer: 0,
        color: rng.pick(PALETTE.cars),
        kind: 'parked',
        driver: 'none',
        wheelSpin: 0,
        soaked: 0,
        bumpCooldown: 0,
        node: -1, next: -1,
        alive: true,
      })
    }
  }
}

function spawnTraffic(rng, city, cars) {
  for (let k = 0; k < CROWD.traffic; k++) {
    const node = city.nodes[rng.int(0, city.nodes.length - 1)]
    const next = city.nodes[node.nb[rng.int(0, node.nb.length - 1)]]
    const dx = next.x - node.x
    const dz = next.z - node.z
    const len = Math.hypot(dx, dz) || 1
    const dirX = dx / len
    const dirZ = dz / len
    const off = laneOffset(dirX, dirZ)
    cars.push({
      x: node.x + off.x, z: node.z + off.z, y: 0,
      heading: Math.atan2(dirX, dirZ),
      speed: 6, steer: 0,
      color: rng.pick(PALETTE.cars),
      kind: 'traffic',
      driver: 'ai',
      wheelSpin: 0,
      soaked: 0,
      bumpCooldown: 0,
      // Set when a disaster throws the car around.
      vy: 0, roll: 0, pitch: 0, rollV: 0, pitchV: 0, airborne: false,
      node: node.id, next: next.id,
      alive: true,
    })
  }
}

function spawnPedestrians(rng, city, peds) {
  const cityBlocks = city.blocks.filter((b) => b.type !== 'police')
  for (let k = 0; k < CROWD.pedestrians; k++) {
    const block = cityBlocks[rng.int(0, cityBlocks.length - 1)]
    const ring = CITY.blockSize / 2 - CITY.sidewalk / 2
    const perimeter = ring * 8
    const t = rng.range(0, perimeter)
    const p = ringPoint(block, ring, t)
    peds.push({
      x: p.x, z: p.z, y: 0,
      vx: 0, vz: 0,
      heading: rng.range(0, Math.PI * 2),
      block, ring, t,
      dir: rng.chance(0.5) ? 1 : -1,
      speed: CROWD.pedSpeed * rng.range(0.8, 1.25),
      state: 'walk',
      fleeTimer: 0,
      soaked: 0,
      phase: rng.range(0, Math.PI * 2),
      // How much weather this one will put up with before heading indoors.
      shy: rng.range(0.15, 0.85),
      indoors: false,
      shirt: rng.pick(PALETTE.shirts),
      skin: rng.pick(PALETTE.skin),
      height: rng.range(0.85, 1.1),
    })
  }
}

/** Position on a block's rectangular sidewalk loop, parameterised by arc length. */
export function ringPoint(block, ring, t) {
  const side = ring * 2
  const perim = side * 4
  let u = ((t % perim) + perim) % perim
  if (u < side) return { x: block.cx - ring + u, z: block.cz - ring }
  u -= side
  if (u < side) return { x: block.cx + ring, z: block.cz - ring + u }
  u -= side
  if (u < side) return { x: block.cx + ring - u, z: block.cz + ring }
  u -= side
  return { x: block.cx - ring, z: block.cz + ring - u }
}

function pool(size, make) {
  const arr = new Array(size)
  for (let i = 0; i < size; i++) arr[i] = make(i)
  return arr
}

export function createWorld() {
  const city = generateCity()
  const rng = makeRng(CITY.seed + 7)
  const bp = buildBroadphase(city.staticBoxes)

  const cars = []
  spawnParkedCars(rng, city, cars)
  spawnTraffic(rng, city, cars)

  const peds = []
  spawnPedestrians(rng, city, peds)

  const world = {
    city,
    bp,
    time: 0,
    timeOfDay: TIME.startHour,
    weather: createWeather(),
    disaster: createDisaster(),
    phase: 'menu', // menu | playing | busted
    interior: 'none', // none | police_station | supermarket
    previousOutdoorPos: { x: city.playerSpawn.x, y: 0, z: city.playerSpawn.z, heading: 0 },

    // Chế độ chạy dính (bật/tắt bằng R hoặc nút 🏃). Bàn phím luôn đẩy cần ở mức
    // tối đa nên không tự phân biệt được đi và chạy như thumbstick, vì vậy cần một
    // công tắc thay cho việc giữ Shift suốt cả ván. Đây là tuỳ chọn điều khiển của
    // người chơi, không phải trạng thái ván đấu -> không reset khi respawn.
    autoRun: false,

    heli: createHelicopter(city), // trực thăng đỗ ở sân bay trực thăng
    landmarks: buildLandmarks(city), // khu vực đặc biệt: minimap + bản đồ chọn điểm đến
    travel: createTravel(), // trạng thái tự động chạy tới điểm đã chọn
    mapOpen: false,

    player: {
      x: city.playerSpawn.x, z: city.playerSpawn.z, y: 0,
      vx: 0, vz: 0, vy: 0,
      heading: 0,
      onGround: true,
      mode: 'foot', // foot | car | train
      car: -1,
      train: -1,
      trainCar: 0,
      trainOffset: { x: 0, z: 0 },
      supportY: 0, // top of whatever the player is standing on
      sprinting: false,
      walkPhase: 0,
      invuln: 0,
      enterCooldown: 0,
      soaked: 0,
    },

    camera: { yaw: 0, pitch: 0.42, x: 0, y: 10, z: 20, shake: 0 },

    cars,
    peds,
    props: city.props,
    fountains: city.fountains,
    trains: createTrains(city.rail),

    police: pool(MAX_POLICE, () => ({
      active: false, x: 0, z: 0, y: 0, heading: 0, speed: 0, steer: 0,
      node: -1, next: -1, state: 'navigate', wheelSpin: 0,
      bustTimer: 0, bailTimer: 0, sirenPhase: 0, soaked: 0, bumpCooldown: 0,
      vy: 0, roll: 0, pitch: 0, rollV: 0, pitchV: 0, airborne: false,
    })),

    footCops: pool(MAX_FOOT_COPS, () => ({
      active: false, x: 0, z: 0, y: 0, heading: 0,
      vx: 0, vz: 0, walkPhase: 0, giveUp: 0, soaked: 0,
    })),

    // Đội bay truy bắt khi người chơi trốn lên trời.
    policeHelis: createPoliceHelis(),
    rubberShots: createRubberShots(), // đạn cao su đang bay
    copHeliTimer: 0,
    copHeliAlert: 'none', // none | scramble | chase | spot | cannon
    copHeliAlertTimer: 0,
    copHeliDistance: Infinity,

    balloons: pool(MAX_BALLOONS, () => ({
      active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, isMega: false,
    })),

    splashes: pool(MAX_SPLASHES, () => ({
      active: false, x: 0, y: 0, z: 0, life: 0, max: 0.6,
    })),

    bananas: pool(MAX_BANANAS, () => ({
      active: false, x: 0, y: 0, z: 0, rot: 0, life: 0,
    })),

    decals: [],
    toothpastePatches: [], // [{ x, y, z, radius, life }]

    // Inventory & Shopping State
    inventory: [], // [{ id, count, name, icon, ... }]
    cart: [],      // [{ id, count, name, price, icon }]
    cash: 500000,  // 500.000 VNĐ SplashPay
    phoneOpen: false,
    hasMegaBalloon: false,
    secretBalloonFound: false,
    activeBuffs: { speedBoost: 1, timer: 0 },

    heat: 0,
    stars: 0,
    score: 0,
    ammo: ACTIONS.maxAmmo,
    lastMischief: 0,
    outOfSight: 0,
    copSpawnTimer: 0,

    throwCooldown: 0,
    sprayTimer: 0,
    spraying: false,
    sprayTarget: null,
    bustedTimer: 0,
    prompt: '',
    combo: 0,
    stats: { splashed: 0, bumped: 0, tagged: 0, busted: 0 },
  }

  return world
}

/** Put the player back at the police station after a bust (or on a fresh start). */
export function respawnPlayer(world, atStation = true) {
  const p = world.player
  world.interior = 'none'
  // Bị bắt / hồi sinh thì dừng tự động di chuyển: đường đã tính không còn đúng với
  // chỗ vừa xuất hiện.
  world.travel = createTravel()
  const spot = atStation ? world.city.policeStation : world.city.playerSpawn
  p.x = spot.x
  p.z = spot.z + (atStation ? 14 : 0)
  p.y = 0
  p.vx = 0
  p.vz = 0
  p.vy = 0
  p.mode = 'foot'
  p.car = -1
  p.train = -1
  p.supportY = 0
  p.invuln = POLICE.respawnInvuln
  p.enterCooldown = 0.5
  p.soaked = 0

  world.heat = 0
  world.stars = 0
  world.outOfSight = 0
  world.ammo = ACTIONS.maxAmmo
  for (const c of world.police) c.active = false
  for (const c of world.footCops) c.active = false
  clearPoliceHelis(world)
  world.copHeliTimer = 0
}

export function resetGame(world) {
  world.score = 0
  world.decals.length = 0
  world.time = 0
  world.interior = 'none'
  world.inventory.length = 0
  world.cart.length = 0
  world.phoneOpen = false
  world.mapOpen = false
  world.heli = createHelicopter(world.city) // trực thăng về lại sân đỗ
  world.cash = 500000
  world.activeBuffs = { speedBoost: 1, timer: 0 }
  world.stats = { splashed: 0, bumped: 0, tagged: 0, busted: 0 }
  for (const b of world.balloons) b.active = false
  for (const s of world.splashes) s.active = false
  for (const bn of world.bananas) bn.active = false
  for (const c of world.cars) {
    if (c.driver === 'player') c.driver = 'none'
    c.soaked = 0
  }
  for (const p of world.peds) {
    p.state = 'walk'
    p.soaked = 0
    p.fleeTimer = 0
  }
  respawnPlayer(world, false)
}

