// Trực thăng cảnh sát: đội bay được điều lên khi người chơi trốn bằng đường không.
//
// Trước khi có hệ này, bay lên là một nút "xoá sao": cảnh sát mặt đất chỉ với tới được
// người chơi ở dưới 3m, còn tia nhìn của họ thì toà nhà nào cũng chắn.
//
// Không dùng lưới đường như police.js - trên trời không có đường, nên AI chỉ là: ngắm
// vào vị trí DỰ ĐOÁN của người chơi, giữ cự ly, rồi leo thang ba bước (thấy -> khoá đèn
// pha -> phun vòi rồng). Bắt trên không chỉ xảy ra khi máy bay người chơi đã ướt sũng,
// vì tóm gọn một đứa trẻ đang bay ở 80m mà không báo trước thì chỉ gây ức chế.
//
// Đội bay luôn chậm hơn máy bay người chơi (30 vs 34) - bay thẳng một mạch là thoát.

import { POLICE_HELI, HELI, CITY } from '../config.js'
import { resolveStatic } from '../collision.js'
import { visibilityFactor } from './weather.js'
import { bustPlayer } from './police.js'
import { playRubberShot, playRubberHit } from '../audio.js'

const MAX_POLICE_HELIS = POLICE_HELI.count

export function createPoliceHelis() {
  const arr = new Array(MAX_POLICE_HELIS)
  for (let i = 0; i < MAX_POLICE_HELIS; i++) {
    arr[i] = {
      active: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      heading: 0,
      rotor: 0,
      tiltRoll: 0,
      state: 'chase', // chase | leaving
      orbitAngle: 0,
      orbitDir: i % 2 === 0 ? 1 : -1,
      spotOn: false,
      cannonOn: false,
      lockTimer: 0, // giữ được đèn pha bao lâu rồi - đủ lâu mới phun vòi rồng
      gunTimer: 0, // đếm ngược tới phát đạn cao su tiếp theo
      soaked: 0, // ăn bóng nước thì phải lùi ra, đây là counter-play của người chơi
      bustTimer: 0,
      giveUp: 0,
      chaseTimer: 0,
      leaveTimer: 0,
    }
  }
  return arr
}

/** Kho đạn cao su dùng chung cho cả đội bay. */
export function createRubberShots() {
  const arr = new Array(18)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = { active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 }
  }
  return arr
}

/** Bắn một phát về phía chỗ người chơi SẼ tới, kèm chút lệch cho có phát trượt. */
function fireRubberShot(world, h) {
  const cfg = POLICE_HELI.gun
  const shot = world.rubberShots.find((s) => !s.active)
  if (!shot) return

  const p = world.player
  const v = playerVelocity(world)
  const travel = distanceToPlayer(world, h) / cfg.speed
  const tx = p.x + v.vx * travel
  const ty = p.y + 1.4
  const tz = p.z + v.vz * travel

  // Nòng nằm ở mũi máy bay, để viên đạn không lòi ra từ giữa thân.
  const sx = h.x + Math.sin(h.heading) * 1.6
  const sz = h.z + Math.cos(h.heading) * 1.6
  const sy = h.y + 0.9

  const dx = tx - sx
  const dy = ty - sy
  const dz = tz - sz
  const len = Math.hypot(dx, dy, dz) || 1
  const jitter = () => (Math.random() - 0.5) * cfg.spread

  shot.active = true
  shot.x = sx
  shot.y = sy
  shot.z = sz
  shot.vx = (dx / len + jitter()) * cfg.speed
  shot.vy = (dy / len + jitter()) * cfg.speed
  shot.vz = (dz / len + jitter()) * cfg.speed
  shot.life = cfg.life
  playRubberShot()
}

/**
 * Đạn cao su đang bay. Trúng thân máy bay người chơi thì hích lệch vận tốc và ghi
 * `heli.stagger` - helicopter.js đọc con số đó để làm loạng choạng tay lái.
 */
