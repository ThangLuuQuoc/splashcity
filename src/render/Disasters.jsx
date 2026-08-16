import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, ShaderMaterial, Color, DoubleSide } from 'three'
import { DISASTER, CITY } from '../game/config.js'

const dummy = new Object3D()
const EDGE = CITY.half + CITY.roadWidth / 2
const DEBRIS_COUNT = 150

// --- tornado -------------------------------------------------------------

function useFunnelMaterial() {
  return useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uTop: { value: new Color('#8f97a6') },
          uBottom: { value: new Color('#4a5260') },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vH;
          void main() {
            vUv = uv;
            vH = uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec2 vUv;
          varying float vH;
          void main() {
            // Diagonal bands scrolling upward read as the funnel spinning.
            float bands = sin((vUv.x * 22.0) + (vUv.y * 9.0) - uTime * 9.0);
            float a = (0.30 + 0.30 * smoothstep(-0.2, 0.9, bands));
            // Denser at the base, wispy at the top.
            a *= mix(1.0, 0.35, vH) * uOpacity;
            vec3 c = mix(uBottom, uTop, vH);
            gl_FragColor = vec4(c, a);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )
}

function Tornado({ world }) {
  const groupRef = useRef()
  const debrisRef = useRef()
  const material = useFunnelMaterial()

  const debris = useMemo(
    () =>
      Array.from({ length: DEBRIS_COUNT }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 3 + Math.random() * 26,
        height: Math.random() * 46,
        speed: 1.4 + Math.random() * 2.2,
        rise: 3 + Math.random() * 9,
        spin: Math.random() * Math.PI,
      })),
    [],
  )

  useFrame((_, delta) => {
    const d = world.disaster
    const g = groupRef.current
    const mesh = debrisRef.current
    if (!g || !mesh) return

    const showing = d.type === 'tornado' && d.phase !== 'idle'
    g.visible = showing
    if (!showing) {
      mesh.count = 0
      return
    }

    const dt = Math.min(delta, 1 / 20)
    material.uniforms.uTime.value += dt
    material.uniforms.uOpacity.value = d.intensity

    g.position.set(d.x, 0, d.z)
    g.rotation.y = d.spin * 0.4
    g.scale.setScalar(0.45 + 0.55 * d.intensity)

    // Debris spirals up and around the funnel.
    let n = 0
    for (let i = 0; i < debris.length; i++) {
      const p = debris[i]
      p.angle += p.speed * dt
      p.height += p.rise * dt
      if (p.height > 48) {
        p.height = 0
        p.radius = 3 + Math.random() * 26
      }
      // Tighter near the ground, flaring out higher up.
      const r = p.radius * (0.35 + (p.height / 48) * 0.9)
      dummy.position.set(
        d.x + Math.cos(p.angle) * r,
        1 + p.height,
        d.z + Math.sin(p.angle) * r,
      )
      dummy.rotation.set(p.angle, p.spin + p.angle * 2, p.angle * 0.5)
      const s = 0.55 * d.intensity
      dummy.scale.set(s, s * 0.35, s * 0.8)
      dummy.updateMatrix()
      mesh.setMatrixAt(n++, dummy.matrix)
    }
    mesh.count = Math.min(n, mesh.instanceMatrix.count)
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <group ref={groupRef} visible={false}>
        <mesh material={material} position={[0, 26, 0]} frustumCulled={false}>
          <cylinderGeometry args={[16, 3.5, 52, 24, 1, true]} />
        </mesh>
        {/* debris cloud kicked up where it touches down */}
        <mesh material={material} position={[0, 2, 0]} frustumCulled={false}>
          <cylinderGeometry args={[9, 12, 5, 20, 1, true]} />
        </mesh>
      </group>

      <instancedMesh ref={debrisRef} args={[null, null, DEBRIS_COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#7c6a55" />
      </instancedMesh>
    </group>
  )
}

// --- tsunami -------------------------------------------------------------

function Tsunami({ world }) {
  const wallRef = useRef()
  const foamRef = useRef()
  const floodRef = useRef()

  const waveMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uWater: { value: new Color('#2b8fbd') },
          uFoam: { value: new Color('#eafaff') },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uWater;
          uniform vec3 uFoam;
          varying vec2 vUv;
          void main() {
            // Churning foam along the top of the wall of water.
            float churn = sin(vUv.x * 40.0 + uTime * 6.0) * 0.5
                        + sin(vUv.x * 17.0 - uTime * 3.4) * 0.5;
            float foam = smoothstep(0.55, 1.0, vUv.y + churn * 0.12);
            vec3 c = mix(uWater, uFoam, foam);
            // Nearly solid at the base, thinning towards the spray on top.
            gl_FragColor = vec4(c, uOpacity * mix(0.99, 0.72, vUv.y));
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )

  useFrame((_, delta) => {
    const d = world.disaster
    const wall = wallRef.current
    const foam = foamRef.current
    const flood = floodRef.current
    if (!wall || !foam || !flood) return

    waveMaterial.uniforms.uTime.value += Math.min(delta, 1 / 20)

    const active = d.type === 'tsunami' && (d.phase === 'active' || d.phase === 'receding')
    wall.visible = active
    foam.visible = active

    if (active) {
      const W = DISASTER.tsunami
      const crest = -EDGE - W.thickness + d.front
      const yaw = Math.atan2(d.dirX, d.dirZ)
      const height = W.crest * d.intensity

      wall.position.set(d.dirX * crest, height / 2, d.dirZ * crest)
      wall.rotation.y = yaw
      wall.scale.set(1, Math.max(0.05, height), 1)
      waveMaterial.uniforms.uOpacity.value = d.intensity

      // A flatter sheet of churn trailing the crest.
      foam.position.set(
        d.dirX * (crest - W.thickness / 2),
        0.35,
        d.dirZ * (crest - W.thickness / 2),
      )
      foam.rotation.y = yaw
    }

    // Standing water covers only what the wave has already crossed, so the
    // flood chases the crest inland instead of appearing everywhere at once.
    const depth = d.flood
    const covered = d.type === 'tsunami' ? Math.max(0, d.front) : 0
    flood.visible = depth > 0.02 && covered > 1
    if (flood.visible) {
      const W = DISASTER.tsunami
      const yaw = Math.atan2(d.dirX, d.dirZ)
      const midAlong = -EDGE - W.thickness + covered / 2
      flood.parent.rotation.y = yaw
      flood.position.set(0, 0.12 + depth * 0.45, midAlong)
      flood.scale.set(EDGE * 3, covered, 1)
      flood.material.opacity = 0.4 * depth
    }
  })

  return (
    <group>
      {/* the wall of water itself - a unit-tall plane scaled by wave height */}
      <mesh ref={wallRef} material={waveMaterial} visible={false} frustumCulled={false}>
        <planeGeometry args={[EDGE * 3, 1, 60, 1]} />
      </mesh>

      <mesh ref={foamRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[EDGE * 3, DISASTER.tsunami.thickness]} />
        <meshBasicMaterial color="#cfeeff" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Wrapped so the parent carries the wave's heading and the mesh itself
          just scales along its local Z as the water spreads inland. */}
      <group>
        <mesh ref={floodRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#5cb4dd" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

export default function Disasters({ world }) {
  return (
    <group>
      <Tornado world={world} />
      <Tsunami world={world} />
    </group>
  )
}
