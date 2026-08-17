// Trực thăng ngắm thành phố + sân đỗ.
//
// Hình khối procedural, vật liệu lấy từ kho dùng chung (assets.js) nên dựng bao nhiêu
// lần cũng không sinh thêm tài nguyên GPU. Cánh quạt quay bằng cách ghi thẳng vào
// rotation của group trong useFrame - không đi qua React state, giống các render khác.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'
import HeliBody from './HeliBody.jsx'

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
        <HeliBody
          body={bodyMaterial()}
          dark={darkMaterial()}
          glass={glassMaterial()}
          metal={metalMaterial()}
          rotorRef={rotorRef}
          tailRotorRef={tailRotorRef}
        />
      </group>
    </>
  )
}
