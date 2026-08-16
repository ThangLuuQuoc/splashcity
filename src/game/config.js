// Every tunable number in the game lives here. Play-testing = editing this file.

export const CITY = {
  seed: 20260816,
  blocks: 7, // 7x7 grid of city blocks
  blockSize: 44, // width of a block (buildings + sidewalk)
  roadWidth: 14, // width of the road between blocks
  sidewalk: 4, // sidewalk ring inside each block
  sidewalkHeight: 0.35,
  buildingMin: 9,
  buildingMax: 46,
}

// Derived: distance from one block origin to the next.
CITY.cell = CITY.blockSize + CITY.roadWidth
CITY.extent = CITY.blocks * CITY.cell // full city square side
CITY.half = CITY.extent / 2

export const TIME = {
  dayLength: 480, // real seconds for a full 24-hour cycle
  startHour: 9.5,
}

export const WEATHER = {
  minDuration: 55, // seconds a weather state holds before the next roll
  maxDuration: 115,
  blendTime: 12, // seconds to cross-fade between two states
  maxParticles: 2800,
  maxLeaves: 150,
  lightningMin: 3.5,
  lightningMax: 12,
  snowCoverRate: 0.06, // how fast snow settles / melts, per second
  windBalloonForce: 9, // how hard a gust shoves a water balloon
  nightSightPenalty: 0.45, // police see this much less far at midnight
  rainSightPenalty: 0.25, // ...and this much less in heavy rain
}

export const RAIL = {
  ring: 2, // the loop runs along road ring 2 and its mirror, B - 2
  cornerRadius: 18,
  trackY: 9, // top of the rails - also the platform and train-floor height
  deckThickness: 0.7,
  halfWidth: 3.2,
  pillarSpacing: 18,
  // Pillars stand on the sidewalk, clear of the 14-wide roadway. At the kerb
  // they left only ~0.3 units of clearance and AI traffic kept wedging itself
  // against them.
  pillarOffset: 8.4,
  pillarHalf: 0.85,
  platformInner: 3.4, // platform starts just clear of the track
  platformOuter: 11, // ...and stops before the buildings begin
  platformHalfLength: 21, // long enough for a whole three-car train
  rampRun: 22,
  rampHalfWidth: 3,
  // The rest of the game treats the street as y = 0 (the sidewalk slab is a
  // cosmetic 0.35 lip), so the ramp has to meet the ground there too.
  groundY: 0,
}

export const TRAIN = {
  // Four trains on a four-station loop, started out of phase. Waiting more than
  // about fifteen seconds for a ride is not fun, especially mid-chase.
  count: 4,
  cars: 3,
  carLength: 12,
  carGap: 1.4,
  carWidth: 3.2,
  carHeight: 3,
  maxSpeed: 26,
  accel: 8,
  brake: 8,
  dwell: 5, // seconds with the doors open at each station
  boardRange: 8,
  minGap: 34, // arc-length safety gap between trains
}

export const PLAYER = {
  radius: 0.55,
  height: 1.7,
  walkSpeed: 7.5,
  sprintSpeed: 13,
  accel: 60,
  friction: 14,
  jumpSpeed: 7.5,
  gravity: 24,
  turnLerp: 14, // how fast the body swings to face movement
  enterRange: 4.2,
}

export const CAMERA = {
  footDistance: 9,
  footHeight: 4.2,
  carDistance: 14,
  carHeight: 6,
  trainDistance: 16,
  trainHeight: 7,
  lookAhead: 3,
  followLerp: 7,
  pitchMin: -0.25,
  pitchMax: 1.15,
  mouseSensitivity: 0.0024,
}

export const CAR = {
  radius: 1.9,
  length: 4.4,
  width: 2.1,
  maxSpeed: 30,
  maxReverse: 10,
  accel: 22,
  brake: 40,
  drag: 0.6,
  rollingFriction: 5,
  steerRate: 2.3, // rad/s at low speed
  steerSpeedFalloff: 0.55, // steering authority lost at top speed
  wallBounce: 0.4, // speed kept after hitting a building
  bumpImpulse: 0.9, // how bouncy car-vs-car is
  policeMaxSpeed: 33,
  trafficSpeed: 12,
}

export const HEAT = {
  max: 100,
  // star thresholds
  stars: [15, 35, 60, 85],
  copsPerStar: [0, 1, 2, 4, 6],
  // how much heat each bit of mischief adds
  splashPed: 8,
  splashCar: 12,
  splashCop: 20,
  bumpCar: 10,
  hitProp: 3,
  sidewalkPerSec: 12,
  sprayPerSec: 9,
  // cooling
  escapeDelay: 6, // seconds out of police sight before heat starts falling
  coolPerSec: 7,
  copSightRange: 55, // needs clear line of sight
  copCloseRange: 24, // this close, they have you regardless of corners
}

export const SCORE = {
  splashPed: 50,
  splashCar: 80,
  splashCop: 250,
  bumpCar: 30,
  hitProp: 10,
  sprayTick: 15, // per completed decal
  bustedPenalty: 0.5, // keep this fraction of your score when busted
}

export const ACTIONS = {
  maxAmmo: 16,
  throwCooldown: 0.34,
  throwSpeed: 26,
  throwArc: 0.28, // upward component
  balloonGravity: 22,
  balloonRadius: 0.35,
  splashRadius: 2.6,
  sprayRange: 7,
  sprayInterval: 0.14, // seconds between decal stamps
  sprayMaxDecals: 260,
  refillRadius: 4,
}

export const POLICE = {
  spawnInterval: 2.2,
  spawnMin: 55, // cops appear this far from the player...
  spawnMax: 115, // ...but no further, or the chase never starts
  chaseRange: 42, // switch from road-graph navigation to direct pursuit
  bustRange: 3.4,
  bustTime: 1.1,
  footCopSpeed: 9.6, // slower than player sprint (13) so escape is possible
  footCopRange: 16, // cop bails out of the car within this distance
  footBustRange: 1.9,
  respawnInvuln: 2.5,
  despawnDistance: 260,
}

export const CROWD = {
  pedestrians: 54,
  traffic: 14,
  pedSpeed: 2.4,
  pedFleeSpeed: 7,
  fleeRadius: 12,
  fleeTime: 5,
}

export const PALETTE = {
  sky: '#8fd3f4',
  ground: '#93c48b',
  road: '#4a4e57',
  roadLine: '#e8e4d0',
  sidewalk: '#c8c3b4',
  buildings: [
    '#f4a4a4', '#f7c59f', '#fbe7a1', '#b8e0a8', '#a8d8e0',
    '#b3b8ea', '#dcb0e6', '#f2b5d4', '#ffd9a0', '#a9e5d0',
  ],
  roofs: ['#7a6a5f', '#8a7f74', '#6f7d86', '#8c6f6f'],
  paint: ['#ff4d6d', '#ffd23f', '#3ddc97', '#3aa7ff', '#c77dff', '#ff9f1c'],
  cars: ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#a663cc', '#ef476f', '#06d6a0'],
  shirts: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff'],
  skin: ['#f2d5b8', '#e0ac82', '#c68863', '#8d5524', '#ffe0bd'],
}
