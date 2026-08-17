import { useMemo, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import { createWorld, resetGame } from './game/world.js'
import { useGame } from './game/store.js'
import GameLoop from './game/GameLoop.jsx'
import { attachInput, requestLock, releaseLock, input, uiCaptured } from './game/systems/input.js'
import { unlockAudio, updateSiren } from './game/audio.js'
import { onLangChange } from './game/i18n.js'
import { buildLandmarks } from './game/landmarks.js'
import { PALETTE } from './game/config.js'

import City from './render/City.jsx'
import Cars from './render/Cars.jsx'
import Helicopter from './render/Helicopter.jsx'
import PoliceHelicopters from './render/PoliceHelicopters.jsx'
import Pedestrians from './render/Pedestrians.jsx'
import Player from './render/Player.jsx'
import Props from './render/Props.jsx'
import Rail from './render/Rail.jsx'
import Trains from './render/Trains.jsx'
import Atmosphere from './render/Atmosphere.jsx'
import Ocean from './render/Ocean.jsx'
import Disasters from './render/Disasters.jsx'
import SupermarketInterior from './render/SupermarketInterior.jsx'
import PoliceInterior from './render/PoliceInterior.jsx'
import { Precipitation, WindDebris } from './render/Precipitation.jsx'
import { Balloons, Splashes, PaintDecals, BlobShadows, SprayBeam, Bananas } from './render/Effects.jsx'

import HUD from './ui/HUD.jsx'
import StartScreen from './ui/StartScreen.jsx'
import BustedOverlay from './ui/BustedOverlay.jsx'
import TouchControls from './ui/TouchControls.jsx'
import PhoneOverlay from './ui/PhoneOverlay.jsx'
import MapOverlay from './ui/MapOverlay.jsx'
import { isTouchDevice, maxPixelRatio } from './game/device.js'
import './ui/ui.css'

function Scene({ world }) {
  const interior = useGame((s) => s.interior)
  const isOutdoor = interior === 'none'

  return (
    <>
      {isOutdoor ? (
        <>
          <Atmosphere world={world} />
          <Ocean world={world} />
          <City world={world} />
          <Props world={world} />
          <Rail world={world} />
          <Cars world={world} />
          <Helicopter world={world} />
          <PoliceHelicopters world={world} />
          <Pedestrians world={world} />
          <Trains world={world} />
          <Precipitation world={world} />
          <WindDebris world={world} />
          <Disasters world={world} />
        </>
      ) : (
        <>
          {/* Chỉ mount đúng toà nhà người chơi đang ở: mọi hook trong component
              interior đều chạy trước câu return null, nên nếu mount cả hai thì vào
              đồn cảnh sát vẫn phải dựng toàn bộ tài nguyên của siêu thị. */}
          <color attach="background" args={['#1a1d24']} />
          {interior === 'supermarket' && <SupermarketInterior world={world} />}
          {interior === 'police_station' && <PoliceInterior world={world} />}
        </>
      )}

      <PaintDecals world={world} />
      <BlobShadows world={world} />
      <Player world={world} />
      <Balloons world={world} />
      <Splashes world={world} />
      <Bananas world={world} />
      <SprayBeam world={world} />

      <GameLoop world={world} />
    </>
  )
}



export default function App() {
  const world = useMemo(() => createWorld(), [])
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const touch = useGame((s) => s.touch)
  const setTouch = useGame((s) => s.setTouch)
  const phoneOpen = useGame((s) => s.phoneOpen)
  const mapOpen = useGame((s) => s.mapOpen)
  const canvasRef = useRef(null)

  // Show the on-screen controls on a tablet immediately, and on a hybrid
  // laptop as soon as someone actually touches the screen.
  useEffect(() => {
    if (isTouchDevice) setTouch(true)
    const onTouch = () => setTouch(true)
    window.addEventListener('touchstart', onTouch, { once: true, passive: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [setTouch])

  useEffect(() => {
    // Expose for quick tuning from the browser console.
    window.world = world
    window.input = input
  }, [world])

  useEffect(() => attachInput(), [])

  // Tên khu vực được dựng một lần lúc tạo world, nên đổi ngôn ngữ phải dựng lại - nếu
  // không thì bản đồ và minimap vẫn hiện tên của ngôn ngữ cũ suốt phiên.
  useEffect(() => onLangChange(() => {
    world.landmarks = buildLandmarks(world.city)
  }), [world])

  // Overlay mở ra là nhả con trỏ chuột ngay. Không có bước này thì con trỏ vẫn bị
  // pointer lock giữ và người chơi phải bấm Esc mới bấm/chọn được trong overlay.
  useEffect(() => {
    if (phoneOpen || mapOpen) releaseLock()
  }, [phoneOpen, mapOpen])

  const start = () => {
    unlockAudio()
    resetGame(world)
    world.phase = 'playing'
    setPhase('playing')
    if (touch) {
      // Browser chrome eats a lot of a tablet screen; this is a user gesture so
      // the request is allowed. Failing is fine - the game just runs windowed.
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      requestLock(canvasRef.current)
    }
  }

  useEffect(() => {
    if (phase !== 'playing') updateSiren(0)
  }, [phase])

  return (
    <>
      <Canvas
        flat
        shadows={false}
        dpr={[1, maxPixelRatio]}
        camera={{ fov: 60, near: 0.4, far: 1800, position: [0, 30, 60] }}
        onCreated={({ gl, scene, camera }) => {
          canvasRef.current = gl.domElement
          gl.setClearColor(PALETTE.sky)
          // Handy for poking at the render state from the browser console.
          window.three = { gl, scene, camera }
        }}
        onPointerDown={() => {
          // Pointer lock is meaningless on a touchscreen, and must not be grabbed
          // back while an overlay needs the cursor.
          if (world.phase === 'playing' && !touch && !uiCaptured(world)) {
            requestLock(canvasRef.current)
          }
        }}
      >
        <Scene world={world} />
      </Canvas>

      <HUD world={world} />
      <BustedOverlay />
      <PhoneOverlay world={world} />
      <MapOverlay world={world} />
      {touch && phase === 'playing' && <TouchControls world={world} />}
      {phase === 'menu' && <StartScreen onStart={start} />}
    </>
  )
}

