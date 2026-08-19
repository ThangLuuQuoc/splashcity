import { useEffect, useState } from 'react'
import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'
import LangChip from './LangChip.jsx'

/**
 * Offers "add to home screen" when the browser says the app is installable.
 * Chrome fires beforeinstallprompt and lets us defer it; iOS Safari has no such
 * event, so there we fall back to telling the player where the button is.
 */
function InstallButton() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Already running from the home screen - nothing to offer.
  const standalone = typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone)
  if (installed || standalone) return null

  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

  if (!prompt) {
    return isIOS
      ? <div className="install-hint" dangerouslySetInnerHTML={{ __html: t('start.installIos') }} />
      : null
  }

  return (
    <button
      className="install-button"
      onClick={async () => {
        prompt.prompt()
        await prompt.userChoice
        setPrompt(null)
      }}
    >
      {t('start.install')}
    </button>
  )
}

// Bảng phím: [danh sách phím, khoá câu mô tả]. Phím giữ nguyên vì chúng là ký hiệu
// trên bàn phím thật, chỉ câu mô tả mới dịch.
const KEYBOARD_CONTROLS = [
  [['W', 'A', 'S', 'D'], 'keys.move'],
  [['keys.mouse'], 'keys.look'],
  [['M'], 'keys.map'],
  [['X'], 'keys.runToggle'],
  [['Shift'], 'keys.shift'],
  [['Q', 'R'], 'keys.turnCam'],
  [['Space'], 'keys.jump'],
  [['E'], 'keys.enter'],
  [['🚁'], 'keys.fly'],
  [['X'], 'keys.autopilot'],
  [['L'], 'keys.searchlight'],
  [['H'], 'keys.heliSiren'],
  [['K'], 'keys.heliSkin'],
  [['keys.click'], 'keys.throw'],
  [['F'], 'keys.spray'],
  [['C'], 'keys.weather'],
  [['N'], 'keys.time'],
  [['Esc'], 'keys.esc'],
]

const TOUCH_CONTROLS = [
  [['touchKeys.leftThumb'], 'touchKeys.stickMove'],
  [['touchKeys.rightThumb'], 'touchKeys.stickLook'],
  [['touchKeys.pushFar'], 'touchKeys.run'],
  [['🗺️'], 'keys.map'],
  [['💧'], 'touchKeys.throwHold'],
  [['🚗'], 'keys.enter'],
  [['🔼', '🔽'], 'touchKeys.heliUpDown'],
  [['🛩️'], 'touchKeys.autopilot'],
  [['🔦'], 'touchKeys.searchlight'],
  [['🚨'], 'touchKeys.heliSiren'],
  [['🔁'], 'touchKeys.heliSkin'],
  [['⬆️'], 'touchKeys.jump'],
  [['🎨'], 'touchKeys.sprayHold'],
  [['touchKeys.topChips'], 'touchKeys.weatherChips'],
]

/** Nhãn phím: khoá i18n thì dịch, còn lại là ký hiệu thật nên để nguyên. */
const keyLabel = (k) => (k.includes('.') ? t(k) : k)

export default function StartScreen({ onStart }) {
  const touch = useGame((s) => s.touch)
  useGame((s) => s.lang) // đổi ngôn ngữ là vẽ lại cả bảng
  const controls = touch ? TOUCH_CONTROLS : KEYBOARD_CONTROLS

  return (
    <div className="overlay start">
      <div className="title">SPLASH CITY</div>
      <div className="start-lang"><LangChip /></div>
      <div className="subtitle">{t('start.subtitle')}</div>

      <div className={`controls${touch ? ' touch' : ''}`}>
        {controls.map(([keys, labelKey]) => (
          <div className="row" key={labelKey + keys.join()}>
            <span>{keys.map((k) => <span className="key" key={k}>{keyLabel(k)}</span>)}</span>
            <span>{t(labelKey)}</span>
          </div>
        ))}
      </div>

      <button className="play-button" onClick={onStart}>{t('start.play')}</button>
      <InstallButton />
    </div>
  )
}
