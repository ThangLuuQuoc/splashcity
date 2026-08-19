import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUPERMARKET_SPACE } from '../game/systems/interiors.js'
import { ProductInstances } from './Products.jsx'
import { SHELF_PRODUCTS, SHELF_TAGS } from './martLayout.js'
import { SUPERMARKET_PRODUCTS } from '../game/config.js'
import { getCanvasTexture } from './assets.js'
import { useGame } from '../game/store.js'

// Texture nằm ở kho dùng chung (assets.js) chứ không trong useMemo của component:
// component này unmount mỗi lần người chơi ra phố, nếu để trong useMemo thì cứ vào
// siêu thị một lần là dựng lại canvas và upload lại lên GPU.

// 1. Texture Sàn Gạch Men Siêu Thị Cao Cấp (Ceramic Floor Tiles with Grout Lines)
function martFloorTexture() {
  return getCanvasTexture(
    'mart:floor',
    512,
    512,
    (ctx) => {
      // Nền gạch men trắng ngà sang trọng
      ctx.fillStyle = '#f5f6f8'
      ctx.fillRect(0, 0, 512, 512)

      // Vẽ lưới ô gạch 4x4 (mỗi viên gạch có bóng nhẹ và ron gạch tinh xảo)
      const tileSize = 128
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = c * tileSize
          const y = r * tileSize

          // Viền bóng nhẹ trên từng viên gạch
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6)

          // Ron gạch (grout line) màu xám trung tính
          ctx.strokeStyle = '#d0d5dd'
          ctx.lineWidth = 3
          ctx.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3)
        }
      }

      // Dải phân cách lối đi màu vàng tươi phong cách siêu thị
      ctx.fillStyle = 'rgba(255, 183, 3, 0.25)'
      ctx.fillRect(0, 250, 512, 12)
    },
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(12, 10) // Lặp lại nhiều lần để tạo sàn gạch rộng lớn
    },
  )
}

// 2. Texture Banner Chào Mừng Siêu Thị Rực Rỡ (Hỗ trợ i18n VI / EN)
function martBannerTexture(lang = 'vi') {
  return getCanvasTexture(`mart:banner:${lang}`, 1024, 256, (ctx) => {
    // Nền Gradient Xanh Lá - Xanh Dương phong cách Family Mark
    const grad = ctx.createLinearGradient(0, 0, 1024, 0)
    grad.addColorStop(0, '#009e49')
    grad.addColorStop(0.5, '#0070ba')
    grad.addColorStop(1, '#009e49')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 256)

    // Viền trắng & vàng kim loại
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 12
    ctx.strokeRect(10, 10, 1004, 236)

    // Tiêu đề chính
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 10
    ctx.fillText(lang === 'en' ? '🛒 FAMILY MARK SUPERMARKET 🛒' : '🛒 SIÊU THỊ FAMILY MARK 🛒', 512, 90)

    // Dòng phụ
    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 32px sans-serif'
    ctx.shadowBlur = 4
    ctx.fillText(
      lang === 'en'
        ? '⭐ FLOOR 1: GROCERY & DAILY ESSENTIALS  •  FLOOR 2: TOY ZONE & DRINKS ⭐'
        : '⭐ TẦNG 1: BÁCH HÓA GIA ĐÌNH  •  TẦNG 2: THẾ GIỚI ĐỒ CHƠI & NƯỚC NGỌT ⭐',
      512,
      175
    )
  })
}

// 3. Texture Màn Hình POS Quét QR (MOMO / VNPAY)
function martQrTexture() {
  return getCanvasTexture('mart:qr', 256, 256, (ctx) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 256, 256)

    // Khung QR
    ctx.fillStyle = '#000000'
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        if ((r < 3 || r > 8) && (c < 3 || c > 8)) {
          ctx.fillRect(c * 20 + 8, r * 20 + 8, 18, 18)
        } else if ((r + c * 3) % 2 === 0) {
          ctx.fillRect(c * 20 + 8, r * 20 + 8, 18, 18)
        }
      }
    }
    // Logo SplashPay đỏ
    ctx.fillStyle = '#d62828'
    ctx.fillRect(96, 96, 64, 64)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('P', 128, 128)

    ctx.fillStyle = '#d62828'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('SPLASHPAY QR', 128, 245)
  })
}

// 4. Texture Giao Diện Máy Tính Tiền POS Nhân Viên
function posScreenTexture() {
  return getCanvasTexture('mart:pos_screen', 256, 256, (ctx) => {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, 256, 256)

    // Thanh tiêu đề phần mềm POS
    ctx.fillStyle = '#009e49'
    ctx.fillRect(0, 0, 256, 36)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚡ FAMILY POS v2.6', 12, 18)

    // Danh sách các mặt hàng đang quét
    ctx.fillStyle = '#334155'
    ctx.fillRect(8, 44, 240, 136)
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 13px monospace'
    ctx.fillText('01. COCACLA CAN       15,000', 14, 66)
    ctx.fillText('02. OREO COOKIES      24,000', 14, 90)
    ctx.fillText('03. PRINGLES CRISPS   48,000', 14, 114)
    ctx.fillText('04. MRBEAST CHOCO     65,000', 14, 138)
    ctx.fillText('05. TITAN BLASTER    150,000', 14, 162)

    // Thanh tổng tiền nổi bật
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(8, 188, 240, 60)
    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('TOTAL:  302,000 đ', 16, 222)
  })
}

