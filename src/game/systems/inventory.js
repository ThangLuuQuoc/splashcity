import { playItemUse, playBananaSlip, playThrow, playFruitThud, playPickup } from '../audio.js'
// useInventoryItem đặt lời nhắc cho HUD bằng t(), nhưng file này chưa bao giờ nhập nó
// vào: bấm phím 1-4 để dùng đồ là ném ReferenceError ngay giữa useFrame, và vòng lặp
// dựng hình của r3f đứng luôn - đúng hiện tượng "bấm dùng đồ xong game treo".
import { t } from '../i18n.js'

let lastProcessedScore = 0
let cashGrantTimer = 0

export function updateInventory(world, dt) {
  // Cập nhật bộ đếm thời gian Buff
  if (world.activeBuffs && world.activeBuffs.timer > 0) {
    world.activeBuffs.timer -= dt
    if (world.activeBuffs.timer <= 0) {
      world.activeBuffs.speedBoost = 1
      world.activeBuffs.timer = 0
    }
  }

  // Cập nhật tuổi thọ của các vỏ chuối trên sàn
  for (const b of world.bananas) {
    if (!b.active) continue
    b.life -= dt
    if (b.life <= 0) {
      b.active = false
    }
  }

  // Cơ chế kinh tế: Quy đổi Fun Points thành Tiền SplashPay (1 điểm = 100 VNĐ)
  if (world.score > lastProcessedScore) {
    const diff = world.score - lastProcessedScore
    world.cash = (world.cash || 0) + diff * 100
    lastProcessedScore = world.score
  } else if (world.score < lastProcessedScore) {
    lastProcessedScore = world.score
  }

  // Trợ cấp kinh tế tự động mỗi 30s (+20.000 VNĐ) để người chơi luôn có tiền mua đồ
  cashGrantTimer += dt
  if (cashGrantTimer >= 30) {
    cashGrantTimer = 0
    world.cash = (world.cash || 0) + 20000
  }
}

export function useInventoryItem(world, itemId) {
  const itemIndex = world.inventory.findIndex(it => it.id === itemId)
  if (itemIndex === -1) return false

  const item = world.inventory[itemIndex]
  const p = world.player

  if (item.type === 'banana_peel' || item.type === 'banana_slip') {
    // Thả vỏ chuối tại chân người chơi
    const banana = world.bananas.find(b => !b.active)
    if (banana) {
      banana.active = true
      banana.x = p.x - Math.sin(p.heading) * 0.8
      banana.z = p.z - Math.cos(p.heading) * 0.8
      banana.y = (p.supportY !== undefined ? p.supportY : p.y)
      banana.rot = Math.random() * Math.PI * 2
      banana.life = 45 // Tồn tại 45 giây
      playBananaSlip()
      world.prompt = t('item.bananaDropped')
      world.promptKind = 'shopping'
    }
  } else if (item.type === 'snack_speed') {
    // Ăn Snack tăng tốc 50%
    world.activeBuffs = {
      speedBoost: 1.5,
      timer: 12, // 12 giây
      nameKey: 'buff.sugarRush',
    }
    playItemUse()
    world.prompt = t('item.sugarRush', { item: item.shortName })
    world.promptKind = 'shopping'
  } else if (item.type === 'mrbeast_speed' || item.type === 'snack_super_speed') {
    // Ăn Feastables MrBeast tăng 85% tốc độ
    world.activeBuffs = {
      speedBoost: 1.85,
      timer: 18, // 18 giây
      nameKey: 'buff.mrbeast',
    }
    playItemUse()
    world.camera.shake = 0.25
    world.prompt = t('item.superRush', { item: item.shortName })
    world.promptKind = 'shopping'
  } else if (item.type === 'weapon_upgrade') {
    // Trang bị súng nước Super Soaker Titan
    world.ammo = 16
    world.hasMegaBalloon = true
    playPickup()
    world.prompt = t('item.soaker')
    world.promptKind = 'shopping'
  } else if (item.type === 'toothpaste') {
    // Bôi vệt kem đánh răng P/S Dâu (tạo vệt decal hồng + vệt trơn trượt vật lý)
    playThrow()
    const patchY = p.supportY !== undefined ? p.supportY : p.y
    world.decals.push({
      x: p.x,
      y: patchY + 0.05,
      z: p.z,
      rot: Math.random() * Math.PI * 2,
      scale: 1.8,
      color: '#ff4d6d',
    })
    if (!world.toothpastePatches) world.toothpastePatches = []
    world.toothpastePatches.push({
      x: p.x,
      y: patchY,
      z: p.z,
      radius: 2.2,
      life: 30, // 30 giây
    })
    world.prompt = t('item.toothpaste')
    world.promptKind = 'shopping'
  } else if (item.type === 'fruit_throw') {
    // Ném hoa quả (táo, nho) với âm thanh bốp
    playFruitThud()
    const balloon = world.balloons.find(b => !b.active)
    if (balloon) {
      balloon.active = true
      balloon.x = p.x
      balloon.y = (p.supportY !== undefined ? p.supportY : p.y) + 1.2
      balloon.z = p.z
      const speed = 28
      balloon.vx = Math.sin(p.heading) * speed + p.vx * 0.4
      balloon.vz = Math.cos(p.heading) * speed + p.vz * 0.4
      balloon.vy = 4.0
      balloon.life = 0
      balloon.isMega = false
    }
    world.prompt = t('item.thrown', { item: item.shortName })
    world.promptKind = 'shopping'
  }

  // Giảm số lượng trong túi
  item.count -= 1
  if (item.count <= 0) {
    world.inventory.splice(itemIndex, 1)
  }

  return true
}
