import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color } from 'three'
import { MAX_FOOT_COPS } from '../game/world.js'

const dummy = new Object3D()
const col = new Color()
const wet = new Color('#5fb8e8')

// Blocky little people: two legs, a torso, two arms and a head. Each body part
// is its own InstancedMesh, so the whole crowd is six draw calls and every
// character can still have an independent walk cycle.

function place(mesh, idx, e, lx, ly, lz, swing, sx, sy, sz) {
  const s = Math.sin(e.heading)
  const c = Math.cos(e.heading)
  dummy.position.set(e.x + lx * c + lz * s, e.y + ly, e.z - lx * s + lz * c)
  dummy.rotation.order = 'YXZ'
  dummy.rotation.set(swing, e.heading, 0)
  dummy.scale.set(sx, sy, sz)
  dummy.updateMatrix()
  dummy.rotation.order = 'XYZ'
  mesh.setMatrixAt(idx, dummy.matrix)
}

/** Writes one character into the six part meshes. Returns nothing. */
export function writeCharacter(parts, idx, e, h, colors) {
  const swing = Math.sin(e.phase || e.walkPhase || 0) * 0.75
  const legLen = 0.78 * h
  const armLen = 0.66 * h
  const hipY = 0.8 * h
  const shoulderY = 1.55 * h

  // Legs swing in opposition around the hip joint.
  for (let i = 0; i < 2; i++) {
    const a = i === 0 ? swing : -swing
    place(parts.legs, idx * 2 + i, e,
      i === 0 ? -0.17 : 0.17,
      hipY - (legLen / 2) * Math.cos(a),
      -(legLen / 2) * Math.sin(a),
      a, 0.26, legLen, 0.26)
    parts.legs.setColorAt(idx * 2 + i, col.set(colors.pants))
  }

  for (let i = 0; i < 2; i++) {
    const a = i === 0 ? -swing : swing
    place(parts.arms, idx * 2 + i, e,
      i === 0 ? -0.42 : 0.42,
      shoulderY - (armLen / 2) * Math.cos(a),
      -(armLen / 2) * Math.sin(a),
      a, 0.19, armLen, 0.19)
    parts.arms.setColorAt(idx * 2 + i, col.set(colors.skin))
  }

  place(parts.torso, idx, e, 0, 1.2 * h, 0, 0, 0.62, 0.82 * h, 0.36)
  col.set(colors.shirt)
  if (e.soaked > 0) col.lerp(wet, Math.min(0.7, e.soaked / 6))
  parts.torso.setColorAt(idx, col)

  place(parts.head, idx, e, 0, 1.82 * h, 0, 0, 0.44, 0.44, 0.42)
  parts.head.setColorAt(idx, col.set(colors.skin))
}

export function hideInstance(mesh, idx) {
  dummy.position.set(0, -999, 0)
  dummy.rotation.set(0, 0, 0)
  dummy.scale.set(0.0001, 0.0001, 0.0001)
  dummy.updateMatrix()
  mesh.setMatrixAt(idx, dummy.matrix)
}

const COP_COLORS = { shirt: '#2b4a80', pants: '#1c2b45', skin: '#e0ac82' }

export default function Pedestrians({ world }) {
  const legs = useRef()
  const arms = useRef()
  const torso = useRef()
  const head = useRef()
  const hats = useRef()

  const pedCount = world.peds.length
  const total = pedCount + MAX_FOOT_COPS

  useFrame(() => {
    const parts = {
      legs: legs.current, arms: arms.current,
      torso: torso.current, head: head.current,
    }
    if (!parts.legs || !parts.arms || !parts.torso || !parts.head || !hats.current) return

    for (let i = 0; i < pedCount; i++) {
      const ped = world.peds[i]
      if (ped.indoors) {
        hideInstance(parts.torso, i)
        hideInstance(parts.head, i)
        hideInstance(parts.legs, i * 2)
        hideInstance(parts.legs, i * 2 + 1)
        hideInstance(parts.arms, i * 2)
        hideInstance(parts.arms, i * 2 + 1)
        continue
      }
      writeCharacter(parts, i, ped, ped.height, {
        shirt: ped.shirt, pants: '#3a3f52', skin: ped.skin,
      })
    }

    let hatCount = 0
    for (let i = 0; i < MAX_FOOT_COPS; i++) {
      const cop = world.footCops[i]
      const idx = pedCount + i
      if (!cop.active) {
        hideInstance(parts.torso, idx)
        hideInstance(parts.head, idx)
        hideInstance(parts.legs, idx * 2)
        hideInstance(parts.legs, idx * 2 + 1)
        hideInstance(parts.arms, idx * 2)
        hideInstance(parts.arms, idx * 2 + 1)
        continue
      }
      cop.phase = cop.walkPhase
      writeCharacter(parts, idx, cop, 1.08, COP_COLORS)

      const s = Math.sin(cop.heading)
      const c = Math.cos(cop.heading)
      dummy.position.set(cop.x, cop.y + 2.08, cop.z)
      dummy.rotation.set(0, cop.heading, 0)
      dummy.scale.set(0.5, 0.14, 0.52)
      dummy.updateMatrix()
      hats.current.setMatrixAt(hatCount, dummy.matrix)
      hatCount++
      // Peak of the cap.
      dummy.position.set(cop.x + s * 0.28, cop.y + 2.04, cop.z + c * 0.28)
      dummy.scale.set(0.44, 0.07, 0.2)
      dummy.updateMatrix()
      hats.current.setMatrixAt(hatCount, dummy.matrix)
      hatCount++
    }

    hats.current.count = hatCount
    for (const m of [parts.legs, parts.arms, parts.torso, parts.head, hats.current]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={legs} args={[null, null, total * 2]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={arms} args={[null, null, total * 2]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={torso} args={[null, null, total]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={head} args={[null, null, total]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={hats} args={[null, null, MAX_FOOT_COPS * 2]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#16233d" />
      </instancedMesh>
    </group>
  )
}
