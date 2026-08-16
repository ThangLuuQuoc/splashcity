import { useEffect, useRef, useState } from 'react'
import { WEATHER_TYPES, formatClock } from '../game/weather.js'
import { cycleWeather, skipTimePhase } from '../game/systems/weather.js'

// Reads straight from the mutable world on its own interval rather than through
// the store - the clock ticks constantly and has no business re-rendering the
// rest of the HUD four times a second.
export default function WeatherWidget({ world }) {
  const [state, setState] = useState({ clock: '', icon: '', label: '' })
  const last = useRef('')

  useEffect(() => {
    const id = setInterval(() => {
      const w = world.weather
      if (!w) return
      const showing = w.blend > 0.5 ? w.target : w.current
      const type = WEATHER_TYPES[showing]
      const clock = formatClock(world.timeOfDay)
      // "Sunny" at half past ten in the evening reads as a bug - but so does
      // "night" during golden hour, so only flip once it is properly dark.
      const dark = w.night > 0.85
      const icon = dark && showing === 'clear' ? '🌙' : type.icon
      const label = dark && showing === 'clear' ? 'Clear night' : type.label
      const key = `${clock}|${label}`
      if (key === last.current) return
      last.current = key
      setState({ clock, icon, label })
    }, 250)
    return () => clearInterval(id)
  }, [world])

  return (
    <div className="hud-panel hud-weather">
      <button
        className="weather-chip"
        title="Change the weather (C)"
        onClick={(e) => { e.currentTarget.blur(); cycleWeather(world) }}
      >
        <span className="weather-icon">{state.icon}</span>
        <span className="weather-label">{state.label}</span>
      </button>
      <button
        className="weather-chip clock"
        title="Skip to the next time of day (N)"
        onClick={(e) => { e.currentTarget.blur(); skipTimePhase(world) }}
      >
        {state.clock}
      </button>
    </div>
  )
}
