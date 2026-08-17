import { POLICE, HEAT, CAR, SCORE } from '../config.js'
import { driveVehicle } from './vehicle.js'
import { steerToward, lanePoint, pickNextNode } from './traffic.js'
import { nearestNode } from '../city.js'
import { hasLineOfSight, resolveStatic } from '../collision.js'
import { playBusted, updateSiren } from '../audio.js'

// Police navigate the road graph using a breadth-first distance field rebuilt
// from the player's nearest intersection a few times a second. Each cop simply
// walks downhill on that field, which is proper pathfinding for ~20 lines and
// never gets stuck circling the way greedy "drive at the player" AI does.

let fieldTimer = 0

function rebuildField(world) {
  const nodes = world.city.nodes
  if (!world.copField || world.copField.length !== nodes.length) {
    world.copField = new Int16Array(nodes.length)
    world.copQueue = new Int32Array(nodes.length)
  }
  const dist = world.copField
  dist.fill(-1)

  const start = nearestNode(world.player.x, world.player.z)
  const queue = world.copQueue
  let head = 0
  let tail = 0
  dist[start] = 0
  queue[tail++] = start

  while (head < tail) {
    const id = queue[head++]
    const nb = nodes[id].nb
    for (let i = 0; i < nb.length; i++) {
      const n = nb[i]
      if (dist[n] === -1) {
        dist[n] = dist[id] + 1
        queue[tail++] = n
      }
    }
  }
  world.playerNode = start
}

function downhillNeighbour(world, fromId) {
  const nodes = world.city.nodes
  const dist = world.copField
  const nb = nodes[fromId].nb
  let best = nb[0]
  let bestD = dist[nb[0]] ?? 999
  for (let i = 1; i < nb.length; i++) {
    const d = dist[nb[i]]
    if (d !== -1 && d < bestD) {
      bestD = d
      best = nb[i]
    }
  }
  return best
}

function spawnCop(world) {
  const cop = world.police.find((c) => !c.active)
  if (!cop) return

  const p = world.player
  const nodes = world.city.nodes

  // Cops come from an intersection a few blocks away, so a chase actually
  // starts before the heat has time to cool. Spawning from the police station
  // reads better but leaves the player unchased when they are across town.
  const candidates = []
  let fallback = nodes[0]
  let fallbackScore = Infinity
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    const d = Math.hypot(n.x - p.x, n.z - p.z)
    if (d >= POLICE.spawnMin && d <= POLICE.spawnMax) candidates.push(n)
    const score = Math.abs(d - (POLICE.spawnMin + POLICE.spawnMax) / 2)
    if (score < fallbackScore) {
      fallbackScore = score
      fallback = n
    }
  }
  const from = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : fallback
  const sx = from.x
  const sz = from.z

  cop.active = true
  cop.bailed = false
  cop.x = sx
  cop.z = sz
  cop.y = 0
  cop.speed = 6
  cop.steer = 0
  cop.heading = Math.atan2(p.x - sx, p.z - sz)
  cop.node = nearestNode(sx, sz)
  cop.next = world.copField
    ? downhillNeighbour(world, cop.node)
    : pickNextNode(world.city.nodes, cop.node, -1)
  cop.state = 'navigate'
  cop.bustTimer = 0
  cop.soaked = 0
  cop.wheelSpin = 0
}

function spawnFootCop(world, fromCop) {
  const foot = world.footCops.find((c) => !c.active)
  if (!foot) return
  foot.active = true
  foot.x = fromCop.x + Math.cos(fromCop.heading) * 2.4
  foot.z = fromCop.z - Math.sin(fromCop.heading) * 2.4
  foot.y = 0
  foot.vx = 0
  foot.vz = 0
  foot.heading = fromCop.heading
  foot.giveUp = 0
  foot.walkPhase = 0
  foot.soaked = 0
}

export function bustPlayer(world) {
  const kept = Math.floor(world.score * SCORE.bustedPenalty)
  world.bustedInfo = { lost: world.score - kept, kept }
  world.score = kept
  world.stats.busted++
  world.phase = 'busted'
  world.bustedTimer = 0
  playBusted()
  updateSiren(0)
}

export function clearPolice(world) {
  for (const c of world.police) c.active = false
  for (const c of world.footCops) c.active = false
}