// 5. Texture Thẻ Tên Nhân Viên Thu Ngân
function cashierNametagTexture(lang = 'vi') {
  return getCanvasTexture(`mart:nametag:${lang}`, 256, 128, (ctx) => {
    ctx.fillStyle = '#009e49'
    ctx.fillRect(0, 0, 256, 128)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(6, 6, 244, 116)
    ctx.fillStyle = '#0070ba'
    ctx.fillRect(10, 10, 236, 32)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('FAMILY MARK', 128, 26)

    ctx.fillStyle = '#111111'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText('MAI ANH', 128, 72)

    ctx.fillStyle = '#d62828'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(lang === 'en' ? '★ CASHIER ★' : '★ THU NGÂN ★', 128, 104)
  })
}

// 6. Texture Biển Treo Thả Trần Quầy Thu Ngân Số 1
function cashierOverheadTexture(lang = 'vi') {
  return getCanvasTexture(`mart:overhead_cashier:${lang}`, 512, 256, (ctx) => {
    ctx.fillStyle = '#009e49'
    ctx.fillRect(0, 0, 512, 256)
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 10
    ctx.strokeRect(6, 6, 500, 244)

    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 46px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(lang === 'en' ? '💳 CHECKOUT COUNTER 01' : '💳 QUẦY THU NGÂN 01', 256, 75)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText(lang === 'en' ? '⭐ SCAN SPLASHPAY QR TO PAY ⭐' : '⭐ QUÉT MÃ QR SPLASHPAY ⭐', 256, 140)

    ctx.fillStyle = '#c7f9cc'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(lang === 'en' ? 'THANK YOU • HAVE A GREAT DAY!' : 'CẢM ƠN QUÝ KHÁCH • HẸN GẶP LẠI!', 256, 195)
  })
}

