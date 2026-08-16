import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color, PlaneGeometry, CircleGeometry } from 'three'
import { ACTIONS, CITY, TRAIN } from '../game/config.js'
import { MAX_BALLOONS, MAX_SPLASHES } from '../game/world.js'

const dummy = new Object3D()
const col = new Color()
const SPLASH_BITS = 8

export function Balloons({ world }) {
  const ref = useRef()
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    let n = 0
    for (let i = 0; i < world.balloons.length; i++) {
      const b = world.balloons[i]
      if (!b.active) continue
      // Squash the balloon along its flight direction so it reads as a lob.
      const speed = Math.hypot(b.vx, b.vy, b.vz)
      dummy.position.set(b.x, b.y, b.z)
      dummy.rotation.set(0, Math.atan2(b.vx, b.vz), 0)
      const stretch = 1 + Math.min(0.5, speed / 90)
      dummy.scale.set(1, 1 / stretch, stretch)
      dummy.updateMatrix()
      mesh.setMatrixAt(n++, dummy.matrix)
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, MAX_BALLOONS]} frustumCulled={false}>
      <sphereGeometry args={[ACTIONS.balloonRadius, 10, 8]} />
      <meshLambertMaterial color="#38b6ff" />
    </instancedMesh>
  )
}

export function Splashes({ world }) {
  const ref = useRef()
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    let n = 0
    for (let i = 0; i < world.splashes.length; i++) {
      const s = world.splashes[i]
      if (!s.active) continue
      const t = s.life / s.max
      const r = ACTIONS.splashRadius * (0.35 + t * 0.85)
      const fade = 1 - t
      for (let b = 0; b < SPLASH_BITS; b++) {
        const a = (b / SPLASH_BITS) * Math.PI * 2 + i
        dummy.position.set(
          s.x + Math.cos(a) * r,
          s.y + Math.sin(t * Math.PI) * 1.6 + (b % 2) * 0.3,
          s.z + Math.sin(a) * r,
        )
        dummy.rotation.set(0, a, 0)
        const sc = 0.42 * fade
        dummy.scale.set(sc, sc, sc)
        dummy.updateMatrix()
        mesh.setMatrixAt(n++, dummy.matrix)
      }
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[null, null, MAX_SPLASHES * SPLASH_BITS]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 5]} />
      <meshLambertMaterial color="#7fd6ff" transparent opacity={0.85} />
    </instancedMesh>
  )
}

export function PaintDecals({ world }) {
  const ref = useRef()
  const written = useRef(0)
  const geo = useMemo(() => new PlaneGeometry(1, 1), [])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const decals = world.decals
    // Only rewrite when the list changed - decals never move once stamped.
    if (!world.decalsDirty && written.current === decals.length) return
    world.decalsDirty = false
    written.current = decals.length

    for (let i = 0; i < decals.length; i++) {
      const d = decals[i]
      dummy.position.set(d.x, d.flat ? CITY.sidewalkHeight + 0.03 : d.y, d.z)
      if (d.flat) dummy.rotation.set(-Math.PI / 2, 0, d.rotY)
      else dummy.rotation.set(0, d.rotY, 0)
      dummy.scale.set(d.size, d.size, d.size)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, col.set(d.color))
    }
    mesh.count = decals.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geo, null, ACTIONS.sprayMaxDecals]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        transparent
        opacity={0.92}
        depthWrite={false}
        side={2}
        polygonOffset
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-8}
      />
    </instancedMesh>
  )
}

/** Cheap round shadows under everything that moves. */
export function BlobShadows({ world }) {
  const ref = useRef()
  const geo = useMemo(() => new CircleGeometry(0.5, 16).rotateX(-Math.PI / 2), [])
  const max = 200

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    let n = 0
    const push = (x, z, size, lift, lengthwise = size, ry = 0) => {
      if (n >= max) return
      dummy.position.set(x, lift + 0.05, z)
      dummy.rotation.set(0, ry, 0)
      dummy.scale.set(size, 1, lengthwise)
      dummy.updateMatrix()
      mesh.setMatrixAt(n++, dummy.matrix)
    }

    for (let i = 0; i < world.cars.length; i++) {
      const c = world.cars[i]
      push(c.x, c.z, 4.4, 0.3)
    }
    for (let i = 0; i < world.police.length; i++) {
      const c = world.police[i]
      if (c.active) push(c.x, c.z, 4.4, 0.3)
    }
    for (let i = 0; i < world.peds.length; i++) {
      const p = world.peds[i]
      push(p.x, p.z, 1.1, 0.3)
    }
    for (let i = 0; i < world.footCops.length; i++) {
      const c = world.footCops[i]
      if (c.active) push(c.x, c.z, 1.2, 0.3)
    }
    if (world.player.mode === 'foot') {
      push(world.player.x, world.player.z, 1.3, world.player.supportY || 0)
    }
    // The elevated train throws a long shadow down onto the street.
    for (let t = 0; t < world.trains.length; t++) {
      const cars = world.trains[t].cars
      for (let c = 0; c < cars.length; c++) {
        const car = cars[c]
        push(car.x, car.z, TRAIN.carWidth * 1.15, 0, TRAIN.carLength * 0.95, car.heading)
      }
    }

    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, null, max]} frustumCulled={false}>
      <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
    </instancedMesh>
  )
}

/** A dotted line showing where the spray will land. */
export function SprayBeam({ world }) {
  const ref = useRef()
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const t = world.sprayTarget
    g.visible = !!t && world.spraying
    if (!t) return
    g.position.set(t.x, t.wall ? 2.0 : CITY.sidewalkHeight + 0.1, t.z)
    g.scale.setScalar(0.9 + Math.sin(world.time * 22) * 0.15)
  })
  return (
    <mesh ref={ref} visible={false}>
      <torusGeometry args={[0.55, 0.09, 6, 14]} />
      <meshBasicMaterial color="#ffd23f" />
    </mesh>
  )
}