function updateRubberShots(world, dt) {
  const cfg = POLICE_HELI.gun
  const p = world.player
  for (let i = 0; i < world.rubberShots.length; i++) {
    const s = world.rubberShots[i]
    if (!s.active) continue

    s.x += s.vx * dt
    s.y += s.vy * dt
    s.z += s.vz * dt
    s.life -= dt
    if (s.life <= 0) { s.active = false; continue }

    if (p.mode !== 'heli' || p.invuln > 0) continue
    const d = Math.hypot(s.x - p.x, s.y - (p.y + 1.4), s.z - p.z)
    if (d > cfg.hitRadius) continue

    s.active = false
    const heli = world.heli

    // Đang loạng choạng dở thì phát sau chỉ nảy ra chứ không cộng thêm thời gian. Hai
    // chiếc thay nhau bắn mỗi 1.4 giây, mỗi phát ghi đè 1.5 giây - cộng dồn thì người
    // chơi không bao giờ lấy lại được tay lái, và đường bay thoát biến mất hoàn toàn.
    if (heli.stagger > 0) continue

    heli.stagger = cfg.staggerTime
    // Cú hích theo đúng hướng viên đạn đang bay, chuẩn hoá lại để phát nào cũng như nhau.
    const len = Math.hypot(s.vx, s.vy, s.vz) || 1
    heli.vx += (s.vx / len) * cfg.kick
    heli.vz += (s.vz / len) * cfg.kick
    heli.vy += (s.vy / len) * cfg.kick * 0.35
    world.camera.shake = Math.min(1, world.camera.shake + cfg.shake)
    playRubberHit()
  }
}

/** Người chơi đang ở trên không - lái trực thăng, hoặc đứng trên cái gì đó rất cao. */
function playerAirborne(world) {
  const p = world.player
  return p.mode === 'heli' || p.y > POLICE_HELI.airborneY
}

/** Vận tốc thật của người chơi: ở chế độ bay thì player.vx bị ghi 0 mỗi frame. */
function playerVelocity(world) {
  const p = world.player
  if (p.mode === 'heli') return { vx: world.heli.vx, vz: world.heli.vz }
  return { vx: p.vx, vz: p.vz }
}

function spawnPoliceHeli(world) {
  const h = world.policeHelis.find((c) => !c.active)
  if (!h) return false

  const p = world.player
  const cfg = POLICE_HELI
  const angle = Math.random() * Math.PI * 2
  const dist = POLICE_HELI.spawnMin + Math.random() * (POLICE_HELI.spawnMax - POLICE_HELI.spawnMin)
  const edge = CITY.half + CITY.roadWidth / 2

  h.active = true
  h.x = Math.max(-edge, Math.min(edge, p.x + Math.cos(angle) * dist))
  h.z = Math.max(-edge, Math.min(edge, p.z + Math.sin(angle) * dist))
  h.y = POLICE_HELI.spawnAltitude
  h.vx = 0
  h.vy = 0
  h.vz = 0
  h.heading = Math.atan2(p.x - h.x, p.z - h.z)
  h.state = 'chase'
  h.orbitAngle = Math.atan2(h.z - p.z, h.x - p.x)
  h.spotOn = false
  h.cannonOn = false
  h.lockTimer = 0
  h.gunTimer = cfg.gun.interval
  h.soaked = 0
  h.bustTimer = 0
  h.giveUp = 0
  h.chaseTimer = 0
  h.leaveTimer = 0
  return true
}

export function clearPoliceHelis(world) {
  for (const h of world.policeHelis) h.active = false
  for (const s of world.rubberShots) s.active = false
  world.copHeliAlert = 'none'
  world.copHeliAlertTimer = 0
}

/** Khoảng cách 3D tới người chơi - trên trời thì độ cao mới là phần quan trọng. */
function distanceToPlayer(world, h) {
  const p = world.player
  return Math.hypot(h.x - p.x, h.y - p.y, h.z - p.z)
}

