// Tự động chạy tới một khu vực đã chọn (auto-travel).
//
// Đường đi tìm bằng BFS trên đồ thị giao lộ có sẵn (`city.nodes`), nên người chơi
// luôn chạy dọc lòng đường thay vì cắm đầu vào tường. Hệ thống này KHÔNG tự dịch
// chuyển người chơi: nó chỉ ghi một hướng mong muốn vào `world.travel`, còn
// updatePlayer vẫn lo gia tốc, va chạm và trượt dọc tường như khi chơi tay - nhờ
// vậy không có đường di chuyển thứ hai nào lệch luật với đường chính.

import { NAV, PLAYER } from '../config.js'
import { nearestNode } from '../city.js'
import { landmarkPosition } from '../landmarks.js'
import { axisForward, axisRight, uiCaptured } from './input.js'
import { playBeep } from '../audio.js'

/**
 * Đường ngắn nhất theo số giao lộ, trả về danh sách điểm đi qua.
 *
 * `approach` là điểm đứng chờ trước cửa (nếu địa điểm có). Đường sẽ bám lòng đường
 * tới giao lộ gần điểm tiếp cận, ghé điểm tiếp cận, rồi mới tới cửa - nhờ vậy chặng
 * cuối luôn đi vào từ phía sân trống chứ không cắt qua toà nhà.
 */
export function findRoadPath(city, from, to, approach) {
  const goal = approach || to
  const startId = nearestNode(from.x, from.z)
  const goalId = nearestNode(goal.x, goal.z)
  const nodes = city.nodes

  const tail = approach ? [{ x: approach.x, z: approach.z }, { x: to.x, z: to.z }] : [{ x: to.x, z: to.z }]

  if (startId === goalId) return tail

  const prev = new Int32Array(nodes.length).fill(-1)
  const seen = new Uint8Array(nodes.length)
  const queue = [startId]
  seen[startId] = 1
  let head = 0
  let found = false

  while (head < queue.length) {
    const id = queue[head++]
    if (id === goalId) { found = true; break }
    for (const nb of nodes[id].nb) {
      if (seen[nb]) continue
      seen[nb] = 1
      prev[nb] = id
      queue.push(nb)
    }
  }

  if (!found) return null

  const path = []
  for (let id = goalId; id !== -1; id = prev[id]) {
    path.push({ x: nodes[id].x, z: nodes[id].z })
    if (id === startId) break
  }
  path.reverse()

  // Giao lộ đầu tiên chính là chỗ đang đứng thì bỏ, khỏi bắt người chơi quay lại.
  if (path.length > 1) {
    const d = Math.hypot(path[0].x - from.x, path[0].z - from.z)
    if (d < NAV.waypointRadius) path.shift()
  }

  // Chặng cuối: từ giao lộ cuối, đi DỌC LÒNG ĐƯỜNG tới ngang đích rồi mới rẽ vuông
  // góc vào trong. Nếu đi thẳng chéo từ giao lộ vào đích thì đường sẽ cắt qua góc
  // block và xuyên vào toà nhà.
  const last = path[path.length - 1]
  if (last) {
    const entry = roadEntry(last, goal)
    if (entry) path.push(entry)
  }

  path.push(...tail)

  // Chặng cuối đi vào mặt tiền toà nhà là có chủ ý (người chơi dừng trước khi tới
  // tường), nên không đưa nó vào bước né vật cản.
  if (approach) {
    const doorPoint = path.pop()
    const dodged = dodgeObstacles(city, [from, ...path]).slice(1)
    dodged.push(doorPoint)
    return dodged
  }
  return dodgeObstacles(city, [from, ...path]).slice(1)
}

/**
 * Điểm rẽ trên lòng đường: cùng một trục với giao lộ cuối, trục còn lại đã ngang với
 * đích. Đi trước theo trục còn xa hơn để chặng cắt vào block là chặng ngắn nhất.
 */
function roadEntry(node, goal) {
  const dx = Math.abs(goal.x - node.x)
  const dz = Math.abs(goal.z - node.z)
  if (dx < 0.5 || dz < 0.5) return null // đã thẳng hàng, không cần rẽ
  return dx > dz ? { x: goal.x, z: node.z } : { x: node.x, z: goal.z }
}

