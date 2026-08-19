// Trực thăng ngắm thành phố từ trên không.
//
// Mô hình bay kiểu arcade, cố tình đơn giản cho trẻ con chơi được: không có mô-men
// quán tính hay lực nâng thật, chỉ có vận tốc kèm giảm chấn. Độ nghiêng thân máy bay
// thuần trang trí, không tác động lên chuyển động.
//
// Va chạm với toà nhà dùng lại `resolveStatic` của thế giới mở: nó vốn đã bỏ qua các
// hộp thấp hơn cao độ truyền vào, nên bay cao hơn nóc nhà là tự do bay qua.

import { HELI, POLICE_HELI, SCORE } from '../config.js'
import { resolveStatic } from '../collision.js'
import { CITY } from '../config.js'
import { axisForward, axisRight, keyDown, keyPressed, uiCaptured } from './input.js'
import { playEngineStart, updateSiren } from '../audio.js'
import { scarePed } from './pedestrians.js'
import { t } from '../i18n.js'

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
    // Vòi rồng của trực thăng cảnh sát làm ướt cánh quạt: 0 = khô, 1 = ướt sũng.
    soaked: 0,
    stagger: 0, // giây còn loạng choạng sau khi ăn đạn cao su
    wobble: 0, // pha rung của thân máy bay lúc loạng choạng
    sprayed: 0, // còn đang bị phun trong bao nhiêu giây nữa (policeHeli.js ghi vào)
    // Đèn pha rọi và còi hú. Điểm rọi trên mặt đất được tính sẵn mỗi nhịp để cả phần
    // dựng hình lẫn phần "ai đang bị rọi" đọc chung một con số, không ai tự tính lại.
    searchlight: false,
    siren: false,
    spotX: city.helipad.x,
    spotZ: city.helipad.z,
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
  const tour = world.heli.tour
  if (tour.active) {
    tour.active = false
    return false
  }

  tour.route = buildTourRoute(world)
  if (!tour.route.length) return false

  // Bắt đầu từ khu vực gần nhất, khỏi phải bay ngược nửa thành phố ở ngay bước đầu.
  const h = world.heli
  let best = 0
  let bestDist = Infinity
  tour.route.forEach((stop, i) => {
    const d = Math.hypot(stop.x - h.x, stop.z - h.z)
    if (d < bestDist) { bestDist = d; best = i }
  })

  tour.active = true
  tour.index = best
  tour.phase = 'climb'
  tour.orbitAngle = 0
  tour.orbitSwept = 0
  return true
}

