// Trực thăng ngắm thành phố + sân đỗ.
//
// Hình khối procedural, vật liệu lấy từ kho dùng chung (assets.js) nên dựng bao nhiêu
// lần cũng không sinh thêm tài nguyên GPU. Cánh quạt quay bằng cách ghi thẳng vào
// rotation của group trong useFrame - không đi qua React state, giống các render khác.
//
// Thân dùng chung HeliBody với đội bay cảnh sát, nhưng sơn đỏ - trắng của trực thăng du
// lịch chứ không phải xanh navy công vụ: đang bị rượt trên trời thì phải nhìn một cái là
// biết chiếc nào là mình, chiếc nào là cảnh sát.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'
import HeliBody from './HeliBody.jsx'

function bodyMaterial() {
  return getMaterial('heli:body', () => new THREE.MeshStandardMaterial({ color: '#ef233c', roughness: 0.3, metalness: 0.3 }))
}
function darkMaterial() {
  return getMaterial('heli:dark', () => new THREE.MeshStandardMaterial({ color: '#22252b', roughness: 0.5 }))
}
function glassMaterial() {
  return getMaterial('heli:glass', () => new THREE.MeshStandardMaterial({
    color: '#8ecae6', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55,
  }))
}
function metalMaterial() {
  return getMaterial('heli:metal', () => new THREE.MeshStandardMaterial({ color: '#adb5bd', roughness: 0.3, metalness: 0.8 }))
}
// Chùm sáng đèn pha: một hình nón trong suốt chứ không phải SpotLight thật. Đèn thật bắt
// three tính lại ánh sáng cho mọi vật trong tầm mỗi khung hình, mà thứ cần ở đây chỉ là
// một vệt sáng nhìn thấy được.
function beamMaterial() {
  return getMaterial('heli:beam', () => new THREE.MeshBasicMaterial({
    color: '#e0fbfc', transparent: true, opacity: 0.16, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  }))
}

/** Quầng sáng đọng trên mặt đường ở cuối chùm đèn. */
function groundSpotTexture() {
  return getCanvasTexture('heli:groundSpot', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126)
    g.addColorStop(0, 'rgba(230, 250, 255, 0.95)')
    g.addColorStop(0.4, 'rgba(180, 235, 255, 0.6)')
    g.addColorStop(0.8, 'rgba(100, 200, 255, 0.22)')
    g.addColorStop(1, 'rgba(0, 150, 255, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  })
}

/** Tem sườn của trực thăng du lịch. Vẽ riêng từng bên để chữ không bị lộn ngược. */
function tourLiveryTexture(side) {
  return getCanvasTexture(`heli:tourLivery:${side}`, 512, 128, (ctx) => {
    ctx.fillStyle = '#ef233c'
    ctx.fillRect(0, 0, 512, 128)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 116, 512, 12)
    ctx.fillStyle = '#ffd166'
    ctx.fillRect(0, 108, 512, 8)

    const badgeX = side === 'left' ? 70 : 442
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(badgeX, 56, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = 'bold 34px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🚁', badgeX, 58)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 58px "Arial Black", "Segoe UI", sans-serif'
    ctx.textAlign = side === 'left' ? 'left' : 'right'
    ctx.fillText('CITY TOUR', side === 'left' ? 120 : 392, 54)

    ctx.font = 'bold 16px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.fillText('SPLASH CITY - H145', side === 'left' ? 124 : 388, 96)
  })
}

function tourTailTexture() {
  return getCanvasTexture('heli:tourTail', 256, 256, (ctx) => {
    ctx.fillStyle = '#ef233c'
    ctx.fillRect(0, 0, 256, 256)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(20, 30, 216, 8)
    ctx.fillRect(20, 50, 216, 8)

    ctx.fillStyle = '#ffd166'
    ctx.font = '900 42px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SC-01', 128, 110)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial, sans-serif'
    ctx.fillText('TOUR', 128, 160)
  })
}

