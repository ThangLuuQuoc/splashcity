// Trực thăng Đồng hồ cơ (Clockwork) - mẫu thứ hai cho người chơi đổi.
//
// Cùng khuôn khổ với HeliBody: mũi ở +Z, nóc ở +Y, cánh quạt chính quay quanh Y và quạt
// đuôi quay quanh X, nên phần lái và phần dựng hình không cần biết đang là mẫu nào. Kích
// thước cũng giữ nguyên (thân rộng ~2.1, càng đáp ở x = ±1.15, đuôi kết thúc ở z = -6),
// vì đèn pha rọi gắn ở toạ độ cố định trên giá càng đáp và bán kính va chạm thì dùng
// chung một hằng số cho mọi mẫu.
//
// Vật liệu tự khai ở đây chứ không nhận từ ngoài như HeliBody: cái làm nên mẫu này chính
// là đồng thau với gỗ, đổi màu sơn thì nó không còn là nó nữa.

import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'

function brassMaterial() {
  return getMaterial('clock:brass', () => new THREE.MeshStandardMaterial({ color: '#b08d57', roughness: 0.32, metalness: 0.9 }))
}
function darkBrassMaterial() {
  return getMaterial('clock:darkBrass', () => new THREE.MeshStandardMaterial({ color: '#7a5c33', roughness: 0.45, metalness: 0.85 }))
}
function copperMaterial() {
  return getMaterial('clock:copper', () => new THREE.MeshStandardMaterial({ color: '#c46a3f', roughness: 0.35, metalness: 0.8 }))
}
function woodMaterial() {
  return getMaterial('clock:wood', () => new THREE.MeshStandardMaterial({ color: '#c89f6b', roughness: 0.85, metalness: 0.05 }))
}
function darkWoodMaterial() {
  return getMaterial('clock:darkWood', () => new THREE.MeshStandardMaterial({ color: '#8a6134', roughness: 0.9, metalness: 0.05 }))
}
function domeMaterial() {
  return getMaterial('clock:dome', () => new THREE.MeshStandardMaterial({
    color: '#1b3a5c', roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.85,
  }))
}

/** Mặt đồng hồ trên sườn máy bay: vành đồng, số La Mã, hai kim. */
function clockFaceTexture() {
  return getCanvasTexture('clock:face', 256, 256, (ctx) => {
    ctx.fillStyle = '#8a6a3c'
    ctx.fillRect(0, 0, 256, 256)

    ctx.fillStyle = '#e8d6b0'
    ctx.beginPath()
    ctx.arc(128, 128, 104, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#6b4f2a'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(128, 128, 104, 0, Math.PI * 2)
    ctx.stroke()

    // Vạch giờ + số La Mã
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    ctx.fillStyle = '#3f2d17'
    ctx.font = 'bold 22px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2
      ctx.fillText(numerals[i], 128 + Math.cos(a) * 78, 128 + Math.sin(a) * 78)
      ctx.beginPath()
      ctx.arc(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Kim giờ và kim phút, dừng ở 10:10 cho cân mặt
    ctx.strokeStyle = '#2b1d0e'
    ctx.lineCap = 'round'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(128, 128)
    ctx.lineTo(128 - 44, 128 - 30)
    ctx.stroke()
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(128, 128)
    ctx.lineTo(128 + 58, 128 - 40)
    ctx.stroke()

    ctx.fillStyle = '#b08d57'
    ctx.beginPath()
    ctx.arc(128, 128, 11, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Một bánh răng hoàn chỉnh: đĩa, vành răng và (tuỳ chọn) mặt số dán lên.
 *
 * Quy ước: trục quay của bánh răng là +Z của group, mặt số nhìn về +Z. Cả ba mảnh phải
 * cùng một quy ước, nếu không thì xoay group đi là răng một đằng đĩa một nẻo - đĩa hình
 * trụ của three mặc định dựng theo trục Y nên luôn cần xoay 90° quanh X để về đúng +Z.
 * Muốn bánh răng quay theo trục nào thì chỉ việc xoay cả group: [0, ±90°, 0] cho nó úp
 * ra sườn, [-90°, 0, 0] cho nó nằm ngang như bánh răng trên trục cánh quạt.
 */
function Gear({ radius, thickness = 0.1, teeth, toothSize, material, toothMaterial, faceMap }) {
  const tooth = toothMaterial || material
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={material}>
        <cylinderGeometry args={[radius, radius, thickness, Math.max(12, teeth)]} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * (radius + toothSize * 0.35), Math.sin(a) * (radius + toothSize * 0.35), 0]}
            rotation={[0, 0, a]}
            material={tooth}
          >
            <boxGeometry args={[toothSize, toothSize * 0.75, thickness * 0.9]} />
          </mesh>
        )
      })}
      {faceMap && (
        <mesh position={[0, 0, thickness / 2 + 0.01]}>
          <circleGeometry args={[radius * 0.94, 24]} />
          <meshStandardMaterial map={faceMap} roughness={0.5} metalness={0.2} />
        </mesh>
      )}
    </>
  )
}

