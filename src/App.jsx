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
import { Precipitation, WindDebris } from './render/Precipitation.jsx'
import { Balloons, Splashes, PaintDecals, BlobShadows, SprayBeam } from './render/Effects.jsx'

import HUD from './ui/HUD.jsx'
import StartScreen from './ui/StartScreen.jsx'
import BustedOverlay from './ui/BustedOverlay.jsx'
import './ui/ui.css'

function Scene({ world }) {
  return (
    <>
      <Atmosphere world={world} />

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

      <GameLoop world={world} />
    </>
  )
}

export default function App() {
  const world = useMemo(() => createWorld(), [])
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const canvasRef = useRef(null)

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
    requestLock(canvasRef.current)
  }

  useEffect(() => {
    if (phase !== 'playing') updateSiren(0)
  }, [phase])

  return (
    <>
      <Canvas
        flat
        shadows={false}
        dpr={[1, 1.75]}
        camera={{ fov: 60, near: 0.4, far: 1800, position: [0, 30, 60] }}
        onCreated={({ gl, scene, camera }) => {
          canvasRef.current = gl.domElement
          gl.setClearColor(PALETTE.sky)
          // Handy for poking at the render state from the browser console.
          window.three = { gl, scene, camera }
        }}
        onPointerDown={() => {
          if (world.phase === 'playing') requestLock(canvasRef.current)
        }}
      >
        <Scene world={world} />
      </Canvas>

      <HUD world={world} />
      <BustedOverlay />
      {phase === 'menu' && <StartScreen onStart={start} />}
    </>
  )
}
