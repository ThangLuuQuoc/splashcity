// Touch support is decided two ways: a static guess at load, used to size the
// renderer and the particle budget before anything is drawn, and a runtime flag
// that flips the moment a real finger lands. Hybrid laptops report touch points
// while being driven with a mouse, so the runtime signal is the one that
// actually shows the on-screen controls.

const coarsePointer = typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches

const hasTouchPoints = typeof navigator !== 'undefined' &&
  (navigator.maxTouchPoints || 0) > 0

/** Best guess at load time: a tablet or phone, not a laptop with a touchscreen. */
export const isTouchDevice = coarsePointer && hasTouchPoints

/** Scales particle counts and pixel ratio down on mobile GPUs. */
export const quality = isTouchDevice ? 0.5 : 1

export const maxPixelRatio = isTouchDevice ? 1.3 : 1.75
