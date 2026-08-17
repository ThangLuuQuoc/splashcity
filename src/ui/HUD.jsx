import { useEffect, useState } from 'react'
import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'
import { ACTIONS, HEAT } from '../game/config.js'
import { setMuted } from '../game/audio.js'
import { useInventoryItem } from '../game/systems/inventory.js'
import { cancelTravel } from '../game/systems/navigation.js'
import Minimap from './Minimap.jsx'
import WeatherWidget from './WeatherWidget.jsx'
import DisasterBanner from './DisasterBanner.jsx'

const MAX_STARS = HEAT.stars.length

function Wanted() {
  const stars = useGame((s) => s.stars)
  const cooling = useGame((s) => s.cooling)
  const touch = useGame((s) => s.touch)

  // Trên touch bỏ dòng chữ khi không có chuyện gì - "all clear" chỉ nhắc lại điều mà 4
  // ngôi sao xám đã nói rồi. Lúc đang bị truy đuổi thì vẫn hiện, vì đó là thông tin
  // thật và chỉ xuất hiện đúng lúc cần.
  const showNote = !touch || stars > 0

  return (
    <div className={`hud-panel hud-wanted${cooling ? ' cooling' : ''}`}>
      <div className="stars">
        {Array.from({ length: MAX_STARS }, (_, i) => (
          <span key={i} className={i < stars ? 'star-on' : 'star-off'}>★</span>
        ))}
      </div>
      {showNote && (
        <div className="note">
          {stars === 0
            ? t('hud.allClear')
            : cooling
              ? t('hud.losingThem')
              : t('hud.chasing')}
        </div>
      )}
    </div>
  )
}

function Score() {
  const score = useGame((s) => s.score)
  return (
    <div className="hud-panel hud-score">
      <div className="label">{t('hud.score')}</div>
      <div className="value">{score.toLocaleString()}</div>
    </div>
  )
}

// Dãy 16 giọt nước chiếm một vệt rất dài trên màn hình ngang của điện thoại; con số đọc
// nhanh hơn mà chỉ tốn một góc nhỏ.
function Ammo() {
  const ammo = useGame((s) => s.ammo)
  return (
    <div className={`hud-panel hud-ammo${ammo === 0 ? ' empty' : ammo <= 4 ? ' low' : ''}`}>
      <span className="ammo-icon">💧</span>
      <span className="ammo-count">{ammo}</span>
      <span className="ammo-max">/{ACTIONS.maxAmmo}</span>
    </div>
  )
}

function BuffBadge() {
  const activeBuffs = useGame((s) => s.activeBuffs)
  if (!activeBuffs || activeBuffs.timer <= 0) return null
  return (
    <div className="hud-panel hud-buff">
      <span className="buff-icon">⚡</span>
      <span className="buff-name">{t(activeBuffs.nameKey || 'buff.sugarRush')}</span>
      <span className="buff-time">{Math.ceil(activeBuffs.timer)}s</span>
    </div>
  )
}

/**
 * Chỉ báo chế độ chạy. Bấm được luôn - trên PC là nút phụ cho phím R, trên tablet
 * là cách chạy liên tục mà không phải giữ cần analog ở sát vành.
 */
function RunModeBadge({ world }) {
  const autoRun = useGame((s) => s.autoRun)
  const touch = useGame((s) => s.touch)
  // Cần analog vốn tự phân biệt đi và chạy theo độ đẩy, nên trên touch không có "chế
  // độ" nào để bật hay theo dõi - chip này chỉ chiếm chỗ.
  if (touch) return null
  return (
    <button
      className={`hud-panel hud-runmode ${autoRun ? 'on' : ''}`}
      onClick={() => { if (world) world.autoRun = !world.autoRun }}
      title={t(autoRun ? 'hud.runModeOnTitle' : 'hud.runModeOffTitle')}
    >
      <span className="run-icon">{autoRun ? '🏃' : '🚶'}</span>
      <span className="run-label">{t(autoRun ? 'hud.runMode' : 'hud.walkMode')}</span>
      {!touch && <span className="run-key">[X]</span>}
    </button>
  )
}

