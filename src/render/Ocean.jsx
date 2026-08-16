import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial, Color, DoubleSide } from 'three'
import { CITY, OCEAN } from '../game/config.js'

// The city is an island: grass out to the sea wall, a sand ring, then open
// water. The water is a single big plane with the waves done in the shader -
// cheaper than moving vertices on the CPU, and it gives the tsunami somewhere
// to come from.

const EDGE = CITY.half + CITY.roadWidth / 2
const SAND_HALF = EDGE + OCEAN.beachWidth

export default function Ocean({ world }) {
  const matRef = useRef()

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uShallow: { value: new Color('#4fb3d9') },
          uDeep: { value: new Color('#16617f') },
          uFoam: { value: new Color('#dff6ff') },
          uSurge: { value: 0 }, // rises as a tsunami is drawn out of the sea
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSurge;
          varying vec2 vPos;
          varying float vWave;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            // Two crossing swells plus a fine ripple.
            float w =
              sin(world.x * 0.018 + uTime * 1.1) * 0.9 +
              sin(world.z * 0.023 - uTime * 0.8) * 0.7 +
              sin((world.x + world.z) * 0.05 + uTime * 2.1) * 0.25;
            w *= 1.0 + uSurge * 2.5;
            world.y += w;
            vWave = w;
            vPos = world.xz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          uniform vec3 uShallow;
          uniform vec3 uDeep;
          uniform vec3 uFoam;
          varying vec2 vPos;
          varying float vWave;
          void main() {
            // Shallower (lighter) near the island, deeper further out.
            float dist = length(vPos) / 900.0;
            vec3 c = mix(uShallow, uDeep, clamp(dist, 0.0, 1.0));
            // White water on the crests.
            c = mix(c, uFoam, smoothstep(1.1, 1.9, vWave));
            gl_FragColor = vec4(c, 0.92);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    const d = world.disaster
    // The sea heaves before a tsunami and stays choppy while it crosses.
    const surge = d && d.type === 'tsunami' ? d.intensity : 0
    u.uSurge.value += (surge - u.uSurge.value) * Math.min(1, delta * 2)
  })

  return (
    <group>
      {/* open water, well below street level so the shore reads as a drop */}
      <mesh
        ref={matRef}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, OCEAN.waterY, 0]}
        frustumCulled={false}
      >
        <planeGeometry args={[OCEAN.extent, OCEAN.extent, 120, 120]} />
      </mesh>

      {/* sand ring between the sea wall and the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[SAND_HALF * 2, SAND_HALF * 2]} />
        <meshLambertMaterial color="#e6d9a8" />
      </mesh>
    </group>
  )
}
