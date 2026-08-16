import { useGame } from '../game/store.js'
import { ACTIONS, HEAT } from '../game/config.js'
import { setMuted } from '../game/audio.js'
import Minimap from './Minimap.jsx'
import WeatherWidget from './WeatherWidget.jsx'

const MAX_STARS = HEAT.stars.length

function Wanted() {
  const stars = useGame((s) => s.stars)
  const cooling = useGame((s) => s.cooling)
  return (
    <div className={`hud-panel hud-wanted${cooling ? ' cooling' : ''}`}>
      <div className="stars">
        {Array.from({ length: MAX_STARS }, (_, i) => (
          <span key={i} className={i < stars ? 'star-on' : 'star-off'}>★</span>
        ))}
      </div>
      <div className="note">
        {stars === 0
          ? 'all clear'
          : cooling
            ? 'losing them...'
            : 'police are chasing!'}
      </div>
    </div>
  )
}

function Score() {
  const score = useGame((s) => s.score)
  return (
    <div className="hud-panel hud-score">
      <div className="label">Fun points</div>
      <div className="value">{score.toLocaleString()}</div>
    </div>
  )
}

function Ammo() {
  const ammo = useGame((s) => s.ammo)
  return (
    <div className="hud-panel hud-ammo">
      <span style={{ fontSize: 18 }}>💧</span>
      <div className="pips">
        {Array.from({ length: ACTIONS.maxAmmo }, (_, i) => (
          <div key={i} className={`pip${i < ammo ? '' : ' empty'}`} />
        ))}
      </div>
    </div>
  )
}

function Prompt() {
  const prompt = useGame((s) => s.prompt)
  const kind = useGame((s) => s.promptKind)
  const touch = useGame((s) => s.touch)
  // The on-screen buttons carry their own labels, so keyboard hints are noise.
  if (touch && kind !== 'hint') return null
  return <div className="hud-panel hud-prompt">{prompt}</div>
}

function MuteButton() {
  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)
  return (
    <button
      className="mute-button"
      onClick={(e) => {
        e.currentTarget.blur()
        setMuted(!muted)
        toggleMute()
      }}
    >
      {muted ? '🔇 sound off' : '🔊 sound on'}
    </button>
  )
}

export default function HUD({ world }) {
  const phase = useGame((s) => s.phase)
  const touch = useGame((s) => s.touch)
  if (phase !== 'playing') return null
  return (
    <div className={`hud${touch ? ' touch' : ''}`}>
      <Score />
      <Wanted />
      <Ammo />
      <Prompt />
      <MuteButton />
      <WeatherWidget world={world} />
      <Minimap world={world} />
    </div>
  )
}