/** Lái một chiếc: ghi thẳng vận tốc mong muốn, giống chế độ bay tự động của người chơi. */
function steerOne(world, h, dt) {
  const p = world.player
  const cfg = POLICE_HELI
  const dx = p.x - h.x
  const dz = p.z - h.z
  const flat = Math.hypot(dx, dz) || 0.0001

  let wantX = 0
  let wantZ = 0
  let wantY = h.y
  let speed = cfg.maxSpeed

  if (h.state === 'leaving') {
    // Rút lui đàng hoàng: bay ngược hướng người chơi và lấy độ cao, thay vì biến mất
    // ngay giữa trời trước mặt người chơi.
    wantX = -dx / flat
    wantZ = -dz / flat
    wantY = HELI.maxAltitude
  } else if (h.soaked > 0) {
    // Vừa ăn bóng nước: lùi ra ngoài tầm phun, lau kính rồi mới vào lại.
    const back = cfg.hoverRange * cfg.recoilRange
    wantX = flat < back ? -dx / flat : dx / flat
    wantZ = flat < back ? -dz / flat : dz / flat
    wantY = Math.max(cfg.minAltitude, p.y + cfg.hoverAbove)
    speed *= 0.75
  } else if (flat > cfg.hoverRange) {
    // Ngắm vào chỗ người chơi SẼ tới, không phải chỗ đang đứng - nếu không thì nó chỉ
    // biết bám đuôi và không bao giờ đuổi kịp một mục tiêu bay ngang tốc độ.
    const v = playerVelocity(world)
    const aimX = p.x + v.vx * cfg.leadTime - h.x
    const aimZ = p.z + v.vz * cfg.leadTime - h.z
    const aim = Math.hypot(aimX, aimZ) || 0.0001
    wantX = aimX / aim
    wantZ = aimZ / aim
    wantY = p.y + cfg.hoverAbove
  } else {
    // Đã áp sát: vòng quanh mục tiêu để giữ đèn pha chiếu vào mà không đâm sầm vào nhau.
    h.orbitAngle += h.orbitDir * 0.7 * dt
    const tx = p.x + Math.cos(h.orbitAngle) * cfg.hoverRange - h.x
    const tz = p.z + Math.sin(h.orbitAngle) * cfg.hoverRange - h.z
    const tl = Math.hypot(tx, tz) || 0.0001
    wantX = tx / tl
    wantZ = tz / tl
    wantY = p.y + cfg.hoverAbove
    speed *= 0.8
  }

  wantY = Math.max(cfg.minAltitude, Math.min(HELI.maxAltitude, wantY))

  const k = Math.min(1, cfg.steerLerp * dt)
  h.vx += (wantX * speed - h.vx) * k
  h.vz += (wantZ * speed - h.vz) * k

  const dy = wantY - h.y
  h.vy = Math.max(-cfg.climbRate, Math.min(cfg.climbRate, dy * 1.2))

  // Mũi máy bay luôn chỉ về phía người chơi: đèn pha và vòi rồng đều gắn ở mũi.
  const wantHeading = h.state === 'leaving'
    ? Math.atan2(h.vx, h.vz)
    : Math.atan2(dx, dz)
  let delta = wantHeading - h.heading
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  const turn = delta * Math.min(1, cfg.yawLerp * dt)
  h.heading += turn
  h.tiltRoll += ((turn / Math.max(dt, 0.0001)) * 0.12 - h.tiltRoll) * Math.min(1, 4 * dt)

  // Trần tốc độ, rồi tích phân.
  const sp = Math.hypot(h.vx, h.vz)
  if (sp > cfg.maxSpeed) {
    h.vx = (h.vx / sp) * cfg.maxSpeed
    h.vz = (h.vz / sp) * cfg.maxSpeed
  }
  h.x += h.vx * dt
  h.y += h.vy * dt
  h.z += h.vz * dt
  h.rotor += cfg.rotorSpin * dt

  // Biên thành phố và trần bay, đúng công thức helicopter.js dùng.
  const edge = CITY.half + CITY.roadWidth / 2
  const clampX = Math.max(-edge, Math.min(edge, h.x))
  const clampZ = Math.max(-edge, Math.min(edge, h.z))
  if (clampX !== h.x) { h.x = clampX; h.vx = 0 }
  if (clampZ !== h.z) { h.z = clampZ; h.vz = 0 }
  h.y = Math.max(cfg.minAltitude * 0.5, Math.min(HELI.maxAltitude, h.y))

  // Đụng toà nhà thì trượt dọc tường VÀ lấy thêm độ cao - nếu không, bay ở 22m giữa khu
  // cao tầng là nó sẽ kẹt cứng vào một góc tường và cuộc rượt đuổi chết đứng ở đó.
  const hit = resolveStatic(world.bp, h, cfg.bodyRadius, h.y)
  if (hit.depth > 0) {
    const into = h.vx * hit.x + h.vz * hit.z
    if (into < 0) {
      h.vx -= hit.x * into
      h.vz -= hit.z * into
    }
    h.vy = Math.max(h.vy, cfg.climbRate * 0.8)
  }
}

