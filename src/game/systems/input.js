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
}

const pressed = new Set()

export function keyDown(code) {
  return input.keys.has(code)
}

/** True once per physical key press. */
export function keyPressed(code) {
  if (input.keys.has(code) && !pressed.has(code)) {
    pressed.add(code)
    return true
  }
  return false
}

export function endFrame() {
  input.mouseDX = 0
  input.mouseDY = 0
  input.firePressed = false
  for (const code of pressed) {
    if (!input.keys.has(code)) pressed.delete(code)
  }
}

export function attachInput() {
  const onKeyDown = (e) => {
    if (e.repeat) return
    input.keys.add(e.code)
    // Stop the page scrolling / browser quick-find getting in the way.
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'KeyE', 'KeyF'].includes(e.code)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e) => input.keys.delete(e.code)
  const onBlur = () => {
    input.keys.clear()
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
