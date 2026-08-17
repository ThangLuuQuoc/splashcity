import { useEffect, useRef, useState } from 'react'
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

  const [scanning, setScanning] = useState(false)
  const timers = useRef([])

  // Đóng điện thoại giữa lúc đang quét thì huỷ luôn nhịp quét, nếu không lần mở sau sẽ
  // bị trừ tiền bởi cái hẹn giờ của lần trước.
  useEffect(() => {
    if (phoneOpen) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setScanning(false)
  }, [phoneOpen])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (!phoneOpen) return null

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.count, 0)
  const checkout = interior === 'supermarket' && cart.length > 0

  const closePhone = () => {
    if (world) world.phoneOpen = false
    setPhoneOpen(false)
  }

  // Nhả tay trúng nền tối cũng đóng ngay khi vừa mở - cùng một lỗi. Nút ✕ vẫn dùng
  // closePhone nên không bị chặn.
  const closeFromBackdrop = () => {
    if (armed) closePhone()
  }

  // Bấm là quét: một nhịp quét ngắn ngay trong nút rồi trừ tiền. Giữ được cảm giác
  // "chạm điện thoại vào mã QR ở quầy" mà không phải nuôi một khung camera giả to đùng
  // chiếm mất chỗ của hoá đơn.
  const handlePay = () => {
    if (!armed || scanning || !world) return
    setScanning(true)
    timers.current.push(setTimeout(() => {
      setScanning(false)
      const res = checkoutCart(world)
      if (res && res.success) {
        world.prompt = t('phone.paid')
        timers.current.push(setTimeout(() => {
          if (world) world.phoneOpen = false
          setPhoneOpen(false)
        }, 500))
      } else {
        playBeep()
        if (res && res.reason) world.prompt = res.reason
      }
    }, 650))
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

          {/* Nội dung chính: Hoá đơn quầy tính tiền hoặc Túi đồ */}
          <div className={`phone-body${checkout ? ' checkout' : ''}`}>
            {checkout ? (
              <div className="phone-checkout">
                {/* Hoá đơn lên trên cùng: đây mới là thứ người chơi cần đọc. Khung quét
                    QR to đùng trước đây chiếm 140px phía trên, đẩy cả danh sách hàng lẫn
                    nút trả tiền xuống dưới mép màn hình. Việc quét giờ nằm gọn trong
                    chính cái nút, chỉ hiện lúc đang quét. */}
                <div className="phone-cart-list">
                  <h4>{t('phone.cart', { count: cart.length })}</h4>
                  {cart.map((item, idx) => (
                    <div key={idx} className="phone-cart-item">
                      <span>{item.icon} {item.shortName} x{item.count}</span>
                      <span className="item-price">{(item.price * item.count).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>

                {/* Tổng tiền nằm ngoài danh sách để giỏ hàng dài mấy cũng không cuộn mất */}
                <div className="phone-cart-total">
                  <span>{t('phone.total')}</span>
                  <span className="total-amount">{cartTotal.toLocaleString('vi-VN')} đ</span>
                </div>

                <button
                  className={`phone-pay-btn ${scanning ? 'scanning' : cash >= cartTotal ? 'active' : 'disabled'}`}
                  onClick={handlePay}
                  disabled={cash < cartTotal || scanning}
                >
                  {scanning && <span className="pay-scan-strip" />}
                  {scanning ? t('phone.scanning') : t('phone.payNow')}
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
