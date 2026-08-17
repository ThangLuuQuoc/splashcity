import { useEffect, useState } from 'react'
import { triggerDisaster, disasterLabel } from '../game/systems/disasters.js'
import { t } from '../game/i18n.js'

// Reads the disaster state on its own interval rather than through the store:
// the countdown ticks every frame and has no business re-rendering the HUD.
export default function DisasterBanner({ world }) {
  const [label, setLabel] = useState(null)
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(disasterLabel(world))
      setPhase(world.disaster.phase)
    }, 200)
    return () => clearInterval(id)
  }, [world])

  return (
    <>
      {label && (
        <div className={`disaster-banner${phase === 'warning' ? ' warning' : ''}`}>
          <span className="disaster-icon">
            {world.disaster.type === 'tornado' ? '🌪️' : '🌊'}
          </span>
          {label}
        </div>
      )}

      <div className="disaster-buttons">
        <button
          className="disaster-chip"
          title={t('disaster.sendTornado')}
          onClick={(e) => { e.currentTarget.blur(); triggerDisaster(world, 'tornado') }}
        >
          🌪️
        </button>
        <button
          className="disaster-chip"
          title={t('disaster.sendTsunami')}
          onClick={(e) => { e.currentTarget.blur(); triggerDisaster(world, 'tsunami') }}
        >
          🌊
        </button>
      </div>
    </>
  )
}
