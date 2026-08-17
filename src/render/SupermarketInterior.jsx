import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUPERMARKET_SPACE } from '../game/systems/interiors.js'
import { ProductInstances } from './Products.jsx'
import { SHELF_PRODUCTS, SHELF_TAGS } from './martLayout.js'
import { SUPERMARKET_PRODUCTS } from '../game/config.js'
import { getCanvasTexture } from './assets.js'

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

// 2. Texture Banner Chào Mừng Siêu Thị Rực Rỡ
function martBannerTexture() {
  return getCanvasTexture('mart:banner', 1024, 256, (ctx) => {
    // Nền Gradient Đỏ - Vàng phong cách Splash Mart
    const grad = ctx.createLinearGradient(0, 0, 1024, 0)
    grad.addColorStop(0, '#d90429')
    grad.addColorStop(0.5, '#ef233c')
    grad.addColorStop(1, '#d90429')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 256)

    // Viền vàng kim loại
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 12
    ctx.strokeRect(10, 10, 1004, 236)

    // Tiêu đề chính
    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8
    ctx.fillText('🛒 SIÊU THỊ SPLASH MART 🛒', 512, 90)

    // Dòng phụ
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px sans-serif'
    ctx.shadowBlur = 4
    ctx.fillText('⭐ TẦNG 1: BÁCH HÓA VIỆT NAM  •  TẦNG 2: THẾ GIỚI ĐỒ CHƠI ⭐', 512, 175)
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

export default function SupermarketInterior({ world }) {
  const isInside = world.interior === 'supermarket'
  const escalatorStepsRef = useRef()

  const floorTexture = martFloorTexture()
  const bannerTexture = martBannerTexture()
  const qrTexture = martQrTexture()

  useFrame((_, delta) => {
    if (!isInside) return
    if (escalatorStepsRef.current) {
      escalatorStepsRef.current.position.z -= delta * 1.8
      if (escalatorStepsRef.current.position.z < -4) {
        escalatorStepsRef.current.position.z = 0
      }
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
          TƯỜNG PHÒNG & CHÂN TƯỜNG (SKIRTING BOARD)
          ========================================== */}
      {/* Tường Hậu (Back Wall) */}
      <mesh position={[0, 6.5, -depth / 2]}>
        <boxGeometry args={[roomW, 13, 0.8]} />
        <meshStandardMaterial color="#e9ecef" roughness={0.6} />
      </mesh>
      {/* Nẹp viền chân tường hậu màu ghi đậm */}
      <mesh position={[0, 0.25, -depth / 2 + 0.45]}>
        <boxGeometry args={[roomW, 0.5, 0.2]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>

      {/* Tường Trái (Left Wall) */}
      <mesh position={[-width / 2, 6.5, 0]}>
        <boxGeometry args={[0.8, 13, roomD]} />
        <meshStandardMaterial color="#e9ecef" roughness={0.6} />
      </mesh>
      <mesh position={[-width / 2 + 0.45, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.5, roomD]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>

      {/* Tường Phải (Right Wall) */}
      <mesh position={[width / 2, 6.5, 0]}>
        <boxGeometry args={[0.8, 13, roomD]} />
        <meshStandardMaterial color="#e9ecef" roughness={0.6} />
      </mesh>
      <mesh position={[width / 2 - 0.45, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.5, roomD]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>

      {/* Tường Trước (Front Wall) - Có khung kính lớn nhìn ra sảnh */}
      <group position={[0, 6.5, depth / 2]}>
        <mesh position={[-14, 0, 0]}>
          <boxGeometry args={[width / 2 - 6, 13, 0.8]} />
          <meshStandardMaterial color="#e9ecef" />
        </mesh>
        <mesh position={[14, 0, 0]}>
          <boxGeometry args={[width / 2 - 6, 13, 0.8]} />
          <meshStandardMaterial color="#e9ecef" />
        </mesh>
        {/* Cửa kính trượt trong suốt */}
        <mesh position={[0, -3.5, 0]}>
          <boxGeometry args={[12, 6, 0.2]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.35} roughness={0.1} />
        </mesh>
        {/* Khung nhôm đen cửa */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[12.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#212529" />
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

      {/* Banner Chào Mừng Siêu Thị Splash Mart lớn */}
      <mesh position={[0, 9.5, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[18, 4.5]} />
        <meshBasicMaterial map={bannerTexture} />
      </mesh>

      {/* ==========================================
          SÀN TẦNG 2 & KHOANG GIẾNG TRỜI THANG CUỐN
          ========================================== */}
      {/* 1. Sàn Chính Tầng 2 (Khu vực Đồ Chơi bên Trái & Trung Tâm) */}
      <group position={[-5.25, 6.0, -8.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          {/* Rộng 33.5m (từ x = -22 đến x = 11.5), sâu 17m (từ z = -17 đến z = 0) */}
          <planeGeometry args={[33.5, 17]} />
          <meshStandardMaterial map={floorTexture} roughness={0.3} />
        </mesh>
        {/* Viền đế sàn Tầng 2 */}
        <mesh position={[0, -0.2, 8.5]}>
          <boxGeometry args={[33.5, 0.4, 0.3]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
        {/* Lan can kính nhìn xuống sảnh Tầng 1 (mặt trước z = 0) */}
        <mesh position={[0, 0.7, 8.5]}>
          <boxGeometry args={[33.3, 1.4, 0.1]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.45, 8.5]}>
          <boxGeometry args={[33.3, 0.1, 0.18]} />
          <meshStandardMaterial color="#e9ecef" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Sảnh Đón Khách Phía Sau Đỉnh Thang Cuốn (Bên Phải x = 11.5 đến x = 22, z = -17 đến z = -8.5) */}
      <group position={[16.75, 6.0, -12.75]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.5, 8.5]} />
          <meshStandardMaterial map={floorTexture} roughness={0.3} />
        </mesh>
        {/* Nẹp viền chân sảnh */}
        <mesh position={[0, -0.2, 4.25]}>
          <boxGeometry args={[10.5, 0.4, 0.3]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
      </group>

      {/* 3. Lan can kính ngăn cách giữa Sàn Chính và Khoang Giếng Trời Thang Cuốn (x = 11.5, z từ 0 đến -8.5) */}
      <group position={[11.5, 6.0, -4.25]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.3, 0.4, 8.5]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.1, 1.4, 8.5]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[0.18, 0.1, 8.5]} />
          <meshStandardMaterial color="#e9ecef" metalness={0.9} />
        </mesh>
      </group>


      {/* ==========================================
          QUẦY THU NGÂN (CHECKOUT COUNTER)
          ========================================== */}
      <group position={[-8, 0, 8]}>
        {/* Chân đế tối màu tạo bóng tiếp xúc */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[5.2, 0.1, 2.0]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
        {/* Thân bàn thu ngân màu đỏ Splash Mart */}
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[5, 1.2, 1.8]} />
          <meshStandardMaterial color="#d62828" roughness={0.3} />
        </mesh>
        {/* Mặt bàn đá trắng sang trọng */}
        <mesh position={[0, 1.27, 0]}>
          <boxGeometry args={[5.1, 0.06, 1.9]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.2} />
        </mesh>
        {/* Băng chuyền tính tiền màu đen */}
        <mesh position={[-1.0, 1.31, 0]}>
          <boxGeometry args={[2.6, 0.03, 1.4]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>
        {/* Màn hình POS quét mã QR */}
        <mesh position={[1.4, 1.65, 0.2]} rotation={[0, -0.35, 0]}>
          <boxGeometry args={[0.8, 0.7, 0.08]} />
          <meshStandardMaterial map={qrTexture} />
        </mesh>
        {/* Chân đế màn hình */}
        <mesh position={[1.4, 1.38, 0.2]}>
          <cylinderGeometry args={[0.06, 0.08, 0.2, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        {/* Biển chỉ dẫn "QUẦY THU NGÂN" trên trần */}
        <mesh position={[0, 3.8, 0]}>
          <boxGeometry args={[3.2, 0.8, 0.1]} />
          <meshStandardMaterial color="#d62828" />
        </mesh>
      </group>

      {/* ==========================================
          THANG CUỐN ĐÔI (ESCALATORS): LÀN LÊN & LÀN XUỐNG
          ========================================== */}
      {/* 1. Làn Thang LÊN (Bên Phải x = 15.5) */}
      <group position={[15.5, 0, -2]}>
        <mesh position={[0, 0.05, 5.5]}>
          <boxGeometry args={[2.4, 0.1, 3.0]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
        <mesh position={[0, 3.0, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[2.0, 0.4, 14.32]} />
          <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[-1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <group ref={escalatorStepsRef}>
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
        {/* Bảng chỉ dẫn LÊN */}
        <mesh position={[0, 1.8, 6.5]}>
          <boxGeometry args={[1.8, 0.4, 0.1]} />
          <meshStandardMaterial color="#38b000" />
        </mesh>
      </group>

      {/* 2. Làn Thang XUỐNG (Bên Trái x = 12.5) */}
      <group position={[12.5, 0, -2]}>
        <mesh position={[0, 0.05, 5.5]}>
          <boxGeometry args={[2.4, 0.1, 3.0]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
        <mesh position={[0, 3.0, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[2.0, 0.4, 14.32]} />
          <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.1, 3.7, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.08, 1.1, 14.32]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.45} />
        </mesh>
        <mesh position={[-1.1, 4.3, 0]} rotation={[0.432, 0, 0]}>
          <boxGeometry args={[0.16, 0.12, 14.32]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Bậc thang làn xuống */}
        {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((localZ, idx) => {
          const stepY = ((6.5 - localZ) / 13.0) * 6.0 + 0.18
          return (
            <mesh key={idx} position={[0, stepY, localZ]}>
              <boxGeometry args={[1.7, 0.28, 1.2]} />
              <meshStandardMaterial color="#adb5bd" metalness={0.6} />
            </mesh>
          )
        })}
        {/* Bảng chỉ dẫn XUỐNG */}
        <mesh position={[0, 7.8, -7.5]}>
          <boxGeometry args={[1.8, 0.4, 0.1]} />
          <meshStandardMaterial color="#d90429" />
        </mesh>
      </group>

      {/* ==========================================
          CÁC KỆ HÀNG SẢN PHẨM VIỆT NAM (TẦNG 1)
          ========================================== */}
      {/* Khung kệ - phần cấu trúc, đứng yên */}
      {/* 1. Kệ Hóa Mỹ Phẩm (P/S Dâu Trẻ Em) */}
      <group position={[-12, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} label="🍓 P/S DÂU TRẺ EM" />
      </group>

      {/* 2. Kệ Bánh Quy & Snack (Oreo, Lay's) */}
      <group position={[-4, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} label="🍪 BÁNH OREO & LAY'S" />
      </group>

      {/* 3. Kệ Snack Ống Pringles */}
      <group position={[4, 0, 0]}>
        <ShelfRack width={5} height={2.8} depth={1.4} label="🥫 SNACK PRINGLES" />
      </group>

      {/* 4. Kệ Sô-cô-la (MrBeast Feastables, Meiji, KitKat) */}
      <group position={[-6, 0, -8]}>
        <ShelfRack width={6} height={2.8} depth={1.4} label="🍫 MRBEAST & MEIJI CHOCO" />
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
      <ShelfPriceTags />

      {/* ==========================================
          KHU TẦNG 2: SÚNG NƯỚC TITAN & NƯỚC GIẢI KHÁT
          ========================================== */}
      {/* Kệ 1: Khu Súng Nước Super Soaker Titan */}
      <group position={[-6, 6.0, -8]}>
        <ShelfRack width={6} height={2.6} depth={1.4} label="🔫 SÚNG NƯỚC SOAKER TITAN" />
      </group>

      {/* Kệ 2: Kệ Nước Tăng Lực Sting Dâu */}
      <group position={[2, 6.0, -8]}>
        <ShelfRack width={5} height={2.6} depth={1.4} label="🥤 NƯỚC TĂNG LỰC STING DÂU" />
      </group>
    </group>
  )
}


/** Bảng tên dãy hàng: nền đỏ, chữ trắng, tự thu nhỏ cho vừa tấm bảng. */
function shelfSignTexture(label) {
  return getCanvasTexture(`mart:sign:${label}`, 768, 128, (ctx) => {
    ctx.fillStyle = '#d62828'
    ctx.fillRect(0, 0, 768, 128)
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 8
    ctx.strokeRect(6, 6, 756, 116)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let px = 62
    do {
      ctx.font = `bold ${px}px sans-serif`
      if (ctx.measureText(label).width <= 700) break
      px -= 2
    } while (px > 14)
    ctx.fillText(label, 384, 68)
  })
}

/**
 * Bảng giá gắn mép đợt kệ. Đây mới là thứ trả lời câu "mình đang định mua cái gì, bao
 * nhiêu tiền" - hình bao bì cho biết đó là hộp gì, còn giá thì phải đọc mới biết.
 */
function priceTagTexture(productId) {
  const prod = SUPERMARKET_PRODUCTS.find((p) => p.id === productId)
  if (!prod) return null
  return getCanvasTexture(`mart:tag:${productId}`, 384, 128, (ctx) => {
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
    let px = 42
    do {
      ctx.font = `bold ${px}px sans-serif`
      if (ctx.measureText(prod.shortName).width <= 356) break
      px -= 2
    } while (px > 12)
    ctx.fillText(prod.shortName, 14, 44)

    ctx.fillStyle = '#d62828'
    ctx.font = 'bold 46px sans-serif'
    ctx.fillText(`${prod.price.toLocaleString('vi-VN')}đ`, 14, 94)

    ctx.fillStyle = '#495057'
    ctx.font = '26px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(prod.icon || '', 366, 94)
  })
}

/** Toàn bộ bảng giá, suy thẳng từ bố cục hàng hoá nên không bao giờ lệch với kệ. */
function ShelfPriceTags() {
  return SHELF_TAGS.map((tag, i) => {
    const map = priceTagTexture(tag.type)
    if (!map) return null
    return (
      <mesh key={i} position={tag.position}>
        <planeGeometry args={[0.44, 0.15]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    )
  })
}

function ShelfRack({ width, height, depth, label = '' }) {
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

      {/* Bảng tên đề mục kệ hàng. Trước đây chỉ là tấm bảng đỏ trơn: prop `label` được
          truyền vào nhưng không hề được vẽ ra, nên đứng giữa siêu thị không biết dãy
          nào bán gì. Chữ nằm trên một tấm phẳng riêng ở mặt trước, vì texture dán lên
          khối hộp thì bò ra cả 6 mặt và bị kéo méo theo tỉ lệ từng mặt. */}
      {label && (
        <group position={[0, height + 0.35, 0]}>
          <mesh>
            <boxGeometry args={[width * 0.85, 0.48, 0.1]} />
            <meshStandardMaterial color="#d62828" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[width * 0.82, 0.44]} />
            <meshBasicMaterial map={shelfSignTexture(label)} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
