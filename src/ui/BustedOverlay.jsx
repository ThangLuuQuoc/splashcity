import { useGame } from '../game/store.js'

export default function BustedOverlay() {
  const busted = useGame((s) => s.busted)
  if (!busted) return null
  return (
    <div className="overlay busted" style={{ pointerEvents: 'none' }}>
      <div className="busted-title">BUSTED!</div>
      <div className="busted-note">
        The police walked you back to the station. You lost{' '}
        <strong>{busted.lost.toLocaleString()}</strong> fun points.
      </div>
      <div className="busted-sub">Kept {busted.kept.toLocaleString()} — back out in a moment…</div>
    </div>
  )
}
