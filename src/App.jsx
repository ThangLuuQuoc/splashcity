import { useMemo, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import { createWorld, resetGame } from './game/world.js'
import { useGame } from './game/store.js'
import GameLoop from './game/GameLoop.jsx'
import { attachInput, requestLock, input } from './game/systems/input.js'
import { unlockAudio, updateSiren } from './game/audio.js'
import { PALETTE } from './game/config.js'

import City from './render/City.jsx'
import Cars from './render/Cars.jsx'
import Pedestrians from './render/Pedestrians.jsx'
import Player from './render/Player.jsx'
import Props from './render/Props.jsx'
import Rail from './render/Rail.jsx'
import Trains from './render/Trains.jsx'
import Atmosphere from './render/Atmosphere.jsx'
import Ocean from './render/Ocean.jsx'
import Disasters from './render/Disasters.jsx'
import { Precipitation, WindDebris } from './render/Precipitation.jsx'
import { Balloons, Splashes, PaintDecals, BlobShadows, SprayBeam } from './render/Effects.jsx'

import HUD from './ui/HUD.jsx'
import StartScreen from './ui/StartScreen.jsx'
import BustedOverlay from './ui/BustedOverlay.jsx'
import TouchControls from './ui/TouchControls.jsx'
import { isTouchDevice, maxPixelRatio } from './game/device.js'
import './ui/ui.css'

function Scene({ world }) {
  return (
    <>
      <Atmosphere world={world} />
      <Ocean world={world} />

      <City world={world} />
      <PaintDecals world={world} />
      <BlobShadows world={world} />
      <Props world={world} />
      <Rail world={world} />
      <Cars world={world} />
      <Pedestrians world={world} />
      <Player world={world} />
      <Trains world={world} />
      <Balloons world={world} />
      <Splashes world={world} />
      <SprayBeam world={world} />
      <Precipitation world={world} />
      <WindDebris world={world} />
      <Disasters world={world} />

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
          // Pointer lock is meaningless on a touchscreen.
          if (world.phase === 'playing' && !touch) requestLock(canvasRef.current)
        }}
      >
        <Scene world={world} />
      </Canvas>

      <HUD world={world} />
      <BustedOverlay />
      {touch && phase === 'playing' && <TouchControls world={world} />}
      {phase === 'menu' && <StartScreen onStart={start} />}
    </>
  )
}