/** Khu vực tour đang hướng tới, hoặc null khi không bật tour. */
export function tourTarget(world) {
  const tour = world.heli.tour
  return tour.active ? tour.route[tour.index] || null : null
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
  const tour = h.tour
  const cfg = HELI.tour
  const stop = tour.route[tour.index]
  if (!stop) { tour.active = false; return }

  const dx = stop.x - h.x
  const dz = stop.z - h.z
  const dist = Math.hypot(dx, dz) || 0.0001

  // Lấy độ cao trước đã: bay ngang ở tầm thấp là đụng nhà.
  if (h.y < cfg.altitude - 2) tour.phase = 'climb'
  else if (tour.phase === 'climb') tour.phase = 'cruise'

  let wantX = 0
  let wantZ = 0
  let faceX = dx / dist
  let faceZ = dz / dist
  let speed = cfg.cruiseSpeed

  if (tour.phase === 'climb') {
    speed *= cfg.climbScale
    wantX = dx / dist
    wantZ = dz / dist
  } else if (tour.phase === 'orbit' || dist <= cfg.orbitRadius + 2) {
    if (tour.phase !== 'orbit') {
      tour.phase = 'orbit'
      tour.orbitAngle = Math.atan2(h.z - stop.z, h.x - stop.x)
      tour.orbitSwept = 0
    }
    tour.orbitAngle += cfg.orbitSpeed * dt
    tour.orbitSwept += cfg.orbitSpeed * dt

    // Điểm cần tới trên vòng tròn, hơi chệch về phía trước để bay thành đường tròn mượt.
    const lead = tour.orbitAngle + 0.35
    const targetX = stop.x + Math.cos(lead) * cfg.orbitRadius
    const targetZ = stop.z + Math.sin(lead) * cfg.orbitRadius
    const tx = targetX - h.x
    const tz = targetZ - h.z
    const tl = Math.hypot(tx, tz) || 0.0001
    wantX = tx / tl
    wantZ = tz / tl

    if (tour.orbitSwept >= Math.PI * 2 * cfg.orbitTurns) {
      tour.index = (tour.index + 1) % tour.route.length
      tour.phase = 'cruise'
      tour.orbitSwept = 0
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
  // Đáp được xuống đất giữa lúc bị vòi rồng dí là đã thoát rồi - cánh quạt coi như khô.
  h.soaked = 0
  h.sprayed = 0
  h.tour.active = false // ra khỏi máy bay thì tour cũng dừng
  // Xuống máy bay là tắt hết đồ chơi: bỏ lại một chiếc trực thăng không người lái mà đèn
  // vẫn quét và còi vẫn hú thì vừa vô lý vừa át mất tiếng còi cảnh sát thật.
  h.searchlight = false
  h.siren = false
  updateSiren(0)
}

/**
 * Đèn pha quét trúng ai thì người đó giật mình bỏ chạy, xe thì rà phanh nhường đường.
 *
 * Điểm chỉ cộng đúng một lần cho mỗi người, tính từ lúc luồng sáng chạm vào: nếu cộng
 * theo từng khung hình thì chỉ cần treo máy bay rọi vào một đám đông là điểm tự chảy về
 * hàng nghìn mỗi giây, không còn là phần thưởng cho việc gì cả.
 */
function sweepSearchlight(world, dt) {
  const h = world.heli
  const lit = h.searchlight && h.y > 2.0
  const radius = lit ? 6.0 + h.y * 0.15 : 0
  const r2 = radius * radius

  for (let i = 0; i < world.peds.length; i++) {
    const ped = world.peds[i]
    if (ped.indoors) {
      ped.lit = false
      continue
    }
    const dx = ped.x - h.spotX
    const dz = ped.z - h.spotZ
    const inBeam = lit && dx * dx + dz * dz < r2
    if (inBeam && !ped.lit) {
      scarePed(ped, h.spotX, h.spotZ)
      world.score += SCORE.spotPed
    }
    ped.lit = inBeam
  }

  if (!lit) return
  for (let i = 0; i < world.cars.length; i++) {
    const car = world.cars[i]
    if (car.driver !== 'ai') continue // xe đỗ thì vốn đã đứng yên, xe người chơi thì kệ
    const dx = car.x - h.spotX
    const dz = car.z - h.spotZ
    // Bị đèn cảnh sát rọi vào thì tài xế rà phanh - chậm dần chứ không phanh cứng, để
    // dòng xe phía sau không dồn cục lại thành một đống đứng im.
    if (dx * dx + dz * dz < r2) car.speed *= Math.max(0, 1 - 2.2 * dt)
  }
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

  // Đèn pha rọi và còi hú. Cả hai đều là công tắc bật/tắt chứ không phải giữ phím: trẻ
  // con không giữ nổi thêm một phím nữa trong lúc đã bận cả hai tay để lái.
  if (!blocked) {
    if (keyPressed('KeyL')) h.searchlight = !h.searchlight
    if (keyPressed('KeyH')) h.siren = !h.siren
  }

  h.rotor += HELI.rotorSpin * dt

  // Cánh quạt ướt vì vòi rồng cảnh sát: mất dần lực nâng, bay nặng nề hơn, và trần bay
  // bị ép tụt xuống. Cách này buộc người chơi phải hạ cánh thay vì bị tóm gọn giữa trời
  // - vẫn còn cả một quãng để xoay xở, mà vẫn thấy rõ là mình đang thua.
  if (h.sprayed > 0) h.sprayed -= dt
  else h.soaked = Math.max(0, h.soaked - (h.landed ? HELI.dryOnGround : POLICE_HELI.soakDrain) * dt)
  // Ăn đạn cao su: máy bay rung giật, tay lái ăn kém hẳn trong hơn một giây. Không mất
  // lái hoàn toàn - trẻ con mà bị cướp mất quyền điều khiển thì chỉ thấy ức chế, còn
  // lái nặng tay vài giây thì thành một pha thót tim rồi gỡ lại được.
  if (h.stagger > 0) {
    h.stagger = Math.max(0, h.stagger - dt)
    h.wobble += dt * 26
  } else {
    h.wobble = 0
  }
  const shaken = h.stagger > 0 ? h.stagger / POLICE_HELI.gun.staggerTime : 0
  const grip = 1 - 0.5 * shaken // vẫn lái được, chỉ nặng tay hẳn đi

  const climbRate = HELI.climbRate * (1 - POLICE_HELI.liftPenalty * h.soaked)
  const maxSpeed = HELI.maxSpeed * (1 - POLICE_HELI.speedPenalty * h.soaked)
  const ceiling = HELI.maxAltitude * (1 - POLICE_HELI.ceilingPenalty * h.soaked)

  // Người chơi chạm vào cần hoặc nút cao độ là nhường tay lái ngay - cùng hợp đồng với
  // chế độ tự động chạy dưới đường: không bao giờ giành lái với người đang chơi.
  const playerSteering = Math.abs(fwd) > 0.2 || Math.abs(turn) > 0.2 || wantUp || wantDown
  if (h.tour.active && playerSteering) h.tour.active = false

  if (h.tour.active) {
    updateTour(world, dt)
  } else {
    // Hướng mũi. Lúc loạng choạng thì mũi bị hất lệch theo nhịp rung, và bẻ lái cũng
    // không ăn được như thường.
    h.heading -= turn * HELI.yawRate * grip * dt
    if (shaken > 0) h.heading += Math.sin(h.wobble) * 0.9 * shaken * dt

    // Đẩy theo hướng mũi đang chỉ.
    const sin = Math.sin(h.heading)
    const cos = Math.cos(h.heading)
    h.vx += sin * fwd * HELI.accel * grip * dt
    h.vz += cos * fwd * HELI.accel * grip * dt

    // Giảm chấn, rồi chặn trần tốc độ.
    const damp = Math.max(0, 1 - HELI.drag * dt)
    h.vx *= damp
    h.vz *= damp

    // Lên / xuống. Không giữ phím thì máy bay treo tại chỗ - dễ ngắm cảnh hơn nhiều so
    // với việc bắt trẻ con giữ ga liên tục.
    // Đi xuống vẫn ở tốc độ đầy đủ kể cả khi ướt: hạ cánh là đường thoát, không được
    // biến nó thành thứ khó nhằn thêm.
    if (wantUp) h.vy = climbRate
    else if (wantDown) h.vy = -HELI.climbRate
    else h.vy *= Math.max(0, 1 - HELI.climbDamp * dt)
  }

  // Ướt quá thì bị dìm xuống dưới trần bay mới, từ từ chứ không giật cục.
  if (h.y > ceiling) h.vy = Math.min(h.vy, -HELI.climbRate * POLICE_HELI.sinkRate)

  // Trần tốc độ áp cho cả hai chế độ.
  const speed = Math.hypot(h.vx, h.vz)
  if (speed > maxSpeed) {
    h.vx = (h.vx / speed) * maxSpeed
    h.vz = (h.vz / speed) * maxSpeed
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
  if (shaken > 0) {
    // Nghiêng ngả thấy rõ trên hình - đây là tín hiệu cho người chơi biết chuyện gì
    // vừa xảy ra, chứ không phải chỉ thấy máy bay tự nhiên trôi.
    h.tiltRoll += Math.sin(h.wobble) * 0.32 * shaken
    h.tiltPitch += Math.cos(h.wobble * 1.3) * 0.22 * shaken
  }

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
  const clampX = Math.max(-edge, Math.min(edge, h.x))
  const clampZ = Math.max(-edge, Math.min(edge, h.z))
  // Chạm tường thì phải triệt luôn vận tốc đâm vào tường, không chỉ kẹp toạ độ: nếu
  // không thì máy bay đứng chết một chỗ trong khi đồng hồ vẫn báo 122 km/h, và người
  // chơi bị dí vào góc bản đồ mà không hiểu vì sao mình không nhúc nhích. Thành phần
  // vận tốc dọc theo tường được giữ nguyên, nên bay men theo biên vẫn là đường thoát.
  if (clampX !== h.x) { h.x = clampX; h.vx = 0 }
  if (clampZ !== h.z) { h.z = clampZ; h.vz = 0 }

  // Va chạm với toà nhà cao hơn cao độ hiện tại.
  const hit = resolveStatic(world.bp, h, HELI.bodyRadius, h.y)
  if (hit.depth > 0) {
    const into = h.vx * hit.x + h.vz * hit.z
    if (into < 0) {
      h.vx -= hit.x * into
      h.vz -= hit.z * into
    }
  }

  // Đèn pha chiếu chếch về phía trước mũi chứ không thẳng xuống chân: bay tới đâu thì
  // vệt sáng đi trước tới đó, nên nhìn thấy người dưới đường trước khi bay qua đầu họ.
  // Bay càng cao thì điểm rọi càng xa, nhưng chặn ở 20m để luồng sáng không nằm ngang.
  const lead = Math.min(20, Math.max(4, h.y * 0.45))
  h.spotX = h.x + Math.sin(h.heading) * lead
  h.spotZ = h.z + Math.cos(h.heading) * lead
  sweepSearchlight(world, dt)

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
      return t('heli.exited')
    }
    // Đang bay tự động mà bấm hạ cánh: tắt tour luôn, khỏi bắt người chơi phải nhớ
    // là còn một công tắc nữa mới điều khiển lại được.
    if (h.tour.active) {
      h.tour.active = false
      return t('heli.tourOff')
    }
    return t('heli.landFirst')
  }

  return null
}
