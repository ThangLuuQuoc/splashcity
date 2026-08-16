import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BackSide, ShaderMaterial, Color, Fog, BufferGeometry,
  BufferAttribute, AdditiveBlending,
} from 'three'
import { smoothstep } from '../game/weather.js'

// Sky, sun, moon, stars, the three lights and the fog - all driven from
// world.weather every frame. Keeping them in one component means the sky and
// the light that falls on the city can never drift out of agreement.

const RADIUS = 900

// Palettes are keyed by time of day; cloud cover then desaturates towards grey
// and a storm pushes the whole thing darker.
const PALETTE = {
  nightTop: new Color('#070d20'),
  nightMid: new Color('#152442'),
  nightBottom: new Color('#26374f'),
  dayTop: new Color('#2f8fdd'),
  dayMid: new Color('#9fd8f5'),
  dayBottom: new Color('#e8f6ff'),
  duskTop: new Color('#31408c'),
  duskMid: new Color('#e2794a'),
  duskBottom: new Color('#ffce8a'),
  overcastTop: new Color('#6b7480'),
  overcastMid: new Color('#98a1ac'),
  overcastBottom: new Color('#b9c0c8'),
  stormTop: new Color('#2c3138'),
  stormMid: new Color('#454c55'),
  stormBottom: new Color('#5c646e'),
  sunDay: new Color('#fff4dd'),
  sunDusk: new Color('#ff9d55'),
  moon: new Color('#c9d8ff'),
}

const tmpTop = new Color()
const tmpMid = new Color()
const tmpBottom = new Color()
const tmpSun = new Color()
const tmpGlow = new Color()

function starField(count) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    // Upper hemisphere only - nobody can see stars through the pavement.
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * 0.92 + 0.06
    const r = RADIUS * 0.94
    positions[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r
    positions[i * 3 + 1] = v * r
    positions[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r
    sizes[i] = 1.5 + Math.random() * 4.5
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1))
  return geo
}