/** Mặt sân đỗ với vòng tròn và chữ H. */
function padTexture() {
  return getCanvasTexture('heli:pad', 512, 512, (ctx) => {
    ctx.fillStyle = '#22252c'
    ctx.fillRect(0, 0, 512, 512)

    // Viền vạch vàng
    ctx.strokeStyle = '#ffb703'
    ctx.lineWidth = 16
    ctx.strokeRect(20, 20, 472, 472)

    // Vòng tròn trắng
    ctx.strokeStyle = '#f8f9fa'
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.arc(256, 256, 185, 0, Math.PI * 2)
    ctx.stroke()

    // Vòng đứt nét bên trong
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 6
    ctx.setLineDash([20, 16])
    ctx.beginPath()
    ctx.arc(256, 256, 140, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Chữ H
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(180, 130, 38, 252)
    ctx.fillRect(294, 130, 38, 252)
    ctx.fillRect(180, 237, 152, 38)
  })
}

// Vị trí bóng đèn pha trong khoang lái, đo trong hệ toạ độ thân máy bay (xem HeliBody).
const LAMP = { x: -1.25, y: 0.65, z: 1.4 }

export default function Helicopter({ world }) {
  const rotorRef = useRef()
  const tailRotorRef = useRef()
  const bodyRef = useRef()
  const beaconRef = useRef()
  const strobeRedRef = useRef()
  const strobeBlueRef = useRef()
  const beamRef = useRef()
  const beamConeRef = useRef()
  const groundSpotRef = useRef()

  useFrame(() => {
    const h = world.heli
    const body = bodyRef.current
    if (body) {
      body.position.set(h.x, h.y, h.z)
      // Thân quay theo hướng mũi, cộng thêm độ nghiêng khi tăng tốc / vào cua.
      body.rotation.set(h.tiltPitch, h.heading, h.tiltRoll)
    }
    if (rotorRef.current) rotorRef.current.rotation.y = h.rotor
    // Quạt Fenestron nhỏ nên quay nhanh hơn hẳn cánh quạt chính.
    if (tailRotorRef.current) tailRotorRef.current.rotation.x = h.rotor * 3.2
    // Đèn chống va chạm trên nóc nháy đều, kể cả lúc đang đỗ.
    if (beaconRef.current) {
      const on = Math.floor(world.time * 5) % 2 === 0
      beaconRef.current.material.emissiveIntensity = on ? 3.2 : 0.2
    }

    // Còi hú: đèn chớp đỏ - xanh luân phiên dưới bụng máy bay.
    if (strobeRedRef.current && strobeBlueRef.current) {
      const phase = h.siren ? Math.floor(world.time * 12) % 2 : -1
      strobeRedRef.current.material.emissiveIntensity = phase === 0 ? 4 : 0
      strobeBlueRef.current.material.emissiveIntensity = phase === 1 ? 4 : 0
    }

    // Đèn pha rọi. Điểm rọi (spotX/spotZ) và bán kính do helicopter.js tính, ở đây chỉ
    // vẽ đúng con số đó ra: cái nhìn thấy phải trùng khít với cái thật sự làm người dưới
    // đường giật mình, nếu không thì người chơi rọi trượt mà không hiểu vì sao.
    const on = h.searchlight && h.y > 2.0
    const radius = 6.0 + h.y * 0.15

    const beam = beamRef.current
    if (beam) {
      beam.visible = on
      if (on) {
        // Toạ độ bóng đèn: xoay theo hướng mũi (bỏ qua độ nghiêng thân, lệch không đáng
        // kể so với chùm sáng dài hàng chục mét).
        const sin = Math.sin(h.heading)
        const cos = Math.cos(h.heading)
        const lx = h.x + cos * LAMP.x + sin * LAMP.z
        const ly = h.y + LAMP.y
        const lz = h.z - sin * LAMP.x + cos * LAMP.z
        beam.position.set(lx, ly, lz)
        // lookAt xoay vật thể sao cho trục +Z hướng vào đích, nên nón cũng được dựng
        // dọc +Z: đỉnh nhọn ở bóng đèn, miệng loe ra đúng chỗ vệt sáng chạm đất.
        beam.lookAt(h.spotX, 0.05, h.spotZ)
        const dist = Math.max(1, Math.hypot(h.spotX - lx, ly - 0.05, h.spotZ - lz))
        if (beamConeRef.current) {
          beamConeRef.current.scale.set(radius, dist, radius)
          beamConeRef.current.position.z = dist / 2
        }
      }
    }

    if (groundSpotRef.current) {
      groundSpotRef.current.visible = on
      if (on) {
        groundSpotRef.current.position.set(h.spotX, 0.06, h.spotZ)
        groundSpotRef.current.scale.set(radius * 2, radius * 2, 1)
      }
    }
  })

  const pad = world.city.helipad

  return (
    <>
      {/* Sân đỗ trực thăng */}
      <group position={[pad.x, 0, pad.z]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial map={padTexture()} roughness={0.85} />
        </mesh>
        {/* Đèn báo ở bốn góc sân */}
        {[[-11, -11], [11, -11], [-11, 11], [11, 11]].map(([dx, dz], i) => (
          <group key={i} position={[dx, 0, dz]}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 0.3, 8]} />
              <meshStandardMaterial color="#343a40" />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={1.6} />
            </mesh>
          </group>
        ))}
        {/* Cột và túi gió */}
        <mesh position={[14, 3, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 6, 8]} />
          <meshStandardMaterial color="#adb5bd" metalness={0.8} />
        </mesh>
        <mesh position={[15.4, 5.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.6, 2.8, 12, 1, true]} />
          <meshStandardMaterial color="#ff5400" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>

      {/* Thân trực thăng */}
      <group ref={bodyRef}>
        <HeliBody
          body={bodyMaterial()}
          dark={darkMaterial()}
          glass={glassMaterial()}
          metal={metalMaterial()}
          livery={[tourLiveryTexture('left'), tourLiveryTexture('right')]}
          tailDecal={tourTailTexture()}
          rotorRef={rotorRef}
          tailRotorRef={tailRotorRef}
          beaconRef={beaconRef}
          strobeRedRef={strobeRedRef}
          strobeBlueRef={strobeBlueRef}
        />
        {/* Đèn pha rọi treo trên giá càng đáp trái */}
        <group position={[LAMP.x, LAMP.y, LAMP.z]} rotation={[0.3, 0.15, 0]}>
          <mesh material={darkMaterial()}>
            <cylinderGeometry args={[0.05, 0.05, 0.35, 8]} />
          </mesh>
          <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={darkMaterial()}>
            <cylinderGeometry args={[0.28, 0.22, 0.35, 16]} />
          </mesh>
          <mesh position={[0, 0, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.25, 16]} />
            <meshStandardMaterial color="#e0fbfc" emissive="#bbf2f6" emissiveIntensity={2} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Chùm sáng: nằm ngoài group thân vì nó phải chỉ vào điểm rọi dưới đất bất kể
          thân đang nghiêng thế nào. Nón dựng dọc +Z, dài 1 đơn vị rồi kéo giãn theo
          khoảng cách thật trong useFrame. */}
      <group ref={beamRef} visible={false}>
        <mesh ref={beamConeRef} rotation={[-Math.PI / 2, 0, 0]} material={beamMaterial()}>
          <coneGeometry args={[1, 1, 20, 1, true]} />
        </mesh>
      </group>

      {/* Quầng sáng đọng trên mặt đường, đúng bán kính mà người đi đường bị doạ */}
      <mesh ref={groundSpotRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={groundSpotTexture()}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

