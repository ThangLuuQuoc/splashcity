import { useEffect, useRef, useState } from 'react'
import { input, virtualHold, virtualTap } from '../game/systems/input.js'
import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'

// The whole touch layer is one full-screen surface plus a button cluster.
// Pointers are tracked by id so a thumb on the stick, a thumb dragging the
// camera and a finger on a button all work at the same time.

const STICK_RADIUS = 62 // px of travel before the stick is fully deflected
const LOOK_SENSITIVITY = 1.35 // touch drags feel slow at raw mouse sensitivity
const STICK_ZONE = 0.5 // left fraction of the screen that drives the stick

export default function TouchControls({ world }) {
  const surfaceRef = useRef(null)
  const knobRef = useRef(null)
  const baseRef = useRef(null)
  const pointers = useRef(new Map())
  const [mode, setMode] = useState('foot')
  useGame((s) => s.lang) // đổi ngôn ngữ là nhãn nút vẽ lại

  // Button labels follow what the player is currently doing.
  useEffect(() => {
    const id = setInterval(() => setMode(world.player.mode), 200)
    return () => clearInterval(id)
  }, [world])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    const showStick = (x, y) => {
      const base = baseRef.current
      const knob = knobRef.current
      if (!base || !knob) return
      base.style.display = 'block'
      base.style.left = `${x}px`
      base.style.top = `${y}px`
      knob.style.transform = 'translate(-50%, -50%)'
    }

    const moveStick = (originX, originY, x, y) => {
      let dx = x - originX
      let dy = y - originY
      const dist = Math.hypot(dx, dy)
      if (dist > STICK_RADIUS) {
        dx = (dx / dist) * STICK_RADIUS
        dy = (dy / dist) * STICK_RADIUS
      }
      const knob = knobRef.current
      if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
      input.moveX = dx / STICK_RADIUS
      input.moveY = -dy / STICK_RADIUS // screen y grows downward
    }

    const hideStick = () => {
      const base = baseRef.current
      if (base) base.style.display = 'none'
      input.moveX = 0
      input.moveY = 0
    }

    const onDown = (e) => {
      if (e.pointerType === 'mouse') return
      input.touchActive = true
      e.preventDefault()

      const stickSide = e.clientX < window.innerWidth * STICK_ZONE
      // Register before capturing: capture is only a nicety (it keeps tracking
      // a thumb that slides off the element), and if it throws we still want a
      // working control rather than dead input.
      pointers.current.set(e.pointerId, {
        role: stickSide ? 'stick' : 'look',
        originX: e.clientX,
        originY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
      })
      if (stickSide) showStick(e.clientX, e.clientY)
      try { surface.setPointerCapture(e.pointerId) } catch { /* not fatal */ }
    }

    const onMove = (e) => {
      const p = pointers.current.get(e.pointerId)
      if (!p) return
      e.preventDefault()

      if (p.role === 'stick') {
        moveStick(p.originX, p.originY, e.clientX, e.clientY)
      } else {
        // Feed the same accumulator the mouse uses, so the camera code is shared.
        input.mouseDX += (e.clientX - p.lastX) * LOOK_SENSITIVITY
        input.mouseDY += (e.clientY - p.lastY) * LOOK_SENSITIVITY
        p.lastX = e.clientX
        p.lastY = e.clientY
      }
    }

    const onUp = (e) => {
      const p = pointers.current.get(e.pointerId)
      if (!p) return
      pointers.current.delete(e.pointerId)
      if (p.role === 'stick') hideStick()
    }

    surface.addEventListener('pointerdown', onDown, { passive: false })
    surface.addEventListener('pointermove', onMove, { passive: false })
    surface.addEventListener('pointerup', onUp)
    surface.addEventListener('pointercancel', onUp)
    return () => {
      surface.removeEventListener('pointerdown', onDown)
      surface.removeEventListener('pointermove', onMove)
      surface.removeEventListener('pointerup', onUp)
      surface.removeEventListener('pointercancel', onUp)
      hideStick()
    }
  }, [])

  const inCar = mode === 'car'
  const onTrain = mode === 'train'
  const inHeli = mode === 'heli'

  return (
    <>
      <div className="touch-surface" ref={surfaceRef} />

      <div className="touch-stick" ref={baseRef} style={{ display: 'none' }}>
        <div className="touch-stick-knob" ref={knobRef} />
      </div>

      <div className="touch-buttons">
        <HoldButton
          className="big throw"
          label={t('btn.throw')}
          icon="💧"
          onChange={(held) => { input.fire = held }}
        />
        <TapButton
          label={t(inHeli ? 'btn.land' : inCar || onTrain ? 'btn.getOut' : 'btn.interact')}
          icon={inHeli ? '🛬' : inCar || onTrain ? '🚪' : '⚡'}
          onTap={() => virtualTap('KeyE')}
        />
        <TapButton
          label={t('btn.phone')}
          icon="📱"
          onTap={() => virtualTap('KeyP')}
        />
        {/* Chỉ hiện khi đang bay, để bật bay tự động ngắm cảnh.
            Đi bộ thì không cần: cần analog đẩy sát vành là đã chạy sẵn, nên nút "Run"
            chỉ làm chật màn hình. */}
        {inHeli && (
          <TapButton
            label={t('btn.auto')}
            icon="🛩️"
            onTap={() => virtualTap('KeyX')}
          />
        )}
        <TapButton
          label={t('btn.map')}
          icon="🗺️"
          onTap={() => virtualTap('KeyM')}
        />
        <HoldButton
          label={t(inHeli ? 'btn.up' : inCar ? 'btn.brake' : 'btn.jump')}
          icon={inHeli ? '🔼' : inCar ? '🛑' : '⬆️'}
          className={inHeli ? 'climb' : ''}
          onChange={(held) => virtualHold('Space', held)}
        />
        {/* Khi bay, ô "Spray" đổi thành nút hạ độ cao: xịt sơn lúc bay vô nghĩa, và giữ
            nguyên số nút giúp dãy nút không xô lệch dưới ngón tay khi đổi phương tiện.
            Thêm nút thứ 8 sẽ đẩy lưới 2 cột thành 4 hàng cao gần 400px - quá nửa chiều
            cao một tablet nằm ngang. */}
        {inHeli ? (
          <HoldButton
            label={t('btn.down')}
            icon="🔽"
            className="climb"
            onChange={(held) => virtualHold('ShiftLeft', held)}
          />
        ) : (
          <HoldButton
            label={t('btn.spray')}
            icon="🎨"
            disabled={inCar || onTrain}
            onChange={(held) => virtualHold('KeyF', held)}
          />
        )}
      </div>
    </>
  )
}


