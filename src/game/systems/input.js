// Keyboard + mouse. Pointer lock is optional: the camera also turns with a
// held mouse drag, so the game is playable without capturing the cursor.

export const input = {
  keys: new Set(),
  mouseDX: 0,
  mouseDY: 0,
  fire: false, // held
  firePressed: false, // edge
  spray: false,
  locked: false,
  dragging: false,

  // Analog stick, -1..1 each. Touch writes these; the keyboard leaves them at
  // zero and falls through to the digital keys below.
  moveX: 0, // + is right / steer right
  moveY: 0, // + is forward
  touchActive: false,
}

const justPressedKeys = new Set()

/**
 * True khi đang có overlay giao diện mở (điện thoại, bản đồ). Lúc đó gameplay phải
 * nhường chuột và bàn phím lại cho giao diện: không khoá con trỏ, không đi lại,
 * không quay camera - nếu không thì người chơi phải bấm Esc mới bấm được vào overlay,
 * và nhân vật vẫn lẳng lặng chạy phía sau.
 */
export function uiCaptured(world) {
  return !!(world.phoneOpen || world.mapOpen)
}

export function keyDown(code) {
  return input.keys.has(code)
}

/** True during the frame the key was physically or virtually pressed. */
export function keyPressed(code) {
  return justPressedKeys.has(code)
}

// --- movement axes -------------------------------------------------------
// Systems read these instead of the raw keys so a thumbstick can give analog
// steering and a walking pace, while the keyboard still reads as full deflection.

/** Forward / back. +1 is forward. */
export function axisForward() {
  const keys = (keyDown('KeyW') ? 1 : 0) - (keyDown('KeyS') ? 1 : 0)
  return keys !== 0 ? keys : input.moveY
}

/** Strafe / steer. +1 is right. */
export function axisRight() {
  const keys = (keyDown('KeyD') ? 1 : 0) - (keyDown('KeyA') ? 1 : 0)
  return keys !== 0 ? keys : input.moveX
}

// --- virtual keys --------------------------------------------------------
// On-screen buttons push real key codes into the same set the keyboard uses, so
// no gameplay system needs to know whether a finger or a key produced them.

export function virtualHold(code, held) {
  if (held) {
    if (!input.keys.has(code)) justPressedKeys.add(code)
    input.keys.add(code)
  } else {
    input.keys.delete(code)
  }
}

/**
 * A momentary press. Latched briefly rather than released immediately: a fast
 * tap could otherwise start and end inside one frame and be missed entirely by
 * the edge-triggered keyPressed().
 */
export function virtualTap(code, ms = 120) {
  if (!input.keys.has(code)) justPressedKeys.add(code)
  input.keys.add(code)
  setTimeout(() => input.keys.delete(code), ms)
}

export function endFrame() {
  input.mouseDX = 0
  input.mouseDY = 0
  input.firePressed = false
  justPressedKeys.clear()
}

export function attachInput() {
  const onKeyDown = (e) => {
    if (e.repeat) return
    if (!input.keys.has(e.code)) {
      justPressedKeys.add(e.code)
    }
    input.keys.add(e.code)
    // Stop the page scrolling / browser quick-find getting in the way.
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'KeyE', 'KeyF', 'KeyP'].includes(e.code)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e) => {
    input.keys.delete(e.code)
  }
  const onBlur = () => {
    input.keys.clear()
    justPressedKeys.clear()
    input.fire = false
    input.dragging = false
  }


  // Only the 3D view arms the throw - clicking HUD buttons should not fire.
  const overCanvas = (e) => input.locked || e.target?.tagName === 'CANVAS'

  const onMouseDown = (e) => {
    if (!overCanvas(e)) return
    if (e.button === 0) {
      input.fire = true
      input.firePressed = true
    }
    if (!input.locked) input.dragging = true
  }
  const onMouseUp = (e) => {
    if (e.button === 0) input.fire = false
    input.dragging = false
  }
  const onMouseMove = (e) => {
    if (input.locked || input.dragging) {
      input.mouseDX += e.movementX || 0
      input.mouseDY += e.movementY || 0
    }
  }
  const onContext = (e) => {
    if (e.target?.tagName === 'CANVAS') e.preventDefault()
  }
  const onLockChange = () => {
    input.locked = !!document.pointerLockElement
    if (!input.locked) input.fire = false
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('contextmenu', onContext)
  document.addEventListener('pointerlockchange', onLockChange)

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('contextmenu', onContext)
    document.removeEventListener('pointerlockchange', onLockChange)
  }
}

// Pointer lock is a nicety, not a requirement - the drag-to-look fallback covers
// embedded contexts (iframes without allow="pointer-lock") where it is refused.
let lockUnavailable = false

export function requestLock(canvas) {
  if (lockUnavailable || !canvas || document.pointerLockElement === canvas) return
  try {
    const result = canvas.requestPointerLock?.()
    if (result && typeof result.catch === 'function') {
      result.catch(() => { lockUnavailable = true })
    }
  } catch {
    lockUnavailable = true
  }
}

export function releaseLock() {
  if (document.pointerLockElement) document.exitPointerLock?.()
}