export default function SupermarketInterior({ world }) {
  const lang = useGame((s) => s.lang)
  const isInside = world.interior === 'supermarket'
  const escalatorUpRef = useRef()
  const escalatorDownRef = useRef()
  const cashierHeadRef = useRef()
  const cashierArmRef = useRef()

  const floorTexture = martFloorTexture()
  const bannerTexture = martBannerTexture(lang)
  const qrTexture = martQrTexture()
  const posScreen = posScreenTexture()
  const nametagTex = cashierNametagTexture(lang)
  const overheadCashierTex = cashierOverheadTexture(lang)

  // Animate escalator steps and cashier NPC motions
  useFrame(({ clock }, delta) => {
    if (!isInside) return
    const speed = 2.0
    const zMin = -6.5, zMax = 6.5, zSpan = zMax - zMin
    const calcY = (z) => ((6.5 - z) / 13.0) * 6.0 + 0.18

    // UP escalator: steps move from +z (bottom) towards -z (top)
    if (escalatorUpRef.current) {
      for (const child of escalatorUpRef.current.children) {
        child.position.z -= speed * delta
        if (child.position.z < zMin) child.position.z += zSpan
        child.position.y = calcY(child.position.z)
      }
    }
    // DOWN escalator: steps move from -z (top) towards +z (bottom)
    if (escalatorDownRef.current) {
      for (const child of escalatorDownRef.current.children) {
        child.position.z += speed * delta
        if (child.position.z > zMax) child.position.z -= zSpan
        child.position.y = calcY(child.position.z)
      }
    }

    // Cashier staff natural idle & scanning animation
    const t = clock.getElapsedTime()
    if (cashierHeadRef.current) {
      cashierHeadRef.current.rotation.y = Math.sin(t * 1.2) * 0.16
      cashierHeadRef.current.rotation.x = Math.sin(t * 2.4) * 0.04
    }
    if (cashierArmRef.current) {
      cashierArmRef.current.rotation.x = -0.7 + Math.sin(t * 2.8) * 0.28
      cashierArmRef.current.rotation.y = Math.cos(t * 2.8) * 0.18
    }
  })

  if (!isInside) return null

  const { cx, cy, cz, width, depth } = SUPERMARKET_SPACE
  const roomW = width + 16 // Mở rộng phòng bao trọn tầm nhìn
  const roomD = depth + 16

  return (
    <group position={[cx, cy, cz]}>
      {/* ==========================================
          HỆ THỐNG ÁNH SÁNG NỘI THẤT RỰC RỠ & ẤM ÁP
          ========================================== */}
      <ambientLight intensity={1.6} color="#ffffff" />
      <directionalLight position={[0, 20, 0]} intensity={1.4} color="#fffcf2" />
      
      {/* Dàn đèn chiếu điểm LED downlight */}
      <pointLight position={[-10, 8, 0]} intensity={2.0} distance={40} color="#ffffff" />
      <pointLight position={[10, 8, 0]} intensity={2.0} distance={40} color="#ffffff" />
      <pointLight position={[0, 8, -8]} intensity={2.2} distance={45} color="#ffffff" />
      <pointLight position={[0, 8, 8]} intensity={2.2} distance={45} color="#ffffff" />
      <pointLight position={[-8, 4, 8]} intensity={1.8} distance={25} color="#ffd166" />

      {/* ==========================================
          SÀN NHÀ GẠCH MEN CAO CẤP (KHÔNG BỊ CẮT MÉT)
          ========================================== */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW * 1.5, roomD * 1.5]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.2}
          metalness={0.05}
        />
      </mesh>

      {/* Tấm thảm đỏ đón khách lớn trước sảnh */}
      <mesh position={[0, 0.01, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#b7094c" roughness={0.9} />
      </mesh>

      {/* ==========================================
          VÁCH KÍNH GƯƠNG TRONG SUỐT & KHUNG NHÔM HIỆN ĐẠI
          ========================================== */}
      {/* 1. Tường Kính Hậu (Back Glass Wall) */}
      <group position={[0, 6.5, -depth / 2]}>
        {/* Tấm kính gương trong suốt lớn */}
        <mesh>
          <boxGeometry args={[roomW, 13, 0.15]} />
          <meshStandardMaterial
            color="#a2d2ff"
            transparent
            opacity={0.38}
            roughness={0.05}
            metalness={0.88}
          />
        </mesh>
        {/* Nẹp chân tường & nẹp trần màu nhôm tối */}
        <mesh position={[0, -6.3, 0.1]}>
          <boxGeometry args={[roomW, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[0, 6.3, 0.1]}>
          <boxGeometry args={[roomW, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        {/* Thanh giằng ngang phân tầng ở giữa */}
        <mesh position={[0, -0.5, 0.1]}>
          <boxGeometry args={[roomW, 0.2, 0.25]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} />
        </mesh>
        {/* Các cột nhôm đứng chia ô kính panorama */}
        {[-24, -18, -12, -6, 0, 6, 12, 18, 24].map((xp) => (
          <mesh key={xp} position={[xp, 0, 0.1]}>
            <boxGeometry args={[0.18, 13, 0.25]} />
            <meshStandardMaterial color="#343a40" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* 2. Tường Kính Trái (Left Glass Wall) */}
      <group position={[-width / 2, 6.5, 0]}>
        {/* Tấm kính gương trong suốt bên trái */}
        <mesh>
          <boxGeometry args={[0.15, 13, roomD]} />
          <meshStandardMaterial
            color="#a2d2ff"
            transparent
            opacity={0.38}
            roughness={0.05}
            metalness={0.88}
          />
        </mesh>
        {/* Nẹp chân & nẹp trần */}
        <mesh position={[0.1, -6.3, 0]}>
          <boxGeometry args={[0.3, 0.4, roomD]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[0.1, 6.3, 0]}>
          <boxGeometry args={[0.3, 0.4, roomD]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        {/* Thanh giằng ngang phân tầng */}
        <mesh position={[0.1, -0.5, 0]}>
          <boxGeometry args={[0.25, 0.2, roomD]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} />
        </mesh>
        {/* Các cột nhôm đứng chia ô kính */}
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((zp) => (
          <mesh key={zp} position={[0.1, 0, zp]}>
            <boxGeometry args={[0.25, 13, 0.18]} />
            <meshStandardMaterial color="#343a40" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* 3. Tường Kính Phải (Right Glass Wall) */}
      <group position={[width / 2, 6.5, 0]}>
        {/* Tấm kính gương trong suốt bên phải */}
        <mesh>
          <boxGeometry args={[0.15, 13, roomD]} />
          <meshStandardMaterial
            color="#a2d2ff"
            transparent
            opacity={0.38}
            roughness={0.05}
            metalness={0.88}
          />
        </mesh>
        {/* Nẹp chân & nẹp trần */}
        <mesh position={[-0.1, -6.3, 0]}>
          <boxGeometry args={[0.3, 0.4, roomD]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[-0.1, 6.3, 0]}>
          <boxGeometry args={[0.3, 0.4, roomD]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        {/* Thanh giằng ngang phân tầng */}
        <mesh position={[-0.1, -0.5, 0]}>
          <boxGeometry args={[0.25, 0.2, roomD]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} />
        </mesh>
        {/* Các cột nhôm đứng chia ô kính */}
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((zp) => (
          <mesh key={zp} position={[-0.1, 0, zp]}>
            <boxGeometry args={[0.25, 13, 0.18]} />
            <meshStandardMaterial color="#343a40" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* 4. Tường Kính Mặt Tiền (Front Glass Wall) */}
      <group position={[0, 6.5, depth / 2]}>
        {/* Vách kính mặt tiền bên trái cửa */}
        <mesh position={[-14, 0, 0]}>
          <boxGeometry args={[width / 2 - 6, 13, 0.15]} />
          <meshStandardMaterial
            color="#a2d2ff"
            transparent
            opacity={0.38}
            roughness={0.05}
            metalness={0.88}
          />
        </mesh>
        {/* Vách kính mặt tiền bên phải cửa */}
        <mesh position={[14, 0, 0]}>
          <boxGeometry args={[width / 2 - 6, 13, 0.15]} />
          <meshStandardMaterial
            color="#a2d2ff"
            transparent
            opacity={0.38}
            roughness={0.05}
            metalness={0.88}
          />
        </mesh>
        {/* Nẹp chân & nẹp trần mặt tiền */}
        <mesh position={[-14, -6.3, 0.1]}>
          <boxGeometry args={[width / 2 - 6, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[14, -6.3, 0.1]}>
          <boxGeometry args={[width / 2 - 6, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[-14, 6.3, 0.1]}>
          <boxGeometry args={[width / 2 - 6, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        <mesh position={[14, 6.3, 0.1]}>
          <boxGeometry args={[width / 2 - 6, 0.4, 0.3]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
        {/* Cột kính mặt tiền */}
        {[-22, -18, -12, -6, 6, 12, 18, 22].map((xp) => (
          <mesh key={xp} position={[xp, 0, 0.1]}>
            <boxGeometry args={[0.18, 13, 0.25]} />
            <meshStandardMaterial color="#343a40" metalness={0.7} />
          </mesh>
        ))}
        {/* Cửa kính trượt tự động trong suốt ở giữa */}
        <mesh position={[0, -3.5, 0]}>
          <boxGeometry args={[12, 6, 0.18]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.35} roughness={0.05} metalness={0.85} />
        </mesh>
        {/* Khung viền cửa nhôm sang trọng */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[12.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#212529" metalness={0.8} />
        </mesh>
      </group>

      {/* Trần nhà hiện đại che kín hoàn toàn không gian */}
      <mesh position={[0, 13, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW * 1.5, roomD * 1.5]} />
        <meshStandardMaterial color="#2b2d42" roughness={0.8} />
      </mesh>

      {/* Các thanh đèn tuýp LED phát sáng trên trần */}
      {[-8, 0, 8].map((xPos, idx) => (
        <group key={idx} position={[xPos, 12.8, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.15, depth - 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Banner Chào Mừng Siêu Thị Family Mark */}
      <mesh position={[0, 9.5, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[18, 4.5]} />
        <meshBasicMaterial map={bannerTexture} />
      </mesh>

      {/* ==========================================
          SÀN TẦNG 2 & KHOANG GIẾNG TRỜI THANG CUỐN
          ========================================== */}
      {/* 1. Sàn Chính Tầng 2 (x từ -22 đến 11.5, z từ -17 đến 0) */}
      <group position={[-5.25, 6.0, -8.5]}>
        <mesh position={[0, -0.075, 0]}>
          <boxGeometry args={[33.5, 0.15, 17]} />
          <meshStandardMaterial map={floorTexture} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.2, 8.5]}>
          <boxGeometry args={[33.5, 0.4, 0.3]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
        {/* Lan can kính nhìn xuống sảnh Tầng 1 */}
        <mesh position={[0, 0.7, 8.5]}>
          <boxGeometry args={[33.3, 1.4, 0.1]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} roughness={0.05} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.45, 8.5]}>
          <boxGeometry args={[33.3, 0.1, 0.18]} />
          <meshStandardMaterial color="#ced4da" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Sảnh Đón Khách Đỉnh Thang Cuốn (x = 11.5 đến 22, z = -17 đến -7.5) */}
      <group position={[16.75, 6.0, -12.25]}>
        <mesh position={[0, -0.075, 0]}>
          <boxGeometry args={[10.5, 0.15, 9.5]} />
          <meshStandardMaterial map={floorTexture} roughness={0.3} />
        </mesh>
      </group>

      {/* 3. Lan can kính ngăn Sàn Chính & Giếng Trời Thang Cuốn (x = 11.5, z từ 0 đến -8) */}
      <group position={[11.5, 6.0, -4.0]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.3, 0.4, 8.0]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.1, 1.4, 8.0]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} roughness={0.05} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[0.18, 0.1, 8.0]} />
          <meshStandardMaterial color="#ced4da" metalness={0.9} />
        </mesh>
      </group>

      {/* ==========================================
          QUẦY THU NGÂN HIỆN ĐẠI & NHÂN VIÊN (CHECKOUT ISLAND & CASHIER NPC)
          ========================================== */}
      <group position={[-8, 0, 8]}>
        {/* Đèn rọi Spotlight riêng biệt cho quầy thu ngân */}
        <pointLight position={[0, 4.0, 0]} intensity={2.4} distance={16} color="#fffdfa" />

        {/* 1. BIỂN ĐÈN TREO THẢ TRẦN QUẦY THU NGÂN SỐ 1 */}
        <group position={[0, 4.2, 0]}>
          {/* 2 Dây ty treo inox thả từ trần */}
          <mesh position={[-1.4, 1.0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 2.0, 8]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} />
          </mesh>
          <mesh position={[1.4, 1.0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 2.0, 8]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} />
          </mesh>
          {/* Hộp đèn LED phát sáng 2 mặt */}
          <mesh>
            <boxGeometry args={[3.8, 1.1, 0.22]} />
            <meshStandardMaterial color="#009e49" roughness={0.2} />
          </mesh>
          {/* Mặt trước nhìn ra cửa chính */}
          <mesh position={[0, 0, 0.12]}>
            <planeGeometry args={[3.7, 1.0]} />
            <meshBasicMaterial map={overheadCashierTex} toneMapped={false} />
          </mesh>
          {/* Mặt sau nhìn từ trong siêu thị ra */}
          <mesh position={[0, 0, -0.12]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3.7, 1.0]} />
            <meshBasicMaterial map={overheadCashierTex} toneMapped={false} />
          </mesh>
        </group>

        {/* 2. THÂN QUẦY THU NGÂN CHỮ L (MODERN COUNTER ISLAND) */}
        {/* Chân đế đen chống ẩm & tạo bóng tiếp xúc */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[5.0, 0.1, 2.2]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        {/* Thân quầy bọc composite xanh navy cao cấp */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[4.8, 1.1, 2.0]} />
          <meshStandardMaterial color="#1b263b" roughness={0.3} />
        </mesh>

        {/* Dải 3 màu nhận diện thương hiệu Family Mark phía mặt trước (hướng ra khách) */}
        <mesh position={[0, 0.85, 1.02]}>
          <boxGeometry args={[4.76, 0.22, 0.02]} />
          <meshStandardMaterial color="#009e49" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.6, 1.02]}>
          <boxGeometry args={[4.76, 0.24, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.35, 1.02]}>
          <boxGeometry args={[4.76, 0.22, 0.02]} />
          <meshStandardMaterial color="#0070ba" roughness={0.2} />
        </mesh>

        {/* Mặt bàn đá thạch anh trắng cao cấp bo viền sang trọng */}
        <mesh position={[0, 1.18, 0]}>
          <boxGeometry args={[5.0, 0.08, 2.2]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.15} metalness={0.1} />
        </mesh>

        {/* 3. BĂNG CHUYỀN HÀNG HÓA TỰ ĐỘNG (CONVEYOR BELT) */}
        {/* Mặt băng chuyền cao su đen */}
        <mesh position={[-0.9, 1.23, 0.1]}>
          <boxGeometry args={[2.8, 0.02, 1.2]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
        {/* Nẹp viền inox 2 bên thành băng chuyền */}
        <mesh position={[-0.9, 1.26, 0.72]}>
          <boxGeometry args={[2.8, 0.06, 0.04]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.9, 1.26, -0.52]}>
          <boxGeometry args={[2.8, 0.06, 0.04]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Thanh phân cách giỏ hàng (Divider Batons) màu vàng sọc đen */}
        {[-1.8, -0.9, 0.0].map((xp, i) => (
          <mesh key={i} position={[xp, 1.25, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 1.1, 8]} />
            <meshStandardMaterial color="#ffd166" metalness={0.5} />
          </mesh>
        ))}

        {/* Khay đón hàng sau khi tính tiền (Baggage Packing Tray) ở phía đầu quầy */}
        <mesh position={[1.8, 1.22, 0.1]}>
          <boxGeometry args={[1.0, 0.03, 1.3]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Giỏ đựng túi nilon sinh học / túi vải Family Mark */}
        <mesh position={[2.1, 1.35, 0.1]}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
          <meshStandardMaterial color="#009e49" transparent opacity={0.7} />
        </mesh>

        {/* 4. KỆ TRƯNG BÀY MINI CẠNH QUẦY (KẸO CAO SU, SÔ-CÔ-LA, PIN) */}
        <group position={[-1.0, 0.65, 1.12]}>
          <mesh>
            <boxGeometry args={[2.6, 0.8, 0.22]} />
            <meshStandardMaterial color="#212529" roughness={0.4} />
          </mesh>
          {/* Các tầng kẹo mini đầy màu sắc */}
          {[-0.2, 0.05, 0.3].map((yp, i) => (
            <group key={i} position={[0, yp, 0.12]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2.5, 0.04, 0.16]} />
                <meshStandardMaterial color="#495057" />
              </mesh>
              {/* Các gói kẹo cao su / bánh thanh mini */}
              {[-0.9, -0.45, 0, 0.45, 0.9].map((xp, j) => (
                <mesh key={j} position={[xp, 0.05, 0]}>
                  <boxGeometry args={[0.3, 0.06, 0.1]} />
                  <meshStandardMaterial color={['#e63946', '#00b4d8', '#ffd166', '#38b000', '#9b5de5'][(i * 3 + j) % 5]} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* 5. HÀNG RÀO INOX PHÂN LUỒNG XẾP HÀNG (QUEUE STANCHIONS) */}
        <group position={[-2.8, 0, 0.5]}>
          {/* Trụ inox 1 */}
          <mesh position={[0, 0.03, 1.2]}>
            <cylinderGeometry args={[0.22, 0.24, 0.06, 16]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.55, 1.2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.08, 1.2]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#ffd166" metalness={0.9} />
          </mesh>

          {/* Trụ inox 2 */}
          <mesh position={[0, 0.03, -1.2]}>
            <cylinderGeometry args={[0.22, 0.24, 0.06, 16]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.55, -1.2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
            <meshStandardMaterial color="#ced4da" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.08, -1.2]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#ffd166" metalness={0.9} />
          </mesh>

          {/* Dây nhung đỏ chắn lối */}
          <mesh position={[0, 0.88, 0]}>
            <boxGeometry args={[0.03, 0.08, 2.4]} />
            <meshStandardMaterial color="#d62828" roughness={0.9} />
          </mesh>
        </group>

        {/* 6. HỆ THỐNG MÁY TÍNH TIỀN POS & TRANG THIẾT BỊ THU NGÂN HIỆN ĐẠI */}
        <group position={[0.7, 1.22, 0.0]}>
          {/* Cột trụ kim loại đỡ màn hình đôi */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.44, 12]} />
            <meshStandardMaterial color="#212529" metalness={0.8} />
          </mesh>

          {/* Màn hình chính hướng về nhân viên thu ngân (Family POS Software UI) */}
          <group position={[0, 0.46, -0.16]} rotation={[0.3, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.88, 0.65, 0.06]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, -0.032]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.82, 0.58]} />
              <meshBasicMaterial map={posScreen} />
            </mesh>
          </group>

          {/* Màn hình phụ cảm ứng hướng về khách hàng (SplashPay QR Screen) */}
          <group position={[0, 0.46, 0.16]} rotation={[-0.25, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.88, 0.65, 0.06]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.032]}>
              <planeGeometry args={[0.82, 0.58]} />
              <meshBasicMaterial map={qrTexture} />
            </mesh>
          </group>

          {/* Máy quét mã vạch mặt kính để bàn (Flatbed Laser Scanner) */}
          <group position={[0, 0.01, -0.38]}>
            <mesh>
              <boxGeometry args={[0.65, 0.04, 0.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            {/* Mặt kính quét mã */}
            <mesh position={[0, 0.025, 0]}>
              <planeGeometry args={[0.55, 0.3]} />
              <meshStandardMaterial color="#0284c7" transparent opacity={0.6} roughness={0.05} />
            </mesh>
            {/* Tia Laser quét màu đỏ phát sáng */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.5, 0.01, 0.03]} />
              <meshBasicMaterial color="#ff0054" />
            </mesh>
          </group>

          {/* Máy in hóa đơn nhiệt siêu tốc (Thermal Receipt Printer) */}
          <group position={[0.68, 0.1, -0.35]}>
            <mesh>
              <boxGeometry args={[0.34, 0.22, 0.38]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} />
            </mesh>
            {/* Khe xuất giấy in hóa đơn */}
            <mesh position={[0, 0.115, 0.05]}>
              <boxGeometry args={[0.22, 0.015, 0.03]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Dải giấy in hóa đơn màu trắng thò ra */}
            <mesh position={[0, 0.16, 0.08]} rotation={[-0.4, 0, 0]}>
              <planeGeometry args={[0.2, 0.12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
          </group>

          {/* Máy quẹt thẻ & thanh toán không tiếp xúc (EDC Card Terminal) */}
          <group position={[0.7, 0.18, 0.45]} rotation={[-0.3, 0.4, 0]}>
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.2, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh>
              <boxGeometry args={[0.26, 0.08, 0.42]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 0.045, -0.06]}>
              <planeGeometry args={[0.2, 0.14]} />
              <meshBasicMaterial color="#0070ba" />
            </mesh>
            <mesh position={[0, 0.045, 0.1]}>
              <boxGeometry args={[0.18, 0.01, 0.14]} />
              <meshStandardMaterial color="#64748b" />
            </mesh>
          </group>

          {/* Máy quét mã vạch cầm tay không dây (Handheld Gun Scanner) */}
          <group position={[-0.6, 0.12, -0.38]} rotation={[0, 0.6, 0.2]}>
            <mesh>
              <boxGeometry args={[0.12, 0.15, 0.22]} />
              <meshStandardMaterial color="#009e49" />
            </mesh>
            <mesh position={[0, -0.1, -0.04]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>

          {/* Két đựng tiền mặt chuyên dụng dưới gầm bàn (Cash Drawer) */}
          <mesh position={[0, -0.22, -0.45]}>
            <boxGeometry args={[1.2, 0.22, 0.9]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        </group>

        {/* 7. NHÂN VIÊN THU NGÂN FAMILY MARK (CASHIER NPC - MAI ANH) */}
        <group position={[0.7, 0, -0.85]}>
          {/* Đôi chân nhân viên đứng làm việc */}
          <mesh position={[-0.14, 0.4, 0]}>
            <boxGeometry args={[0.22, 0.8, 0.22]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.14, 0.4, 0]}>
            <boxGeometry args={[0.22, 0.8, 0.22]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Đôi giày công sở đen */}
          <mesh position={[-0.14, 0.05, 0.04]}>
            <boxGeometry args={[0.24, 0.1, 0.3]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
          <mesh position={[0.14, 0.05, 0.04]}>
            <boxGeometry args={[0.24, 0.1, 0.3]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>

          {/* Thân mình áo đồng phục Family Mark màu xanh lá */}
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.62, 0.75, 0.36]} />
            <meshStandardMaterial color="#009e49" roughness={0.4} />
          </mesh>
          {/* Dải áo trắng ở giữa ngực */}
          <mesh position={[0, 1.18, 0.185]}>
            <boxGeometry args={[0.16, 0.68, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Cổ áo đồng phục màu xanh dương */}
          <mesh position={[0, 1.5, 0.1]}>
            <boxGeometry args={[0.32, 0.08, 0.22]} />
            <meshStandardMaterial color="#0070ba" />
          </mesh>
          {/* Bảng tên nhân viên "MAI ANH - THU NGÂN" ghim trên ngực */}
          <mesh position={[-0.18, 1.35, 0.19]}>
            <planeGeometry args={[0.18, 0.09]} />
            <meshBasicMaterial map={nametagTex} />
          </mesh>

          {/* Cánh tay trái vịn quầy */}
          <group position={[-0.38, 1.45, 0]}>
            <mesh position={[0, -0.3, 0.1]} rotation={[-0.4, 0, 0]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#009e49" />
            </mesh>
            <mesh position={[0, -0.58, 0.24]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#fed0bb" />
            </mesh>
          </group>

          {/* Cánh tay phải đang quét mã vạch (Animated scan motion) */}
          <group ref={cashierArmRef} position={[0.38, 1.45, 0]}>
            <mesh position={[0, -0.3, 0]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#009e49" />
            </mesh>
            {/* Bàn tay */}
            <mesh position={[0, -0.6, 0]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#fed0bb" />
            </mesh>
            {/* Hộp sản phẩm đang quét trên tay nhân viên */}
            <mesh position={[0, -0.65, 0.12]}>
              <boxGeometry args={[0.18, 0.24, 0.12]} />
              <meshStandardMaterial color="#e63946" />
            </mesh>
          </group>

          {/* Đầu & Khuôn mặt nhân viên (Animated Head) */}
          <group ref={cashierHeadRef} position={[0, 1.76, 0]}>
            {/* Khuôn mặt dễ thương */}
            <mesh>
              <boxGeometry args={[0.44, 0.44, 0.42]} />
              <meshStandardMaterial color="#fed0bb" roughness={0.5} />
            </mesh>
            {/* Mái tóc đen/nâu gọn gàng */}
            <mesh position={[0, 0.08, -0.05]}>
              <boxGeometry args={[0.48, 0.42, 0.42]} />
              <meshStandardMaterial color="#271c19" roughness={0.8} />
            </mesh>
            {/* Mũ lưỡi trai đồng phục Family Mark */}
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.48, 0.14, 0.46]} />
              <meshStandardMaterial color="#009e49" />
            </mesh>
            {/* Vành nón màu xanh dương */}
            <mesh position={[0, 0.18, 0.26]}>
              <boxGeometry args={[0.46, 0.05, 0.22]} />
              <meshStandardMaterial color="#0070ba" />
            </mesh>
            {/* Đôi mắt to tròn long lanh */}
            <mesh position={[-0.1, 0.02, 0.215]}>
              <boxGeometry args={[0.08, 0.09, 0.02]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <mesh position={[-0.08, 0.04, 0.225]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.1, 0.02, 0.215]}>
              <boxGeometry args={[0.08, 0.09, 0.02]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <mesh position={[0.12, 0.04, 0.225]}>
              <boxGeometry args={[0.03, 0.03, 0.02]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Má hồng ửng nhẹ */}
            <mesh position={[-0.12, -0.06, 0.215]}>
              <planeGeometry args={[0.08, 0.04]} />
              <meshBasicMaterial color="#ff85a1" />
            </mesh>
            <mesh position={[0.12, -0.06, 0.215]}>
              <planeGeometry args={[0.08, 0.04]} />
              <meshBasicMaterial color="#ff85a1" />
            </mesh>
            {/* Nụ cười chào đón khách hàng */}
            <mesh position={[0, -0.1, 0.215]}>
              <boxGeometry args={[0.1, 0.025, 0.02]} />
              <meshBasicMaterial color="#d62828" />
            </mesh>
          </group>
        </group>
      </group>

      {/* ==========================================
          THANG CUỐN ĐÔI (ESCALATORS): LÀN LÊN & LÀN XUỐNG
          ========================================== */}
      {/* 1. Làn Thang LÊN (Bên Phải x = 15.5) */}
      <group position={[15.5, 0, -2]}>
        {/* Sàn phẳng đáy thang (nơi bước vào) */}
        <mesh position={[0, 0.05, 6.0]}>
          <boxGeometry args={[2.4, 0.1, 2.0]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} />
        </mesh>
        {/* Thân dốc thang cuốn */}
        <mesh position={[0, 3.0, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[2.0, 0.4, 14.32]} />
          <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Thành kính 2 bên */}
        <mesh position={[-1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        {/* Tay vịn cao su đen */}
        <mesh position={[-1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Bậc thang chuyển động (animated) */}
        <group ref={escalatorUpRef}>
          {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((localZ, idx) => {
            const stepY = ((6.5 - localZ) / 13.0) * 6.0 + 0.18
            return (
              <mesh key={idx} position={[0, stepY, localZ]}>
                <boxGeometry args={[1.7, 0.28, 1.2]} />
                <meshStandardMaterial color="#ced4da" metalness={0.7} roughness={0.3} />
              </mesh>
            )
          })}
        </group>
        {/* Bảng chỉ dẫn LÊN TẦNG 2 (mũi tên xanh) */}
        <mesh position={[0, 1.8, 6.8]}>
          <boxGeometry args={[1.8, 0.5, 0.1]} />
          <meshBasicMaterial color="#38b000" />
        </mesh>
        <mesh position={[0, 1.8, 6.86]}>
          <planeGeometry args={[1.7, 0.44]} />
          <meshBasicMaterial map={shelfSignTexture('escalator_up', lang)} toneMapped={false} />
        </mesh>
      </group>

      {/* 2. Làn Thang XUỐNG (Bên Trái x = 12.5) */}
      <group position={[12.5, 0, -2]}>
        {/* Sàn phẳng đáy thang (nơi bước ra) */}
        <mesh position={[0, 0.05, 6.0]}>
          <boxGeometry args={[2.4, 0.1, 2.0]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} />
        </mesh>
        {/* Thân dốc thang cuốn */}
        <mesh position={[0, 3.0, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[2.0, 0.4, 14.32]} />
          <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Thành kính 2 bên */}
        <mesh position={[-1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        {/* Tay vịn cao su đen */}
        <mesh position={[-1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Bậc thang chuyển động (animated) */}
        <group ref={escalatorDownRef}>
          {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((localZ, idx) => {
            const stepY = ((6.5 - localZ) / 13.0) * 6.0 + 0.18
            return (
              <mesh key={idx} position={[0, stepY, localZ]}>
                <boxGeometry args={[1.7, 0.28, 1.2]} />
                <meshStandardMaterial color="#adb5bd" metalness={0.6} />
              </mesh>
            )
          })}
        </group>
        {/* Bảng chỉ dẫn XUỐNG TẦNG 1 (mũi tên đỏ) */}
        <mesh position={[0, 6.9, -6.5]}>
          <boxGeometry args={[1.6, 0.5, 0.1]} />
          <meshBasicMaterial color="#d90429" />
        </mesh>
        <mesh position={[0, 6.9, -6.44]}>
          <planeGeometry args={[1.5, 0.44]} />
          <meshBasicMaterial map={shelfSignTexture('escalator_down', lang)} toneMapped={false} />
        </mesh>
      </group>


      {/* ==========================================
          CÁC KỆ HÀNG SẢN PHẨM (TẦNG 1)
          ========================================== */}
      {/* 1. Kệ Hóa Mỹ Phẩm (P/S Dâu Trẻ Em) */}
      <group position={[-12, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} shelfKey="care" lang={lang} />
      </group>

      {/* 2. Kệ Bánh Quy & Snack (Oreo, Lay's) */}
      <group position={[-4, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} shelfKey="snacks_1" lang={lang} />
      </group>

      {/* 3. Kệ Snack Ống Pringles */}
      <group position={[4, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} shelfKey="snacks_2" lang={lang} />
      </group>

      {/* 4. Kệ Sô-cô-la (MrBeast Feastables, Meiji, KitKat) */}
      <group position={[-6, 0, -8]}>
        <ShelfRack width={6} height={2.8} depth={1.4} shelfKey="sweets" lang={lang} />
      </group>

      {/* 5. Quầy Trái Cây Tươi (Chuối già Nam Mỹ, Nho, Táo Queen) */}
      <group position={[4, 0, -8]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[5.8, 0.1, 2.5]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[5.5, 0.9, 2.2]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[4.2, 0.4, 0.1]} />
          <meshStandardMaterial color="#2a9d8f" />
        </mesh>
      </group>

      {/* Toàn bộ hàng hoá của cả hai tầng, gộp về vài InstancedMesh dùng chung */}
      <ProductInstances items={SHELF_PRODUCTS} />
      <ShelfPriceTags lang={lang} />

      {/* ==========================================
          KHU TẦNG 2: SÚNG NƯỚC TITAN & NƯỚC GIẢI KHÁT
          ========================================== */}
      {/* Kệ 1: Khu Súng Nước Super Soaker Titan */}
      <group position={[-6, 6.0, -8]}>
        <ShelfRack width={6} height={2.6} depth={1.4} shelfKey="toys" lang={lang} />
      </group>

      {/* Kệ 2: Kệ Nước Giải Khát Lon Cocacla & Lon Pensi */}
      <group position={[2, 6.0, -8]}>
        <ShelfRack width={5} height={2.6} depth={1.4} shelfKey="drinks" lang={lang} />
      </group>
    </group>
  )
}


const SHELF_LABELS = {
  care: { vi: '🍓 P/S DÂU TRẺ EM', en: '🍓 P/S KIDS TOOTHPASTE' },
  snacks_1: { vi: "🍪 BÁNH OREO & LAY'S", en: "🍪 OREO & LAY'S SNACKS" },
  snacks_2: { vi: '🥫 SNACK PRINGLES', en: '🥫 PRINGLES POTATO CRISPS' },
  sweets: { vi: '🍫 MRBEAST & MEIJI CHOCO', en: '🍫 MRBEAST & MEIJI CHOCO' },
  fruits: { vi: '🍌 QUẦY TRÁI CÂY TƯƠI', en: '🍌 FRESH FRUIT MARKET' },
  toys: { vi: '🔫 SÚNG NƯỚC SOAKER TITAN', en: '🔫 TITAN SOAKER WATER GUNS' },
  drinks: { vi: '🥤 NƯỚC GIẢI KHÁT COCACLA & PENSI', en: '🥤 COCACLA & PENSI DRINKS' },
  cashier: { vi: '💳 QUẦY THU NGÂN', en: '💳 CHECKOUT COUNTER' },
  escalator_up: { vi: '🟢 LÊN TẦNG 2 ⬆️', en: '🟢 UP TO FLOOR 2 ⬆️' },
  escalator_down: { vi: '🔴 XUỐNG TẦNG 1 ⬇️', en: '🔴 DOWN TO FLOOR 1 ⬇️' },
}

/** Bảng tên dãy hàng: nền đỏ, chữ trắng, tự thu nhỏ cho vừa tấm bảng. */
function shelfSignTexture(shelfKey, lang = 'vi') {
  const cfg = SHELF_LABELS[shelfKey] || { vi: shelfKey, en: shelfKey }
  const label = lang === 'en' ? cfg.en : cfg.vi
  return getCanvasTexture(`mart:sign:${shelfKey}:${lang}`, 768, 128, (ctx) => {
    ctx.fillStyle = '#d62828'
    ctx.fillRect(0, 0, 768, 128)
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 8
    ctx.strokeRect(6, 6, 756, 116)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let px = 58
    do {
      ctx.font = `bold ${px}px sans-serif`
      if (ctx.measureText(label).width <= 700) break
      px -= 2
    } while (px > 14)
    ctx.fillText(label, 384, 68)
  })
}

/**
 * Bảng giá gắn mép đợt kệ theo ngôn ngữ hiện tại.
 */
function priceTagTexture(productId, lang = 'vi') {
  const prod = SUPERMARKET_PRODUCTS.find((p) => p.id === productId)
  if (!prod) return null
  const shortName = lang === 'en' ? prod.shortName_en || prod.shortName : prod.shortName
  const priceStr = `${prod.price.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}đ`

  return getCanvasTexture(`mart:tag:${productId}:${lang}`, 384, 128, (ctx) => {
    ctx.fillStyle = '#fdfdfd'
    ctx.fillRect(0, 0, 384, 128)
    ctx.fillStyle = '#f1f3f5'
    ctx.fillRect(0, 0, 384, 10)
    ctx.strokeStyle = '#adb5bd'
    ctx.lineWidth = 5
    ctx.strokeRect(3, 3, 378, 122)

    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#212529'
    let px = 40
    do {
      ctx.font = `bold ${px}px sans-serif`
      if (ctx.measureText(shortName).width <= 356) break
      px -= 2
    } while (px > 12)
    ctx.fillText(shortName, 14, 44)

    ctx.fillStyle = '#d62828'
    ctx.font = 'bold 46px sans-serif'
    ctx.fillText(priceStr, 14, 94)

    ctx.fillStyle = '#495057'
    ctx.font = '26px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(prod.icon || '', 366, 94)
  })
}

/** Toàn bộ bảng giá, suy thẳng từ bố cục hàng hoá nên không bao giờ lệch với kệ. */
function ShelfPriceTags({ lang = 'vi' }) {
  return SHELF_TAGS.map((tag, i) => {
    const map = priceTagTexture(tag.type, lang)
    if (!map) return null
    return (
      <mesh key={i} position={tag.position}>
        <planeGeometry args={[0.44, 0.15]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    )
  })
}

function ShelfRack({ width, height, depth, shelfKey = '', lang = 'vi' }) {
  return (
    <group>
      {/* Đế chân kệ màu đen tạo bóng tiếp xúc sàn */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* 2 Cột trụ kim loại chắc chắn */}
      <mesh position={[-width / 2 + 0.1, height / 2, 0]}>
        <boxGeometry args={[0.18, height, depth]} />
        <meshStandardMaterial color="#495057" metalness={0.7} />
      </mesh>
      <mesh position={[width / 2 - 0.1, height / 2, 0]}>
        <boxGeometry args={[0.18, height, depth]} />
        <meshStandardMaterial color="#495057" metalness={0.7} />
      </mesh>

      {/* Các tầng đợt kệ */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#6c757d" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#6c757d" metalness={0.5} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#6c757d" metalness={0.5} />
      </mesh>

      {/* Bảng tên đề mục kệ hàng */}
      {shelfKey && (
        <group position={[0, height + 0.35, 0]}>
          <mesh>
            <boxGeometry args={[width * 0.85, 0.48, 0.1]} />
            <meshStandardMaterial color="#d62828" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[width * 0.82, 0.44]} />
            <meshBasicMaterial map={shelfSignTexture(shelfKey, lang)} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
