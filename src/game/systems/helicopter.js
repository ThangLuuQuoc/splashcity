// Trực thăng ngắm thành phố từ trên không.
//
// Mô hình bay kiểu arcade, cố tình đơn giản cho trẻ con chơi được: không có mô-men
// quán tính hay lực nâng thật, chỉ có vận tốc kèm giảm chấn. Độ nghiêng thân máy bay
// thuần trang trí, không tác động lên chuyển động.
//
// Va chạm với toà nhà dùng lại `resolveStatic` của thế giới mở: nó vốn đã bỏ qua các
// hộp thấp hơn cao độ truyền vào, nên bay cao hơn nóc nhà là tự do bay qua.

import { HELI } from '../config.js'
import { resolveStatic } from '../collision.js'
import { CITY } from '../config.js'
import { axisForward, axisRight, keyDown, uiCaptured } from './input.js'
import { playEngineStart } from '../audio.js'

export function createHelicopter(city) {
  return {
    x: city.helipad.x,
    z: city.helipad.z,
    y: HELI.groundClearance,
    heading: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    rotor: 0, // góc quay cánh quạt, dùng khi dựng hình
    tiltPitch: 0,
    tiltRoll: 0,
    landed: true,
    // Bay tự động ngắm cảnh
    tour: {
      active: false,
      route: [], // [{ name, icon, x, z }] - vòng quanh thành phố theo thứ tự
      index: 0,
      phase: 'climb', // climb | cruise | orbit
      orbitAngle: 0,
      orbitSwept: 0,
    },
  }
}

/**
 * Lộ trình ngắm cảnh: các khu vực đặc biệt, sắp theo góc quanh tâm thành phố để thành
 * một vòng tròn mượt thay vì đường zigzag qua lại.
 *
 * Bỏ các mốc động (như "vòi nước gần nhất"): vị trí của chúng tính theo chỗ người chơi
 * đang đứng, mà lúc bay thì người chơi CHÍNH LÀ máy bay - điểm đến sẽ chạy theo chính
 * mình và tour không bao giờ tới đích.
 */
function buildTourRoute(world) {
  return (world.landmarks || [])
    .filter((lm) => !lm.dynamic)
    .map((lm) => ({ name: lm.name, icon: lm.icon, x: lm.x, z: lm.z }))
    .sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x))
}

/** Bật / tắt bay tự động. Trả về true nếu vừa bật. */
export function toggleHeliTour(world) {
  const t = world.heli.tour
  if (t.active) {
    t.active = false
    return false
  }

  t.route = buildTourRoute(world)
  if (!t.route.length) return false

  // Bắt đầu từ khu vực gần nhất, khỏi phải bay ngược nửa thành phố ở ngay bước đầu.
  const h = world.heli
  let best = 0
  let bestDist = Infinity
  t.route.forEach((stop, i) => {
    const d = Math.hypot(stop.x - h.x, stop.z - h.z)
    if (d < bestDist) { bestDist = d; best = i }
  })

  t.active = true
  t.index = best
  t.phase = 'climb'
  t.orbitAngle = 0
  t.orbitSwept = 0
  return true
}

/** Khu vực tour đang hướng tới, hoặc null khi không bật tour. */
export function tourTarget(world) {
  const t = world.heli.tour
  return t.active ? t.route[t.index] || null : null
}

/**
 * Một nhịp bay tự động: ghi thẳng vận tốc mong muốn vào máy bay.
 *
 * Khác với lái tay (đẩy lực theo hướng mũi), ở đây vận tốc và hướng mũi được tách rời:
 * máy bay bay theo phương tiếp tuyến vòng tròn nhưng mũi luôn chỉ vào khu vực đang
 * ngắm - đúng kiểu trực thăng du lịch bay nghiêng quanh điểm tham quan.
 */
