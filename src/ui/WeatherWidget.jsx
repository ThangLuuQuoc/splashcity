import { useEffect, useRef, useState } from 'react'
import { WEATHER_TYPES, formatClock } from '../game/weather.js'
import { cycleWeather, skipTimePhase } from '../game/systems/weather.js'
import { useGame } from '../game/store.js'
import { setMuted } from '../game/audio.js'

export default function WeatherWidget({ world }) {
  const [state, setState] = useState({ clock: '', icon: '', label: '' })
  const last = useRef('')

  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)

  useEffect(() => {
    const id = setInterval(() => {
      const w = world.weather
      if (!w) return
      const showing = w.blend > 0.5 ? w.target : w.current
      const type = WEATHER_TYPES[showing]
      const clock = formatClock(world.timeOfDay)
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
      {/* Nút Mute tinh gọn dạng icon chip cùng 1 dòng */}
      <button
        className={`weather-chip mute-chip ${muted ? 'is-muted' : ''}`}
        title={muted ? 'Bật âm thanh (Sound On)' : 'Tắt âm thanh (Mute)'}
        onClick={(e) => {
          e.currentTarget.blur()
          setMuted(!muted)
          toggleMute()
        }}
      >
        <span className="weather-icon">{muted ? '🔇' : '🔊'}</span>
      </button>

      {/* Chip Thời tiết */}
      <button
        className="weather-chip"
        title="Đổi thời tiết (C)"
        onClick={(e) => { e.currentTarget.blur(); cycleWeather(world) }}
      >
        <span className="weather-icon">{state.icon}</span>
        <span className="weather-label">{state.label}</span>
      </button>

      {/* Chip Đồng hồ */}
      <button
        className="weather-chip clock"
        title="Chuyển thời gian Ngày / Đêm (N)"
        onClick={(e) => { e.currentTarget.blur(); skipTimePhase(world) }}
      >
        {state.clock}
      </button>
    </div>
  )
}
