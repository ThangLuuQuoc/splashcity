import { useMemo, useRef, useLayoutEffect } from 'react'
import { CanvasTexture, LinearFilter } from 'three'
import { RAIL } from '../game/config.js'
import { writeInstances } from './instancing.js'

const DECK_Y = RAIL.trackY - RAIL.deckThickness / 2
const PILLAR_H = RAIL.trackY - RAIL.deckThickness
const PLATFORM_MID = (RAIL.platformInner + RAIL.platformOuter) / 2
const PLATFORM_DEPTH = RAIL.platformOuter - RAIL.platformInner
const RAMP_LENGTH = Math.hypot(RAIL.rampRun, RAIL.trackY)
const RAMP_ANGLE = Math.atan2(RAIL.trackY, RAIL.rampRun)

function buildLists(rail) {
  const deck = []
  const rails = []
  const pillars = []
  const caps = []
  const beams = []

  for (const seg of rail.deck) {
    const nx = Math.cos(seg.heading)
    const nz = -Math.sin(seg.heading)
    deck.push({
      x: seg.x, y: DECK_Y, z: seg.z, ry: seg.heading,
      sx: RAIL.halfWidth * 2, sy: RAIL.deckThickness, sz: seg.length,
    })
    for (const side of [-1, 1]) {
      rails.push({
        x: seg.x + nx * 1.15 * side,
        y: RAIL.trackY + 0.09,
        z: seg.z + nz * 1.15 * side,
        ry: seg.heading,
        sx: 0.18, sy: 0.18, sz: seg.length,
      })
    }
  }

  for (const p of rail.pillars) {
    pillars.push({
      x: p.x, y: PILLAR_H / 2, z: p.z, ry: p.heading,
      sx: RAIL.pillarHalf * 2, sy: PILLAR_H, sz: RAIL.pillarHalf * 2,
    })
    caps.push({
      x: p.x, y: PILLAR_H - 0.35, z: p.z, ry: p.heading,
      sx: RAIL.pillarHalf * 2.9, sy: 0.7, sz: RAIL.pillarHalf * 2.9,
    })
    // One portal beam per pair, spanning the street between the two pillars.
    if (p.side === -1) {
      beams.push({
        x: p.beamX, y: PILLAR_H - 0.7, z: p.beamZ, ry: p.heading,
        sx: RAIL.pillarOffset * 2 + RAIL.pillarHalf * 2, sy: 1, sz: 1.5,
      })
    }
  }

  return { deck, rails, pillars, caps, beams }
}

function signTexture(name) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#12335c'
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = '#ffd23f'
  ctx.fillRect(0, 0, 512, 8)
  ctx.fillRect(0, 120, 512, 8)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px "Trebuchet MS", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 256, 68)
  const tex = new CanvasTexture(canvas)
  tex.minFilter = LinearFilter
  return tex
}

function Station({ station }) {
  const sign = useMemo(() => signTexture(station.name), [station.name])
  const half = RAIL.platformHalfLength

  return (
    <group position={[station.x, 0, station.z]} rotation={[0, station.yaw, 0]}>
      {/* deck */}
      <mesh position={[0, RAIL.trackY - 0.3, PLATFORM_MID]}>
        <boxGeometry args={[half * 2, 0.6, PLATFORM_DEPTH]} />
        <meshLambertMaterial color="#cdc7b8" />
      </mesh>
      {/* yellow safety line along the track edge */}
      <mesh position={[0, RAIL.trackY + 0.01, RAIL.platformInner + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[half * 2, 0.7]} />
        <meshBasicMaterial color="#ffd23f" />
      </mesh>

      {/* columns holding the outer edge up */}
      {[-12, 12].map((x) => (
        <mesh key={x} position={[x, RAIL.trackY / 2 - 0.3, RAIL.platformOuter - 1]}>
          <boxGeometry args={[1.4, RAIL.trackY - 0.6, 1.4]} />
          <meshLambertMaterial color="#9aa0a8" />
        </mesh>
      ))}

      {/* canopy */}
      <mesh position={[0, RAIL.trackY + 3.5, PLATFORM_MID]}>
        <boxGeometry args={[half * 1.9, 0.3, PLATFORM_DEPTH + 0.8]} />
        <meshLambertMaterial color="#3f6b8f" />
      </mesh>
      {[-half + 2.5, 0, half - 2.5].map((x) => (
        <mesh key={x} position={[x, RAIL.trackY + 1.75, RAIL.platformOuter - 0.8]}>
          <boxGeometry args={[0.3, 3.5, 0.3]} />
          <meshLambertMaterial color="#7e858e" />
        </mesh>
      ))}

      {/* name board hanging under the canopy */}
      <mesh position={[0, RAIL.trackY + 2.6, RAIL.platformOuter - 0.95]}>
        <planeGeometry args={[9, 2.25]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>

      {/* ramp down to the street, with a rail on each side */}
      <group
        position={[0, RAIL.trackY / 2, RAIL.platformOuter + RAIL.rampRun / 2]}
        rotation={[RAMP_ANGLE, 0, 0]}
      >
        <mesh>
          <boxGeometry args={[RAIL.rampHalfWidth * 2, 0.4, RAMP_LENGTH]} />
          <meshLambertMaterial color="#b9b3a5" />
        </mesh>
        {[-RAIL.rampHalfWidth, RAIL.rampHalfWidth].map((x) => (
          <mesh key={x} position={[x, 0.7, 0]}>
            <boxGeometry args={[0.16, 1, RAMP_LENGTH]} />
            <meshLambertMaterial color="#ffd23f" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Rail({ world }) {
  const rail = world.city.rail
  const lists = useMemo(() => buildLists(rail), [rail])

  const deckRef = useRef()
  const railRef = useRef()
  const pillarRef = useRef()
  const capRef = useRef()
  const beamRef = useRef()

  useLayoutEffect(() => {
    writeInstances(deckRef.current, lists.deck)
    writeInstances(railRef.current, lists.rails)
    writeInstances(pillarRef.current, lists.pillars)
    writeInstances(capRef.current, lists.caps)
    writeInstances(beamRef.current, lists.beams)
  }, [lists])

  return (
    <group>
      <instancedMesh ref={deckRef} args={[null, null, lists.deck.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#8f949c" />
      </instancedMesh>
      <instancedMesh ref={railRef} args={[null, null, lists.rails.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#5d6169" />
      </instancedMesh>
      <instancedMesh ref={pillarRef} args={[null, null, lists.pillars.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#a4a9b0" />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[null, null, lists.caps.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#8b9098" />
      </instancedMesh>
      <instancedMesh ref={beamRef} args={[null, null, lists.beams.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#9aa0a8" />
      </instancedMesh>

      {rail.stations.map((s) => <Station key={s.name} station={s} />)}
    </group>
  )
}
