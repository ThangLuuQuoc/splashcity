// Đội trực thăng cảnh sát: thân sơn xanh, đèn quay trên nóc, đèn pha và vòi rồng.
//
// Đèn pha dựng bằng một hình nón trong suốt chứ không dùng SpotLight thật: đèn thật kéo
// theo cả một lượt tính sáng cho mọi vật thể trong tầm, trong khi thứ cần ở đây chỉ là
// một vệt sáng nhìn thấy được. Nón nằm trong group riêng ngoài thân máy bay, vì nó phải
// chỉ thẳng vào người chơi bất kể thân đang nghiêng thế nào.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'
import HeliBody from './HeliBody.jsx'
import { POLICE_HELI } from '../game/config.js'

function copBodyMaterial() {
  return getMaterial('copheli:body', () => new THREE.MeshStandardMaterial({ color: '#0e2b4d', roughness: 0.24, metalness: 0.35 }))
}
function copDarkMaterial() {
  return getMaterial('copheli:dark', () => new THREE.MeshStandardMaterial({ color: '#16191f', roughness: 0.45, metalness: 0.2 }))
}
function copGlassMaterial() {
  return getMaterial('copheli:glass', () => new THREE.MeshStandardMaterial({
    color: '#122c44', roughness: 0.08, metalness: 0.45, transparent: true, opacity: 0.72,
  }))
}
function copMetalMaterial() {
  return getMaterial('copheli:metal', () => new THREE.MeshStandardMaterial({ color: '#212529', roughness: 0.35, metalness: 0.75 }))
}

