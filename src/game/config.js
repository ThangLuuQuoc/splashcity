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

export const OCEAN = {
  beachWidth: 52, // sand ring between the city wall and the water
  waterY: -1.8,
  extent: 4000,
}

export const DISASTER = {
  warningTime: 6, // seconds of on-screen warning before it arrives
  minGap: 90, // shortest quiet spell between two disasters
  maxGap: 190,
  stormChance: 0.55, // a thunderstorm makes one much more likely

  tornado: {
    duration: 42,
    radius: 32, // outer pull
    core: 8, // inside this it lifts rather than drags
    moveSpeed: 13,
    pull: 22, // inward, units/s^2
    swirl: 40, // tangential
    lift: 30,
    carLift: 15, // the initial kick that gets a car off the ground
    liftAccel: 46, // sustained lift while held in the funnel; beats gravity
    maxHeight: 30, // cars stop climbing here and just circle
    pedLift: 11,
    gravity: 19,
    airDrag: 0.55, // how fast a flung car loses its sideways speed
  },

  tsunami: {
    speed: 32, // how fast the front crosses the city
    thickness: 30, // depth of the churning water behind the crest
    crest: 16, // wave height - tall enough to read as a wall from street level
    push: 46,
    lift: 12,
    floodTime: 10, // seconds the shallow water lingers before draining
  },
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
  heliDistance: 24,
  heliHeight: 9,
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

// Trực thăng ngắm thành phố từ trên không
export const HELI = {
  boardRadius: 5.0, // đứng gần cỡ này là bấm E lên được
  bodyRadius: 3.0, // bán kính va chạm với toà nhà
  // Vận tốc tới hạn của mô hình này là accel/drag, nên accel phải đủ lớn để với tới
  // maxSpeed - nếu không thì maxSpeed thành số chết và máy bay bay chậm hơn hẳn ý định.
  maxSpeed: 34, // ~122 km/h, bay ngang thành phố 420m trong khoảng 13 giây
  accel: 52,
  drag: 1.5,
  yawRate: 1.5, // rad mỗi giây
  climbRate: 14,
  // Nhả nút lên/xuống thì dừng dâng trong khoảng climbRate/climbDamp mét. Để 6 thì
  // trôi thêm 2.3m mỗi lần nhả - treo máy bay ngắm cảnh thấy bồng bềnh, khó canh.
  // Để 14 thì trôi ~1m: vẫn mềm chứ không phanh cứng, mà canh cao độ đã ăn tay.
  climbDamp: 14,
  maxAltitude: 110, // vẫn thấp hơn trần mây, đủ nhìn trọn thành phố
  groundClearance: 1.1, // cao độ khi càng đáp chạm sàn
  landSpeed: 3.0, // hạ nhanh hơn mức này thì chưa cho xuống máy bay
  rotorSpin: 26, // rad mỗi giây khi động cơ chạy
  tiltMax: 0.28, // độ nghiêng thân khi tăng tốc / vào cua, chỉ để nhìn cho đẹp
  dryOnGround: 0.5, // đáp xuống đất thì nước trên cánh quạt khô nhanh hơn hẳn

  // Chế độ bay tự động ngắm cảnh: máy bay tự vòng quanh từng khu vực đặc biệt.
  tour: {
    // Toà nhà cao nhất thành phố là 43.7m, nên bay ở 52m là chắc chắn không đụng gì.
    altitude: 52,
    cruiseSpeed: 19, // chậm hơn hẳn tốc độ lái tay (34) cho có thời gian ngắm
    orbitRadius: 34, // bán kính vòng quanh mỗi khu vực
    orbitSpeed: 0.32, // rad mỗi giây -> một vòng khoảng 20 giây
    orbitTurns: 1, // số vòng quanh mỗi khu vực trước khi đi tiếp
    climbScale: 0.35, // lúc còn đang lấy độ cao thì bay ngang chậm lại cho an toàn
    steerLerp: 1.8, // độ mượt khi đổi hướng bay
    cameraLerp: 0.8, // camera tự nhìn theo, nhưng nhẹ tay để người chơi vẫn kéo được
  },
}

// Trực thăng cảnh sát: đội bay truy bắt khi người chơi trốn lên trời.
//
// Ba con số phải luôn nhỏ hơn của HELI (maxSpeed, climbRate) - nếu không thì bay
// thẳng cũng không bao giờ cắt được đuôi và người chơi mất hẳn đường thoát.
export const POLICE_HELI = {
  count: 2,
  // Hễ bị truy nã là bay lên trời cũng không thoát: 1 sao đã có đội bay. Bay ngắm cảnh
  // lúc không sao vẫn hoàn toàn yên thân, vì điều kiện là stars >= 1.
  minStars: 1,
  spawnDelay: 3.5, // giãn cách giữa hai chiếc
  spawnMin: 150, // xuất phát ngoài tầm mắt...
  spawnMax: 190, // ...nhưng đủ gần để cuộc rượt bắt đầu trước khi máu truy nã nguội
  spawnAltitude: 60,
  airborneY: 12, // cao hơn mức này thì coi như người chơi đang ở trên không

  // Cùng cái bẫy đã ghi ở HELI.maxSpeed: vận tốc tới hạn là accel/drag, phải lớn hơn
  // maxSpeed thì trần tốc độ mới có tác dụng.
  // Thành phố chỉ rộng 420m, nên chênh lệch 4 km/h là vô nghĩa: bay thẳng đến hết bản
  // đồ cũng không đủ nới ra khỏi tầm nhìn. Chênh 8 (26 so với 34) thì mất khoảng 13
  // giây bay thẳng để cắt đuôi - vừa đủ căng mà vẫn là một đường thoát có thật.
  maxSpeed: 26,
  accel: 44, // accel/drag = 29 > maxSpeed
  drag: 1.5,
  climbRate: 12,
  steerLerp: 1.6, // độ mượt khi đổi hướng bay
  yawLerp: 2.2, // độ nhanh mũi máy bay quay về phía người chơi
  leadTime: 1.1, // dự đoán vị trí người chơi để cắt góc thay vì bám đuôi
  // Cự ly treo (8 ngang + 5 cao, cộng độ trễ lái) ổn định ở khoảng 11m. Mọi ngưỡng bên
  // dưới phải rộng hơn con số đó, nếu không thì vòi rồng và lệnh bắt không bao giờ nổ.
  hoverRange: 8, // vào tới đây thì vòng quanh mục tiêu chứ không đâm thẳng vào
  hoverAbove: 5, // treo cao hơn người chơi chừng này, đèn pha mới chiếu xuống được
  minAltitude: 22, // thấp hơn nóc nhà cao nhất: bay luồn giữa các toà vẫn là chỗ trốn
  bodyRadius: 3.0,

  // Ba vòng cảnh báo tăng dần: thấy -> khoá đèn pha -> phun vòi rồng.
  sightRange: 90,
  spotRange: 26,
  cannonRange: 14,

  // Đèn pha khoá xong phải giữ được mục tiêu chừng này giây mới bắt đầu phun vòi rồng.
  // Đây là quãng để người chơi kịp hiểu chuyện gì đang xảy ra và bẻ lái chạy.
  lockDelay: 4,
  soakPerSec: 0.16, // ướt từ 0 đến 1 trong hơn 6 giây, bất kể mấy chiếc đang chĩa vòi vào
  soakDrain: 0.3, // thoát khỏi tia nước thì khô nhanh hơn hẳn lúc bị phun
  liftPenalty: 0.75, // ướt hết thì chỉ còn 25% sức leo
  speedPenalty: 0.25, // ...và bay chậm hơn 25%
  ceilingPenalty: 0.6, // trần bay bị ép tụt, buộc phải hạ cánh
  sinkRate: 0.5, // tốc độ bị dìm xuống, tính theo HELI.climbRate

  // Đạn cao su: bắn vào thân máy bay cho rung giật mất thăng bằng vài giây. Không gây
  // sát thương, không bắt được ai - chỉ làm người chơi loạng choạng đủ để đội bay áp
  // sát. Đây là thứ khiến quãng "đang bị đèn pha khoá" có việc để xảy ra, thay vì chỉ
  // đứng đợi cho tới lúc vòi rồng với tới.
  gun: {
    range: 22, // xa hơn vòi rồng (14m): bị bắn trước, bị xịt nước sau
    interval: 1.4, // giây giữa hai phát
    speed: 52,
    spread: 0.035, // lệch nhẹ cho có phát trượt
    hitRadius: 2.6,
    life: 2.2, // bay quá lâu không trúng thì tự tắt
    staggerTime: 1.5, // giây mất thăng bằng sau mỗi phát trúng
    kick: 6, // cú hích vào vận tốc lúc trúng đạn
    shake: 0.5,
  },

  bustRange: 12, // chỉ bắt trên không khi máy bay đã ướt sũng
  bustTime: 5.0, // và vẫn phải giữ được ngần này giây - vẫn còn đường vùng ra

  // Thành phố chỉ rộng 420m nên không thể bay thẳng mãi để cắt đuôi. Không có nhịp nghỉ
  // thì đội bay thành một bản án chung thân: hết dầu là phải về, rồi mới có tốp khác.
  maxChase: 45, // giây bám liên tục trước khi phải về tiếp dầu
  regroupDelay: 25, // và chừng này giây nữa mới có chiếc tiếp theo cất cánh
  soakedRecoil: 8, // giây phải lùi ra sau khi ăn một quả bóng nước
  recoilRange: 2.2, // lùi ra xa gấp chừng này lần hoverRange
  loseRange: 220,
  giveUpTime: 6, // mất dấu lâu hơn mức này thì rút
  leaveTime: 5, // thời gian bay lên cao rút lui trước khi biến mất
  rotorSpin: 30,
}

// Tự động chạy tới khu vực đã chọn trên bản đồ
export const NAV = {
  speedBoost: 1.8, // nhân vào tốc độ chạy nước rút, để đi xa không phải ngồi đợi
  waypointRadius: 5.0, // đến gần giao lộ cỡ này thì chuyển sang điểm kế tiếp
  arriveRadius: 4.0, // coi như đã tới đích
  cancelDeflection: 0.3, // người chơi đẩy cần / bấm phím quá mức này thì nhường tay lái
  cameraLerp: 2.2, // độ nhanh camera quay theo hướng chạy
  stuckDistance: 0.6, // dưới mức này (mét mỗi giây) coi như đang bị chặn
  stuckTimeout: 1.6, // bị chặn quá lâu thì thoát chế độ tự động
  messageDuration: 3.0,
}

export const INTERIORS = {
  enterDistance: 7.5,
  policeOffset: { x: -400, y: -80, z: 0 },
  supermarketOffset: { x: 400, y: -80, z: 0 },
  floorHeight: 6.0, // Tầng 2 cách tầng 1 là 6m
}

export const SUPERMARKET_PRODUCTS = [
  // Hóa mỹ phẩm (Tầng 1)
  {
    id: 'ps_strawberry',
    name: 'Kem đánh răng P/S Dâu Trẻ Em',
    shortName: 'P/S Dâu',
    category: 'personal_care',
    price: 32000,
    shelf: 'shelf_care',
    color: '#e63946',
    icon: '🪥',
    desc: 'Bôi vệt dâu thơm lừng trơn trượt vật lý lên sàn nhà',
    type: 'toothpaste',
  },
  // Bánh & Snack (Tầng 1)
  {
    id: 'oreo',
    name: 'Bánh Quy Kẹp Kem Oreo',
    shortName: 'Bánh Oreo',
    category: 'snacks',
    price: 24000,
    shelf: 'shelf_snacks_1',
    color: '#1a3b5c',
    icon: '🍪',
    desc: 'Ăn vào nhận Sugar Rush tăng 50% tốc độ chạy',
    type: 'snack_speed',
  },
  {
    id: 'lays_classic',
    name: "Snack Khoai Tây Lay's Cổ Điển",
    shortName: "Lay's Vàng",
    category: 'snacks',
    price: 22000,
    shelf: 'shelf_snacks_1',
    color: '#ffb703',
    icon: '🥔',
    desc: 'Snack giòn tan tăng nhẹ năng lượng',
    type: 'snack_speed',
  },
  {
    id: 'pringles',
    name: 'Snack Khoai Tây Ống Pringles',
    shortName: 'Pringles',
    category: 'snacks',
    price: 48000,
    shelf: 'shelf_snacks_2',
    color: '#d90429',
    icon: '🥫',
    desc: 'Ăn vào nhận Sugar Rush chạy siêu nhanh',
    type: 'snack_speed',
  },
  // Bánh kẹo & Sô-cô-la (Tầng 1)
  {
    id: 'feastables',
    name: 'Sô-cô-la MrBeast Feastables',
    shortName: 'MrBeast Choco',
    category: 'sweets',
    price: 65000,
    shelf: 'shelf_sweets',
    color: '#00b4d8',
    icon: '⚡',
    desc: 'MrBeast Energy tăng 85% tốc độ chạy cực đại trong 15s',
    type: 'mrbeast_speed',
  },
  {
    id: 'meiji_choco',
    name: 'Sô-cô-la Sữa Meiji Milk Chocolate',
    shortName: 'Meiji Choco',
    category: 'sweets',
    price: 38000,
    shelf: 'shelf_sweets',
    color: '#4a2810',
    icon: '🍫',
    desc: 'Hương vị sô-cô-la ngọt ngào thư giãn',
    type: 'snack_speed',
  },
  {
    id: 'kitkat',
    name: 'Bánh Xốp Phủ Sô-cô-la KitKat',
    shortName: 'KitKat',
    category: 'sweets',
    price: 26000,
    shelf: 'shelf_sweets',
    color: '#d62828',
    icon: '🍫',
    desc: 'Nghỉ xả hơi xơi KitKat tăng tốc độ',
    type: 'snack_speed',
  },
  // Trái cây tươi (Tầng 1)
  {
    id: 'banana',
    name: 'Chuối Già Nam Mỹ Tươi',
    shortName: 'Chuối Nam Mỹ',
    category: 'fruits',
    price: 28000,
    shelf: 'shelf_fruits',
    color: '#ffd166',
    icon: '🍌',
    desc: 'Ăn xong thả vỏ chuối ra sàn làm cảnh sát và NPC trượt té 360 độ',
    type: 'banana_peel',
  },
  {
    id: 'grapes',
    name: 'Nho Mẫu Đơn Xanh Tươi',
    shortName: 'Nho Mẫu Đơn',
    category: 'fruits',
    price: 75000,
    shelf: 'shelf_fruits',
    color: '#9b5de5',
    icon: '🍇',
    desc: 'Ném chùm nho trêu chọc mọi người xung quanh',
    type: 'fruit_throw',
  },
  {
    id: 'queen_apple',
    name: 'Táo Queen New Zealand Giòn Ngọt',
    shortName: 'Táo Queen',
    category: 'fruits',
    price: 45000,
    shelf: 'shelf_fruits',
    color: '#c1121f',
    icon: '🍎',
    desc: 'Táo đỏ giòn ngọt, có thể ăn hoặc ném',
    type: 'fruit_throw',
  },
  // Đồ chơi & Súng nước (Tầng 2)
  {
    id: 'supersoaker_titan',
    name: 'Súng Nước Super Soaker Titan',
    shortName: 'Súng Soaker',
    category: 'toys',
    price: 150000,
    shelf: 'shelf_toys',
    color: '#06d6a0',
    icon: '🔫',
    desc: 'Trang bị súng nước siêu cấp: nạp đầy đạn và nhận Mega Balloon!',
    type: 'weapon_upgrade',
  },
  // Nước giải khát (Tầng 2)
  {
    id: 'sting_strawberry',
    name: 'Nước Tăng Lực Sting Dâu Tây',
    shortName: 'Sting Dâu',
    category: 'drinks',
    price: 15000,
    shelf: 'shelf_drinks',
    color: '#e63946',
    icon: '🥤',
    desc: 'Uống vào hồi phục thể lực và nhận buff chạy nước rút trong 12s',
    type: 'snack_speed',
  },
]


