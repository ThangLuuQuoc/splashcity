import { INTERIORS, SUPERMARKET_PRODUCTS } from '../config.js'
import { keyPressed, uiCaptured } from './input.js'
import { playBeep, playAlarm, playPickup, playCashRegister } from '../audio.js'

// Vị trí cố định của các phòng nội thất trong không gian ảo
export const SUPERMARKET_SPACE = {
  cx: INTERIORS.supermarketOffset.x,
  cy: INTERIORS.supermarketOffset.y,
  cz: INTERIORS.supermarketOffset.z,
  width: 44,
  depth: 34,
  door: { x: INTERIORS.supermarketOffset.x, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z + 14 },
  escalatorUp: { x: INTERIORS.supermarketOffset.x + 15, y: INTERIORS.supermarketOffset.y, zStart: INTERIORS.supermarketOffset.z + 4.5, zEnd: INTERIORS.supermarketOffset.z - 8.5 },
  escalatorDown: { x: INTERIORS.supermarketOffset.x + 12, y: INTERIORS.supermarketOffset.y, zStart: INTERIORS.supermarketOffset.z - 8.5, zEnd: INTERIORS.supermarketOffset.z + 4.5 },
  cashier: { x: INTERIORS.supermarketOffset.x - 8, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z + 8 },
  
  // Danh sách các kệ hàng
  shelves: [
    // Tầng 1
    { id: 'shelf_care', name: 'Kệ Hóa Mỹ Phẩm (P/S Dâu)', x: INTERIORS.supermarketOffset.x - 12, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z, productId: 'ps_strawberry', floor: 1 },
    { id: 'shelf_snacks_1', name: "Kệ Snack (Oreo, Lay's)", x: INTERIORS.supermarketOffset.x - 4, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z, productId: 'oreo', altProductId: 'lays_classic', floor: 1 },
    { id: 'shelf_snacks_2', name: 'Kệ Snack Ống Pringles', x: INTERIORS.supermarketOffset.x + 4, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z, productId: 'pringles', floor: 1 },
    { id: 'shelf_sweets', name: 'Kệ Sô-cô-la (MrBeast, Meiji, KitKat)', x: INTERIORS.supermarketOffset.x - 6, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z - 8, productId: 'feastables', altProductId: 'meiji_choco', floor: 1 },
    { id: 'shelf_fruits', name: 'Quầy Trái Cây (Chuối Nam Mỹ, Nho, Táo)', x: INTERIORS.supermarketOffset.x + 4, y: INTERIORS.supermarketOffset.y, z: INTERIORS.supermarketOffset.z - 8, productId: 'banana', altProductId: 'queen_apple', floor: 1 },
    // Tầng 2
    { id: 'shelf_toys', name: 'Khu Đồ Chơi (Super Soaker Titan)', x: INTERIORS.supermarketOffset.x - 6, y: INTERIORS.supermarketOffset.y + 6.0, z: INTERIORS.supermarketOffset.z - 8, productId: 'supersoaker_titan', floor: 2 },
    { id: 'shelf_drinks', name: 'Kệ Nước Giải Khát (Sting Dâu)', x: INTERIORS.supermarketOffset.x + 2, y: INTERIORS.supermarketOffset.y + 6.0, z: INTERIORS.supermarketOffset.z - 8, productId: 'sting_strawberry', floor: 2 },
  ],
}

export const POLICE_SPACE = {
  cx: INTERIORS.policeOffset.x,
  cy: INTERIORS.policeOffset.y,
  cz: INTERIORS.policeOffset.z,
  width: 36,
  depth: 26,
  door: { x: INTERIORS.policeOffset.x, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z + 11 },
  desk: { x: INTERIORS.policeOffset.x - 4, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z + 4 },
  wantedBoard: { x: INTERIORS.policeOffset.x + 12, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z + 4 },
  armory: { x: INTERIORS.policeOffset.x - 12, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z - 6 },
  alarmButton: { x: INTERIORS.policeOffset.x - 4, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z + 6 },
  cells: { x: INTERIORS.policeOffset.x + 8, y: INTERIORS.policeOffset.y, z: INTERIORS.policeOffset.z - 6 },
}

