import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color, CylinderGeometry } from 'three'
import { MAX_POLICE } from '../game/world.js'
import { setInstanceCount } from './instancing.js'

const dummy = new Object3D()
const col = new Color()
const soakedColor = new Color('#5fb8e8')

// A car is four stacked boxes plus four wheels: body, glass band, roof, and a
// lightbar for the police. Everything is instanced, so the whole traffic system
// costs five draw calls.
const RIDE = 0.35 // sidewalk slab height - everything sits on top of it
const WHEEL_R = 0.44
const BODY = { w: 1.78, h: 0.72, l: 4.4, y: RIDE + 0.62 }
const GLASS = { w: 1.6, h: 0.46, l: 2.15, y: RIDE + 1.21 }
const ROOF = { w: 1.6, h: 0.22, l: 1.8, y: RIDE + 1.55 }
const LIGHT_Y = RIDE + 1.75

function collect(world, out) {
  out.length = 0
  for (let i = 0; i < world.cars.length; i++) out.push(world.cars[i])
  for (let i = 0; i < world.police.length; i++) {
    if (world.police[i].active) out.push(world.police[i])
  }
  return out
}

export default function Cars({ world }) {
  const bodyRef = useRef()
  const glassRef = useRef()
  const roofRef = useRef()
  const wheelRef = useRef()
  const lightRef = useRef()
  const lampRef = useRef()
  const list = useRef([])

  const total = world.cars.length + MAX_POLICE
  const wheelGeo = useMemo(
    () => new CylinderGeometry(WHEEL_R, WHEEL_R, 0.36, 10).rotateZ(Math.PI / 2),
    [],
  )

  useFrame(() => {
    const cars = collect(world, list.current)
    const body = bodyRef.current
    const glass = glassRef.current
    const roof = roofRef.current
    const wheels = wheelRef.current
    const lights = lightRef.current
    const lamps = lampRef.current
    if (!body || !glass || !roof || !wheels || !lights || !lamps) return

    let lightCount = 0
    let lampCount = 0
    // Everyone switches their lights on after dusk or in a downpour.
    const w = world.weather
    const headlightsOn = w
      ? w.night > 0.35 || w.params.rain + w.params.snow > 0.5 || w.params.cloud > 0.9
      : false

    for (let i = 0; i < cars.length; i++) {
      if (i >= body.instanceMatrix.count) break
      const c = cars[i]
      const isCop = c.sirenPhase !== undefined
      const s = Math.sin(c.heading)
      const cs = Math.cos(c.heading)

      // Body colour, tinted blue while the car is still dripping.
      col.set(isCop ? '#f4f6fa' : c.color)
      if (c.soaked > 0) col.lerp(soakedColor, Math.min(0.65, c.soaked / 8))

      dummy.position.set(c.x, BODY.y, c.z)
      dummy.rotation.set(0, c.heading, 0)
      dummy.scale.set(BODY.w, BODY.h, BODY.l)
      dummy.updateMatrix()
      body.setMatrixAt(i, dummy.matrix)
      body.setColorAt(i, col)

      // The cabin sits slightly back from centre, like a real three-box car.
      const backX = c.x - s * 0.28
      const backZ = c.z - cs * 0.28

      dummy.position.set(backX, GLASS.y, backZ)
      dummy.scale.set(GLASS.w, GLASS.h, GLASS.l)
      dummy.updateMatrix()
      glass.setMatrixAt(i, dummy.matrix)

      dummy.position.set(backX, ROOF.y, backZ)
      dummy.scale.set(ROOF.w, ROOF.h, ROOF.l)
      dummy.updateMatrix()
      roof.setMatrixAt(i, dummy.matrix)
      roof.setColorAt(i, col)

      for (let w = 0; w < 4; w++) {
        const lx = w % 2 === 0 ? -0.92 : 0.92
        const lz = w < 2 ? 1.4 : -1.4
        dummy.position.set(c.x + lx * cs + lz * s, RIDE + WHEEL_R, c.z - lx * s + lz * cs)
        dummy.rotation.order = 'YXZ'
        dummy.rotation.set(c.wheelSpin || 0, c.heading + (w < 2 ? (c.steer || 0) * 0.35 : 0), 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        dummy.rotation.order = 'XYZ'
        wheels.setMatrixAt(i * 4 + w, dummy.matrix)
      }

      if (headlightsOn) {
        for (let h = 0; h < 4; h++) {
          const front = h < 2
          const side = h % 2 === 0 ? -0.62 : 0.62
          const nose = front ? 2.15 : -2.15
          dummy.position.set(
            c.x + side * cs + nose * s,
            RIDE + 0.75,
            c.z - side * s + nose * cs,
          )
          dummy.rotation.set(0, c.heading, 0)
          dummy.scale.set(0.42, 0.24, 0.12)
          dummy.updateMatrix()
          lamps.setMatrixAt(lampCount, dummy.matrix)
          lamps.setColorAt(lampCount, col.set(front ? '#fff6d5' : '#ff4436'))
          lampCount++
        }
      }

      if (isCop) {
        const blink = Math.sin((c.sirenPhase || 0) * 9) > 0
        for (let b = 0; b < 2; b++) {
          const side = b === 0 ? -0.32 : 0.32
          dummy.position.set(backX + side * cs, LIGHT_Y, backZ - side * s)
          dummy.rotation.set(0, c.heading, 0)
          dummy.scale.set(0.36, 0.18, 0.34)
          dummy.updateMatrix()
          lights.setMatrixAt(lightCount, dummy.matrix)
          lights.setColorAt(lightCount, col.set((b === 0) === blink ? '#ff2d4b' : '#2d6cff'))
          lightCount++
        }
      }
    }

    setInstanceCount(body, cars.length)
    setInstanceCount(glass, cars.length)
    setInstanceCount(roof, cars.length)
    setInstanceCount(wheels, cars.length * 4)
    setInstanceCount(lights, lightCount)
    setInstanceCount(lamps, lampCount)

    for (const m of [body, glass, roof, wheels, lights, lamps]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[null, null, total]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={glassRef} args={[null, null, total]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#2c3a4d" />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[null, null, total]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={wheelRef} args={[wheelGeo, null, total * 4]} frustumCulled={false}>
        <meshLambertMaterial color="#22262e" />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[null, null, MAX_POLICE * 2]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[null, null, total * 4]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
