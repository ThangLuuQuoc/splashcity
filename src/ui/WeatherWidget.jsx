import { useEffect, useRef, useState } from 'react'
import { WEATHER_TYPES, formatClock } from '../game/weather.js'
import { cycleWeather, skipTimePhase } from '../game/systems/weather.js'
import { useGame } from '../game/store.js'
import { setMuted } from '../game/audio.js'
import { t } from '../game/i18n.js'
import LangChip from './LangChip.jsx'

export default function WeatherWidget({ world }) {
  const [state, setState] = useState({ clock: '', icon: '', labelKey: '' })
  const last = useRef('')

  const lang = useGame((s) => s.lang) // đọc để đổi ngôn ngữ là vẽ lại
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
      const labelKey = dark && showing === 'clear' ? 'weather.clearNight' : type.labelKey
      const key = `${clock}|${labelKey}`
      if (key === last.current) return
      last.current = key
      setState({ clock, icon, labelKey })
    }, 250)
    return () => clearInterval(id)
  }, [world])

  return (
    <div className="hud-panel hud-weather">
      <LangChip />
      {/* Nút Mute tinh gọn dạng icon chip cùng 1 dòng */}
      <button
        className={`weather-chip mute-chip ${muted ? 'is-muted' : ''}`}
        title={muted ? t('weather.muteOff') : t('weather.muteOn')}
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
        title={t('weather.changeTitle')}
        onClick={(e) => { e.currentTarget.blur(); cycleWeather(world) }}
      >
        <span className="weather-icon">{state.icon}</span>
        <span className="weather-label">{state.labelKey ? t(state.labelKey) : ''}</span>
      </button>

      {/* Chip Đồng hồ */}
      <button
        className="weather-chip clock"
        title={t('weather.timeTitle')}
        onClick={(e) => { e.currentTarget.blur(); skipTimePhase(world) }}
      >
        {state.clock}
      </button>
    </div>
  )
}