const PAD = PLAYER.radius + 0.3

function boxAt(boxes, x, z) {
  for (const b of boxes) {
    if (x > b.minX - PAD && x < b.maxX + PAD && z > b.minZ - PAD && z < b.maxZ + PAD) return b
  }
  return null
}

/** Vật cản đầu tiên chắn ngang một chặng, hoặc null nếu chặng thông thoáng. */
function segmentBlocker(boxes, a, b) {
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.max(2, Math.ceil(len))
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const hit = boxAt(boxes, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)
    if (hit) return hit
  }
  return null
}

/**
 * Né vật cản mảnh nằm trong lòng đường - chủ yếu là trụ cầu cạn dựng ở mép đường
 * này nhưng lại chìa vào lòng đường vuông góc. Đâm chính giữa trụ thì bộ giải va
 * chạm không có hướng nào để trượt, nên người chơi đứng chết tại chỗ.
 *
 * Chèn một điểm lệch sang bên còn thoáng. Chạy một lần lúc bắt đầu di chuyển nên
 * chi phí không đáng kể; chặng nào không né được thì để nguyên, đã có cơ chế phát
 * hiện bị kẹt lo phần còn lại.
 */
function dodgeObstacles(city, poly) {
  const boxes = city.staticBoxes
  const out = [poly[0]]

  for (let i = 0; i < poly.length - 1; i++) {
    const a = out[out.length - 1]
    const b = poly[i + 1]
    const blocker = segmentBlocker(boxes, a, b)

    if (blocker) {
      const len = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const dirX = (b.x - a.x) / len
      const dirZ = (b.z - a.z) / len
      // Pháp tuyến của chặng, và tâm vật cản chiếu lên chặng.
      const nx = -dirZ
      const nz = dirX
      const cX = (blocker.minX + blocker.maxX) / 2
      const cZ = (blocker.minZ + blocker.maxZ) / 2
      const along = (cX - a.x) * dirX + (cZ - a.z) * dirZ
      const baseX = a.x + dirX * along
      const baseZ = a.z + dirZ * along
      const reach = Math.max(blocker.maxX - blocker.minX, blocker.maxZ - blocker.minZ) / 2 + PAD + 0.9

      // Trụ cầu cạn dựng theo cặp hai bên mép đường, nên lệch một mức có thể lại gặp
      // đúng trụ còn lại - thử nhiều mức lệch, lòng đường rộng 14m nên vẫn còn chỗ.
      let done = false
      for (const mult of [1, 1.8, 2.6]) {
        for (const side of [1, -1]) {
          const px = baseX + nx * reach * mult * side
          const pz = baseZ + nz * reach * mult * side
          const detour = { x: px, z: pz }
          if (!boxAt(boxes, px, pz) && !segmentBlocker(boxes, a, detour) && !segmentBlocker(boxes, detour, b)) {
            out.push(detour)
            done = true
            break
          }
        }
        if (done) break
      }
    }

    out.push(b)
  }

  return out
}

export function createTravel() {
  return {
    active: false,
    name: '',
    icon: '',
    path: [],
    index: 0,
    destX: 0,
    destZ: 0,
    arriveRadius: 0,
    enterHint: '',
    dirX: 0,
    dirZ: 0,
    stuckTimer: 0,
    lastX: 0,
    lastZ: 0,
    message: '',
    messageTimer: 0,
  }
}

/** Lý do không đi được, hoặc null nếu đi được. */
export function travelBlockedReason(world) {
  const p = world.player
  if (world.phase !== 'playing') return 'Chưa vào ván chơi'
  if (world.interior !== 'none') return 'Hãy ra khỏi toà nhà trước khi tự động di chuyển'
  if (p.mode === 'car') return 'Hãy xuống xe trước khi tự động chạy'
  if (p.mode === 'train') return 'Hãy xuống tàu trước khi tự động chạy'
  // Đang bay thì trực thăng quyết định vị trí người chơi, hệ dẫn đường sẽ đẩy hướng vào
  // hư không rồi tự huỷ vì tưởng bị kẹt - nói thẳng ra còn dễ hiểu hơn.
  if (p.mode === 'heli') return 'Hãy hạ cánh trước khi tự động chạy'
  return null
}