/**
 * Một trạm của giàn đuôi: khung vuông gỗ với hai thanh chéo. Giàn thu nhỏ dần về phía
 * đuôi nên mỗi trạm nhận bán kính riêng.
 */
function TrussBay({ z, half, wood }) {
  const beam = 0.075
  const diag = half * 2.6
  return (
    <group position={[0, 1.75, z]}>
      <mesh position={[0, half, 0]} material={wood}>
        <boxGeometry args={[half * 2, beam, beam]} />
      </mesh>
      <mesh position={[0, -half, 0]} material={wood}>
        <boxGeometry args={[half * 2, beam, beam]} />
      </mesh>
      <mesh position={[-half, 0, 0]} material={wood}>
        <boxGeometry args={[beam, half * 2, beam]} />
      </mesh>
      <mesh position={[half, 0, 0]} material={wood}>
        <boxGeometry args={[beam, half * 2, beam]} />
      </mesh>
      {/* Hai thanh giằng chéo, thứ khiến cái giàn nhìn ra giàn chứ không ra cái ống */}
      <mesh rotation={[0, 0, Math.PI / 4]} material={wood}>
        <boxGeometry args={[beam * 0.8, diag, beam * 0.8]} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} material={wood}>
        <boxGeometry args={[beam * 0.8, diag, beam * 0.8]} />
      </mesh>
    </group>
  )
}

