import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// The player is the one character that isn't instanced, so it can carry a bit
// more detail: a cap, a backpack, and a water balloon held in one hand.
export default function Player({ world }) {
  const root = useRef()
  const legL = useRef()
  const legR = useRef()
  const armL = useRef()
  const armR = useRef()
  const held = useRef()

  useFrame(() => {
    const p = world.player
    const g = root.current
    if (!g) return

    // Hidden in a car, but visible riding the train - you can see yourself
    // through the carriage windows and the see-through roof above you. Trực thăng
    // cũng ẩn: người chơi ngồi trong khoang kín, hiện ra chỉ lòi vào giữa thân máy.
    const visible = p.mode !== 'car' && p.mode !== 'heli'
    g.visible = visible
    if (!visible) return

    g.position.set(p.x, p.y, p.z)
    g.rotation.y = p.heading

    const swing = Math.sin(p.walkPhase) * 0.8
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (armL.current) armL.current.rotation.x = world.spraying ? -1.35 : -swing
    if (armR.current) armR.current.rotation.x = world.throwCooldown > 0.15 ? -2.1 : swing
    if (held.current) held.current.visible = world.ammo > 0

    // Blink when freshly respawned so the invulnerability is visible.
    if (p.invuln > 0) g.visible = Math.floor(world.time * 10) % 2 === 0
  })

  return (
    <group ref={root}>
      {/* legs */}
      <group ref={legL} position={[-0.19, 0.85, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <boxGeometry args={[0.28, 0.85, 0.28]} />
          <meshLambertMaterial color="#2f3b6b" />
        </mesh>
      </group>
      <group ref={legR} position={[0.19, 0.85, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <boxGeometry args={[0.28, 0.85, 0.28]} />
          <meshLambertMaterial color="#2f3b6b" />
        </mesh>
      </group>

      {/* body */}
      <mesh position={[0, 1.28, 0]}>
        <boxGeometry args={[0.68, 0.9, 0.4]} />
        <meshLambertMaterial color="#ffd23f" />
      </mesh>
      <mesh position={[0, 1.3, -0.3]}>
        <boxGeometry args={[0.5, 0.62, 0.26]} />
        <meshLambertMaterial color="#e63946" />
      </mesh>

      {/* arms */}
      <group ref={armL} position={[-0.46, 1.66, 0]}>
        <mesh position={[0, -0.36, 0]}>
          <boxGeometry args={[0.21, 0.72, 0.21]} />
          <meshLambertMaterial color="#f2d5b8" />
        </mesh>
      </group>
      <group ref={armR} position={[0.46, 1.66, 0]}>
        <mesh position={[0, -0.36, 0]}>
          <boxGeometry args={[0.21, 0.72, 0.21]} />
          <meshLambertMaterial color="#f2d5b8" />
        </mesh>
        <mesh ref={held} position={[0, -0.78, 0.08]}>
          <sphereGeometry args={[0.19, 10, 8]} />
          <meshLambertMaterial color="#3aa7ff" />
        </mesh>
      </group>

      {/* head + cap */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.46]} />
        <meshLambertMaterial color="#f2d5b8" />
      </mesh>
      <mesh position={[0, 2.27, 0]}>
        <boxGeometry args={[0.54, 0.16, 0.52]} />
        <meshLambertMaterial color="#3ddc97" />
      </mesh>
      <mesh position={[0, 2.21, 0.32]}>
        <boxGeometry args={[0.5, 0.08, 0.24]} />
        <meshLambertMaterial color="#2bb87c" />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 2.02, 0.24]}>
          <boxGeometry args={[0.09, 0.11, 0.04]} />
          <meshBasicMaterial color="#25313f" />
        </mesh>
      ))}
    </group>
  )
}
