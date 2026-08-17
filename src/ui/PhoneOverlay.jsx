import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'
import { checkoutCart } from '../game/systems/interiors.js'
import { useInventoryItem } from '../game/systems/inventory.js'
import { playBeep } from '../game/audio.js'
import { useArmed } from './useArmed.js'

export default function PhoneOverlay({ world }) {
  const phoneOpen = useGame((s) => s.phoneOpen)
  const setPhoneOpen = useGame((s) => s.setPhoneOpen)
  const cart = useGame((s) => s.cart) || []
  const inventory = useGame((s) => s.inventory) || []
  const cash = useGame((s) => s.cash) || 0
  const interior = useGame((s) => s.interior)
  // Nút 📱 nằm ngay trong vùng ngón tay, nên bỏ qua thao tác ~1/4 giây đầu để cú chạm
  // mở điện thoại không tự bấm hộ vào nút bên trong. Xem useArmed.js.
  const armed = useArmed(phoneOpen)
  useGame((s) => s.lang) // đổi ngôn ngữ là điện thoại vẽ lại

  if (!phoneOpen) return null

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.count, 0)

  const closePhone = () => {
    if (world) world.phoneOpen = false
    setPhoneOpen(false)
  }

  // Nhả tay trúng nền tối cũng đóng ngay khi vừa mở - cùng một lỗi. Nút ✕ vẫn dùng
  // closePhone nên không bị chặn.
  const closeFromBackdrop = () => {
    if (armed) closePhone()
  }

  const handlePay = () => {
    if (!armed) return
    if (world) {
      const res = checkoutCart(world)
      if (res && res.success) {
        world.prompt = t('phone.paid')
        setTimeout(() => {
          if (world) world.phoneOpen = false
          setPhoneOpen(false)
        }, 500)
      } else {
        playBeep()
        if (res && res.reason) world.prompt = res.reason
      }
    }
  }

  const handleUse = (itemId) => {
    if (!armed) return
    if (world) {
      useInventoryItem(world, itemId)
    }
  }

  return (
    <div className="phone-backdrop" onClick={closeFromBackdrop}>
      <div className="phone-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Khung viền điện thoại Smartphone cao cấp */}
        <div className="phone-screen">
          {/* Tai thỏ / Dynamic Island */}
          <div className="phone-notch">
            <span className="phone-camera"></span>
          </div>

          {/* Header trạng thái */}
          <div className="phone-header">
            <span className="phone-brand">{t('phone.brand')}</span>
            <button className="phone-close-btn" onClick={closePhone}>✕</button>
          </div>

          {/* SplashPay App Header */}
          <div className="splashpay-card">
            <div className="splashpay-title">
              <span className="splashpay-logo">💳 SplashPay (MoMo/VNPay)</span>
              <span className="splashpay-balance">{(cash).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="splashpay-status">
              {t('phone.payReady')}
            </div>
          </div>

          {/* Nội dung chính: Camera quét QR hoặc Túi đồ */}
          <div className="phone-body">
            {interior === 'supermarket' && cart.length > 0 ? (
              <div className="phone-qr-scanner-box">
                <div className="phone-scanner-frame">
                  <div className="scanner-line"></div>
                  <div className="scanner-target-qr">
                    <span className="qr-box-icon">📷</span>
                    <span>{t('phone.scanning')}</span>
                  </div>
                </div>

                <div className="phone-cart-list">
                  <h4>{t('phone.cart', { count: cart.length })}</h4>
                  {cart.map((item, idx) => (
                    <div key={idx} className="phone-cart-item">
                      <span>{item.icon} {item.shortName} x{item.count}</span>
                      <span className="item-price">{(item.price * item.count).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                  <div className="phone-cart-total">
                    <span>{t('phone.total')}</span>
                    <span className="total-amount">{cartTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <button 
                  className={`phone-pay-btn ${cash >= cartTotal ? 'active' : 'disabled'}`}
                  onClick={handlePay}
                  disabled={cash < cartTotal}
                >
                  {t('phone.payNow')}
                </button>
              </div>
            ) : (
              <div className="phone-inventory-section">
                <h4>{t('phone.bag')}</h4>
                {inventory.length === 0 ? (
                  <div className="phone-empty-inv">
                    <p>{t('phone.bagEmpty')}</p>
                    <p>{t('phone.bagEmptyHint')}</p>
                  </div>
                ) : (
                  <div className="phone-inv-grid">
                    {inventory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="phone-inv-card"
                        onClick={() => handleUse(item.id)}
                      >
                        <span className="inv-icon">{item.icon}</span>
                        <span className="inv-name">{item.shortName}</span>
                        <span className="inv-count">x{item.count}</span>
                        <span className="inv-desc">{item.desc}</span>
                        <button className="inv-use-btn">{t('phone.use')}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nút Home ảo */}
          <div className="phone-home-bar" onClick={closePhone}></div>
        </div>
      </div>
    </div>
  )
}
