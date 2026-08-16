import { CITY, RAIL } from './config.js'

// The elevated railway is a rounded square that follows two road rings, sitting
// on pillars at the kerb so the roadway underneath stays drivable. Everything
// downstream - trains, stations, the minimap - reads from the single arc-length
// parameterised polyline built here.

const B = CITY.blocks

// Defined here rather than imported from city.js so the two modules stay
// one-directional: city.js needs the station block list, rail.js needs nothing
// from city.js.
const roadCenter = (i) => -CITY.half + i * CITY.cell

/** Which city blocks the station ramps land on - they must be left unbuilt. */
export function stationBlocks() {
  const mid = Math.floor(B / 2)
  return [
    [mid, RAIL.ring],
    [B - RAIL.ring - 1, mid],
    [mid, B - RAIL.ring - 1],
    [RAIL.ring, mid],
  ]
}

function pushStraight(pts, x0, z0, x1, z1, step) {
  const dx = x1 - x0
  const dz = z1 - z0
  const len = Math.hypot(dx, dz)
  const n = Math.max(1, Math.round(len / step))
  for (let i = 0; i < n; i++) {
    const t = i / n
    pts.push({ x: x0 + dx * t, z: z0 + dz * t })
  }
}

function pushArc(pts, cx, cz, r, a0, a1, steps) {
  for (let i = 0; i < steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps)
    pts.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r })
  }
}

function buildPath(R, cr) {
  const pts = []
  const step = 4
  const arcSteps = 10
  const inner = R - cr
  const H = Math.PI / 2

  pushStraight(pts, -inner, -R, inner, -R, step)
  pushArc(pts, inner, -inner, cr, -H, 0, arcSteps)
  pushStraight(pts, R, -inner, R, inner, step)
  pushArc(pts, inner, inner, cr, 0, H, arcSteps)
  pushStraight(pts, inner, R, -inner, R, step)
  pushArc(pts, -inner, inner, cr, H, Math.PI, arcSteps)
  pushStraight(pts, -R, inner, -R, -inner, step)
  pushArc(pts, -inner, -inner, cr, Math.PI, Math.PI + H, arcSteps)

  // Cumulative arc length, with the closing segment back to pts[0].
  const cum = new Float64Array(pts.length + 1)
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    cum[i + 1] = cum[i] + Math.hypot(b.x - a.x, b.z - a.z)
  }
  return { pts, cum, length: cum[pts.length] }
}

/** Position and heading at arc length `s` (wraps around the loop). */
export function railAt(rail, s, out = {}) {
  const L = rail.length
  let d = s % L
  if (d < 0) d += L

  const cum = rail.cum
  let lo = 0
  let hi = rail.pts.length
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= d) lo = mid
    else hi = mid
  }

  const a = rail.pts[lo]
  const b = rail.pts[(lo + 1) % rail.pts.length]
  const segLen = cum[lo + 1] - cum[lo] || 1
  const t = (d - cum[lo]) / segLen

  out.x = a.x + (b.x - a.x) * t
  out.z = a.z + (b.z - a.z) * t
  out.heading = Math.atan2(b.x - a.x, b.z - a.z)
  return out
}

/** Arc length of the point on the loop closest to (x, z). */
export function nearestS(rail, x, z) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < rail.pts.length; i++) {
    const p = rail.pts[i]
    const d = (p.x - x) ** 2 + (p.z - z) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return rail.cum[best]
}

/** Signed forward distance from `from` to `to` around the loop. */
export function arcAhead(rail, from, to) {
  const L = rail.length
  return ((to - from) % L + L) % L
}

/**
 * A station's walkable geometry, expressed as world-space axis-aligned surfaces
 * because the loop only ever runs along the north-south or east-west grid.
 */
