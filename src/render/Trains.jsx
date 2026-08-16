import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Color } from 'three'
import { TRAIN, RAIL } from '../game/config.js'
import { setInstanceCount } from './instancing.js'

const dummy = new Object3D()
const col = new Color()

const LIVERY = ['#2a9d8f', '#e76f51']
const TOTAL = TRAIN.count * TRAIN.cars

const BODY_Y = RAIL.trackY + TRAIN.carHeight / 2
const WINDOW_Y = RAIL.trackY + 1.95
const ROOF_Y = RAIL.trackY + TRAIN.carHeight + 0.12
const SKIRT_Y = RAIL.trackY - 0.3

export default function Trains({ world }) {
  const bodyRef = useRef()
  const windowRef = useRef()
  const roofRef = useRef()
  const skirtRef = useRef()
  const ghostRef = useRef()

  useFrame(() => {
    const body = bodyRef.current
    const win = windowRef.current
    const roof = roofRef.current
    const skirt = skirtRef.current
    const ghost = ghostRef.current
    if (!body || !win || !roof || !skirt || !ghost) return

    const p = world.player
    const riding = p.mode === 'train' ? p : null

    let n = 0
    let ghostCount = 0
    // Draw the carriage the player is inside as a translucent ghost so they can
    // still see their character while riding.
    const stow = (mesh, index) => {
      if (ghostCount < ghost.instanceMatrix.count) ghost.setMatrixAt(ghostCount++, dummy.matrix)
      dummy.scale.set(0.0001, 0.0001, 0.0001)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    for (let t = 0; t < world.trains.length; t++) {
      const train = world.trains[t]
      col.set(LIVERY[t % LIVERY.length])

      for (let c = 0; c < train.cars.length; c++) {
        if (n >= body.instanceMatrix.count) break
        const car = train.cars[c]
        const isRidden = riding && riding.train === t && riding.trainCar === c

        dummy.position.set(car.x, BODY_Y, car.z)
        dummy.rotation.set(0, car.heading, 0)
        dummy.scale.set(TRAIN.carWidth, TRAIN.carHeight, TRAIN.carLength)
        dummy.updateMatrix()
        if (isRidden) stow(body, n)
        else body.setMatrixAt(n, dummy.matrix)
        body.setColorAt(n, col)

        dummy.position.set(car.x, WINDOW_Y, car.z)
        dummy.scale.set(TRAIN.carWidth + 0.06, 1.05, TRAIN.carLength * 0.88)
        dummy.updateMatrix()
        win.setMatrixAt(n, dummy.matrix)

        dummy.position.set(car.x, ROOF_Y, car.z)
        dummy.scale.set(TRAIN.carWidth * 0.86, 0.35, TRAIN.carLength * 0.94)
        dummy.updateMatrix()
        if (isRidden) stow(roof, n)
        else roof.setMatrixAt(n, dummy.matrix)

        // A skirt under the floor hides the gap down to the deck.
        dummy.position.set(car.x, SKIRT_Y, car.z)
        dummy.scale.set(TRAIN.carWidth * 0.72, 0.66, TRAIN.carLength * 0.8)
        dummy.updateMatrix()
        skirt.setMatrixAt(n, dummy.matrix)

        n++
      }
    }

    for (const m of [body, win, roof, skirt]) {
      setInstanceCount(m, n)
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    setInstanceCount(ghost, ghostCount)
    ghost.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={skirtRef} args={[null, null, TOTAL]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#33383f" />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[null, null, TOTAL]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      {/* Windows are see-through so you can spot the rider inside. */}
      <instancedMesh ref={windowRef} args={[null, null, TOTAL]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#cdeeff" transparent opacity={0.42} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[null, null, TOTAL]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#e8ecf1" />
      </instancedMesh>
      <instancedMesh ref={ghostRef} args={[null, null, 2]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#dff3f0" transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
