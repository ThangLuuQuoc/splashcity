import { HEAT } from '../config.js'
import { hasLineOfSight } from '../collision.js'
import { visibilityFactor } from './weather.js'
import { playStar } from '../audio.js'

export function starsForHeat(heat) {
  let stars = 0
  for (let i = 0; i < HEAT.stars.length; i++) {
    if (heat >= HEAT.stars[i]) stars = i + 1
  }
  return stars
}

export function addHeat(world, amount) {
  if (world.player.invuln > 0) return
  world.heat = Math.min(HEAT.max, world.heat + amount)
  world.lastMischief = world.time
  world.outOfSight = 0
  refreshStars(world)
}

function refreshStars(world) {
  const next = starsForHeat(world.heat)
  if (next > world.stars) playStar()
  world.stars = next
}

/** True when at least one active cop can currently see the player. */
export function policeCanSee(world) {
  const p = world.player
  // Up on the elevated railway you are simply gone - that is the whole point of
  // the train as an escape route.
  if (p.mode === 'train') return false

  // Darkness and heavy weather shorten how far a patrol can pick you out.
  const sight = HEAT.copSightRange * visibilityFactor(world)

  for (let i = 0; i < world.police.length; i++) {
    const cop = world.police[i]
    if (!cop.active) continue
    const d = Math.hypot(cop.x - p.x, cop.z - p.z)
    // Right on top of you counts even round a corner - otherwise the grid city
    // blocks line of sight so often that escaping on foot is trivial.
    if (d < HEAT.copCloseRange) return true
    if (d > sight) continue
    if (hasLineOfSight(world.bp, cop.x, cop.z, p.x, p.z)) return true
  }
  for (let i = 0; i < world.footCops.length; i++) {
    const cop = world.footCops[i]
    if (!cop.active) continue
    const d = Math.hypot(cop.x - p.x, cop.z - p.z)
    if (d < HEAT.copCloseRange) return true
    if (d < sight * 0.6 && hasLineOfSight(world.bp, cop.x, cop.z, p.x, p.z)) return true
  }
  return false
}

export function updateHeat(world, dt) {
  if (world.heat <= 0) {
    world.stars = 0
    world.outOfSight = 0
    world.cooling = false
    return
  }

  if (policeCanSee(world)) {
    world.outOfSight = 0
    world.cooling = false
    return
  }

  world.outOfSight += dt
  world.cooling = world.outOfSight >= HEAT.escapeDelay
  if (world.cooling) {
    world.heat = Math.max(0, world.heat - HEAT.coolPerSec * dt)
    refreshStars(world)
  }
}