// Xử lý va chạm hình hộp AABB đơn giản trong nội thất
function resolveBoxCollision(p, minX, maxX, minZ, maxZ, radius = 0.5) {
  if (p.x > minX - radius && p.x < maxX + radius && p.z > minZ - radius && p.z < maxZ + radius) {
    const dLeft = Math.abs(p.x - (minX - radius))
    const dRight = Math.abs(p.x - (maxX + radius))
    const dBack = Math.abs(p.z - (minZ - radius))
    const dFront = Math.abs(p.z - (maxZ + radius))
    const minD = Math.min(dLeft, dRight, dBack, dFront)
    if (minD === dLeft) p.x = minX - radius
    else if (minD === dRight) p.x = maxX + radius
    else if (minD === dBack) p.z = minZ - radius
    else p.z = maxZ + radius
  }
}

export function updateInteriors(world, dt) {
  const p = world.player

  // Overlay đang mở: phím E thuộc về giao diện, không dùng để ra vào cửa. Prompt vẫn
  // giữ nguyên để người chơi đóng overlay là thấy lại ngay.
  const uiBlocked = uiCaptured(world)

  // ==========================================
  // 1. NGƯỜI CHƠI ĐANG Ở NGOÀI THẾ GIỚI MỞ
  // ==========================================
  if (world.interior === 'none') {
    if (p.mode !== 'foot') {
      if (world.promptKind === 'interior' || world.promptKind === 'shopping' || world.promptKind === 'police') {
        world.prompt = ''
        world.promptKind = null
      }
      return
    }

    // Cửa Đồn Cảnh Sát
    const distPolice = Math.hypot(p.x - world.city.policeDoor.x, p.z - world.city.policeDoor.z)
    if (distPolice < INTERIORS.enterDistance) {
      world.prompt = '[E] Vào Trụ sở Cảnh sát'
      world.promptKind = 'interior'
      if (!uiBlocked && keyPressed('KeyE')) {
        enterInterior(world, 'police_station')
      }
      return
    }

    // Cửa Siêu Thị Splash Mart
    const distSuper = Math.hypot(p.x - world.city.supermarketDoor.x, p.z - world.city.supermarketDoor.z)
    if (distSuper < INTERIORS.enterDistance) {
      world.prompt = '[E] Vào Siêu thị Splash Mart'
      world.promptKind = 'interior'
      if (!uiBlocked && keyPressed('KeyE')) {
        enterInterior(world, 'supermarket')
      }
      return
    }

    // Nếu đã đi ra xa cả 2 cửa: Giải phóng prompt để actions.js hiển thị prompt ngoài đường
    if (world.promptKind === 'interior' || world.promptKind === 'shopping' || world.promptKind === 'police') {
      world.prompt = ''
      world.promptKind = null
    }

    return
  }

  // ==========================================
  // 2. NGƯỜI CHƠI ĐANG TRONG SIÊU THỊ
  // ==========================================
  if (world.interior === 'supermarket') {
    const scx = SUPERMARKET_SPACE.cx
    const scy = SUPERMARKET_SPACE.cy
    const scz = SUPERMARKET_SPACE.cz

    // Ràng buộc 4 bức tường biên
    const minX = scx - SUPERMARKET_SPACE.width / 2 + 1.2
    const maxX = scx + SUPERMARKET_SPACE.width / 2 - 1.2
    const minZ = scz - SUPERMARKET_SPACE.depth / 2 + 1.2
    const maxZ = scz + SUPERMARKET_SPACE.depth / 2 - 1.2
    p.x = Math.max(minX, Math.min(maxX, p.x))
    p.z = Math.max(minZ, Math.min(maxZ, p.z))

    // Va chạm với quầy thu ngân và các kệ hàng Tầng 1 (khi p.y < cy + 3.0)
    if (p.y < scy + 3.0) {
      // Quầy thu ngân
      resolveBoxCollision(p, scx - 10.6, scx - 5.4, scz + 7.0, scz + 9.0)
      // Kệ 1 (P/S Dâu)
      resolveBoxCollision(p, scx - 14.6, scx - 9.4, scz - 0.8, scz + 0.8)
      // Kệ 2 (Oreo/Lay's)
      resolveBoxCollision(p, scx - 6.6, scx - 1.4, scz - 0.8, scz + 0.8)
      // Kệ 3 (Pringles)
      resolveBoxCollision(p, scx + 1.4, scx + 6.6, scz - 0.8, scz + 0.8)
      // Kệ 4 (MrBeast/Meiji)
      resolveBoxCollision(p, scx - 9.1, scx - 2.9, scz - 8.8, scz - 7.2)
      // Quầy trái cây
      resolveBoxCollision(p, scx + 1.1, scx + 6.9, scz - 9.2, scz - 6.8)
    } else {
      // Va chạm với kệ đồ chơi Tầng 2 (khi p.y >= cy + 4.0)
      resolveBoxCollision(p, scx - 9.6, scx - 2.4, scz - 8.8, scz - 7.2)
      // Lan can kính trước Tầng 2 (tại z = scz, từ x = minX đến x = scx + 11.5)
      if (p.x <= scx + 11.5 && p.z > scz - 0.5 && p.z < scz + 0.5) {
        p.z = Math.min(p.z, scz - 0.5)
      }
      // Lan can kính dọc giếng trời thang cuốn (tại x = scx + 11.5, từ z = scz đến z = scz - 8.5)
      if (p.z <= scz && p.z >= scz - 8.5 && Math.abs(p.x - (scx + 11.5)) < 0.6) {
        p.x = Math.min(p.x, scx + 11.0)
      }
    }

    // Cửa ra siêu thị (Tầng 1)
    const distExit = Math.hypot(p.x - SUPERMARKET_SPACE.door.x, p.z - SUPERMARKET_SPACE.door.z)
    if (distExit < 4.5 && p.y <= scy + 1.2) {
      world.prompt = '[E] Rời Siêu thị ra ngoài'
      world.promptKind = 'interior'
      if (!uiBlocked && keyPressed('KeyE')) {
        exitInterior(world)
        return
      }
    }

    // ==========================================
    // CƠ CHẾ THANG CUỐN 2 CHIỀU (LÊN & XUỐNG)
    // ==========================================
    const zBottom = scz + 4.5 // Chân thang (Tầng 1)
    const zTop = scz - 8.5    // Đỉnh thang (Tầng 2)

    // Làn Thang LÊN (Bên phải x ~ scx + 15.5)
    const onUpEscX = p.x >= scx + 13.5 && p.x <= scx + 17.5
    // Làn Thang XUỐNG (Bên trái x ~ scx + 12.5)
    const onDownEscX = p.x >= scx + 10.5 && p.x < scx + 13.5
    const onEscZ = p.z <= zBottom + 1.2 && p.z >= zTop - 1.2

    if ((onUpEscX || onDownEscX) && onEscZ) {
      const t = Math.max(0, Math.min(1, (zBottom - p.z) / (zBottom - zTop)))
      const targetY = scy + t * 6.0

      if (onUpEscX) {
        // Trượt LÊN Tầng 2
        if (p.z > zTop + 0.4) p.z -= 3.6 * dt
      } else {
        // Trượt XUỐNG Tầng 1
        if (p.z < zBottom - 0.4) p.z += 3.6 * dt
      }

      p.y = targetY
      p.supportY = targetY
      p.vy = 0
      p.onGround = true
    } else {
      // Xác định đang ở Tầng 1 hay Tầng 2
      const onMainFloor2 = p.x <= scx + 11.5 && p.z <= scz + 0.5
      const onLanding2 = p.x > scx + 11.5 && p.z <= scz - 8.5

      if ((onMainFloor2 || onLanding2) && p.y >= scy + 4.0) {
        p.supportY = scy + 6.0
      } else {
        p.supportY = scy
      }
    }

    // Quầy Thu Ngân
    const distCashier = Math.hypot(p.x - SUPERMARKET_SPACE.cashier.x, p.z - SUPERMARKET_SPACE.cashier.z)
    if (distCashier < 3.2 && p.y <= scy + 1.5) {
      if (world.cart.length > 0) {
        const total = world.cart.reduce((sum, item) => sum + item.price * item.count, 0)
        world.prompt = `Quầy Thu Ngân • [P] Mở SplashPay Quét Mã QR (${total.toLocaleString('vi-VN')} đ)`
        world.promptKind = 'shopping'
      } else {
        world.prompt = 'Quầy Thu Ngân Splash Mart • Hãy nhặt hàng trên kệ trước'
        world.promptKind = 'shopping'
      }
      return
    }

    // Kiểm tra tương tác với các kệ hàng (Tầng 1 & Tầng 2)
    for (const shelf of SUPERMARKET_SPACE.shelves) {
      const d = Math.hypot(p.x - shelf.x, p.z - shelf.z)
      const correctFloor = Math.abs(p.y - shelf.y) < 2.0
      if (d < 2.8 && correctFloor) {
        const prod = SUPERMARKET_PRODUCTS.find(pr => pr.id === shelf.productId)
        if (prod) {
          world.prompt = `[E] Nhặt ${prod.shortName} (${prod.price.toLocaleString('vi-VN')}đ) | [P] Xem Túi/Giỏ`
          world.promptKind = 'shopping'

          if (!uiBlocked && keyPressed('KeyE')) {
            addToCart(world, prod)
            playPickup()
          }
          return
        }
      }
    }

    // Nếu không ở gần đối tượng đặc biệt nào, hiển thị hướng dẫn cơ bản trong siêu thị
    world.prompt = 'Siêu thị Splash Mart • [P] Smartphone SplashPay • Phím 1-4: Dùng Item'
    world.promptKind = 'interior'
    return
  }

  // ==========================================
  // 3. NGƯỜI CHƠI ĐANG TRONG ĐỒN CẢNH SÁT
  // ==========================================
  if (world.interior === 'police_station') {
    const pcx = POLICE_SPACE.cx
    const pcy = POLICE_SPACE.cy
    const pcz = POLICE_SPACE.cz

    const minX = pcx - POLICE_SPACE.width / 2 + 1.2
    const maxX = pcx + POLICE_SPACE.width / 2 - 1.2
    const minZ = pcz - POLICE_SPACE.depth / 2 + 1.2
    const maxZ = pcz + POLICE_SPACE.depth / 2 - 1.2
    p.x = Math.max(minX, Math.min(maxX, p.x))
    p.z = Math.max(minZ, Math.min(maxZ, p.z))
    p.supportY = pcy

    // Va chạm bàn trực ban
    resolveBoxCollision(p, pcx - 6.2, pcx - 1.8, pcz + 2.8, pcz + 5.2)

    // Cửa ra đồn cảnh sát
    const distExit = Math.hypot(p.x - POLICE_SPACE.door.x, p.z - POLICE_SPACE.door.z)
    if (distExit < 4.0) {
      world.prompt = '[E] Rời Trụ sở Cảnh sát'
      world.promptKind = 'interior'
      if (!uiBlocked && keyPressed('KeyE')) {
        exitInterior(world)
        return
      }
    }

    // Bảng Truy nã (Wanted Board)
    const distBoard = Math.hypot(p.x - POLICE_SPACE.wantedBoard.x, p.z - POLICE_SPACE.wantedBoard.z)
    if (distBoard < 3.2) {
      world.prompt = `BẢNG TRUY NÃ: ${world.stars} ⭐ | Điểm quậy phá: ${world.score} Fun Points`
      world.promptKind = 'police'
      return
    }

    // Kho Vũ Khí Nước (Armory)
    const distArmory = Math.hypot(p.x - POLICE_SPACE.armory.x, p.z - POLICE_SPACE.armory.z)
    if (distArmory < 3.2) {
      world.prompt = '[E] Lấy Bóng Nước Siêu Cấp 2× (Mega Balloon) & Nạp Đầy Đạn'
      world.promptKind = 'police'
      if (!uiBlocked && keyPressed('KeyE')) {
        world.ammo = 16
        world.hasMegaBalloon = true
        playPickup()
        world.prompt = '⭐ Đã nhận Bóng Nước Siêu Cấp 2× Bán Kính Nổ!'
      }
      return
    }

    // Buồng Giam Tạm Giữ (Holding Cells) - Bí mật nhặt bóng nước ẩn
    const distCells = Math.hypot(p.x - POLICE_SPACE.cells.x, p.z - POLICE_SPACE.cells.z)
    if (distCells < 3.2) {
      if (!world.secretBalloonFound) {
        world.prompt = '[E] Lục lọi góc buồng giam tìm vật phẩm bí mật'
        world.promptKind = 'police'
        if (!uiBlocked && keyPressed('KeyE')) {
          world.secretBalloonFound = true
          world.hasMegaBalloon = true
          world.ammo = 16
          world.score += 500
          playPickup()
          world.prompt = '🎉 Tìm thấy Bóng Nước Bí Mật giấu trong buồng giam! (+500 Fun Points)'
        }
      } else {
        world.prompt = 'Buồng giam tạm giữ cảnh sát (Đã lục lọi sạch sẽ)'
        world.promptKind = 'police'
      }
      return
    }

    // Nút Báo Động Khẩn Cấp (Alarm Button)
    const distAlarm = Math.hypot(p.x - POLICE_SPACE.alarmButton.x, p.z - POLICE_SPACE.alarmButton.z)
    if (distAlarm < 2.8) {
      world.prompt = '[E] Bấm còi báo động trêu chọc cảnh sát!'
      world.promptKind = 'police'
      if (!uiBlocked && keyPressed('KeyE')) {
        playAlarm()
        world.heat = Math.min(100, world.heat + 25)
        world.score += 200
        world.camera.shake = 0.5
      }
      return
    }

    world.prompt = 'Trụ sở Cảnh sát • [E] Tương tác • [P] Smartphone'
    world.promptKind = 'interior'
  }
}