export function updatePolice(world, dt) {
  const p = world.player
  // Anything up on the railway is out of arm's reach from the street. Cops can
  // still see you standing on a platform - so the heat keeps burning and they
  // gather below - but they can only arrest you back down at street level.
  const reachable = p.mode !== 'train' && p.invuln <= 0 && p.y < 3

  fieldTimer -= dt
  if (fieldTimer <= 0) {
    fieldTimer = 0.35
    rebuildField(world)
  }

  // --- spawning --------------------------------------------------------
  const wanted = HEAT.copsPerStar[Math.min(world.stars, HEAT.copsPerStar.length - 1)]
  const activeCount = world.police.reduce((n, c) => n + (c.active ? 1 : 0), 0)
  world.copSpawnTimer -= dt
  if (activeCount < wanted && world.copSpawnTimer <= 0) {
    spawnCop(world)
    world.copSpawnTimer = POLICE.spawnInterval
  }
  if (world.stars === 0) {
    clearPolice(world)
  }

  let nearestDist = Infinity
  const maxSpeed = CAR.policeMaxSpeed * (0.82 + 0.06 * world.stars)

  // --- patrol cars -----------------------------------------------------
  for (let i = 0; i < world.police.length; i++) {
    const cop = world.police[i]
    if (!cop.active) continue
    if (cop.soaked > 0) cop.soaked -= dt

    const dx = p.x - cop.x
    const dz = p.z - cop.z
    const dist = Math.hypot(dx, dz)
    nearestDist = Math.min(nearestDist, dist)

    if (dist > POLICE.despawnDistance) {
      cop.active = false
      continue
    }

    if (cop.bailed) {
      // Driver is out chasing on foot - the car just sits there.
      cop.speed *= Math.max(0, 1 - dt * 3)
      continue
    }

    const sees = dist < POLICE.chaseRange && hasLineOfSight(world.bp, cop.x, cop.z, p.x, p.z)
    cop.state = sees ? 'chase' : 'navigate'

    let steer, throttle
    if (cop.state === 'chase') {
      steer = steerToward(cop, p.x, p.z)
      // Ease off when already on top of the player so they can make the arrest.
      throttle = dist < 5 ? (Math.abs(cop.speed) > 6 ? -0.6 : 0.25) : 1
    } else {
      if (cop.node < 0) cop.node = nearestNode(cop.x, cop.z)

      // Re-attach to the nearest intersection if a crash knocked us off route.
      let target = lanePoint(world.city.nodes, cop.node, cop.next)
      if (Math.hypot(target.x - cop.x, target.z - cop.z) > 70) {
        cop.node = nearestNode(cop.x, cop.z)
      }
      // Recompute the downhill step every frame rather than only on arrival, so
      // a cop turns around as soon as the player doubles back.
      cop.next = downhillNeighbour(world, cop.node)
      target = lanePoint(world.city.nodes, cop.node, cop.next)
      if (Math.hypot(target.x - cop.x, target.z - cop.z) < 8) {
        cop.node = cop.next
        cop.next = downhillNeighbour(world, cop.node)
        target = lanePoint(world.city.nodes, cop.node, cop.next)
      }

      // Standing on the player's own intersection: head straight for them.
      if (world.copField[cop.node] === 0) {
        steer = steerToward(cop, p.x, p.z)
      } else {
        steer = steerToward(cop, target.x, target.z)
      }
      throttle = 1
    }

    driveVehicle(world, cop, dt, { throttle, steer, handbrake: false }, maxSpeed)
    cop.sirenPhase += dt

    // Bail out and chase on foot when the player is walking.
    if (p.mode === 'foot' && dist < POLICE.footCopRange &&
        (Math.abs(cop.speed) < 8 || dist < 7)) {
      cop.bailed = true
      cop.speed *= 0.2
      spawnFootCop(world, cop)
    }

    if (reachable && dist < POLICE.bustRange) {
      cop.bustTimer += dt
      if (cop.bustTimer >= POLICE.bustTime) {
        bustPlayer(world)
        return
      }
    } else {
      cop.bustTimer = Math.max(0, cop.bustTimer - dt * 2)
    }
  }

  // --- foot cops -------------------------------------------------------
  for (let i = 0; i < world.footCops.length; i++) {
    const foot = world.footCops[i]
    if (!foot.active) continue
    if (foot.soaked > 0) foot.soaked -= dt

    const dx = p.x - foot.x
    const dz = p.z - foot.z
    const dist = Math.hypot(dx, dz)
    nearestDist = Math.min(nearestDist, dist)

    if (dist > 60 || world.stars === 0) {
      foot.giveUp += dt
      if (foot.giveUp > 4) foot.active = false
    } else {
      foot.giveUp = 0
    }

    if (dist > 0.01) {
      const speed = POLICE.footCopSpeed * (0.9 + 0.04 * world.stars)
      foot.vx += ((dx / dist) * speed - foot.vx) * Math.min(1, dt * 5)
      foot.vz += ((dz / dist) * speed - foot.vz) * Math.min(1, dt * 5)
      foot.heading = Math.atan2(foot.vx, foot.vz)
    }
    foot.x += foot.vx * dt
    foot.z += foot.vz * dt
    resolveStatic(world.bp, foot, 0.5)
    foot.walkPhase += Math.hypot(foot.vx, foot.vz) * dt * 1.6

    if (reachable && p.mode === 'foot' && dist < POLICE.footBustRange) {
      bustPlayer(world)
      return
    }
  }

  // Trực thăng cảnh sát cũng hú còi, và khi đang bay thì nó là thứ duy nhất còn bám
  // theo - không tính vào đây thì cuộc rượt đuổi trên trời diễn ra trong im lặng.
  for (let i = 0; i < world.policeHelis.length; i++) {
    const h = world.policeHelis[i]
    if (!h.active || h.state !== 'chase') continue
    nearestDist = Math.min(nearestDist, Math.hypot(h.x - p.x, h.y - p.y, h.z - p.z))
  }

  // Siren volume rises as the nearest cop closes in.
  if (world.stars > 0 && nearestDist < 90) {
    updateSiren(Math.max(0.25, 1 - nearestDist / 90))
  } else {
    updateSiren(0)
  }
}