function updateTour(world, dt) {
  const h = world.heli
  const t = h.tour
  const cfg = HELI.tour
  const stop = t.route[t.index]
  if (!stop) { t.active = false; return }

  const dx = stop.x - h.x
  const dz = stop.z - h.z
  const dist = Math.hypot(dx, dz) || 0.0001

  // Lấy độ cao trước đã: bay ngang ở tầm thấp là đụng nhà.
  if (h.y < cfg.altitude - 2) t.phase = 'climb'
  else if (t.phase === 'climb') t.phase = 'cruise'

  let wantX = 0
  let wantZ = 0
  let faceX = dx / dist
  let faceZ = dz / dist
  let speed = cfg.cruiseSpeed

  if (t.phase === 'climb') {
    speed *= cfg.climbScale
    wantX = dx / dist
    wantZ = dz / dist
  } else if (t.phase === 'orbit' || dist <= cfg.orbitRadius + 2) {
    if (t.phase !== 'orbit') {
      t.phase = 'orbit'
      t.orbitAngle = Math.atan2(h.z - stop.z, h.x - stop.x)
      t.orbitSwept = 0
    }
    t.orbitAngle += cfg.orbitSpeed * dt
    t.orbitSwept += cfg.orbitSpeed * dt

    // Điểm cần tới trên vòng tròn, hơi chệch về phía trước để bay thành đường tròn mượt.
    const lead = t.orbitAngle + 0.35
    const targetX = stop.x + Math.cos(lead) * cfg.orbitRadius
    const targetZ = stop.z + Math.sin(lead) * cfg.orbitRadius
    const tx = targetX - h.x
    const tz = targetZ - h.z
    const tl = Math.hypot(tx, tz) || 0.0001
    wantX = tx / tl
    wantZ = tz / tl

    if (t.orbitSwept >= Math.PI * 2 * cfg.orbitTurns) {
      t.index = (t.index + 1) % t.route.length
      t.phase = 'cruise'
      t.orbitSwept = 0
    }
  } else {
    wantX = dx / dist
    wantZ = dz / dist
  }

  // Đưa vận tốc về hướng mong muốn một cách mượt, không giật.
  const k = Math.min(1, cfg.steerLerp * dt)
  h.vx += (wantX * speed - h.vx) * k
  h.vz += (wantZ * speed - h.vz) * k

  // Giữ cao độ tour.
  const dy = cfg.altitude - h.y
  h.vy = Math.max(-HELI.climbRate, Math.min(HELI.climbRate, dy * 1.2))

  // Mũi máy bay luôn chỉ vào khu vực đang ngắm.
  const wantHeading = Math.atan2(faceX, faceZ)
  let delta = wantHeading - h.heading
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  h.heading += delta * Math.min(1, cfg.steerLerp * dt)

  // Camera nhìn theo, nhưng nhẹ tay - người chơi vẫn kéo được sang hướng khác.
  const cam = world.camera
  let camDelta = wantHeading - cam.yaw
  while (camDelta > Math.PI) camDelta -= Math.PI * 2
  while (camDelta < -Math.PI) camDelta += Math.PI * 2
  cam.yaw += camDelta * Math.min(1, cfg.cameraLerp * dt)
}

/** True khi người chơi đang đứng đủ gần để lên trực thăng. */
export function nearHelicopter(world) {
  const p = world.player
  if (p.mode !== 'foot' || world.interior !== 'none') return false
  const h = world.heli
  return Math.hypot(p.x - h.x, p.z - h.z) < HELI.boardRadius && p.y < h.y + 4
}

export function enterHelicopter(world) {
  const p = world.player
  p.mode = 'heli'
  p.vx = 0
  p.vz = 0
  p.vy = 0
  p.enterCooldown = 0.45
  world.heli.landed = false
  playEngineStart()
}

/** Rời trực thăng. Chỉ gọi khi đã đáp xuống - chỗ kiểm tra nằm ở updateHelicopter. */
export function exitHelicopter(world) {
  const p = world.player
  const h = world.heli
  // Bước ra bên cạnh, tránh đứng lẫn vào thân máy bay.
  p.x = h.x + Math.cos(h.heading) * 4.0
  p.z = h.z - Math.sin(h.heading) * 4.0
  p.y = 0
  p.supportY = 0
  p.vx = 0
  p.vz = 0
  p.vy = 0
  p.mode = 'foot'
  p.enterCooldown = 0.45
  h.landed = true
  h.vx = 0
  h.vz = 0
  h.vy = 0
  h.tour.active = false // ra khỏi máy bay thì tour cũng dừng
}

/**
 * Một nhịp bay. Trả về thông báo gợi ý để HUD hiển thị.
 * `exitPressed` do player.js truyền vào để phím E chỉ được đọc ở một nơi duy nhất.
 */
