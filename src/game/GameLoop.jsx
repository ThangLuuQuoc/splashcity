import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame } from './store.js'
import { respawnPlayer } from './world.js'
import { updatePlayer, updateCamera, cameraTarget } from './systems/player.js'
import { updateTraffic } from './systems/traffic.js'
import { updateTrains } from './systems/train.js'
import { updateWeather, cycleWeather, skipTimePhase } from './systems/weather.js'
import { updateDisasters, triggerDisaster } from './systems/disasters.js'
import { keyPressed } from './systems/input.js'
import { updatePedestrians, carsVersusPedestrians } from './systems/pedestrians.js'
import { resolveVehicleCollisions, updateProps } from './systems/physics.js'
import { updateActions, updatePrompt } from './systems/actions.js'
import { updateProjectiles } from './systems/projectiles.js'
import { updatePolice, clearPolice } from './systems/police.js'
import { updateHeat } from './systems/heat.js'
import { endFrame } from './systems/input.js'
import { updateSiren } from './audio.js'

const BUSTED_DURATION = 3.2

// The single simulation tick. Systems run in a fixed order every frame and the
// HUD store is only touched when a displayed value actually changes.
export default function GameLoop({ world }) {
  const { camera } = useThree()
  const sync = useGame((s) => s.sync)
  const setPhase = useGame((s) => s.setPhase)
  const setBusted = useGame((s) => s.setBusted)
  const mirror = useRef({ score: -1, stars: -1, ammo: -1, prompt: '', cooling: false })
  const syncTimer = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)

    // The sky keeps moving in every phase, so the menu and the busted screen
    // are never lit differently from the game behind them.
    updateWeather(world, dt)

    if (world.phase === 'menu') {
      // Slow orbit over the plaza behind the title screen.
      world.time += dt
      const r = 46
      const a = world.time * 0.12
      camera.position.set(
        world.city.plaza.x + Math.cos(a) * r,
        26,
        world.city.plaza.z + Math.sin(a) * r,
      )
      camera.lookAt(world.city.plaza.x, 4, world.city.plaza.z)
      endFrame()
      return
    }

    if (world.phase === 'busted') {
      world.bustedTimer += dt
      updateSiren(0)
      // Keep the world alive but drift the camera up and back.
      const t = cameraTarget(world)
      camera.position.lerp({ x: t.x, y: t.y + world.bustedTimer * 2.5, z: t.z }, 0.05)
      camera.lookAt(t.lookX, t.lookY, t.lookZ)
      if (world.bustedTimer >= BUSTED_DURATION) {
        respawnPlayer(world, true)
        clearPolice(world)
        world.phase = 'playing'
        setPhase('playing')
        setBusted(null)
      }
      endFrame()
      return
    }

    world.time += dt

    if (keyPressed('KeyC')) cycleWeather(world)
    if (keyPressed('KeyN')) skipTimePhase(world)
    if (keyPressed('KeyT')) triggerDisaster(world, 'tornado')
    if (keyPressed('KeyY')) triggerDisaster(world, 'tsunami')

    updateCamera(world, dt)
    // Trains move before the player so a rider is carried by this frame's
    // position rather than lagging one frame behind the carriage.
    updateTrains(world, dt)
    updatePlayer(world, dt)
    updateTraffic(world, dt)
    updatePedestrians(world, dt)
    resolveVehicleCollisions(world, dt)
    carsVersusPedestrians(world, dt)
    updateProps(world, dt)
    updateActions(world, dt)
    updateProjectiles(world, dt)
    // Runs after the movement systems so it has the last word on where
    // everything ends up when it is throwing the city around.
    updateDisasters(world, dt)
    updatePolice(world, dt)
    updateHeat(world, dt)
    updatePrompt(world)

    // --- camera ----------------------------------------------------------
    const t = cameraTarget(world)
    const lerp = 1 - Math.pow(0.001, dt)
    camera.position.x += (t.x - camera.position.x) * lerp
    camera.position.y += (t.y - camera.position.y) * lerp
    camera.position.z += (t.z - camera.position.z) * lerp
    if (world.camera.shake > 0) {
      const s = world.camera.shake * 0.35
      camera.position.x += (Math.random() - 0.5) * s
      camera.position.y += (Math.random() - 0.5) * s
      camera.position.z += (Math.random() - 0.5) * s
    }
    camera.lookAt(t.lookX, t.lookY, t.lookZ)

    // --- HUD sync --------------------------------------------------------
    if (world.phase === 'busted') {
      setBusted(world.bustedInfo)
      setPhase('busted')
    }

    syncTimer.current -= dt
    const m = mirror.current
    const changed =
      m.score !== world.score ||
      m.stars !== world.stars ||
      m.ammo !== world.ammo ||
      m.prompt !== world.prompt ||
      m.cooling !== !!world.cooling
    if (changed || syncTimer.current <= 0) {
      syncTimer.current = 0.2
      m.score = world.score
      m.stars = world.stars
      m.ammo = world.ammo
      m.prompt = world.prompt
      m.cooling = !!world.cooling
      sync({
        score: world.score,
        stars: world.stars,
        heat: world.heat,
        ammo: world.ammo,
        prompt: world.prompt,
        promptKind: world.promptKind,
        cooling: !!world.cooling,
        stats: world.stats,
      })
    }

    endFrame()
  })

  return null
}
