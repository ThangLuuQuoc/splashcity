import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import { CITY, PALETTE } from '../game/config.js'
import { roadCenter } from '../game/city.js'
import { writeInstances } from './instancing.js'

const SNOW = new Color('#eef4fa')
const DAY_WINDOW = new Color('#bfe7ff')
const LIT_WINDOW = new Color('#ffd98a')
const DARK_WINDOW = new Color('#2b3445')
const tmp = new Color()

const SLAB = CITY.sidewalkHeight
const MAX_WINDOWS = 6000

function buildInstanceLists(city) {
  const slabs = []
  const bodies = []
  const roofs = []
  const windows = []
  const dashes = []
  const trunks = []
  const leaves = []

  // Sidewalk / lot slabs, one per block.
  for (const block of city.blocks) {
    slabs.push({
      x: block.cx, y: SLAB / 2, z: block.cz,
      sx: CITY.blockSize, sy: SLAB, sz: CITY.blockSize,
      color: block.type === 'park' ? '#7fbf6a' : block.type === 'plaza' ? '#ded7c4' : PALETTE.sidewalk,
    })
  }

  // Buildings: a coloured body, a darker roof cap, and a grid of windows.
  for (const b of city.buildings) {
    bodies.push({
      x: b.x, y: SLAB + b.h / 2, z: b.z,
      sx: b.w, sy: b.h, sz: b.d,
      color: b.color,
    })
    roofs.push({
      x: b.x, y: SLAB + b.h + 0.35, z: b.z,
      sx: b.w + 0.6, sy: 0.7, sz: b.d + 0.6,
      color: b.roof,
    })

    if (windows.length < MAX_WINDOWS) {
      const rows = Math.max(1, Math.floor((b.h - 3) / 4.5))
      const colsW = Math.max(1, Math.floor(b.w / 4.5))
      const colsD = Math.max(1, Math.floor(b.d / 4.5))
      for (let r = 0; r < rows; r++) {
        const y = SLAB + 3 + r * 4.5
        if (y > b.h - 1.2) break
        // `lit` decides whether this window glows once it gets dark.
        for (let c = 0; c < colsW; c++) {
          const x = b.x - b.w / 2 + (c + 0.5) * (b.w / colsW)
          windows.push({ x, y, z: b.z + b.d / 2 + 0.06, ry: 0, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
          windows.push({ x, y, z: b.z - b.d / 2 - 0.06, ry: Math.PI, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
        }
        for (let c = 0; c < colsD; c++) {
          const z = b.z - b.d / 2 + (c + 0.5) * (b.d / colsD)
          windows.push({ x: b.x + b.w / 2 + 0.06, y, z, ry: Math.PI / 2, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
          windows.push({ x: b.x - b.w / 2 - 0.06, y, z, ry: -Math.PI / 2, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
        }
      }
    }
  }

  // Dashed centre lines down every road.
  const span = CITY.half + CITY.roadWidth / 2
  for (let i = 0; i <= CITY.blocks; i++) {
    const c = roadCenter(i)
    for (let t = -span; t < span; t += 8) {
      dashes.push({ x: c, y: 0.02, z: t + 2, sx: 0.5, sy: 1, sz: 3.4 })
      dashes.push({ x: t + 2, y: 0.02, z: c, sx: 3.4, sy: 1, sz: 0.5 })
    }
  }

  for (const tree of city.trees) {
    trunks.push({
      x: tree.x, y: SLAB + 1.4 * tree.scale, z: tree.z,
      sx: 1, sy: tree.scale, sz: 1,
    })
    leaves.push({
      x: tree.x, y: SLAB + 3.6 * tree.scale, z: tree.z,
      ry: tree.rot,
      sx: 2.3 * tree.scale, sy: 2.6 * tree.scale, sz: 2.3 * tree.scale,
    })
  }

  return { slabs, bodies, roofs, windows: windows.slice(0, MAX_WINDOWS), dashes, trunks, leaves }
}

function Fountain({ x, z }) {
  return (
    <group position={[x, SLAB, z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.7, 20]} />
        <meshLambertMaterial color="#cfd6dc" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[2.85, 2.85, 0.3, 20]} />
        <meshLambertMaterial color="#57b6e5" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 1.8, 10]} />
        <meshLambertMaterial color="#cfd6dc" />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.75, 12, 10]} />
        <meshLambertMaterial color="#8fd8ff" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

function PoliceStationSign({ city }) {
  const s = city.policeStation
  return (
    <group position={[s.x, SLAB, s.z - 12]}>
      <mesh position={[0, 13.4, 8.2]}>
        <boxGeometry args={[16, 2.2, 0.4]} />
        <meshLambertMaterial color="#1d3557" />
      </mesh>
      <mesh position={[0, 13.4, 8.5]}>
        <boxGeometry args={[2.4, 1.2, 0.2]} />
        <meshBasicMaterial color="#ffd23f" />
      </mesh>
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 13.4, 8.5]}>
          <boxGeometry args={[1.2, 1.2, 0.2]} />
          <meshBasicMaterial color="#e8f1ff" />
        </mesh>
      ))}
    </group>
  )
}

