import { CITY, PALETTE, RAIL } from './config.js'
import { makeRng } from './rng.js'
import { buildRail, stationBlocks } from './rail.js'

// The city is a lattice of roads with square blocks between them.
//
//   road   block   road   block   road      <- one "cell" = roadWidth + blockSize
//   |======|=====|======|=====|======|
//
// Road centre lines sit at x = -half + i*cell for i in 0..blocks. Blocks fill the
// space between two consecutive centre lines, inset by half a road width.

const B = CITY.blocks
const CELL = CITY.cell
const HALF = CITY.half
const RW = CITY.roadWidth
const BS = CITY.blockSize

export const roadCenter = (i) => -HALF + i * CELL
export const nodeCount = B + 1
export const nodeId = (i, j) => i * nodeCount + j

function blockCenter(i, j) {
  return {
    cx: roadCenter(i) + RW / 2 + BS / 2,
    cz: roadCenter(j) + RW / 2 + BS / 2,
  }
}

function buildRoadGraph() {
  const nodes = []
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      const nb = []
      if (i > 0) nb.push(nodeId(i - 1, j))
      if (i < nodeCount - 1) nb.push(nodeId(i + 1, j))
      if (j > 0) nb.push(nodeId(i, j - 1))
      if (j < nodeCount - 1) nb.push(nodeId(i, j + 1))
      nodes.push({ id: nodeId(i, j), i, j, x: roadCenter(i), z: roadCenter(j), nb })
    }
  }
  return nodes
}

function generateBuildings(rng, block, out, boxes) {
  const { cx, cz } = block
  const innerHalf = BS / 2 - CITY.sidewalk
  const inner = innerHalf * 2

  const cols = rng.chance(0.55) ? 2 : 1
  const rows = rng.chance(0.55) ? 2 : 1
  const gap = 1.6
  const cw = inner / cols
  const cd = inner / rows

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Occasionally leave a lot empty so the city has courtyards.
      if ((cols > 1 || rows > 1) && rng.chance(0.14)) continue

      const shrinkX = rng.range(0, 3)
      const shrinkZ = rng.range(0, 3)
      const w = Math.max(6, cw - gap - shrinkX)
      const d = Math.max(6, cd - gap - shrinkZ)
      const x = cx - innerHalf + c * cw + cw / 2
      const z = cz - innerHalf + r * cd + cd / 2
      const h = rng.range(CITY.buildingMin, CITY.buildingMax) * (cols * rows > 1 ? 0.72 : 1)

      const b = {
        x, z, w, d,
        h: Math.max(CITY.buildingMin, h),
        color: rng.pick(PALETTE.buildings),
        roof: rng.pick(PALETTE.roofs),
        windowRows: Math.max(1, Math.floor(h / 4)),
      }
      out.push(b)
      boxes.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
        height: b.h,
      })
    }
  }
}

function addProps(rng, block, props, trees) {
  const { cx, cz } = block
  const ring = BS / 2 - CITY.sidewalk / 2 // middle of the sidewalk ring

  // Street furniture spaced around the sidewalk ring.
  const count = rng.int(3, 6)
  for (let k = 0; k < count; k++) {
    const side = rng.int(0, 3)
    const t = rng.range(-ring + 4, ring - 4)
    let x = cx, z = cz
    if (side === 0) { x = cx + t; z = cz - ring }
    else if (side === 1) { x = cx + ring; z = cz + t }
    else if (side === 2) { x = cx + t; z = cz + ring }
    else { x = cx - ring; z = cz + t }

    const roll = rng.next()
    const type = roll < 0.4 ? 'cone' : roll < 0.7 ? 'bin' : roll < 0.88 ? 'bench' : 'hydrant'
    props.push({
      type, x, z,
      rot: side * (Math.PI / 2) + rng.range(-0.2, 0.2),
      vx: 0, vz: 0, vy: 0, y: 0, spin: 0, tilt: 0,
      color: type === 'cone' ? '#ff7a29' : type === 'bin' ? '#3f7d5c' : type === 'bench' ? '#8b5e3c' : '#d92b2b',
    })
  }

  // Trees at the block corners.
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if (rng.chance(0.45)) continue
    trees.push({
      x: cx + sx * (ring - 1), z: cz + sz * (ring - 1),
      scale: rng.range(0.85, 1.35),
      rot: rng.range(0, Math.PI * 2),
    })
  }
}

