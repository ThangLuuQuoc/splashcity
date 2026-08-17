// Nút đổi ngôn ngữ, đặt cùng dải chip với loa và thời tiết ở giữa mép trên: đó là chỗ
// người chơi đã quen tìm các công tắc, và trên cảm ứng nó đã có sẵn cỡ chạm vừa tay.
//
// Hiện mã ngôn ngữ SẼ chuyển sang khi bấm, không phải mã đang dùng - nút nói việc nó
// làm chứ không nói trạng thái, nên không phải đoán xem "EN" nghĩa là đang Anh hay
// bấm để sang Anh.

import { useGame } from '../game/store.js'
import { nextLang } from '../game/i18n.js'

export default function LangChip() {
  const lang = useGame((s) => s.lang)
  const toggleLang = useGame((s) => s.toggleLang)
  const next = nextLang()

  return (
    <button
      className="weather-chip lang-chip"
      title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
      onClick={(e) => { e.currentTarget.blur(); toggleLang() }}
    >
      <span className="weather-icon">🌐</span>
      <span className="lang-code">{next.toUpperCase()}</span>
    </button>
  )
}
