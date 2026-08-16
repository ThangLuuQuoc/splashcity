// Everything in the game is a circle on a flat plane colliding with axis-aligned
// boxes. That keeps collision resolution to a few dozen lines and makes the
// bumper-car feel easy to tune.

const CELL_SIZE = 24

/** Bucket static boxes into a uniform grid so a moving circle only tests neighbours. */
export function buildBroadphase(boxes) {
  const map = new Map()
  const key = (cx, cz) => cx * 100000 + cz
  for (let n = 0; n < boxes.length; n++) {
    const b = boxes[n]
    const x0 = Math.floor(b.minX / CELL_SIZE)
    const x1 = Math.floor(b.maxX / CELL_SIZE)
    const z0 = Math.floor(b.minZ / CELL_SIZE)
    const z1 = Math.floor(b.maxZ / CELL_SIZE)
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = key(cx, cz)
        let list = map.get(k)
        if (!list) map.set(k, (list = []))
        list.push(b)
      }
    }
  }
  return { map, key, boxes }
}

const scratch = []

/** Static boxes possibly overlapping a circle at (x, z) with the given radius. */
export function nearbyBoxes(bp, x, z, radius) {
  scratch.length = 0
  const x0 = Math.floor((x - radius) / CELL_SIZE)
  const x1 = Math.floor((x + radius) / CELL_SIZE)
  const z0 = Math.floor((z - radius) / CELL_SIZE)
  const z1 = Math.floor((z + radius) / CELL_SIZE)
  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const list = bp.map.get(bp.key(cx, cz))
      if (!list) continue
      for (let n = 0; n < list.length; n++) {
        if (scratch.indexOf(list[n]) === -1) scratch.push(list[n])
      }
    }
  }
  return scratch
}

/**
 * Push a circle out of every overlapping static box.
 * Mutates `ent.x` / `ent.z` and returns the accumulated push normal
 * (zero-length when nothing was hit).
 *
 * `entY` lets tall-enough entities clear short obstacles: a player standing on
 * an elevated station platform walks straight over the pillars holding it up,
 * while a car at street level still bounces off them.
 */
const hitNormal = { x: 0, z: 0, depth: 0 }

export function resolveStatic(bp, ent, radius, entY = 0) {
  hitNormal.x = 0
  hitNormal.z = 0
  hitNormal.depth = 0

  const boxes = nearbyBoxes(bp, ent.x, ent.z, radius + 1)
  for (let n = 0; n < boxes.length; n++) {
    const b = boxes[n]
    if (b.height <= entY + 0.1) continue
    // Closest point on the box to the circle centre.
    const cx = Math.max(b.minX, Math.min(ent.x, b.maxX))
    const cz = Math.max(b.minZ, Math.min(ent.z, b.maxZ))
    let dx = ent.x - cx
    let dz = ent.z - cz
    let dist2 = dx * dx + dz * dz

    if (dist2 > radius * radius) continue

    let nx, nz, depth
    if (dist2 > 1e-8) {
      const dist = Math.sqrt(dist2)
      nx = dx / dist
      nz = dz / dist
      depth = radius - dist
    } else {
      // Centre is inside the box: escape through the nearest face.
      const left = ent.x - b.minX
      const right = b.maxX - ent.x
      const back = ent.z - b.minZ
      const front = b.maxZ - ent.z
      const min = Math.min(left, right, back, front)
      if (min === left) { nx = -1; nz = 0; depth = left + radius }
      else if (min === right) { nx = 1; nz = 0; depth = right + radius }
      else if (min === back) { nx = 0; nz = -1; depth = back + radius }
      else { nx = 0; nz = 1; depth = front + radius }
    }

    ent.x += nx * depth
    ent.z += nz * depth

    if (depth > hitNormal.depth) {
      hitNormal.x = nx
      hitNormal.z = nz
      hitNormal.depth = depth
    }
  }
  return hitNormal
}

/** Symmetric circle-vs-circle separation with an equal-and-opposite bounce. */
export function resolveCircles(a, b, ra, rb, restitution) {
  let dx = b.x - a.x
  let dz = b.z - a.z
  let d2 = dx * dx + dz * dz
  const r = ra + rb
  if (d2 > r * r || d2 < 1e-9) return 0

  const d = Math.sqrt(d2)
  const nx = dx / d
  const nz = dz / d
  const overlap = r - d

  a.x -= nx * overlap * 0.5
  a.z -= nz * overlap * 0.5
  b.x += nx * overlap * 0.5
  b.z += nz * overlap * 0.5

  return overlap * restitution
}

/** Is the straight line from a to b free of static boxes? Used for police line of sight. */
export function hasLineOfSight(bp, ax, az, bx, bz) {
  const dx = bx - ax
  const dz = bz - az
  const dist = Math.hypot(dx, dz)
  if (dist < 0.001) return true
  const steps = Math.min(48, Math.ceil(dist / 3))
  const sx = dx / steps
  const sz = dz / steps
  for (let s = 1; s < steps; s++) {
    const px = ax + sx * s
    const pz = az + sz * s
    const boxes = nearbyBoxes(bp, px, pz, 0.1)
    for (let n = 0; n < boxes.length; n++) {
      const b = boxes[n]
      if (px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ) return false
    }
  }
  return true
}
