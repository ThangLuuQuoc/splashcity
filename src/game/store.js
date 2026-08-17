import { create } from 'zustand'
import { getLang, setLang as applyLang, nextLang } from './i18n.js'

// Only what the HUD needs. Systems push into this a few times a second, never
// every frame, so React re-renders stay cheap.
export const useGame = create((set) => ({
  phase: 'menu', // menu | playing | busted
  score: 0,
  stars: 0,
  heat: 0,
  ammo: 0,
  prompt: '',
  promptKind: 'controls', // 'hint' = worth showing even on touch
  cooling: false,
  copsNear: 0,
  busted: null, // { lost, kept }
  stats: { splashed: 0, bumped: 0, tagged: 0, busted: 0 },
  muted: false,
  touch: false, // on-screen controls are showing

  // Ngôn ngữ: nguồn sự thật nằm ở i18n.js (các hệ thống game ngoài React cũng đọc nó);
  // đây chỉ là bản sao để component đang hiển thị chữ biết mà vẽ lại.
  lang: getLang(),

  // Interior, Phone & Shopping state
  interior: 'none',
  phoneOpen: false,
  autoRun: false,
  mapOpen: false,
  travelName: '',
  travelIcon: '',
  travelling: false,
  travelMessage: '',
  setMapOpen: (mapOpen) => set({ mapOpen }),
  inventory: [],
  cart: [],
  cash: 500000,
  activeBuffs: { speedBoost: 1, timer: 0 },

  setTouch: (touch) => set((s) => (s.touch === touch ? s : { touch })),
  setPhase: (phase) => set({ phase }),
  setBusted: (busted) => set({ busted }),
  setPhoneOpen: (phoneOpen) => set({ phoneOpen }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setLang: (lang) => set({ lang: applyLang(lang) }),
  toggleLang: () => set({ lang: applyLang(nextLang()) }),
  sync: (patch) => set(patch),
}))