export function updateHelicopter(world, dt, exitPressed) {
  const h = world.heli
  const p = world.player
  const blocked = uiCaptured(world)

  const fwd = blocked ? 0 : axisForward()
  const turn = blocked ? 0 : axisRight()
  const wantUp = !blocked && keyDown('Space')
  const wantDown = !blocked && (keyDown('ShiftLeft') || keyDown('ShiftRight') || keyDown('KeyC'))

  h.rotor += HELI.rotorSpin * dt

  // Người chơi chạm vào cần hoặc nút cao độ là nhường tay lái ngay - cùng hợp đồng với
  // chế độ tự động chạy dưới đường: không bao giờ giành lái với người đang chơi.
  const playerSteering = Math.abs(fwd) > 0.2 || Math.abs(turn) > 0.2 || wantUp || wantDown
  if (h.tour.active && playerSteering) h.tour.active = false

  if (h.tour.active) {
    updateTour(world, dt)
  } else {
    // Hướng mũi.
    h.heading -= turn * HELI.yawRate * dt

    // Đẩy theo hướng mũi đang chỉ.
    const sin = Math.sin(h.heading)
    const cos = Math.cos(h.heading)
    h.vx += sin * fwd * HELI.accel * dt
    h.vz += cos * fwd * HELI.accel * dt

    // Giảm chấn, rồi chặn trần tốc độ.
    const damp = Math.max(0, 1 - HELI.drag * dt)
    h.vx *= damp
    h.vz *= damp

    // Lên / xuống. Không giữ phím thì máy bay treo tại chỗ - dễ ngắm cảnh hơn nhiều so
    // với việc bắt trẻ con giữ ga liên tục.
    if (wantUp) h.vy = HELI.climbRate
    else if (wantDown) h.vy = -HELI.climbRate
    else h.vy *= Math.max(0, 1 - HELI.climbDamp * dt)
  }

  // Trần tốc độ áp cho cả hai chế độ.
  const speed = Math.hypot(h.vx, h.vz)
  if (speed > HELI.maxSpeed) {
    h.vx = (h.vx / speed) * HELI.maxSpeed
    h.vz = (h.vz / speed) * HELI.maxSpeed
  }

  h.x += h.vx * dt
  h.z += h.vz * dt
  h.y += h.vy * dt

  // Nghiêng thân cho ra dáng bay. Khi bay tự động thì fwd/turn đều bằng 0, nên độ
  // nghiêng suy ra từ vận tốc thực - nếu không máy bay sẽ bay phẳng như tấm ván.
  const cruising = Math.hypot(h.vx, h.vz) / HELI.maxSpeed
  const targetPitch = h.tour.active ? -cruising * HELI.tiltMax : -fwd * HELI.tiltMax
  const targetRoll = h.tour.active
    ? (h.tour.phase === 'orbit' ? HELI.tiltMax * 0.8 : 0)
    : turn * HELI.tiltMax
  h.tiltPitch += (targetPitch - h.tiltPitch) * Math.min(1, 4 * dt)
  h.tiltRoll += (targetRoll - h.tiltRoll) * Math.min(1, 4 * dt)

  // Trần bay và sàn.
  if (h.y > HELI.maxAltitude) {
    h.y = HELI.maxAltitude
    h.vy = Math.min(0, h.vy)
  }

  const descending = h.vy
  if (h.y <= HELI.groundClearance) {
    h.y = HELI.groundClearance
    h.vy = 0
    h.landed = true
    // Ma sát càng đáp: đã chạm đất thì trượt chậm lại nhanh.
    h.vx *= Math.max(0, 1 - 4 * dt)
    h.vz *= Math.max(0, 1 - 4 * dt)
  } else {
    h.landed = false
  }

  // Không cho bay ra ngoài tường biên thành phố. Dùng đúng công thức city.js dựng
  // tường (HALF + RW/2), vì bay cao hơn tường thì resolveStatic bỏ qua tường.
  const edge = CITY.half + CITY.roadWidth / 2
  h.x = Math.max(-edge, Math.min(edge, h.x))
  h.z = Math.max(-edge, Math.min(edge, h.z))

  // Va chạm với toà nhà cao hơn cao độ hiện tại.
  const hit = resolveStatic(world.bp, h, HELI.bodyRadius, h.y)
  if (hit.depth > 0) {
    const into = h.vx * hit.x + h.vz * hit.z
    if (into < 0) {
      h.vx -= hit.x * into
      h.vz -= hit.z * into
    }
  }

  // Người chơi ngồi trong khoang.
  p.x = h.x
  p.y = h.y
  p.z = h.z
  p.heading = h.heading
  p.supportY = h.y
  p.onGround = false
  p.vx = 0
  p.vz = 0
  p.vy = 0

  if (exitPressed) {
    if (h.landed && Math.abs(descending) < HELI.landSpeed) {
      exitHelicopter(world)
      return 'Đã xuống trực thăng'
    }
    // Đang bay tự động mà bấm hạ cánh: tắt tour luôn, khỏi bắt người chơi phải nhớ
    // là còn một công tắc nữa mới điều khiển lại được.
    if (h.tour.active) {
      h.tour.active = false
      return 'Đã tắt bay tự động - giữ 🔽 để hạ cánh'
    }
    return 'Hạ cánh xuống đất trước khi ra khỏi trực thăng!'
  }

  return null
}
