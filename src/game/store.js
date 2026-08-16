import { create } from 'zustand'

// Only what the HUD needs. Systems push into this a few times a second, never
// every frame, so React re-renders stay cheap.
export const useGame = create((set) => ({
  phase: 'menu', // menu | playing | busted
  score: 0,
  stars: 0,
  heat: 0,
  ammo: 0,
  prompt: '',
  cooling: false,
  copsNear: 0,
  busted: null, // { lost, kept }
  stats: { splashed: 0, bumped: 0, tagged: 0, busted: 0 },
  muted: false,

  setPhase: (phase) => set({ phase }),
  setBusted: (busted) => set({ busted }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  sync: (patch) => set(patch),
}))