function stationSurfaces(station) {
  const { x, z, dx, dz } = station
  const along = (d) => ({ x: x + dx * d, z: z + dz * d })
  const half = RAIL.platformHalfLength

  const p0 = along(RAIL.platformInner)
  const p1 = along(RAIL.platformOuter)
  const platform = dx !== 0
    ? { minX: Math.min(p0.x, p1.x), maxX: Math.max(p0.x, p1.x), minZ: z - half, maxZ: z + half }
    : { minX: x - half, maxX: x + half, minZ: Math.min(p0.z, p1.z), maxZ: Math.max(p0.z, p1.z) }
  platform.type = 'flat'
  platform.y = RAIL.trackY

  const r0 = along(RAIL.platformOuter)
  const r1 = along(RAIL.platformOuter + RAIL.rampRun)
  const rw = RAIL.rampHalfWidth
  const ramp = dx !== 0
    ? {
        minX: Math.min(r0.x, r1.x), maxX: Math.max(r0.x, r1.x),
        minZ: z - rw, maxZ: z + rw,
        axis: 'x',
        // yMin/yMax are the heights at the box's min and max along `axis`.
        yMin: dx > 0 ? RAIL.trackY : RAIL.groundY,
        yMax: dx > 0 ? RAIL.groundY : RAIL.trackY,
      }
    : {
        minX: x - rw, maxX: x + rw,
        minZ: Math.min(r0.z, r1.z), maxZ: Math.max(r0.z, r1.z),
        axis: 'z',
        yMin: dz > 0 ? RAIL.trackY : RAIL.groundY,
        yMax: dz > 0 ? RAIL.groundY : RAIL.trackY,
      }
  ramp.type = 'ramp'

  return [platform, ramp]
}

export function buildRail() {
  const R = roadCenter(B - RAIL.ring)
  const rail = buildPath(R, RAIL.cornerRadius)

  // One station at the midpoint of each straight side, platform facing the
  // middle of the city so the ramp lands on an open block.
  const names = ['Fountain Square', 'East Market', 'North Park', 'West Gate']
  const raw = [
    { x: 0, z: -R, dx: 0, dz: 1 },
    { x: R, z: 0, dx: -1, dz: 0 },
    { x: 0, z: R, dx: 0, dz: -1 },
    { x: -R, z: 0, dx: 1, dz: 0 },
  ].map((s, i) => ({ ...s, name: names[i], block: stationBlocks()[i] }))

  const stations = raw.map((s, i) => ({
    ...s,
    index: i,
    s: nearestS(rail, s.x, s.z),
    yaw: Math.atan2(s.dx, s.dz),
    surfaces: stationSurfaces(s),
  }))
  stations.sort((a, b) => a.s - b.s)
  stations.forEach((s, i) => { s.index = i })

  // Pillar pairs at the kerb, skipped where a station platform sits.
  const pillars = []
  const point = {}
  for (let s = 0; s < rail.length; s += RAIL.pillarSpacing) {
    const nearStation = stations.some(
      (st) => Math.min(arcAhead(rail, s, st.s), arcAhead(rail, st.s, s)) < RAIL.platformHalfLength + 4,
    )
    if (nearStation) continue
    railAt(rail, s, point)
    const nx = Math.cos(point.heading)
    const nz = -Math.sin(point.heading)
    for (const side of [-1, 1]) {
      pillars.push({
        x: point.x + nx * RAIL.pillarOffset * side,
        z: point.z + nz * RAIL.pillarOffset * side,
        // Centre of the pair, so the renderer can span a beam between them.
        beamX: side === -1 ? point.x : null,
        beamZ: side === -1 ? point.z : null,
        side,
        s,
        heading: point.heading,
      })
    }
  }

  // Deck segments for rendering, sampled a little finer than the pillars.
  const deck = []
  const deckStep = 4
  for (let s = 0; s < rail.length; s += deckStep) {
    railAt(rail, s, point)
    deck.push({ x: point.x, z: point.z, heading: point.heading, length: deckStep + 0.35 })
  }

  const surfaces = stations.flatMap((s) => s.surfaces)

  return { ...rail, R, stations, pillars, deck, surfaces }
}

/**
 * Height of the highest walkable surface at (x, z) that the entity can reach
 * from its current height, or the street if there is nothing to stand on.
 */
export function supportHeight(surfaces, x, z, currentY, stepUp = 0.6) {
  let best = 0
  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i]
    if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue

    let h
    if (s.type === 'ramp') {
      const t = s.axis === 'x'
        ? (x - s.minX) / (s.maxX - s.minX)
        : (z - s.minZ) / (s.maxZ - s.minZ)
      h = s.yMin + (s.yMax - s.yMin) * t
    } else {
      h = s.y
    }

    if (h <= currentY + stepUp && h > best) best = h
  }
  return best
}
