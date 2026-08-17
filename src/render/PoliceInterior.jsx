import * as THREE from 'three'
import { POLICE_SPACE } from '../game/systems/interiors.js'
import { getCanvasTexture } from './assets.js'

// Texture nằm ở kho dùng chung (assets.js) nên chỉ dựng một lần cho cả phiên chơi,
// ra vào đồn bao nhiêu lần cũng không upload lại lên GPU.

// Texture Sàn Đồn Cảnh Sát (Navy Floor Tiles)
function policeFloorTexture() {
  return getCanvasTexture(
    'police:floor',
    512,
    512,
    (ctx) => {
      ctx.fillStyle = '#26374f'
      ctx.fillRect(0, 0, 512, 512)

      const tileSize = 128
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = c * tileSize
          const y = r * tileSize
          ctx.fillStyle = '#2f4360'
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
          ctx.strokeStyle = '#152238'
          ctx.lineWidth = 3
          ctx.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3)
        }
      }
    },
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(10, 8)
    },
  )
}

// Texture Bảng Truy Nã (Wanted Board)
function wantedBoardTexture() {
  return getCanvasTexture('police:wanted', 512, 512, (ctx) => {
    ctx.fillStyle = '#c9a66b'
    ctx.fillRect(0, 0, 512, 512)

    // Tờ giấy truy nã
    ctx.fillStyle = '#fff8e7'
    ctx.fillRect(40, 40, 432, 432)
    ctx.lineWidth = 8
    ctx.strokeStyle = '#000000'
    ctx.strokeRect(40, 40, 432, 432)

    ctx.fillStyle = '#d00000'
    ctx.font = 'bold 48px serif'
    ctx.textAlign = 'center'
    ctx.fillText('WANTED', 256, 110)

    ctx.fillStyle = '#333333'
    ctx.fillRect(136, 140, 240, 200)

    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText('SPLASH BANDIT', 256, 380)

    ctx.fillStyle = '#111111'
    ctx.font = '22px sans-serif'
    ctx.fillText('Tội: Tạt bóng nước khắp phố', 256, 420)
  })
}