export default function ClockworkBody({
  rotorRef, tailRotorRef, beaconRef, strobeRedRef, strobeBlueRef,
}) {
  const brass = brassMaterial()
  const darkBrass = darkBrassMaterial()
  const copper = copperMaterial()
  const wood = woodMaterial()
  const darkWood = darkWoodMaterial()

  // Giàn đuôi hở: 5 trạm nhỏ dần, cộng 4 thanh dọc nối chúng lại.
  const bays = [0, 1, 2, 3, 4].map((i) => ({ z: -2.1 - i * 1.0, half: 0.6 - i * 0.09 }))

  return (
    <>
      {/* --- 1. THÂN ĐỒNG THAU --- */}
      <mesh position={[0, 1.55, 0.15]} scale={[1, 0.95, 1.3]} material={brass}>
        <sphereGeometry args={[1.15, 20, 16]} />
      </mesh>
      {/* Đai đồng quanh bụng, che chỗ nối hai nửa vỏ */}
      <mesh position={[0, 1.55, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={darkBrass}>
        <torusGeometry args={[1.13, 0.07, 8, 24]} />
      </mesh>
      <mesh position={[0, 0.72, 0.15]} scale={[1, 0.5, 1.25]} material={darkBrass}>
        <sphereGeometry args={[0.85, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>

      {/* --- 2. MŨI KÍNH VÒM --- */}
      <mesh position={[0, 1.5, 1.5]} rotation={[Math.PI / 2, 0, 0]} material={domeMaterial()}>
        <sphereGeometry args={[0.86, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 1.5, 1.12]} material={brass}>
        <torusGeometry args={[0.87, 0.08, 8, 20]} />
      </mesh>
      {/* Ống pitot đồng ở chóp mũi */}
      <mesh position={[0, 1.5, 2.5]} rotation={[Math.PI / 2, 0, 0]} material={copper}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
      </mesh>

      {/* --- 3. MẶT ĐỒNG HỒ VÀ BÁNH RĂNG HAI BÊN SƯỜN --- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.02, 1.6, 0.15]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <Gear
            radius={0.62}
            teeth={18}
            toothSize={0.11}
            material={darkBrass}
            toothMaterial={brass}
            faceMap={clockFaceTexture()}
          />
        </group>
      ))}

      {/* Bánh răng nhỏ ăn khớp phía trên mặt đồng hồ */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.0, 2.32, -0.35]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <Gear radius={0.26} thickness={0.09} teeth={10} toothSize={0.08} material={copper} />
        </group>
      ))}

      {/* --- 4. NỒI HƠI VÀ ỐNG KHÓI --- */}
      <mesh position={[0, 2.32, -0.9]} rotation={[Math.PI / 2, 0, 0]} material={copper}>
        <cylinderGeometry args={[0.42, 0.42, 1.5, 14]} />
      </mesh>
      <mesh position={[0, 2.32, -1.62]} material={darkBrass}>
        <torusGeometry args={[0.42, 0.07, 8, 16]} />
      </mesh>
      <mesh position={[-0.5, 2.9, -0.6]} material={darkBrass}>
        <cylinderGeometry args={[0.11, 0.14, 0.75, 10]} />
      </mesh>
      <mesh position={[-0.5, 3.3, -0.6]} material={copper}>
        <cylinderGeometry args={[0.19, 0.12, 0.22, 10]} />
      </mesh>
      <mesh position={[0.5, 2.86, -0.6]} material={darkBrass}>
        <cylinderGeometry args={[0.09, 0.12, 0.65, 10]} />
      </mesh>

      {/* --- 5. ĐÈN --- */}
      {/* Đèn hiệu trên nóc: một cái đèn lồng đồng thay cho bóng nháy nhựa */}
      <mesh position={[0, 2.78, 0.55]} material={darkBrass}>
        <cylinderGeometry args={[0.1, 0.13, 0.12, 10]} />
      </mesh>
      <mesh ref={beaconRef} position={[0, 2.92, 0.55]}>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial color="#ffb703" emissive="#ff8800" emissiveIntensity={2.5} roughness={0.3} />
      </mesh>
      {/* Đèn hoa tiêu đỏ trái / xanh phải */}
      <mesh position={[-1.12, 1.95, 0.15]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.12, 1.95, 0.15]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#2ec4b6" emissive="#2ec4b6" emissiveIntensity={2} />
      </mesh>
      {/* Cặp đèn hiệu dưới bụng, nhấp nháy khi bật còi */}
      {strobeRedRef && strobeBlueRef && (
        <group position={[0, 0.72, 0.3]}>
          <mesh ref={strobeRedRef} position={[-0.62, 0, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#d90429" emissive="#d90429" emissiveIntensity={0} />
          </mesh>
          <mesh ref={strobeBlueRef} position={[0.62, 0, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#0077b6" emissive="#0096c7" emissiveIntensity={0} />
          </mesh>
        </group>
      )}

      {/* --- 6. CÀNG ĐÁP GỖ --- */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.15, 0.14, 0.15]} material={darkWood}>
            <boxGeometry args={[0.16, 0.16, 4.3]} />
          </mesh>
          {/* Mũi càng vuốt cong lên phía trước */}
          <mesh position={[side * 1.15, 0.33, 2.4]} rotation={[-0.55, 0, 0]} material={darkWood}>
            <boxGeometry args={[0.16, 0.16, 0.7]} />
          </mesh>
          {/* Hai cột chống, có thanh giằng chéo cho ra dáng khung gỗ */}
          <mesh position={[side * 1.05, 0.62, 1.05]} material={wood}>
            <boxGeometry args={[0.13, 1.0, 0.13]} />
          </mesh>
          <mesh position={[side * 1.05, 0.62, -0.75]} material={wood}>
            <boxGeometry args={[0.13, 1.0, 0.13]} />
          </mesh>
          <mesh position={[side * 1.05, 0.62, 0.15]} rotation={[0.62, 0, 0]} material={wood}>
            <boxGeometry args={[0.09, 2.1, 0.09]} />
          </mesh>
        </group>
      ))}
      {/* Hai thanh ngang nối hai càng lại thành một cái cũi */}
      {[1.05, -0.75].map((z) => (
        <mesh key={z} position={[0, 0.62, z]} rotation={[0, 0, Math.PI / 2]} material={wood}>
          <boxGeometry args={[0.12, 2.2, 0.12]} />
        </mesh>
      ))}

      {/* --- 7. GIÀN ĐUÔI GỖ HỞ --- */}
      {bays.map((b) => (
        <TrussBay key={b.z} z={b.z} half={b.half} wood={wood} />
      ))}
      {/* Bốn thanh dọc nối các trạm: hơi chụm vào trong nên giàn thon dần về đuôi */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[sx * 0.42, 1.75 + sy * 0.42, -4.1]}
          rotation={[sy * 0.045, sx * -0.045, 0]}
          material={wood}
        >
          <boxGeometry args={[0.085, 0.085, 4.3]} />
        </mesh>
      ))}
      {/* Vòng đồng ôm chỗ giàn cắm vào thân */}
      <mesh position={[0, 1.75, -1.85]} material={brass}>
        <torusGeometry args={[0.68, 0.09, 8, 18]} />
      </mesh>

      {/* --- 8. ĐUÔI: VÂY GỖ VÀ QUẠT ĐUÔI --- */}
      <group position={[0, 1.75, -6.1]}>
        <mesh position={[0, 0.62, 0]} material={darkWood}>
          <boxGeometry args={[0.1, 1.3, 0.85]} />
        </mesh>
        <mesh position={[0, -0.5, 0.1]} rotation={[0.4, 0, 0]} material={darkWood}>
          <boxGeometry args={[0.1, 0.8, 0.6]} />
        </mesh>
        {/* Hộp số quạt đuôi */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={brass}>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 12]} />
        </mesh>
        <group ref={tailRotorRef} position={[0.42, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={copper}>
            <cylinderGeometry args={[0.12, 0.12, 0.16, 10]} />
          </mesh>
          {[0, 1].map((i) => (
            <mesh key={i} rotation={[(i * Math.PI) / 2, 0, 0]} material={wood}>
              <boxGeometry args={[0.05, 2.0, 0.28]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* --- 9. TRỤC VÀ CÁNH QUẠT CHÍNH --- */}
      {/* Cột trục hở với hai tầng bánh răng, thứ nhìn thấy đầu tiên trên mẫu này */}
      <mesh position={[0, 2.75, 0.1]} material={brass}>
        <cylinderGeometry args={[0.15, 0.2, 0.75, 12]} />
      </mesh>
      <group position={[0, 2.72, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <Gear radius={0.5} teeth={16} toothSize={0.1} material={darkBrass} toothMaterial={brass} />
      </group>
      <group position={[0, 3.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <Gear radius={0.34} thickness={0.09} teeth={12} toothSize={0.08} material={copper} />
      </group>
      {/* Bốn thanh chống trục, kiểu khung máy bay đời đầu */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * 0.35, 2.5, 0.1 + sz * 0.35]}
            rotation={[sz * 0.28, 0, sx * -0.28]}
            material={brass}
          >
            <cylinderGeometry args={[0.045, 0.045, 1.1, 6]} />
          </mesh>
        )),
      )}

      <group ref={rotorRef} position={[0, 3.32, 0.1]}>
        <mesh material={brass}>
          <cylinderGeometry args={[0.3, 0.36, 0.28, 14]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={copper}>
          <sphereGeometry args={[0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Ba lá gỗ - mẫu này cố tình lệch khỏi bốn lá của chiếc H145 */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <mesh position={[0, 0, 0.55]} material={darkBrass}>
              <boxGeometry args={[0.16, 0.16, 0.7]} />
            </mesh>
            {/* Cuống nối bằng hai thanh giằng nhỏ */}
            <mesh position={[0, 0.14, 1.1]} rotation={[0.16, 0, 0]} material={copper}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 6]} />
            </mesh>
            <mesh position={[0, 0.01, 3.2]} material={wood}>
              <boxGeometry args={[0.42, 0.07, 4.6]} />
            </mesh>
            <mesh position={[0, 0.012, 5.65]} material={darkWood}>
              <boxGeometry args={[0.425, 0.072, 0.45]} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}
