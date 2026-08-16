import { CAR, CITY } from '../config.js'
import { driveVehicle } from './vehicle.js'
import { nearestNode } from '../city.js'

const LANE = CITY.roadWidth / 4
const shortAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/** Target point for a vehicle heading to `next`, offset into the right-hand lane. */
export function lanePoint(nodes, fromId, toId) {
  const from = nodes[fromId]
  const to = nodes[toId]
  const dx = to.x - from.x
  const dz = to.z - from.z
  const len = Math.hypot(dx, dz) || 1
  const dirX = dx / len
  const dirZ = dz / len
  return { x: to.x - dirZ * LANE, z: to.z + dirX * LANE, dirX, dirZ }
}

/**
 * Steering input that turns a vehicle toward a world point. driveVehicle adds
 * `steer` to `heading`, so the sign has to match the heading error, not oppose it.
 */
export function steerToward(car, tx, tz) {
  const desired = Math.atan2(tx - car.x, tz - car.z)
  const diff = shortAngle(desired - car.heading)
  return Math.max(-1, Math.min(1, diff * 1.6))
}

export function pickNextNode(nodes, current, previous, rng = Math.random) {
  const node = nodes[current]
  const options = node.nb.filter((n) => n !== previous)
  const list = options.length ? options : node.nb
  return list[Math.floor(rng() * list.length)]
}

export function updateTraffic(world, dt) {
  const nodes = world.city.nodes
  for (let i = 0; i < world.cars.length; i++) {
    const car = world.cars[i]
    if (car.driver !== 'ai' || car.kind !== 'traffic') continue

    if (car.node < 0 || car.next < 0) {
      car.node = nearestNode(car.x, car.z)
      car.next = pickNextNode(nodes, car.node, -1)
    }

    const target = lanePoint(nodes, car.node, car.next)
    const dist = Math.hypot(target.x - car.x, target.z - car.z)
    if (dist < 7) {
      const prev = car.node
      car.node = car.next
      car.next = pickNextNode(nodes, car.node, prev)
    }

    // Brake for whatever is directly in front (other cars, the player's car).
    let throttle = 1
    const fx = Math.sin(car.heading)
    const fz = Math.cos(car.heading)
    for (let j = 0; j < world.cars.length; j++) {
      if (j === i) continue
      const other = world.cars[j]
      const dx = other.x - car.x
      const dz = other.z - car.z
      const ahead = dx * fx + dz * fz
      if (ahead > 0 && ahead < 9 && Math.abs(dx * fz - dz * fx) < 2.4) {
        throttle = ahead < 4 ? -0.3 : 0
        break
      }
    }

    // Two cars can end up nose to nose politely waiting forever. After a couple
    // of seconds of not moving, one of them just goes.
    car.stuck = Math.abs(car.speed) < 1 ? (car.stuck || 0) + dt : 0
    if (car.stuck > 2) {
      throttle = 1
      if (car.stuck > 4) car.stuck = 0
    }

    driveVehicle(world, car, dt, {
      throttle,
      steer: steerToward(car, target.x, target.z),
      handbrake: false,
    }, CAR.trafficSpeed)
  }
}