/** Tem sườn "POLICE" + huy hiệu sao. Vẽ riêng từng bên để chữ không bị lộn ngược. */
function copLiveryTexture(side) {
  return getCanvasTexture(`copheli:livery:${side}`, 512, 128, (ctx) => {
    ctx.fillStyle = '#0e2b4d'
    ctx.fillRect(0, 0, 512, 128)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 118, 512, 10)
    ctx.fillStyle = '#ffb703'
    ctx.fillRect(0, 112, 512, 6)

    const badgeX = side === 'left' ? 70 : 442
    ctx.fillStyle = '#ffd166'
    ctx.beginPath()
    ctx.arc(badgeX, 58, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0e2b4d'
    ctx.beginPath()
    ctx.arc(badgeX, 58, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 30px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', badgeX, 58)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 68px "Arial Black", "Segoe UI", sans-serif'
    ctx.textAlign = side === 'left' ? 'left' : 'right'
    ctx.fillText('POLICE', side === 'left' ? 120 : 392, 56)

    ctx.font = 'bold 16px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText('AIRBUS H145', side === 'left' ? 124 : 388, 100)
  })
}

/** Số hiệu trên vây đuôi. */
function copTailTexture() {
  return getCanvasTexture('copheli:tail', 256, 256, (ctx) => {
    ctx.fillStyle = '#0e2b4d'
    ctx.fillRect(0, 0, 256, 256)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(20, 30, 216, 8)
    ctx.fillRect(20, 50, 216, 8)

    ctx.fillStyle = '#ffd166'
    ctx.font = '900 42px "Arial Black", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('H-145', 128, 110)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial, sans-serif'
    ctx.fillText('POLICE', 128, 160)
  })
}
function beamMaterial() {
  return getMaterial('copheli:beam', () => new THREE.MeshBasicMaterial({
    color: '#fff3c4', transparent: true, opacity: 0.28, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  }))
}
// Vũng sáng đọng trên người chơi ở đầu kia chùm đèn
function poolMaterial() {
  return getMaterial('copheli:pool', () => new THREE.MeshBasicMaterial({
    color: '#fff8d6', transparent: true, opacity: 0.5, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  }))
}
function jetMaterial() {
  return getMaterial('copheli:jet', () => new THREE.MeshBasicMaterial({
    color: '#8ee6ff', transparent: true, opacity: 0.42, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  }))
}

function CopHeli({ world, index }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const rotorRef = useRef()
  const tailRotorRef = useRef()
  const beaconRef = useRef()
  const strobeRedRef = useRef()
  const strobeBlueRef = useRef()
  const beamRef = useRef()
  const beamConeRef = useRef()
  const jetRef = useRef()
  const poolRef = useRef()

  useFrame(() => {
    const h = world.policeHelis[index]
    const group = groupRef.current
    if (!group) return

    group.visible = h.active
    if (!h.active) return

    group.position.set(h.x, h.y, h.z)
    if (bodyRef.current) bodyRef.current.rotation.set(0, h.heading, h.tiltRoll)
    if (rotorRef.current) rotorRef.current.rotation.y = h.rotor
    // Quạt Fenestron nhỏ nên quay nhanh hơn hẳn cánh quạt chính.
    if (tailRotorRef.current) tailRotorRef.current.rotation.x = h.rotor * 3.2

    // Đèn quay trên nóc: nhấp nháy nhanh khi đang bám sát, chậm khi mới chỉ tuần tra.
    if (beaconRef.current) {
      const rate = h.spotOn ? 9 : 4
      const on = Math.floor(world.time * rate) % 2 === 0
      beaconRef.current.material.emissiveIntensity = on ? 3.2 : 0.25
    }

    // Đèn chớp đỏ - xanh luân phiên dưới bụng: nhìn từ mặt đất là thấy ngay cảnh sát
    // đang lượn trên đầu, kể cả khi chưa bật đèn pha.
    if (strobeRedRef.current && strobeBlueRef.current) {
      const phase = Math.floor(world.time * 12) % 2
      strobeRedRef.current.material.emissiveIntensity = phase === 0 ? 4.0 : 0.1
      strobeBlueRef.current.material.emissiveIntensity = phase === 1 ? 4.0 : 0.1
    }

    // Đèn pha và vòi rồng: nhóm riêng ngoài thân, xoay cho chỉ thẳng vào người chơi rồi
    // kéo dài nón đúng bằng khoảng cách, nên vệt sáng chạm tới tận nơi.
    //
    // Object3D.lookAt của three quay vật thể sao cho trục +Z hướng vào đích (chỉ camera
    // và đèn mới là -Z). Trước đây ở đây dựng nón về phía -Z, thành ra đèn pha chiếu
    // ngược ra sau lưng: đo bằng toạ độ thật thì đáy nón nằm cách người chơi 19m.
    const beam = beamRef.current
    if (beam) {
      const p = world.player
      beam.visible = h.spotOn
      if (h.spotOn) {
        const ty = p.y + 1.4 // ngắm vào thân máy bay chứ không phải càng đáp
        beam.position.set(h.x, h.y + 0.6, h.z)
        beam.lookAt(p.x, ty, p.z)
        const dist = Math.max(1, Math.hypot(p.x - h.x, ty - (h.y + 0.6), p.z - h.z))
        if (beamConeRef.current) {
          beamConeRef.current.scale.set(1, dist, 1)
          beamConeRef.current.position.z = dist / 2
        }
        if (jetRef.current) {
          jetRef.current.visible = h.cannonOn
          jetRef.current.scale.set(1, dist, 1)
          jetRef.current.position.z = dist / 2
        }
        // Vũng sáng đọng trên chính người chơi - thứ cho thấy rõ "nó đang chiếu vào MÌNH"
        if (poolRef.current) {
          poolRef.current.position.z = dist
          const pulse = 1 + Math.sin(world.time * 9) * 0.06
          poolRef.current.scale.set(pulse, pulse, 1)
        }
      }
    }
  })

  return (
    <>
      <group ref={groupRef} visible={false}>
        <group ref={bodyRef}>
          <HeliBody
            body={copBodyMaterial()}
            dark={copDarkMaterial()}
            glass={copGlassMaterial()}
            metal={copMetalMaterial()}
            livery={[copLiveryTexture('left'), copLiveryTexture('right')]}
            tailDecal={copTailTexture()}
            rotorRef={rotorRef}
            tailRotorRef={tailRotorRef}
            beaconRef={beaconRef}
            strobeRedRef={strobeRedRef}
            strobeBlueRef={strobeBlueRef}
          />
          {/* Đèn pha Nightsun treo trên giá càng đáp trái - chỗ chùm sáng phát ra */}
          <group position={[-1.25, 0.65, 1.4]} rotation={[0.3, 0.15, 0]}>
            <mesh material={copDarkMaterial()}>
              <cylinderGeometry args={[0.05, 0.05, 0.35, 8]} />
            </mesh>
            <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={copDarkMaterial()}>
              <cylinderGeometry args={[0.28, 0.22, 0.35, 16]} />
            </mesh>
            <mesh position={[0, 0, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.25, 16]} />
              <meshStandardMaterial color="#e0fbfc" emissive="#bbf2f6" emissiveIntensity={2} roughness={0.1} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Vệt đèn pha + tia nước, luôn chỉ vào người chơi nên nằm ngoài group thân.
          Nón xoay -90° quanh X: đỉnh nhọn nằm ở bóng đèn, miệng loe ra phía người chơi,
          đúng chiều một chùm sáng thật. */}
      <group ref={beamRef} visible={false}>
        <mesh ref={beamConeRef} rotation={[-Math.PI / 2, 0, 0]} material={beamMaterial()}>
          <coneGeometry args={[1.7, 1, 16, 1, true]} />
        </mesh>
        <mesh ref={jetRef} rotation={[-Math.PI / 2, 0, 0]} material={jetMaterial()} visible={false}>
          <coneGeometry args={[0.7, 1, 10, 1, true]} />
        </mesh>
        <mesh ref={poolRef} material={poolMaterial()}>
          <circleGeometry args={[2.1, 20]} />
        </mesh>
      </group>
    </>
  )
}

/**
 * Đạn cao su đang bay: quả cầu cam nhỏ, gộp về một InstancedMesh nên bắn dày mấy cũng
 * chỉ tốn đúng một draw call. Viên chưa dùng bị đẩy ra ngoài tầm nhìn thay vì phải dựng
 * lại lưới mỗi lần số lượng thay đổi.
 */
function RubberShots({ world }) {
  const ref = useRef()

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const shots = world.rubberShots
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i]
      if (s.active) DUMMY.position.set(s.x, s.y, s.z)
      else DUMMY.position.set(0, -9999, 0)
      DUMMY.updateMatrix()
      mesh.setMatrixAt(i, DUMMY.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, world.rubberShots.length]} frustumCulled={false}>
      <sphereGeometry args={[0.22, 8, 6]} />
      <meshStandardMaterial color="#ff7b00" emissive="#c2410c" emissiveIntensity={0.6} roughness={0.8} />
    </instancedMesh>
  )
}

const DUMMY = new THREE.Object3D()

export default function PoliceHelicopters({ world }) {
  return (
    <>
      {Array.from({ length: POLICE_HELI.count }, (_, i) => (
        <CopHeli key={i} world={world} index={i} />
      ))}
      <RubberShots world={world} />
    </>
  )
}
