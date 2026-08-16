import { CAR } from '../config.js'
import { resolveStatic, resolveCircles } from '../collision.js'

// One arcade car model shared by the player, traffic and police. State is
// { x, z, heading, speed }: throttle changes speed, steering rotates heading,
// and the car always travels along its heading. No drift simulation - the goal
// is bumper-car readability, not a driving sim.

/**
 * @param controls { throttle: -1..1, steer: -1..1, handbrake: boolean }
 * @returns impact strength (0 when nothing was hit)
 */
export function driveVehicle(world, car, dt, controls, maxSpeed = CAR.maxSpeed) {
  const throttle = controls.throttle || 0
  const steer = controls.steer || 0
  // Wet tarmac and snow cut into acceleration, braking and cornering bite.
  const traction = world.weather ? world.weather.params.grip : 1

  if (throttle !== 0) {
    const coasting = Math.abs(car.speed) < 0.5
    const sameDirection = coasting || Math.sign(throttle) === Math.sign(car.speed)
    car.speed += throttle * (sameDirection ? CAR.accel : CAR.brake) * traction * dt
  } else {
    const f = CAR.rollingFriction * dt
    car.speed = Math.abs(car.speed) <= f ? 0 : car.speed - Math.sign(car.speed) * f
  }

  if (controls.handbrake) {
    // Locked wheels bite far less on a wet or snowy road.
    const f = CAR.brake * 1.5 * traction * dt
    car.speed = Math.abs(car.speed) <= f ? 0 : car.speed - Math.sign(car.speed) * f
  }

  // Aerodynamic-ish drag so top speed settles instead of climbing forever.
  car.speed -= car.speed * CAR.drag * dt * (Math.abs(car.speed) / maxSpeed)
  car.speed = Math.max(-CAR.maxReverse, Math.min(maxSpeed, car.speed))

  // Steering authority drops with speed, and a parked car cannot pirouette.
  const speedRatio = Math.min(1, Math.abs(car.speed) / maxSpeed)
  // Cold tyres bite less, so the car turns in lazily as well as sliding wide.
  const authority = (1 - CAR.steerSpeedFalloff * speedRatio) * (0.55 + 0.45 * traction)
  const grip = Math.min(1, Math.abs(car.speed) / 3)
  car.heading += steer * CAR.steerRate * authority * grip * Math.sign(car.speed || 1) * dt
  car.steer += (steer - car.steer) * Math.min(1, dt * 10)

  // The direction the car actually travels lags behind where it is pointing.
  // With full grip it catches up almost instantly; on snow the car slides wide
  // through corners, which is the whole feel of driving in bad weather.
  const headX = Math.sin(car.heading)
  const headZ = Math.cos(car.heading)
  if (car.dirX === undefined) {
    car.dirX = headX
    car.dirZ = headZ
  }
  const catchUp = Math.min(1, dt * (4 + 20 * traction))
  car.dirX += (headX - car.dirX) * catchUp
  car.dirZ += (headZ - car.dirZ) * catchUp
  const dirLen = Math.hypot(car.dirX, car.dirZ) || 1
  car.dirX /= dirLen
  car.dirZ /= dirLen

  const dirX = car.dirX
  const dirZ = car.dirZ
  car.x += dirX * car.speed * dt
  car.z += dirZ * car.speed * dt
  car.wheelSpin = (car.wheelSpin || 0) + car.speed * dt * 1.6

  // --- buildings -------------------------------------------------------
  const hit = resolveStatic(world.bp, car, CAR.radius)
  let impact = 0
  if (hit.depth > 0) {
    const vdotn = dirX * hit.x + dirZ * hit.z
    if (vdotn < 0) {
      const headOn = Math.min(1, -vdotn)
      impact = Math.abs(car.speed) * headOn

      // Slide along the wall; if we hit it square, bounce back instead.
      let tx = dirX - hit.x * vdotn
      let tz = dirZ - hit.z * vdotn
      const tlen = Math.hypot(tx, tz)
      if (tlen > 0.15) {
        car.heading = Math.atan2(tx / tlen, tz / tlen)
        car.dirX = tx / tlen
        car.dirZ = tz / tlen
        car.speed *= 1 - 0.55 * headOn
      } else {
        car.speed *= -CAR.wallBounce
      }
    }
  }
  return impact
}

/** Bumper-car response between two vehicles. Returns the impact strength. */
export function bumpVehicles(a, b, ra, rb) {
  const before = Math.abs(a.speed) + Math.abs(b.speed)
  const overlap = resolveCircles(a, b, ra, rb, 1)
  if (overlap <= 0) return 0

  const dx = b.x - a.x
  const dz = b.z - a.z
  const d = Math.hypot(dx, dz) || 1
  const nx = dx / d
  const nz = dz / d

  const adir = { x: Math.sin(a.heading), z: Math.cos(a.heading) }
  const bdir = { x: Math.sin(b.heading), z: Math.cos(b.heading) }
  const closing = (adir.x * nx + adir.z * nz) * a.speed - (bdir.x * nx + bdir.z * nz) * b.speed
  if (closing <= 0.5) return 0

  const transfer = closing * CAR.bumpImpulse * 0.5
  a.speed -= transfer * (adir.x * nx + adir.z * nz)
  b.speed += transfer * (bdir.x * nx + bdir.z * nz)

  // A glancing hit also nudges each car's heading, which is what sells the bump.
  a.heading -= nx * 0.05 * transfer * 0.1
  b.heading += nx * 0.05 * transfer * 0.1

  return Math.min(before, closing)
}