/** Stays active while a finger is on it. */
function HoldButton({ label, icon, className = '', disabled, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let active = false

    const press = (e) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      active = true
      el.classList.add('pressed')
      onChange(true)
      // Capture keeps the button held if the thumb drifts off it; losing the
      // capture must never stop the press itself from registering.
      try { el.setPointerCapture(e.pointerId) } catch { /* not fatal */ }
    }
    const release = (e) => {
      if (!active) return
      e.preventDefault()
      e.stopPropagation()
      active = false
      el.classList.remove('pressed')
      onChange(false)
    }

    el.addEventListener('pointerdown', press, { passive: false })
    el.addEventListener('pointerup', release, { passive: false })
    el.addEventListener('pointercancel', release, { passive: false })
    return () => {
      // Never leave an input stuck on if the button unmounts mid-press.
      if (active) onChange(false)
      el.removeEventListener('pointerdown', press)
      el.removeEventListener('pointerup', release)
      el.removeEventListener('pointercancel', release)
    }
  }, [onChange, disabled])

  return (
    <button ref={ref} className={`touch-btn ${className}`} disabled={disabled}>
      <span className="touch-btn-icon">{icon}</span>
      <span className="touch-btn-label">{label}</span>
    </button>
  )
}

/** Fires once per tap. */
function TapButton({ label, icon, disabled, onTap }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const press = (e) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      el.classList.add('pressed')
      onTap()
    }
    const release = () => el.classList.remove('pressed')
    el.addEventListener('pointerdown', press, { passive: false })
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)
    return () => {
      el.removeEventListener('pointerdown', press)
      el.removeEventListener('pointerup', release)
      el.removeEventListener('pointercancel', release)
    }
  }, [onTap, disabled])

  return (
    <button ref={ref} className="touch-btn" disabled={disabled}>
      <span className="touch-btn-icon">{icon}</span>
      <span className="touch-btn-label">{label}</span>
    </button>
  )
}
