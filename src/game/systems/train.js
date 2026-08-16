import { TRAIN, RAIL } from '../config.js'
import { railAt, arcAhead } from '../rail.js'

// Trains run the elevated loop on a simple timetable: accelerate to line speed,
// brake into the next station on a square-root speed curve, hold the doors open
// for a few seconds, repeat. Two trains share the loop half a lap apart.

const scratch = {}
const SPACING = TRAIN.carLength + TRAIN.carGap

// `s` tracks the lead car, so a train berths with its middle car level with the
// station marker rather than hanging off the back of the platform.
const stopS = (station) => station.s + ((TRAIN.cars - 1) / 2) * SPACING

export function createTrains(rail) {
  const trains = []
  for (let i = 0; i < TRAIN.count; i++) {
    const startStation = rail.stations[i % rail.stations.length]
    trains.push({
      index: i,
      s: stopS(startStation),
      speed: 0,
      state: 'dwell',
      // Stagger the first departure so they don't run the loop in lockstep.
      dwellTimer: TRAIN.dwell * (0.3 + (i % rail.stations.length) * 0.45),
      station: startStation.index,
      next: (startStation.index + 1) % rail.stations.length,
      cars: Array.from({ length: TRAIN.cars }, () => ({ x: 0, z: 0, heading: 0 })),
    })
  }
  return trains
}

/** World-space position of a train car, refreshed every frame. */
function updateCarTransforms(rail, train) {
  const spacing = TRAIN.carLength + TRAIN.carGap
  for (let i = 0; i < train.cars.length; i++) {
    // The lead car sits at `s`; the rest trail behind it along the track.
    railAt(rail, train.s - i * spacing, scratch)
    const car = train.cars[i]
    car.x = scratch.x
    car.z = scratch.z
    car.heading = scratch.heading
  }
}

export function updateTrains(world, dt) {
  const rail = world.city.rail
  const stations = rail.stations

  for (let t = 0; t < world.trains.length; t++) {
    const train = world.trains[t]

    if (train.state === 'dwell') {
      train.dwellTimer -= dt
      if (train.dwellTimer <= 0) {
        train.next = (train.station + 1) % stations.length
        train.station = -1
        train.state = 'run'
      }
    } else {
      const target = stations[train.next]
      const targetS = stopS(target)
      const ahead = arcAhead(rail, train.s, targetS)

      // Don't run up the back of the train in front.
      let gap = Infinity
      for (let o = 0; o < world.trains.length; o++) {
        if (o === t) continue
        gap = Math.min(gap, arcAhead(rail, train.s, world.trains[o].s))
      }

      // v = sqrt(2 * a * d) is the fastest speed you can still stop from, so
      // taking the smaller of "room to the platform" and "room to the train
      // ahead" gives a smooth brake into either.
      const room = Math.min(Math.max(0, ahead - 0.2), Math.max(0, gap - TRAIN.minGap))
      const desired = Math.min(TRAIN.maxSpeed, Math.sqrt(2 * TRAIN.brake * room))

      train.speed = desired > train.speed
        ? Math.min(desired, train.speed + TRAIN.accel * dt)
        : Math.max(desired, train.speed - TRAIN.brake * dt)

      train.s += train.speed * dt

      const remaining = arcAhead(rail, train.s, targetS)
      const overshot = remaining > rail.length - 5
      if (remaining < 0.5 || overshot) {
        train.s = targetS
        train.speed = 0
        train.state = 'dwell'
        train.dwellTimer = TRAIN.dwell
        train.station = target.index
      }
    }

    updateCarTransforms(rail, train)
  }
}

/** The station a train currently has its doors open at, or null. */
export function dwellingStation(world, train) {
  if (train.state !== 'dwell' || train.station < 0) return null
  return world.city.rail.stations[train.station]
}

/**
 * Nearest boardable train car for the player, or null. The player has to be on
 * foot, up on the platform, and next to a train with its doors open.
 */
export function findBoardableCar(world) {
  const p = world.player
  if (p.mode !== 'foot' || p.y < RAIL.trackY - 1) return null

  for (let t = 0; t < world.trains.length; t++) {
    const train = world.trains[t]
    if (!dwellingStation(world, train)) continue
    for (let c = 0; c < train.cars.length; c++) {
      const car = train.cars[c]
      const d = Math.hypot(car.x - p.x, car.z - p.z)
      if (d < TRAIN.boardRange) return { train: t, car: c, distance: d }
    }
  }
  return null
}

export function boardTrain(world, hit) {
  const p = world.player
  p.mode = 'train'
  p.train = hit.train
  p.trainCar = hit.car
  p.vx = 0
  p.vz = 0
  p.vy = 0
  p.enterCooldown = 0.45
  // Stand a little off-centre so the player is visible through the windows.
  p.trainOffset = { x: (Math.random() - 0.5) * 1.2, z: (Math.random() - 0.5) * 6 }
}

/** Ride along with the car. Returns false if the ride is no longer valid. */
export function rideTrain(world, dt) {
  const p = world.player
  const train = world.trains[p.train]
  if (!train) return false
  const car = train.cars[p.trainCar]
  if (!car) return false

  const s = Math.sin(car.heading)
  const c = Math.cos(car.heading)
  const o = p.trainOffset
  p.x = car.x + o.x * c + o.z * s
  p.z = car.z - o.x * s + o.z * c
  p.y = RAIL.trackY
  p.heading = car.heading
  p.walkPhase += Math.abs(train.speed) * dt * 0.12
  return true
}

/** Step off onto the platform when stopped, or hop down to the street. */
export function leaveTrain(world) {
  const p = world.player
  const train = world.trains[p.train]
  const station = train && dwellingStation(world, train)

  if (station) {
    // Onto the middle of the platform.
    const out = (RAIL.platformInner + RAIL.platformOuter) / 2
    p.x = station.x + station.dx * out
    p.z = station.z + station.dz * out
    p.y = RAIL.trackY
    p.vy = 0
  } else {
    // Leap off the side of a moving train and fall to the street.
    const car = train ? train.cars[p.trainCar] : null
    if (car) {
      const side = Math.cos(car.heading) * 4.5
      const sideZ = -Math.sin(car.heading) * 4.5
      p.x = car.x + side
      p.z = car.z + sideZ
    }
    p.y = RAIL.trackY - 0.4
    p.vy = 1.5
  }

  p.mode = 'foot'
  p.train = -1
  p.vx = 0
  p.vz = 0
  p.onGround = false
  p.enterCooldown = 0.45
}
