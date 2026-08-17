// Bản đồ thành phố toàn màn hình: xem các khu vực đặc biệt và bấm để tự động chạy
// tới. Mở bằng phím M, nút 🗺️ trên HUD, hoặc nút bản đồ trên tablet.
//
// Cùng một nguồn dữ liệu địa điểm với minimap (world.landmarks), nên hai chỗ không
// bao giờ lệch nhau.

import { useEffect, useRef } from 'react'
import { useGame } from '../game/store.js'
import { t } from '../game/i18n.js'
import { useArmed } from './useArmed.js'
import { CITY } from '../game/config.js'
import { roadCenter } from '../game/city.js'
import { landmarkPosition } from '../game/landmarks.js'
import { startTravel, cancelTravel, travelBlockedReason } from '../game/systems/navigation.js'

const SIZE = 420 // cạnh bản đồ vẽ trên màn hình, đơn vị px

export default function MapOverlay({ world }) {
  const mapOpen = useGame((s) => s.mapOpen)
  const setMapOpen = useGame((s) => s.setMapOpen)
  const travelling = useGame((s) => s.travelling)
  const travelName = useGame((s) => s.travelName)
  const listRef = useRef(null)
  useGame((s) => s.lang) // đổi ngôn ngữ là bản đồ vẽ lại
  const armed = useArmed(mapOpen)

  // Bàn phím: mũi tên lên/xuống chạy trong danh sách, Enter/Space chọn. Mở bản đồ là
  // mục đầu tiên được focus sẵn, nên chơi bằng bàn phím không cần chạm tới chuột.
  useEffect(() => {
    if (!mapOpen) return
    const list = listRef.current
    if (!list) return

    const items = () => Array.from(list.querySelectorAll('button:not(:disabled)'))
    items()[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const all = items()
      if (!all.length) return
      e.preventDefault()
      const at = all.indexOf(document.activeElement)
      const step = e.key === 'ArrowDown' ? 1 : -1
      const next = at === -1 ? 0 : (at + step + all.length) % all.length
      all[next].focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mapOpen])

  if (!mapOpen || !world) return null

  const landmarks = world.landmarks || []
  const blocked = travelBlockedReason(world)
  const p = world.player

  // Bỏ qua thao tác trong ~1/4 giây đầu: xem chú thích trong useArmed.js.
  const close = () => {
    world.mapOpen = false
    setMapOpen(false)
  }

  const pick = (landmark) => {
    if (!armed) return
    if (startTravel(world, landmark)) close()
  }

  // Nhả tay trúng nền tối cũng đóng bản đồ ngay khi vừa mở - cùng một lỗi.
  const closeFromBackdrop = () => {
    if (armed) close()
  }

  // Thành phố là hình vuông quanh gốc toạ độ, quy về khoảng 0..SIZE trên màn hình.
  const extent = CITY.half + CITY.roadWidth
  const toPx = (v) => ((v + extent) / (extent * 2)) * SIZE

  const grid = []
  for (let i = 0; i <= CITY.blocks; i++) grid.push(toPx(roadCenter(i)))

  return (
    <div className="map-backdrop" onClick={closeFromBackdrop}>
      <div className="map-window" onClick={(e) => e.stopPropagation()}>
        <div className="map-header">
          <span className="map-title">{t('map.title')}</span>
          <button className="map-close-btn" onClick={close}>✕</button>
        </div>

        <div className="map-body">
          <div className="map-canvas" style={{ width: SIZE, height: SIZE }}>
            {/* Lưới đường phố */}
            <svg width={SIZE} height={SIZE} className="map-grid">
              {grid.map((c, i) => (
                <g key={i}>
                  <line x1={c} y1={0} x2={c} y2={SIZE} />
                  <line x1={0} y1={c} x2={SIZE} y2={c} />
                </g>
              ))}
            </svg>

            {/* Mốc khu vực đặc biệt */}
            {landmarks.map((lm) => {
              const at = landmarkPosition(world, lm)
              return (
                <button
                  key={lm.id}
                  className={`map-pin kind-${lm.kind}`}
                  style={{ left: toPx(at.x), top: toPx(at.z) }}
                  onClick={() => pick(lm)}
                  title={`${lm.name} — ${lm.desc}`}
                >
                  <span className="map-pin-icon">{lm.icon}</span>
                </button>
              )
            })}

            {/* Vị trí người chơi */}
            <div className="map-you" style={{ left: toPx(p.x), top: toPx(p.z) }} title={t('map.youAreHere')}>
              <span>🧒</span>
            </div>
          </div>

          <div className="map-side">
            {travelling ? (
              <div className="map-travelling">
                <span>{t('map.travellingTo')} <b>{travelName}</b></span>
                <button
                  className="map-stop-btn"
                  onClick={() => { cancelTravel(world, t('travel.stopped')); close() }}
                >
                  {t('map.stopButton')}
                </button>
              </div>
            ) : blocked ? (
              <div className="map-blocked">⚠️ {blocked}</div>
            ) : (
              <div className="map-hint">{t('map.hint')}</div>
            )}

            <div className="map-list" ref={listRef}>
              {landmarks.map((lm) => {
                const at = landmarkPosition(world, lm)
                const dist = Math.round(Math.hypot(at.x - p.x, at.z - p.z))
                return (
                  <button
                    key={lm.id}
                    className="map-list-item"
                    onClick={() => pick(lm)}
                    disabled={!!blocked}
                  >
                    <span className="map-item-icon">{lm.icon}</span>
                    <span className="map-item-text">
                      <span className="map-item-name">{lm.name}</span>
                      <span className="map-item-desc">{lm.desc}</span>
                    </span>
                    <span className="map-item-dist">{dist}m</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