function addParkContent(rng, block, trees, props, fountains) {
  const { cx, cz } = block
  fountains.push({ x: cx, z: cz })
  for (let k = 0; k < 16; k++) {
    const x = cx + rng.range(-16, 16)
    const z = cz + rng.range(-16, 16)
    if (Math.hypot(x - cx, z - cz) < 6) continue
    trees.push({ x, z, scale: rng.range(1.0, 1.7), rot: rng.range(0, Math.PI * 2) })
  }
  for (let k = 0; k < 4; k++) {
    props.push({
      type: 'bench',
      x: cx + rng.range(-14, 14), z: cz + rng.range(-14, 14),
      rot: rng.range(0, Math.PI * 2),
      vx: 0, vz: 0, vy: 0, y: 0, spin: 0, tilt: 0,
      color: '#8b5e3c',
    })
  }
}

export function generateCity() {
  const rng = makeRng(CITY.seed)

  const buildings = []
  const staticBoxes = []
  const props = []
  const trees = []
  const fountains = []
  const blocks = []

  // Reserve a few themed blocks.
  const policeBlock = { i: 1, j: B - 2 }
  const supermarketBlock = { i: B - 2, j: 1 }
  const parkBlocks = [{ i: 4, j: 2 }, { i: 2, j: 5 }]
  const plazaBlock = { i: 3, j: 3 }
  // Sân đỗ trực thăng ở một góc thành phố - phải bay một đoạn mới tới được trung tâm,
  // nên chuyến bay có cảm giác đi khám phá thật.
  const helipadBlock = { i: 1, j: 1 }

  const isAt = (a, i, j) => a.i === i && a.j === j
  const stationLots = stationBlocks()
  const isStationLot = (i, j) => stationLots.some(([bi, bj]) => bi === i && bj === j)

  for (let i = 0; i < B; i++) {
    for (let j = 0; j < B; j++) {
      const { cx, cz } = blockCenter(i, j)
      let type = 'city'
      // Station lots come first: their ramps need the block left clear.
      if (isStationLot(i, j)) type = 'station'
      else if (isAt(policeBlock, i, j)) type = 'police'
      else if (isAt(supermarketBlock, i, j)) type = 'supermarket'
      else if (parkBlocks.some((p) => isAt(p, i, j))) type = 'park'
      else if (isAt(plazaBlock, i, j)) type = 'plaza'
      else if (isAt(helipadBlock, i, j)) type = 'helipad'

      const block = { i, j, cx, cz, type, half: BS / 2 }
      blocks.push(block)

      if (type === 'city') {
        generateBuildings(rng, block, buildings, staticBoxes)
        addProps(rng, block, props, trees)
      } else if (type === 'park') {
        addParkContent(rng, block, trees, props, fountains)
      } else if (type === 'plaza') {
        fountains.push({ x: cx, z: cz })
        addProps(rng, block, props, trees)
      } else if (type === 'station') {
        // Forecourt only - the ramp comes down the middle of this lot, so keep
        // it clear and push the fountain off to one side.
        addProps(rng, block, props, trees)
        const rampRunsAlongZ = i === Math.floor(B / 2)
        fountains.push({
          x: cx + (rampRunsAlongZ ? 14 : 0),
          z: cz + (rampRunsAlongZ ? 0 : 14),
        })
      } else if (type === 'police') {
        // A single wide station building at the back of the lot.
        const w = 30, d = 16
        const z = cz - 8
        buildings.push({
          x: cx, z, w, d, h: 12,
          color: '#5b7fa6', roof: '#3d5470', windowRows: 3, station: true,
        })
        staticBoxes.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: z - d / 2, maxZ: z + d / 2, height: 12 })
        fountains.push({ x: cx + 15, z: cz + 14 })
      } else if (type === 'helipad') {
        // Sân đỗ để trống hoàn toàn ở giữa: người chơi phải đi bộ tới được trực thăng,
        // và hạ cánh về đây cũng không được có gì chắn.
        addProps(rng, block, props, trees)
        fountains.push({ x: cx - 15, z: cz + 15 })
      } else if (type === 'supermarket') {
        // Tòa nhà siêu thị Splash Mart 2 tầng bề thế
        const w = 32, d = 22
        const z = cz - 6
        buildings.push({
          x: cx, z, w, d, h: 14,
          color: '#d62828', roof: '#222222', windowRows: 2, supermarket: true,
        })
        staticBoxes.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: z - d / 2, maxZ: z + d / 2, height: 14 })
        addProps(rng, block, props, trees)
        fountains.push({ x: cx + 14, z: cz + 14 })
      }
    }
  }

  // A few extra fountains scattered on ordinary blocks for balloon refills.
  for (let k = 0; k < 6; k++) {
    const b = blocks[rng.int(0, blocks.length - 1)]
    if (b.type !== 'city') continue
    fountains.push({ x: b.cx + BS / 2 - CITY.sidewalk / 2, z: b.cz })
  }

  // Boundary walls keep the player inside the city.
  const edge = HALF + RW / 2
  const wallT = 3
  const walls = [
    { minX: -edge - wallT, maxX: edge + wallT, minZ: -edge - wallT, maxZ: -edge, height: 6 },
    { minX: -edge - wallT, maxX: edge + wallT, minZ: edge, maxZ: edge + wallT, height: 6 },
    { minX: -edge - wallT, maxX: -edge, minZ: -edge, maxZ: edge, height: 6 },
    { minX: edge, maxX: edge + wallT, minZ: -edge, maxZ: edge, height: 6 },
  ]
  staticBoxes.push(...walls)

  // The elevated railway. Its pillars are solid to anything at street level;
  // the height field lets the player walk over them once up on a platform.
  const rail = buildRail()
  for (const p of rail.pillars) {
    staticBoxes.push({
      minX: p.x - RAIL.pillarHalf, maxX: p.x + RAIL.pillarHalf,
      minZ: p.z - RAIL.pillarHalf, maxZ: p.z + RAIL.pillarHalf,
      height: RAIL.trackY - RAIL.deckThickness,
    })
  }
  for (const st of rail.stations) {
    // Two columns holding up the outer edge of each platform.
    for (const side of [-1, 1]) {
      const ox = st.x + st.dx * (RAIL.platformOuter - 1) + (st.dx !== 0 ? 0 : side * 12)
      const oz = st.z + st.dz * (RAIL.platformOuter - 1) + (st.dz !== 0 ? 0 : side * 12)
      staticBoxes.push({
        minX: ox - 0.7, maxX: ox + 0.7,
        minZ: oz - 0.7, maxZ: oz + 0.7,
        height: RAIL.trackY - 0.2,
      })
    }
  }

  const station = blockCenter(policeBlock.i, policeBlock.j)
  const superM = blockCenter(supermarketBlock.i, supermarketBlock.j)
  const plaza = blockCenter(plazaBlock.i, plazaBlock.j)

  return {
    rail,
    blocks,
    buildings,
    staticBoxes,
    walls,
    props,
    trees,
    fountains,
    nodes: buildRoadGraph(),
    bounds: { min: -edge, max: edge },
    policeStation: { x: station.cx, z: station.cz },
    policeDoor: { x: station.cx, z: station.cz },
    supermarket: { x: superM.cx, z: superM.cz + 5 },
    supermarketDoor: { x: superM.cx, z: superM.cz + 5 },
    plaza: { x: plaza.cx, z: plaza.cz },
    helipad: (() => {
      const c = blockCenter(helipadBlock.i, helipadBlock.j)
      return { x: c.cx, z: c.cz }
    })(),
    parks: parkBlocks.map((p) => {
      const c = blockCenter(p.i, p.j)
      return { x: c.cx, z: c.cz }
    }),
    playerSpawn: { x: plaza.cx, z: plaza.cz + BS / 2 + RW / 2 },
  }
}

// --- queries used by the AI and gameplay systems -------------------------

/** Nearest road-graph node id to a world position. */
export function nearestNode(x, z) {
  const i = Math.max(0, Math.min(B, Math.round((x + HALF) / CELL)))
  const j = Math.max(0, Math.min(B, Math.round((z + HALF) / CELL)))
  return nodeId(i, j)
}

/** True when the position is over a block (i.e. a sidewalk / lot, not a road). */
export function isOnBlock(x, z) {
  const u = ((x + HALF + RW / 2) % CELL + CELL) % CELL
  const v = ((z + HALF + RW / 2) % CELL + CELL) % CELL
  const inside = (t) => t > RW && t < CELL
  return inside(u) && inside(v) &&
    Math.abs(x) < HALF + RW / 2 && Math.abs(z) < HALF + RW / 2
}