export function startTravel(world, landmark) {
  const blocked = travelBlockedReason(world)
  if (blocked) {
    setTravelMessage(world, blocked)
    return false
  }

  const dest = landmarkPosition(world, landmark)
  const p = world.player
  const arriveRadius = landmark.arriveRadius || NAV.arriveRadius
  if (Math.hypot(dest.x - p.x, dest.z - p.z) < arriveRadius) {
    setTravelMessage(world, `Bạn đang ở ${landmark.name} rồi!${landmark.enterHint ? ' ' + landmark.enterHint : ''}`)
    return false
  }

  const path = findRoadPath(world.city, p, dest, landmark.approach)
  if (!path) {
    setTravelMessage(world, 'Không tìm được đường tới đó')
    return false
  }

  const t = world.travel
  t.active = true
  t.name = landmark.name
  t.icon = landmark.icon
  t.path = path
  t.index = 0
  t.destX = dest.x
  t.destZ = dest.z
  t.arriveRadius = arriveRadius
  t.enterHint = landmark.enterHint || ''
  t.dirX = 0
  t.dirZ = 0
  t.stuckTimer = 0
  t.lastX = p.x
  t.lastZ = p.z
  playBeep()
  return true
}

export function cancelTravel(world, message) {
  const t = world.travel
  if (!t.active) return
  t.active = false
  t.path = []
  t.dirX = 0
  t.dirZ = 0
  if (message) setTravelMessage(world, message)
}

function setTravelMessage(world, text) {
  const t = world.travel
  t.message = text
  t.messageTimer = NAV.messageDuration
}

export function updateTravel(world, dt) {
  const t = world.travel
  if (t.messageTimer > 0) {
    t.messageTimer -= dt
    if (t.messageTimer <= 0) t.message = ''
  }
  if (!t.active) return

  const blocked = travelBlockedReason(world)
  if (blocked) return cancelTravel(world, blocked)

  // Người chơi tự bấm phím di chuyển thì nhường quyền lại ngay - không bao giờ giành
  // tay lái với người đang chơi. Nhưng khi overlay đang mở thì phím thuộc về giao diện
  // (mũi tên chọn mục, WASD bị bỏ qua), nên không tính là ý định lái.
  if (!uiCaptured(world) &&
    (Math.abs(axisForward()) > NAV.cancelDeflection || Math.abs(axisRight()) > NAV.cancelDeflection)) {
    return cancelTravel(world, 'Đã dừng tự động di chuyển')
  }

  const p = world.player

  // Tới đích.
  if (Math.hypot(t.destX - p.x, t.destZ - p.z) < (t.arriveRadius || NAV.arriveRadius)) {
    const { name, icon, enterHint } = t
    cancelTravel(world)
    setTravelMessage(world, `${icon} Đã tới ${name}!${enterHint ? ' ' + enterHint : ''}`)
    return
  }

  // Sang điểm tiếp theo khi đã đủ gần điểm hiện tại.
  while (t.index < t.path.length - 1) {
    const wp = t.path[t.index]
    if (Math.hypot(wp.x - p.x, wp.z - p.z) < NAV.waypointRadius) t.index++
    else break
  }

  const target = t.path[t.index]
  const dx = target.x - p.x
  const dz = target.z - p.z
  const len = Math.hypot(dx, dz)
  if (len > 0.001) {
    t.dirX = dx / len
    t.dirZ = dz / len
  }

  // Kẹt vào đâu đó (tường, xe, cây) thì thoát chế độ tự động thay vì dập đầu mãi.
  const moved = Math.hypot(p.x - t.lastX, p.z - t.lastZ)
  t.lastX = p.x
  t.lastZ = p.z
  if (moved < NAV.stuckDistance * dt) {
    t.stuckTimer += dt
    if (t.stuckTimer > NAV.stuckTimeout) {
      return cancelTravel(world, 'Bị chặn đường - hãy tự đi tiếp nhé!')
    }
  } else {
    t.stuckTimer = 0
  }

  // Camera từ từ quay theo hướng chạy để người chơi thấy mình đang đi đâu.
  const cam = world.camera
  const want = Math.atan2(t.dirX, t.dirZ)
  let delta = want - cam.yaw
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  cam.yaw += delta * Math.min(1, NAV.cameraLerp * dt)
}
