import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'

export default function BustedOverlay() {
  const busted = useGame((s) => s.busted)
  useGame((s) => s.lang) // đổi ngôn ngữ là vẽ lại
  if (!busted) return null
  return (
    <div className="overlay busted" style={{ pointerEvents: 'none' }}>
      <div className="busted-title">{t('busted.title')}</div>
      <div className="busted-note">{t('busted.note', { lost: busted.lost.toLocaleString() })}</div>
      <div className="busted-sub">{t('busted.kept', { kept: busted.kept.toLocaleString() })}</div>
    </div>
  )
}
