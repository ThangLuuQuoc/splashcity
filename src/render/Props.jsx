import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color } from 'three'
import { CITY } from '../game/config.js'

const dummy = new Object3D()
const col = new Color()
const SLAB = CITY.sidewalkHeight

// Street furniture. Cones, bins, benches and hydrants all get knocked around by
// cars, so their matrices are rewritten every frame from the physics state.

// Resting height of each prop's origin above the pavement.
const REST_Y = { cone: 0.45, bin: 0.55, bench: 0.4, hydrant: 0.45 }

function useGroup(world, type) {
  return useMemo(
    () => world.props.filter((p) => p.type === type),
    [world, type],
  )
}

function PropGroup({ items, children }) {
  const ref = useRef()
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < items.length; i++) {
      const p = items[i]
      dummy.position.set(p.x, SLAB + REST_Y[p.type] + p.y, p.z)
      dummy.rotation.set(p.tilt || 0, p.rot, (p.tilt || 0) * 0.6)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, col.set(p.color))
    }
    mesh.count = items.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, Math.max(1, items.length)]} frustumCulled={false}>
      {children}
    </instancedMesh>
  )
}

export default function Props({ world }) {
  const cones = useGroup(world, 'cone')
  const bins = useGroup(world, 'bin')
  const benches = useGroup(world, 'bench')
  const hydrants = useGroup(world, 'hydrant')

  return (
    <group>
      <PropGroup items={cones}>
        <coneGeometry args={[0.42, 0.95, 8]} />
        <meshLambertMaterial />
      </PropGroup>
      <PropGroup items={bins}>
        <cylinderGeometry args={[0.42, 0.36, 1.05, 8]} />
        <meshLambertMaterial />
      </PropGroup>
      <PropGroup items={benches}>
        <boxGeometry args={[1.9, 0.75, 0.6]} />
        <meshLambertMaterial />
      </PropGroup>
      <PropGroup items={hydrants}>
        <cylinderGeometry args={[0.22, 0.26, 0.9, 8]} />
        <meshLambertMaterial />
      </PropGroup>
    </group>
  )
}