export default function Atmosphere({ world }) {
  const { scene } = useThree()
  const sunRef = useRef()
  const moonRef = useRef()
  const starsRef = useRef()
  const keyRef = useRef()
  const fillRef = useRef()
  const hemiRef = useRef()
  const ambientRef = useRef()

  const skyMaterial = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new Color('#2f8fdd') },
          uMid: { value: new Color('#9fd8f5') },
          uBottom: { value: new Color('#e8f6ff') },
          uSunDir: { value: [0, 1, 0] },
          uGlow: { value: new Color('#ffb066') },
          uGlowStrength: { value: 0 },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vDir = normalize(world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uMid;
          uniform vec3 uBottom;
          uniform vec3 uGlow;
          uniform vec3 uSunDir;
          uniform float uGlowStrength;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -1.0, 1.0);
            vec3 c = h > 0.0
              ? mix(uMid, uTop, pow(h, 0.65))
              : mix(uMid, uBottom, pow(-h, 0.5));
            float d = max(0.0, dot(normalize(vDir), normalize(uSunDir)));
            c += uGlow * pow(d, 5.0) * uGlowStrength;
            gl_FragColor = vec4(c, 1.0);
            // Uniform colours arrive in linear space; without this the sky is
            // written raw into an sRGB buffer and comes out far too dark.
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )

  const starGeometry = useMemo(() => starField(700), [])
  const starMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: `
          attribute float aSize;
          varying float vSize;
          void main() {
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying float vSize;
          void main() {
            vec2 d = gl_PointCoord - vec2(0.5);
            float a = smoothstep(0.5, 0.1, length(d));
            gl_FragColor = vec4(vec3(1.0, 0.98, 0.92), a * uOpacity);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )

  const fog = useMemo(() => new Fog('#9fd8f5', 260, 700), [])
  useLayoutEffect(() => {
    scene.fog = fog
    return () => { scene.fog = null }
  }, [scene, fog])

  useFrame(({ camera }) => {
    const w = world.weather
    if (!w) return

    const { cloud, lightning } = w.params
    const storm = Math.min(1, lightning + Math.max(0, cloud - 0.85) * 4)
    const flash = w.flash * w.flash // sharper falloff than the linear timer

    // --- sky gradient ----------------------------------------------------
    // Night -> dusk -> day, then greyed out by cloud and darkened by storm.
    tmpTop.copy(PALETTE.nightTop).lerp(PALETTE.duskTop, w.twilight).lerp(PALETTE.dayTop, w.day)
    tmpMid.copy(PALETTE.nightMid).lerp(PALETTE.duskMid, w.twilight).lerp(PALETTE.dayMid, w.day)
    tmpBottom.copy(PALETTE.nightBottom).lerp(PALETTE.duskBottom, w.twilight).lerp(PALETTE.dayBottom, w.day)

    const overcast = cloud * (0.35 + 0.65 * w.day)
    tmpTop.lerp(PALETTE.overcastTop, overcast).lerp(PALETTE.stormTop, storm * 0.8)
    tmpMid.lerp(PALETTE.overcastMid, overcast).lerp(PALETTE.stormMid, storm * 0.8)
    tmpBottom.lerp(PALETTE.overcastBottom, overcast).lerp(PALETTE.stormBottom, storm * 0.8)

    if (flash > 0.001) {
      tmpTop.lerp(PALETTE.dayBottom, flash * 0.85)
      tmpMid.lerp(PALETTE.dayBottom, flash * 0.85)
      tmpBottom.lerp(PALETTE.dayBottom, flash * 0.85)
    }

    const u = skyMaterial.uniforms
    u.uTop.value.copy(tmpTop)
    u.uMid.value.copy(tmpMid)
    u.uBottom.value.copy(tmpBottom)
    u.uSunDir.value[0] = w.sunX
    u.uSunDir.value[1] = w.sunY
    u.uSunDir.value[2] = w.sunZ
    tmpGlow.copy(PALETTE.sunDusk).lerp(PALETTE.sunDay, w.day)
    u.uGlow.value.copy(tmpGlow)
    u.uGlowStrength.value = (0.25 + w.twilight * 1.5) * (1 - cloud * 0.85) * w.day

    // --- sun, moon, stars -------------------------------------------------
    const sunVisible = w.sunHeight > -0.12
    if (sunRef.current) {
      sunRef.current.visible = sunVisible && cloud < 0.9
      sunRef.current.position.set(w.sunX * 700, w.sunY * 700, w.sunZ * 700)
      tmpSun.copy(PALETTE.sunDusk).lerp(PALETTE.sunDay, smoothstep(0.05, 0.35, w.sunHeight))
      sunRef.current.material.color.copy(tmpSun)
      sunRef.current.material.opacity = (1 - cloud) * smoothstep(-0.12, 0.05, w.sunHeight)
    }
    if (moonRef.current) {
      moonRef.current.visible = w.night > 0.05 && cloud < 0.85
      moonRef.current.position.set(-w.sunX * 700, -w.sunY * 700, -w.sunZ * 700)
      moonRef.current.material.opacity = w.night * (1 - cloud)
    }
    starMaterial.uniforms.uOpacity.value = w.night * (1 - cloud) * (1 - flash)
    if (starsRef.current) starsRef.current.visible = starMaterial.uniforms.uOpacity.value > 0.01

    // --- lights -----------------------------------------------------------
    const sunUp = Math.max(0, w.sunHeight)
    const clearSky = 1 - cloud * 0.78
    const keyIntensity = (0.18 + 1.5 * sunUp) * clearSky
    if (keyRef.current) {
      keyRef.current.position.set(w.sunX * 160, Math.max(12, w.sunY * 160), w.sunZ * 160 + 40)
      keyRef.current.intensity = keyIntensity + flash * 2.6
      keyRef.current.color.copy(tmpSun)
    }
    if (fillRef.current) fillRef.current.intensity = 0.14 + 0.22 * w.day
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.28 + 0.85 * w.day * (1 - cloud * 0.35) + flash * 1.2
      hemiRef.current.color.copy(tmpMid)
      hemiRef.current.groundColor.copy(tmpBottom).multiplyScalar(0.45)
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.18 + 0.24 * w.day + cloud * 0.12 + flash * 0.9
    }

    // --- fog ---------------------------------------------------------------
    fog.color.copy(tmpMid)
    const reach = w.params.fog
    fog.near = 90 + 190 * reach
    fog.far = 240 + 520 * reach

    // The dome and the stars ride with the camera so they never clip.
    if (starsRef.current) starsRef.current.position.copy(camera.position)
  })

  return (
    <group>
      <mesh material={skyMaterial} frustumCulled={false} renderOrder={-2}>
        <sphereGeometry args={[RADIUS, 24, 16]} />
      </mesh>

      <points
        ref={starsRef}
        geometry={starGeometry}
        material={starMaterial}
        frustumCulled={false}
        renderOrder={-1}
      />

      <mesh ref={sunRef} frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[26, 16, 12]} />
        <meshBasicMaterial color="#fff4dd" transparent depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={moonRef} frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[17, 16, 12]} />
        <meshBasicMaterial color="#c9d8ff" transparent depthWrite={false} fog={false} />
      </mesh>

      <directionalLight ref={keyRef} position={[90, 140, 60]} intensity={1.5} />
      <directionalLight ref={fillRef} position={[-70, 60, -50]} intensity={0.35} />
      <hemisphereLight ref={hemiRef} args={['#dff0ff', '#7d8a63', 1.15]} />
      <ambientLight ref={ambientRef} intensity={0.35} />
    </group>
  )
}
