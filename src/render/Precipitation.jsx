import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color } from 'three'
import { WEATHER } from '../game/config.js'

const dummy = new Object3D()
const col = new Color()

// Rain, snow and wind-blown leaves all live in a box that rides along with the
// camera. Particles that fall out of the bottom (or get blown out of the side)
// wrap back around to the top, so a few thousand instances cover the whole city.

// Kept deliberately tight: the same particle budget spread over a smaller
// volume reads as much heavier weather, and you never see the far edge anyway.
const BOX = { w: 110, h: 52, d: 110 }
const RAIN_COLOR = new Color('#a8d5f2')
const SNOW_COLOR = new Color('#ffffff')

function makeParticles(count) {
  const list = new Array(count)
  for (let i = 0; i < count; i++) {
    list[i] = {
      x: (Math.random() - 0.5) * BOX.w,
      y: Math.random() * BOX.h,
      z: (Math.random() - 0.5) * BOX.d,
      speed: 0.7 + Math.random() * 0.6,
      sway: Math.random() * Math.PI * 2,
      swayRate: 0.8 + Math.random() * 1.6,
    }
  }
  return list
}

export function Precipitation({ world }) {
  const ref = useRef()
  const particles = useMemo(() => makeParticles(WEATHER.maxParticles), [])

  useFrame(({ camera }, delta) => {
    const mesh = ref.current
    const w = world.weather
    if (!mesh || !w) return

    const dt = Math.min(delta, 1 / 20)
    const rain = w.params.rain
    const snow = w.params.snow
    const amount = Math.min(1, rain + snow)
    if (amount < 0.01) {
      mesh.count = 0
      return
    }

    const snowy = snow > rain
    // Snow drifts down slowly and is pushed around much more by the wind.
    const fall = snowy ? 7 : 46
    const drift = snowy ? 5.5 : 1.6
    const windX = w.windX * drift
    const windZ = w.windZ * drift

    const cx = camera.position.x
    const cz = camera.position.z

    const active = Math.floor(WEATHER.maxParticles * amount)
    col.copy(snowy ? SNOW_COLOR : RAIN_COLOR)

    // A raindrop is a streak leaning into the wind; a snowflake is a fleck.
    const tilt = Math.atan2(w.windX * 2.2, fall * 0.35)
    const sx = snowy ? 0.17 : 0.05
    const sy = snowy ? 0.17 : 2.4
    const sz = snowy ? 0.17 : 0.05

    for (let i = 0; i < active; i++) {
      const p = particles[i]
      p.y -= fall * p.speed * dt
      p.x += windX * dt
      p.z += windZ * dt
      if (snowy) {
        p.sway += p.swayRate * dt
        p.x += Math.sin(p.sway) * 1.6 * dt
        p.z += Math.cos(p.sway * 0.8) * 1.6 * dt
      }

      // Wrap within the moving box.
      if (p.y < -4) {
        p.y += BOX.h
        p.x = (Math.random() - 0.5) * BOX.w
        p.z = (Math.random() - 0.5) * BOX.d
      }
      const relX = p.x - (cx - Math.round(cx / BOX.w) * BOX.w)
      if (relX > BOX.w / 2) p.x -= BOX.w
      else if (relX < -BOX.w / 2) p.x += BOX.w
      const relZ = p.z - (cz - Math.round(cz / BOX.d) * BOX.d)
      if (relZ > BOX.d / 2) p.z -= BOX.d
      else if (relZ < -BOX.d / 2) p.z += BOX.d

      dummy.position.set(cx + p.x, p.y, cz + p.z)
      dummy.rotation.set(0, 0, snowy ? p.sway : tilt)
      dummy.scale.set(sx, sy, sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.material.color.copy(col)
    mesh.material.opacity = snowy ? 0.92 : 0.68
    mesh.count = active
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[null, null, WEATHER.maxParticles]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.55} depthWrite={false} fog={false} />
    </instancedMesh>
  )
}

/** Leaves and litter tumbling along the street - the cheapest way to show wind. */
export function WindDebris({ world }) {
  const ref = useRef()
  const leaves = useMemo(
    () =>
      Array.from({ length: WEATHER.maxLeaves }, () => ({
        x: (Math.random() - 0.5) * BOX.w,
        y: 0.4 + Math.random() * 7,
        z: (Math.random() - 0.5) * BOX.d,
        spin: Math.random() * Math.PI * 2,
        spinRate: (Math.random() - 0.5) * 9,
        bob: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.8,
      })),
    [],
  )

  useFrame(({ camera }, delta) => {
    const mesh = ref.current
    const w = world.weather
    if (!mesh || !w) return

    const dt = Math.min(delta, 1 / 20)
    const strength = Math.max(0, w.gust - 0.25)
    if (strength < 0.02) {
      mesh.count = 0
      return
    }

    const cx = camera.position.x
    const cz = camera.position.z
    const active = Math.floor(WEATHER.maxLeaves * Math.min(1, strength * 1.4))

    for (let i = 0; i < active; i++) {
      const p = leaves[i]
      p.x += w.windX * 12 * p.speed * dt
      p.z += w.windZ * 12 * p.speed * dt
      p.spin += p.spinRate * dt
      p.bob += dt * 3
      const y = p.y + Math.sin(p.bob) * 0.9

      const relX = p.x - (cx - Math.round(cx / BOX.w) * BOX.w)
      if (relX > BOX.w / 2) p.x -= BOX.w
      else if (relX < -BOX.w / 2) p.x += BOX.w
      const relZ = p.z - (cz - Math.round(cz / BOX.d) * BOX.d)
      if (relZ > BOX.d / 2) p.z -= BOX.d
      else if (relZ < -BOX.d / 2) p.z += BOX.d

      dummy.position.set(cx + p.x, y, cz + p.z)
      dummy.rotation.set(p.spin, p.spin * 0.6, p.spin * 1.3)
      dummy.scale.set(0.42, 0.06, 0.3)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.count = active
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, WEATHER.maxLeaves]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial color="#b5843c" />
    </instancedMesh>
  )
}