export function enterInterior(world, type) {
  const p = world.player
  world.previousOutdoorPos = { x: p.x, y: p.y, z: p.z, heading: p.heading }
  world.interior = type

  if (type === 'supermarket') {
    p.x = SUPERMARKET_SPACE.door.x
    p.y = SUPERMARKET_SPACE.door.y
    p.z = SUPERMARKET_SPACE.door.z - 3.5
    p.supportY = SUPERMARKET_SPACE.cy
    p.heading = 0
  } else if (type === 'police_station') {
    p.x = POLICE_SPACE.door.x
    p.y = POLICE_SPACE.door.y
    p.z = POLICE_SPACE.door.z - 3.5
    p.supportY = POLICE_SPACE.cy
    p.heading = 0
  }

  p.vx = 0
  p.vy = 0
  p.vz = 0
  playBeep()
}

export function exitInterior(world) {
  const p = world.player
  world.interior = 'none'
  if (world.previousOutdoorPos) {
    p.x = world.previousOutdoorPos.x
    p.y = world.previousOutdoorPos.y
    p.z = world.previousOutdoorPos.z
    p.heading = world.previousOutdoorPos.heading
  } else {
    p.y = 0
  }
  p.supportY = 0
  p.vx = 0
  p.vy = 0
  p.vz = 0
  world.prompt = ''
  world.promptKind = null
  playBeep()
}

export function addToCart(world, product) {
  if (!world.cart) world.cart = []
  const existing = world.cart.find(item => item.id === product.id)
  if (existing) {
    existing.count += 1
  } else {
    world.cart.push({
      id: product.id,
      name: product.name,
      shortName: product.shortName,
      price: product.price,
      icon: product.icon,
      type: product.type,
      count: 1,
    })
  }
}

export function checkoutCart(world) {
  if (!world.cart || world.cart.length === 0) return { success: false, reason: 'Giỏ hàng trống!' }
  
  const total = world.cart.reduce((sum, item) => sum + item.price * item.count, 0)
  if (world.cash < total) {
    return { success: false, reason: 'Số dư SplashPay không đủ!' }
  }

  world.cash -= total
  if (!world.inventory) world.inventory = []
  
  for (const cartItem of world.cart) {
    const invItem = world.inventory.find(it => it.id === cartItem.id)
    if (invItem) {
      invItem.count += cartItem.count
    } else {
      world.inventory.push({ ...cartItem })
    }
  }

  world.cart = []
  playCashRegister()
  world.score += Math.floor(total / 1000) * 10
  return { success: true, total }
}