export default function PoliceInterior({ world }) {
  const isInside = world.interior === 'police_station'

  const floorTexture = policeFloorTexture()
  const wantedTexture = wantedBoardTexture()

  if (!isInside) return null

  const { cx, cy, cz, width, depth } = POLICE_SPACE
  const roomW = width + 16
  const roomD = depth + 16

  return (
    <group position={[cx, cy, cz]}>
      {/* Ánh sáng đồn cảnh sát */}
      <ambientLight intensity={1.4} />
      <directionalLight position={[0, 15, 0]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0, 7, 0]} intensity={1.8} distance={40} color="#e2eafc" />
      <pointLight position={[-8, 4, 4]} intensity={1.4} distance={25} color="#fff" />
      <pointLight position={[8, 5, -6]} intensity={1.5} distance={25} color="#48cae4" />

      {/* Sàn gạch đồn cảnh sát bao trùm tầm nhìn */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW * 1.5, roomD * 1.5]} />
        <meshStandardMaterial map={floorTexture} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Trần nhà */}
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW * 1.5, roomD * 1.5]} />
        <meshStandardMaterial color="#1b263b" />
      </mesh>

      {/* Tường bao quanh */}
      <mesh position={[0, 4.5, -depth / 2]}>
        <boxGeometry args={[roomW, 9, 0.8]} />
        <meshStandardMaterial color="#415a77" />
      </mesh>
      <mesh position={[0, 4.5, depth / 2]}>
        <boxGeometry args={[roomW, 9, 0.8]} />
        <meshStandardMaterial color="#415a77" />
      </mesh>
      <mesh position={[-width / 2, 4.5, 0]}>
        <boxGeometry args={[0.8, 9, roomD]} />
        <meshStandardMaterial color="#415a77" />
      </mesh>
      <mesh position={[width / 2, 4.5, 0]}>
        <boxGeometry args={[0.8, 9, roomD]} />
        <meshStandardMaterial color="#415a77" />
      </mesh>

      {/* Nẹp chân tường */}
      <mesh position={[0, 0.25, -depth / 2 + 0.45]}>
        <boxGeometry args={[roomW, 0.5, 0.2]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[-width / 2 + 0.45, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.5, roomD]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[width / 2 - 0.45, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.5, roomD]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>

      {/* Cửa Ra Vào Đồn */}
      <group position={[0, 1.8, depth / 2 - 0.4]}>
        <mesh>
          <boxGeometry args={[5, 3.6, 0.2]} />
          <meshStandardMaterial color="#1d3557" />
        </mesh>
      </group>

      {/* ==========================================
          BÀN TRỰC BAN & MÁY TÍNH CẢNH SÁT
          ========================================== */}
      <group position={[-4, 0, 4]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[4.4, 0.1, 2.2]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[4.2, 1.2, 2.0]} />
          <meshStandardMaterial color="#2b2d42" roughness={0.4} />
        </mesh>
        {/* Máy tính CRT màn hình xanh */}
        <mesh position={[-0.8, 1.5, 0]}>
          <boxGeometry args={[0.8, 0.7, 0.7]} />
          <meshStandardMaterial color="#ced4da" />
        </mesh>
        <mesh position={[-0.8, 1.5, 0.36]}>
          <boxGeometry args={[0.65, 0.55, 0.02]} />
          <meshBasicMaterial color="#0077b6" />
        </mesh>
        {/* Bàn phím & chuột */}
        <mesh position={[-0.8, 1.28, 0.6]}>
          <boxGeometry args={[0.7, 0.04, 0.3]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
        {/* Đĩa bánh donut & Tách cà phê */}
        <mesh position={[1.0, 1.35, 0.2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.25, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[1.0, 1.3, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.08, 8, 16]} />
          <meshStandardMaterial color="#ff70a6" />
        </mesh>
      </group>

      {/* ==========================================
          BẢNG TRUY NÃ (WANTED BOARD)
          ========================================== */}
      <group position={[12, 0, 4]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[0.2, 3.2, 4.2]} />
          <meshStandardMaterial map={wantedTexture} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[0.25, 3.4, 4.4]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>
      </group>

      {/* ==========================================
          PHÒNG GIAM TẠM GIỮ (HOLDING CELLS)
          ========================================== */}
      <group position={[8, 0, -6]}>
        <mesh position={[0, 2.0, 0]}>
          <boxGeometry args={[8, 4.0, 6]} />
          <meshStandardMaterial color="#1b263b" transparent opacity={0.1} />
        </mesh>
        {/* Các song sắt phòng giam */}
        {[-3, -2, -1, 0, 1, 2, 3].map((xOffset) => (
          <mesh key={xOffset} position={[xOffset, 2.0, 3]}>
            <cylinderGeometry args={[0.05, 0.05, 4.0, 8]} />
            <meshStandardMaterial color="#8d99ae" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        {/* Giường tầng trong buồng giam */}
        <mesh position={[0, 0.6, -1.8]}>
          <boxGeometry args={[6, 0.3, 2]} />
          <meshStandardMaterial color="#6c757d" />
        </mesh>
        <mesh position={[0, 2.2, -1.8]}>
          <boxGeometry args={[6, 0.3, 2]} />
          <meshStandardMaterial color="#6c757d" />
        </mesh>
        {/* Quả Bóng Nước Bí Mật giấu dưới gầm giường nếu chưa nhặt */}
        {!world.secretBalloonFound && (
          <mesh position={[2.2, 0.35, -1.5]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.8} />
          </mesh>
        )}
      </group>


      {/* ==========================================
          KHO VŨ KHÍ NƯỚC (WATER ARMORY)
          ========================================== */}
      <group position={[-12, 0, -6]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[4, 3.6, 1.2]} />
          <meshStandardMaterial color="#212529" metalness={0.7} />
        </mesh>
        {/* Quả Bóng Nước Siêu Cấp (Mega Balloon) phát sáng xoay */}
        <mesh position={[0, 1.8, 0.7]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshStandardMaterial color="#38b6ff" emissive="#0077b6" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 3.8, 0]}>
          <boxGeometry args={[3.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#0077b6" />
        </mesh>
      </group>

      {/* ==========================================
          NÚT BÁO ĐỘNG KHẨN CẤP (EMERGENCY ALARM)
          ========================================== */}
      <group position={[-4, 0, 6]}>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[0.4, 0.6, 0.2]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
        <mesh position={[0, 1.3, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#d90429" emissive="#d90429" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
}