export function updatePoliceHelis(world, dt) {
  const p = world.player
  const cfg = POLICE_HELI
  const helis = world.policeHelis

  if (world.copHeliAlertTimer > 0) world.copHeliAlertTimer -= dt

  // --- điều động ---------------------------------------------------------
  const wanted = world.stars >= cfg.minStars && playerAirborne(world) ? cfg.count : 0
  const activeCount = helis.reduce((n, h) => n + (h.active && h.state === 'chase' ? 1 : 0), 0)
  world.copHeliTimer -= dt
  if (activeCount < wanted && world.copHeliTimer <= 0) {
    if (spawnPoliceHeli(world)) {
      world.copHeliTimer = cfg.spawnDelay
      if (activeCount === 0) {
        world.copHeliAlert = 'scramble'
        world.copHeliAlertTimer = 4
        // Đang bay tự động ngắm cảnh giữa lúc bị truy nã thì trả lái lại cho người chơi.
        world.heli.tour.active = false
      }
    }
  }

  let sprayed = false
  let closest = Infinity
  let alert = 'none'

  for (let i = 0; i < helis.length; i++) {
    const h = helis[i]
    if (!h.active) continue
    if (h.soaked > 0) h.soaked -= dt

    const dist = distanceToPlayer(world, h)
    closest = Math.min(closest, dist)

    // --- bỏ cuộc -------------------------------------------------------
    const sight = cfg.sightRange * visibilityFactor(world)
    const sees = dist < sight
    if (sees && playerAirborne(world)) h.giveUp = 0
    else h.giveUp += dt

    if (h.state === 'chase') h.chaseTimer += dt
    const outOfFuel = h.chaseTimer > cfg.maxChase
    if (h.state === 'chase' &&
        (world.stars === 0 || dist > cfg.loseRange || h.giveUp > cfg.giveUpTime || outOfFuel)) {
      h.state = 'leaving'
      h.leaveTimer = 0
      h.spotOn = false
      h.cannonOn = false
      h.lockTimer = 0
      // Rút là cả tốp nghỉ một lúc. Không có nhịp này thì cắt được đuôi cũng vô ích:
      // chiếc vừa mất dấu tắt đi là chiếc mới cất cánh ngay ở cách 150m, và công sức
      // chạy thoát của người chơi không đổi lấy được gì.
      world.copHeliTimer = Math.max(
        world.copHeliTimer,
        outOfFuel ? cfg.regroupDelay : cfg.regroupDelay * 0.5,
      )
    }
    if (h.state === 'leaving') {
      h.leaveTimer += dt
      // Quay lại cuộc rượt nếu người chơi lại bay lên trong lúc nó chưa đi xa - trừ khi
      // nó đang phải về tiếp dầu.
      if (!outOfFuel && world.stars >= cfg.minStars && playerAirborne(world) && dist < cfg.sightRange) {
        h.state = 'chase'
        h.giveUp = 0
      } else if (h.leaveTimer > cfg.leaveTime || dist > cfg.loseRange) {
        h.active = false
        continue
      }
    }

    steerOne(world, h, dt)

    if (h.state !== 'chase') continue

    // --- leo thang ba bước ---------------------------------------------
    h.spotOn = sees && dist < cfg.spotRange

    // Khoá được đèn pha rồi vẫn phải giữ yên mục tiêu vài giây mới phun được vòi rồng.
    // Không có quãng chờ này thì đèn pha bật lên là nước xối luôn trong nửa giây sau -
    // lời cảnh báo chẳng còn nghĩa lý gì vì không ai kịp làm gì với nó.
    if (h.spotOn) h.lockTimer = Math.min(cfg.lockDelay, h.lockTimer + dt)
    else h.lockTimer = Math.max(0, h.lockTimer - dt)

    h.cannonOn = h.spotOn && h.lockTimer >= cfg.lockDelay &&
      dist < cfg.cannonRange && h.soaked <= 0 && p.mode === 'heli'

    // Ướt theo thời gian bị phun, KHÔNG theo số vòi đang chĩa vào. Cộng dồn từng chiếc
    // khiến hai chiếc cùng phun là ướt sũng trong nửa thời gian thiết kế, và người chơi
    // chẳng có cách nào biết vì sao lần này mình chìm nhanh gấp đôi lần trước.
    // Súng đạn cao su: bắt đầu sau khi đã khoá đèn pha đủ lâu, tầm xa hơn vòi rồng nên
    // người chơi ăn đạn rung giật trước khi bị xịt nước.
    const canShoot = h.spotOn && h.lockTimer >= cfg.lockDelay && h.soaked <= 0 &&
      p.mode === 'heli' && p.invuln <= 0 && dist < cfg.gun.range
    h.gunTimer -= dt
    if (canShoot && h.gunTimer <= 0) {
      h.gunTimer = cfg.gun.interval
      fireRubberShot(world, h)
    } else if (!canShoot) {
      h.gunTimer = Math.min(h.gunTimer, cfg.gun.interval * 0.5)
    }

    if (h.cannonOn && !sprayed) {
      // Cánh quạt ướt thì mất lực nâng - helicopter.js đọc world.heli.soaked.
      world.heli.soaked = Math.min(1, world.heli.soaked + cfg.soakPerSec * dt)
      world.heli.sprayed = 0.2
      sprayed = true
    }

    if (alert !== 'cannon') {
      if (h.cannonOn) alert = 'cannon'
      else if (h.spotOn) alert = 'spot'
      else if (alert === 'none') alert = 'chase'
    }

    // --- bắt trên không -------------------------------------------------
    const canBust = p.mode === 'heli' && p.invuln <= 0 && world.heli.soaked >= 0.9
    if (canBust && dist < cfg.bustRange) {
      h.bustTimer += dt
      if (h.bustTimer >= cfg.bustTime) {
        bustPlayer(world)
        return
      }
    } else {
      h.bustTimer = Math.max(0, h.bustTimer - dt * 2)
    }
  }

  updateRubberShots(world, dt)

  if (!sprayed && world.heli.sprayed > 0) world.heli.sprayed = 0
  world.copHeliDistance = closest

  // Cảnh báo cất cánh giữ nguyên vài giây rồi mới nhường cho trạng thái rượt đuổi.
  const holding = world.copHeliAlertTimer > 0 && world.copHeliAlert === 'scramble'
  if (!holding) world.copHeliAlert = alert
}