function QuickInventory({ world }) {
  const inventory = useGame((s) => s.inventory) || []
  if (inventory.length === 0) return null
  return (
    <div className="hud-panel hud-inventory">
      <div className="inv-title">{t('hud.bag')}</div>
      <div className="inv-slots">
        {inventory.slice(0, 4).map((item, idx) => (
          <button
            key={idx}
            className="inv-slot-btn"
            onClick={() => world && useInventoryItem(world, item.id)}
            title={`${item.name} (${item.desc})`}
          >
            <span className="slot-key">[{idx + 1}]</span>
            <span className="slot-icon">{item.icon}</span>
            <span className="slot-count">x{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PhoneButton({ world }) {
  const phoneOpen = useGame((s) => s.phoneOpen)
  const setPhoneOpen = useGame((s) => s.setPhoneOpen)
  const cart = useGame((s) => s.cart) || []
  return (
    <button
      className={`phone-toggle-btn ${cart.length > 0 ? 'has-cart' : ''}`}
      onClick={() => {
        const next = !phoneOpen
        if (world) world.phoneOpen = next
        setPhoneOpen(next)
      }}
      title={t('hud.phoneButtonTitle')}
    >
      <span>{t('hud.phoneButton')}</span>
      {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
    </button>
  )
}

/**
 * Đồng hồ cao độ khi đang bay.
 *
 * Cần thiết nhất trên tablet: dòng gợi ý điều khiển mang promptKind 'controls', mà
 * Prompt() lọc bỏ 'controls' trên touch - nên nếu không có chip này thì người chơi
 * tablet bay mà không hề biết mình đang ở cao độ nào, cũng không biết đã đáp chưa.
 *
 * Đọc thẳng từ world theo nhịp 200ms thay vì đẩy qua store: cao độ đổi mỗi frame,
 * nếu cho vào phép so sánh của GameLoop thì sẽ ép đồng bộ store 60 lần mỗi giây.
 */
function FlightBadge({ world }) {
  const [flight, setFlight] = useState(null)

  useEffect(() => {
    const id = setInterval(() => {
      if (world.player.mode !== 'heli') return setFlight(null)
      const h = world.heli
      const stop = h.tour.active ? h.tour.route[h.tour.index] : null
      setFlight({
        alt: Math.round(h.y),
        landed: h.landed,
        speed: Math.round(Math.hypot(h.vx, h.vz) * 3.6), // km/h cho dễ hình dung
        tour: stop ? `${stop.icon} ${stop.name}` : null,
        orbiting: h.tour.active && h.tour.phase === 'orbit',
      })
    }, 200)
    return () => clearInterval(id)
  }, [world])

  if (!flight) return null
  return (
    <div className={`hud-panel hud-flight ${flight.landed ? 'landed' : ''} ${flight.tour ? 'touring' : ''}`}>
      <span className="flight-icon">{flight.tour ? '🛩️' : '🚁'}</span>
      <span className="flight-alt">{flight.alt}<small>m</small></span>
      <span className="flight-speed">{flight.speed}<small>km/h</small></span>
      <span className="flight-state">
        {flight.tour
          ? t(flight.orbiting ? 'flight.orbiting' : 'flight.goingTo', { place: flight.tour })
          : t(flight.landed ? 'flight.landed' : 'flight.flying')}
      </span>
    </div>
  )
}

function MapButton({ world }) {
  const mapOpen = useGame((s) => s.mapOpen)
  const setMapOpen = useGame((s) => s.setMapOpen)
  return (
    <button
      className="map-toggle-btn"
      onClick={() => {
        const next = !mapOpen
        if (world) world.mapOpen = next
        setMapOpen(next)
      }}
      title={t('hud.mapButtonTitle')}
    >
      <span>{t('hud.mapButton')}</span>
    </button>
  )
}

/** Băng thông báo khi đang tự động chạy, kèm nút dừng. */
function TravelBanner({ world }) {
  const travelling = useGame((s) => s.travelling)
  const name = useGame((s) => s.travelName)
  const icon = useGame((s) => s.travelIcon)
  const message = useGame((s) => s.travelMessage)
  const touch = useGame((s) => s.touch)

  if (travelling) {
    return (
      <div className="hud-panel hud-travel">
        <span className="travel-icon">{icon || '🏃'}</span>
        <span className="travel-text">{t('travel.running')} <b>{name}</b></span>
        <button
          className="travel-stop"
          onClick={() => world && cancelTravel(world, t('travel.stopped'))}
        >
          {t('travel.stop')}{touch ? '' : t('travel.stopHint')}
        </button>
      </div>
    )
  }
  if (message) return <div className="hud-panel hud-travel note">{message}</div>
  return null
}

// Trên điện thoại không có phím nào cả, nên prompt kiểu "[E] Vào Siêu thị" là chỉ vào
// một phím không tồn tại - người chơi đi tìm nút "E" không thấy và tưởng là thiếu nút.
// Đổi tên phím thành đúng biểu tượng của nút trong dãy nút cảm ứng để hai thứ khớp nhau.
const TOUCH_KEY_ICONS = {
  E: '⚡',
  P: '📱',
  M: '🗺️',
  X: '🛩️',
}

function withTouchButtons(text) {
  return text.replace(/\[([EPMX])\]/g, (whole, key) => TOUCH_KEY_ICONS[key] || whole)
}

function Prompt() {
  const prompt = useGame((s) => s.prompt)
  const kind = useGame((s) => s.promptKind)
  const touch = useGame((s) => s.touch)
  if (touch && kind !== 'hint' && kind !== 'shopping' && kind !== 'interior') return null
  return <div className="hud-panel hud-prompt">{touch ? withTouchButtons(prompt) : prompt}</div>
}

export default function HUD({ world }) {
  const phase = useGame((s) => s.phase)
  useGame((s) => s.lang) // đổi ngôn ngữ là cả HUD vẽ lại
  const touch = useGame((s) => s.touch)
  if (phase !== 'playing') return null
  return (
    <div className={`hud${touch ? ' touch' : ''}`}>
      <Score />
      <Wanted />
      <Ammo />
      <BuffBadge />
      <RunModeBadge world={world} />
      <FlightBadge world={world} />
      <QuickInventory world={world} />
      <PhoneButton world={world} />
      <MapButton world={world} />
      <TravelBanner world={world} />
      <Prompt />
      <WeatherWidget world={world} />
      <DisasterBanner world={world} />
      <Minimap world={world} />
    </div>
  )
}



