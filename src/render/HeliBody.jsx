// Khối hình thân trực thăng kiểu Airbus H145, dùng chung cho máy bay của người chơi và
// của cảnh sát.
//
// Nhận vật liệu từ bên ngoài chứ không tự tạo: hai loại máy bay chỉ khác nhau nước sơn
// và bộ tem, còn hình khối thì y hệt. Vật liệu vẫn lấy qua assets.js nên dựng bao nhiêu
// chiếc cũng không sinh thêm tài nguyên GPU.
//
// Hình dáng: mũi vát với kính buồng lái toàn cảnh và kính quan sát dưới sàn, nóc động cơ
// đôi có hốc hút gió và ống xả, đuôi kín Fenestron với quạt 8 cánh chạy trong ống, cánh
// quạt chính 4 lá có nắp chụp hình vòm và vạch cảnh báo vàng ở đầu cánh.
//
// Trục toạ độ: +Z là mũi, +Y là nóc - đúng như hệ mà updateHelicopter dùng để tính
// heading, nên group cha chỉ cần xoay quanh Y là thân chỉ đúng hướng bay.

import * as THREE from 'three'
import { getMaterial } from './assets.js'

// Các chi tiết kim loại trần thì chiếc nào cũng như chiếc nào, nên giữ luôn ở đây thay
// vì bắt mỗi nơi gọi phải truyền thêm ba vật liệu nữa.
function titaniumMaterial() {
  return getMaterial('heli:titanium', () => new THREE.MeshStandardMaterial({ color: '#495057', roughness: 0.3, metalness: 0.85 }))
}
function trimMaterial() {
  return getMaterial('heli:trim', () => new THREE.MeshStandardMaterial({ color: '#f8f9fa', roughness: 0.3, metalness: 0.1 }))
}
function bladeMaterial() {
  return getMaterial('heli:blade', () => new THREE.MeshStandardMaterial({ color: '#1e2127', roughness: 0.4, metalness: 0.3 }))
}
function tipMaterial() {
  return getMaterial('heli:bladeTip', () => new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.3 }))
}

/**
 * @param body   vật liệu vỏ ngoài (nước sơn riêng của từng chiếc)
 * @param dark   nhựa / gioăng đen
 * @param glass  kính buồng lái
 * @param metal  càng đáp và các thanh thép
 * @param livery texture tem sườn, một cặp [trái, phải]; bỏ trống thì thân trơn
 * @param tailDecal texture số hiệu trên vây đuôi
 * @param beaconRef, strobeRedRef, strobeBlueRef - đèn để bên ngoài tự nhấp nháy.
 *        Không truyền strobe thì cụm đèn chớp cảnh sát không được dựng.
 */
