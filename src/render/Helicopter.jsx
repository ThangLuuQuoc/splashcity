// Trực thăng ngắm thành phố + sân đỗ.
//
// Hình khối procedural, vật liệu lấy từ kho dùng chung (assets.js) nên dựng bao nhiêu
// lần cũng không sinh thêm tài nguyên GPU. Cánh quạt quay bằng cách ghi thẳng vào
// rotation của group trong useFrame - không đi qua React state, giống các render khác.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'

function bodyMaterial() {
  return getMaterial('heli:body', () => new THREE.MeshStandardMaterial({ color: '#ef233c', roughness: 0.35, metalness: 0.3 }))
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

/** Mặt sân đỗ với vòng tròn và chữ H. */
function padTexture() {
  return getCanvasTexture('heli:pad', 512, 512, (ctx) => {
    ctx.fillStyle = '#2b2d33'
    ctx.fillRect(0, 0, 512, 512)

    // Viền vạch vàng
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 14
    ctx.strokeRect(24, 24, 464, 464)

    // Vòng tròn trắng
    ctx.strokeStyle = '#f8f9fa'
    ctx.lineWidth = 18
    ctx.beginPath()
    ctx.arc(256, 256, 168, 0, Math.PI * 2)
    ctx.stroke()

    // Chữ H
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(186, 140, 34, 232)
    ctx.fillRect(292, 140, 34, 232)
    ctx.fillRect(186, 240, 140, 34)
  })
}

export default function Helicopter({ world }) {
  const rotorRef = useRef()
  const tailRotorRef = useRef()
  const bodyRef = useRef()

  useFrame(() => {
    const h = world.heli
    const body = bodyRef.current
    if (body) {
      body.position.set(h.x, h.y, h.z)
      // Thân quay theo hướng mũi, cộng thêm độ nghiêng khi tăng tốc / vào cua.
      body.rotation.set(h.tiltPitch, h.heading, h.tiltRoll)
    }
    if (rotorRef.current) rotorRef.current.rotation.y = h.rotor
    if (tailRotorRef.current) tailRotorRef.current.rotation.x = h.rotor * 1.6
  })

  const pad = world.city.helipad

  return (
    <>
      {/* Sân đỗ trực thăng */}
      <group position={[pad.x, 0, pad.z]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[22, 22]} />
          <meshStandardMaterial map={padTexture()} roughness={0.8} />
        </mesh>
        {/* Đèn báo ở bốn góc sân */}
        {[[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([dx, dz], i) => (
          <mesh key={i} position={[dx, 0.35, dz]}>
            <sphereGeometry args={[0.32, 8, 8]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={1.2} />
          </mesh>
        ))}
        {/* Cột và túi gió */}
        <mesh position={[13, 3, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 6, 8]} />
          <meshStandardMaterial color="#adb5bd" metalness={0.7} />
        </mesh>
        <mesh position={[14.4, 5.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.55, 2.6, 10, 1, true]} />
          <meshStandardMaterial color="#ff7a29" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Thân trực thăng */}
      <group ref={bodyRef}>
        {/* Khoang chính */}
        <mesh position={[0, 1.5, 0]} material={bodyMaterial()}>
          <capsuleGeometry args={[1.25, 2.2, 6, 12]} />
        </mesh>
        {/* Kính buồng lái phía trước */}
        <mesh position={[0, 1.65, 1.6]} material={glassMaterial()}>
          <sphereGeometry args={[1.05, 14, 12]} />
        </mesh>
        {/* Đuôi */}
        <mesh position={[0, 1.75, -3.1]} rotation={[Math.PI / 2, 0, 0]} material={bodyMaterial()}>
          <cylinderGeometry args={[0.28, 0.5, 3.4, 10]} />
        </mesh>
        {/* Vây đuôi thẳng đứng */}
        <mesh position={[0, 2.55, -4.5]} material={bodyMaterial()}>
          <boxGeometry args={[0.16, 1.5, 1.0]} />
        </mesh>
        {/* Càng đáp */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 1.0, 0.18, 0]} material={metalMaterial()}>
              <boxGeometry args={[0.18, 0.18, 3.6]} />
            </mesh>
            <mesh position={[side * 0.75, 0.75, 0.7]} rotation={[0, 0, side * 0.5]} material={metalMaterial()}>
              <boxGeometry args={[0.14, 1.3, 0.14]} />
            </mesh>
            <mesh position={[side * 0.75, 0.75, -0.7]} rotation={[0, 0, side * 0.5]} material={metalMaterial()}>
              <boxGeometry args={[0.14, 1.3, 0.14]} />
            </mesh>
          </group>
        ))}
        {/* Trục cánh quạt */}
        <mesh position={[0, 2.85, 0]} material={darkMaterial()}>
          <cylinderGeometry args={[0.2, 0.2, 0.7, 8]} />
        </mesh>
        {/* Cánh quạt chính */}
        <group ref={rotorRef} position={[0, 3.2, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, 0, 0]} material={darkMaterial()}>
              <boxGeometry args={[0.34, 0.07, 11]} />
            </mesh>
          ))}
        </group>
        {/* Cánh quạt đuôi */}
        <group ref={tailRotorRef} position={[0.35, 2.4, -4.5]}>
          {[0, 1].map((i) => (
            <mesh key={i} rotation={[(i * Math.PI) / 2, 0, 0]} material={darkMaterial()}>
              <boxGeometry args={[0.06, 2.2, 0.22]} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  )
}