export default function City({ world }) {
  const city = world.city
  const lists = useMemo(() => buildInstanceLists(city), [city])

  const slabRef = useRef()
  const bodyRef = useRef()
  const roofRef = useRef()
  const windowRef = useRef()
  const dashRef = useRef()
  const trunkRef = useRef()
  const leafRef = useRef()

  const groundRef = useRef()
  const roadRef = useRef()
  const lastNight = useRef(-1)
  const lastSnow = useRef(-1)

  useLayoutEffect(() => {
    writeInstances(slabRef.current, lists.slabs)
    writeInstances(bodyRef.current, lists.bodies)
    writeInstances(roofRef.current, lists.roofs)
    writeInstances(windowRef.current, lists.windows)
    writeInstances(dashRef.current, lists.dashes)
    writeInstances(trunkRef.current, lists.trunks)
    writeInstances(leafRef.current, lists.leaves)
    lastNight.current = -1
    lastSnow.current = -1
  }, [lists])

  useFrame(() => {
    const w = world.weather
    if (!w) return

    // Windows glow at night. Rewriting 6000 instance colours is only worth
    // doing when the light has actually moved on.
    const night = w.night
    if (Math.abs(night - lastNight.current) > 0.02 && windowRef.current) {
      lastNight.current = night
      const mesh = windowRef.current
      for (let i = 0; i < lists.windows.length; i++) {
        const target = lists.windows[i].lit ? LIT_WINDOW : DARK_WINDOW
        tmp.copy(DAY_WINDOW).lerp(target, night)
        mesh.setColorAt(i, tmp)
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    // Settled snow whitens the ground, the roads and the sidewalks.
    const cover = w.snowCover
    if (Math.abs(cover - lastSnow.current) > 0.01) {
      lastSnow.current = cover
      if (groundRef.current) {
        groundRef.current.material.color.copy(tmp.set(PALETTE.ground)).lerp(SNOW, cover * 0.9)
      }
      if (roadRef.current) {
        roadRef.current.material.color.copy(tmp.set(PALETTE.road)).lerp(SNOW, cover * 0.75)
      }
      if (slabRef.current) {
        for (let i = 0; i < lists.slabs.length; i++) {
          tmp.set(lists.slabs[i].color).lerp(SNOW, cover * 0.85)
          slabRef.current.setColorAt(i, tmp)
        }
        if (slabRef.current.instanceColor) slabRef.current.instanceColor.needsUpdate = true
      }
      if (roofRef.current) {
        for (let i = 0; i < lists.roofs.length; i++) {
          tmp.set(lists.roofs[i].color).lerp(SNOW, cover * 0.9)
          roofRef.current.setColorAt(i, tmp)
        }
        if (roofRef.current.instanceColor) roofRef.current.instanceColor.needsUpdate = true
      }
    }
  })

  const extent = CITY.extent + CITY.roadWidth

  return (
    <group>
      {/* grass surround + asphalt */}
      {/* Grass stops at the sea wall - beyond it Ocean.jsx takes over with sand
          and then open water, which is where a tsunami comes from. */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshLambertMaterial color={PALETTE.ground} />
      </mesh>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshLambertMaterial color={PALETTE.road} />
      </mesh>

      <instancedMesh ref={dashRef} args={[null, null, lists.dashes.length]}>
        <boxGeometry args={[1, 0.04, 1]} />
        <meshBasicMaterial color={PALETTE.roadLine} />
      </instancedMesh>

      <instancedMesh ref={slabRef} args={[null, null, lists.slabs.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={bodyRef} args={[null, null, lists.bodies.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={roofRef} args={[null, null, lists.roofs.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={windowRef} args={[null, null, lists.windows.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#bfe7ff" />
      </instancedMesh>

      <instancedMesh ref={trunkRef} args={[null, null, lists.trunks.length]}>
        <cylinderGeometry args={[0.28, 0.36, 2.8, 6]} />
        <meshLambertMaterial color="#7a5230" />
      </instancedMesh>

      <instancedMesh ref={leafRef} args={[null, null, lists.leaves.length]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#4f9e4a" flatShading />
      </instancedMesh>

      {city.fountains.map((f, i) => <Fountain key={i} x={f.x} z={f.z} />)}
      <PoliceStationSign city={city} />

      {/* boundary hedge */}
      {city.walls.map((w, i) => (
        <mesh
          key={i}
          position={[(w.minX + w.maxX) / 2, 3, (w.minZ + w.maxZ) / 2]}
        >
          <boxGeometry args={[w.maxX - w.minX, 6, w.maxZ - w.minZ]} />
          <meshLambertMaterial color="#3f7a45" />
        </mesh>
      ))}
    </group>
  )
}