export default function HeliBody({
  body, dark, glass, metal,
  livery, tailDecal,
  rotorRef, tailRotorRef, beaconRef,
  strobeRedRef, strobeBlueRef,
}) {
  return (
    <>
      {/* --- 1. THÂN CHÍNH --- */}
      <mesh position={[0, 1.55, 0.2]} material={body}>
        <boxGeometry args={[2.1, 1.85, 3.4]} />
      </mesh>
      <mesh position={[0, 1.6, -1.7]} rotation={[-0.2, 0, 0]} material={body}>
        <boxGeometry args={[1.9, 1.7, 1.4]} />
      </mesh>
      <mesh position={[0, 0.82, 0.2]} material={dark}>
        <boxGeometry args={[1.95, 0.45, 3.2]} />
      </mesh>

      {/* --- 2. MŨI & KÍNH BUỒNG LÁI --- */}
      <mesh position={[0, 1.35, 2.3]} rotation={[0.42, 0, 0]} material={body}>
        <boxGeometry args={[1.95, 1.35, 1.6]} />
      </mesh>
      <mesh position={[0, 1.0, 3.0]} rotation={[0.65, 0, 0]} material={dark}>
        <sphereGeometry args={[0.9, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.75, 2.05]} rotation={[-0.45, 0, 0]} material={glass}>
        <boxGeometry args={[1.88, 1.25, 1.45]} />
      </mesh>
      {/* Kính quan sát dưới sàn hai bên mũi - chỗ trinh sát nhìn thẳng xuống đường */}
      <mesh position={[-0.65, 1.1, 2.45]} rotation={[-0.3, -0.2, 0]} material={glass}>
        <boxGeometry args={[0.55, 0.65, 0.6]} />
      </mesh>
      <mesh position={[0.65, 1.1, 2.45]} rotation={[-0.3, 0.2, 0]} material={glass}>
        <boxGeometry args={[0.55, 0.65, 0.6]} />
      </mesh>

      {/* Cửa sổ hông */}
      <mesh position={[-1.06, 1.65, 0.4]} material={glass}>
        <boxGeometry args={[0.04, 0.85, 2.2]} />
      </mesh>
      <mesh position={[1.06, 1.65, 0.4]} material={glass}>
        <boxGeometry args={[0.04, 0.85, 2.2]} />
      </mesh>

      {/* Tem sườn */}
      {livery && (
        <>
          <mesh position={[-1.07, 1.28, 0.15]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.8, 0.7]} />
            <meshStandardMaterial map={livery[0]} roughness={0.3} />
          </mesh>
          <mesh position={[1.07, 1.28, 0.15]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.8, 0.7]} />
            <meshStandardMaterial map={livery[1]} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Dao cắt cáp trên / dưới và hai ống pitot ở mũi */}
      <mesh position={[0, 2.45, 1.8]} rotation={[0.35, 0, 0]} material={dark}>
        <boxGeometry args={[0.08, 0.55, 0.14]} />
      </mesh>
      <mesh position={[0, 0.65, 2.8]} rotation={[-0.45, 0, 0]} material={dark}>
        <boxGeometry args={[0.08, 0.45, 0.14]} />
      </mesh>
      <mesh position={[-0.75, 1.05, 3.4]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
      </mesh>
      <mesh position={[0.75, 1.05, 3.4]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
      </mesh>

      {/* --- 3. CỤM CAMERA TẦM NHIỆT FLIR DƯỚI MŨI --- */}
      <group position={[0, 0.48, 2.3]}>
        <mesh material={dark}>
          <cylinderGeometry args={[0.18, 0.18, 0.22, 12]} />
        </mesh>
        <mesh position={[0, -0.22, 0.05]} material={dark}>
          <sphereGeometry args={[0.26, 16, 16]} />
        </mesh>
        <mesh position={[0, -0.22, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
          <meshStandardMaterial color="#0077b6" emissive="#0096c7" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* --- 4. ĐÈN CHỚP CẢNH SÁT (chỉ dựng khi bên gọi có đèn để nhấp nháy) --- */}
      {strobeRedRef && strobeBlueRef && (
        <group position={[0, 0.7, 0.2]}>
          <mesh ref={strobeRedRef} position={[-0.95, 0, 0]}>
            <boxGeometry args={[0.15, 0.12, 0.6]} />
            <meshStandardMaterial color="#d90429" emissive="#d90429" emissiveIntensity={0} />
          </mesh>
          <mesh ref={strobeBlueRef} position={[0.95, 0, 0]}>
            <boxGeometry args={[0.15, 0.12, 0.6]} />
            <meshStandardMaterial color="#0077b6" emissive="#0096c7" emissiveIntensity={0} />
          </mesh>
        </group>
      )}

      {/* --- 5. NÓC ĐỘNG CƠ ĐÔI --- */}
      <mesh position={[0, 2.52, -0.2]} material={body}>
        <boxGeometry args={[1.5, 0.65, 3.0]} />
      </mesh>
      <mesh position={[-0.45, 2.58, 1.25]} rotation={[0.35, 0, 0]} material={dark}>
        <boxGeometry args={[0.42, 0.35, 0.45]} />
      </mesh>
      <mesh position={[0.45, 2.58, 1.25]} rotation={[0.35, 0, 0]} material={dark}>
        <boxGeometry args={[0.42, 0.35, 0.45]} />
      </mesh>
      <mesh position={[-0.45, 2.45, -1.6]} rotation={[-0.35, -0.15, 0]} material={titaniumMaterial()}>
        <cylinderGeometry args={[0.18, 0.22, 0.65, 12]} />
      </mesh>
      <mesh position={[0.45, 2.45, -1.6]} rotation={[-0.35, 0.15, 0]} material={titaniumMaterial()}>
        <cylinderGeometry args={[0.18, 0.22, 0.65, 12]} />
      </mesh>

      {/* Đèn chớp chống va chạm trên nóc + đèn hoa tiêu đỏ trái / xanh phải */}
      <mesh ref={beaconRef} position={[0, 2.9, -0.3]}>
        <cylinderGeometry args={[0.08, 0.1, 0.14, 12]} />
        <meshStandardMaterial color="#d90429" emissive="#d90429" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[-1.08, 1.9, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[1.08, 1.9, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#2ec4b6" emissive="#2ec4b6" emissiveIntensity={2.0} />
      </mesh>

      {/* --- 6. CÀNG ĐÁP --- */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.15, 0.14, 0.2]} material={metal}>
            <boxGeometry args={[0.12, 0.12, 4.4]} />
          </mesh>
          <mesh position={[side * 1.15, 0.32, 2.45]} rotation={[-0.6, 0, 0]} material={metal}>
            <boxGeometry args={[0.12, 0.12, 0.65]} />
          </mesh>
          <mesh position={[side * 0.85, 0.68, 1.1]} rotation={[0, 0, side * 0.42]} material={metal}>
            <boxGeometry args={[0.1, 1.15, 0.14]} />
          </mesh>
          <mesh position={[side * 0.85, 0.68, -0.7]} rotation={[0, 0, side * 0.42]} material={metal}>
            <boxGeometry args={[0.1, 1.15, 0.14]} />
          </mesh>
          {/* Bệ bước chân */}
          <mesh position={[side * 1.25, 0.18, 0.2]} material={dark}>
            <boxGeometry args={[0.16, 0.04, 1.8]} />
          </mesh>
        </group>
      ))}

      {/* --- 7. ĐUÔI KÍN FENESTRON --- */}
      <mesh position={[0, 1.95, -3.8]} rotation={[Math.PI / 2, 0, 0]} material={body}>
        <cylinderGeometry args={[0.32, 0.68, 4.0, 12]} />
      </mesh>
      {/* Cánh đuôi ngang với hai vây đứng ở đầu mút */}
      <group position={[0, 2.05, -4.8]}>
        <mesh material={body}>
          <boxGeometry args={[2.5, 0.08, 0.65]} />
        </mesh>
        <mesh position={[-1.25, 0, 0]} material={body}>
          <boxGeometry args={[0.06, 0.75, 0.75]} />
        </mesh>
        <mesh position={[1.25, 0, 0]} material={body}>
          <boxGeometry args={[0.06, 0.75, 0.75]} />
        </mesh>
      </group>

      <group position={[0, 2.7, -6.0]}>
        {/* Vây đứng bọc quạt đuôi */}
        <mesh position={[0, 0.25, 0]} rotation={[0.25, 0, 0]} material={body}>
          <boxGeometry args={[0.34, 2.4, 1.8]} />
        </mesh>
        {tailDecal && (
          <>
            <mesh position={[-0.18, 0.8, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshStandardMaterial map={tailDecal} roughness={0.3} />
            </mesh>
            <mesh position={[0.18, 0.8, -0.1]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshStandardMaterial map={tailDecal} roughness={0.3} />
            </mesh>
          </>
        )}
        {/* Ống bọc quạt và vành thép */}
        <mesh position={[0, -0.1, 0.1]} rotation={[0, Math.PI / 2, 0]} material={dark}>
          <cylinderGeometry args={[0.62, 0.62, 0.38, 24, 1, true]} />
        </mesh>
        <mesh position={[0, -0.1, 0.1]} rotation={[0, Math.PI / 2, 0]} material={metal}>
          <torusGeometry args={[0.62, 0.06, 12, 24]} />
        </mesh>

        {/* Quạt 8 cánh quay trong ống */}
        <group ref={tailRotorRef} position={[0, -0.1, 0.1]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMaterial()}>
            <cylinderGeometry args={[0.16, 0.16, 0.32, 12]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <mesh key={idx} rotation={[(idx * Math.PI) / 4, 0, 0]} material={metal}>
              <boxGeometry args={[0.04, 1.15, 0.12]} />
            </mesh>
          ))}
        </group>

        {/* Chân chống quẹt đuôi + đèn đuôi trắng */}
        <mesh position={[0, -1.2, 0.4]} rotation={[-0.45, 0, 0]} material={metal}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
        </mesh>
        <mesh position={[0, 1.45, -0.45]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* --- 8. CÁNH QUẠT CHÍNH 4 LÁ --- */}
      <mesh position={[0, 2.95, 0.1]} material={titaniumMaterial()}>
        <cylinderGeometry args={[0.16, 0.22, 0.5, 12]} />
      </mesh>
      <mesh position={[0, 3.12, 0.1]} material={dark}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 16]} />
      </mesh>

      <group ref={rotorRef} position={[0, 3.32, 0.1]}>
        {/* Nắp chụp khí động học hình vòm */}
        <mesh position={[0, 0.12, 0]} material={body}>
          <sphereGeometry args={[0.48, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} material={dark}>
          <cylinderGeometry args={[0.48, 0.48, 0.14, 16]} />
        </mesh>

        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0, 0.05, 0.8]} material={titaniumMaterial()}>
              <boxGeometry args={[0.22, 0.08, 0.7]} />
            </mesh>
            <mesh position={[0, 0.05, 3.4]} material={bladeMaterial()}>
              <boxGeometry args={[0.32, 0.04, 4.6]} />
            </mesh>
            <mesh position={[0, 0.052, 5.6]} material={trimMaterial()}>
              <boxGeometry args={[0.325, 0.042, 0.35]} />
            </mesh>
            {/* Vạch cảnh báo vàng ở đầu cánh */}
            <mesh position={[0, 0.054, 5.85]} material={tipMaterial()}>
              <boxGeometry args={[0.325, 0.044, 0.3]} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}
