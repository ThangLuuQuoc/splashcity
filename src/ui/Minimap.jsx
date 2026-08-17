import { useEffect, useRef } from 'react'
import { CITY } from '../game/config.js'
import { roadCenter } from '../game/city.js'
import { landmarkPosition } from '../game/landmarks.js'

const SIZE = 168
const VIEW = 220 // world units visible across the minimap

// Drawn straight onto a 2D canvas from the mutable world - never through React.
export default function Minimap({ world }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    let raf
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const p = world.player
      const scale = SIZE / VIEW
      const toX = (wx) => (wx - p.x) * scale + SIZE / 2
      const toY = (wz) => (wz - p.z) * scale + SIZE / 2

      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.save()
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
      ctx.clip()

      ctx.fillStyle = '#2f4a33'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Roads.
      ctx.strokeStyle = '#565b66'
      ctx.lineWidth = CITY.roadWidth * scale
      ctx.beginPath()
      for (let i = 0; i <= CITY.blocks; i++) {
        const c = roadCenter(i)
        ctx.moveTo(toX(c), toY(-CITY.half - CITY.roadWidth))
        ctx.lineTo(toX(c), toY(CITY.half + CITY.roadWidth))
        ctx.moveTo(toX(-CITY.half - CITY.roadWidth), toY(c))
        ctx.lineTo(toX(CITY.half + CITY.roadWidth), toY(c))
      }
      ctx.stroke()

      // Railway loop, its stations, and the trains running on it.
      const rail = world.city.rail
      ctx.strokeStyle = '#e0e4ea'
      ctx.lineWidth = 2.5
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      rail.pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(toX(p.x), toY(p.z))
        else ctx.lineTo(toX(p.x), toY(p.z))
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#ffd23f'
      ctx.strokeStyle = '#2a2f38'
      ctx.lineWidth = 1.5
      for (const st of rail.stations) {
        ctx.beginPath()
        ctx.rect(toX(st.x) - 3.5, toY(st.z) - 3.5, 7, 7)
        ctx.fill()
        ctx.stroke()
      }

      ctx.fillStyle = '#2a9d8f'
      for (const train of world.trains) {
        for (const car of train.cars) {
          ctx.beginPath()
          ctx.arc(toX(car.x), toY(car.z), 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Fountains (balloon refills).
      ctx.fillStyle = '#4fc3f7'
      for (const f of world.fountains) {
        ctx.beginPath()
        ctx.arc(toX(f.x), toY(f.z), 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Đường đang tự động chạy tới, vẽ dưới các mốc.
      const travel = world.travel
      if (travel && travel.active && travel.path.length) {
        ctx.strokeStyle = 'rgba(6, 214, 160, 0.9)'
        ctx.lineWidth = 3
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(SIZE / 2, SIZE / 2)
        for (let i = travel.index; i < travel.path.length; i++) {
          const wp = travel.path[i]
          ctx.lineTo(toX(wp.x), toY(wp.z))
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Các khu vực đặc biệt. Mốc nằm ngoài tầm nhìn được kẹp vào viền minimap kèm
      // mũi chỉ hướng - nếu không thì đồn cảnh sát và siêu thị gần như vô hình, vì
      // minimap chỉ thấy 220m trong khi thành phố rộng gần 400m.
      const radius = SIZE / 2 - 1
      const pulse = 0.5 + 0.5 * Math.sin(world.time * 3)
      for (const lm of world.landmarks || []) {
        const at = landmarkPosition(world, lm)
        let mx = toX(at.x)
        let my = toY(at.z)
        const dx = mx - SIZE / 2
        const dy = my - SIZE / 2
        const dist = Math.hypot(dx, dy)
        const offscreen = dist > radius - 10

        if (offscreen) {
          const k = (radius - 10) / dist
          mx = SIZE / 2 + dx * k
          my = SIZE / 2 + dy * k
        }

        // Vòng nhấp nháy cho các khu vực vào được, để chúng nổi hơn mốc thường.
        if (lm.kind === 'interior') {
          ctx.strokeStyle = `rgba(255, 209, 102, ${0.35 + 0.5 * pulse})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(mx, my, 8 + pulse * 3, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.fillStyle = lm.color
        ctx.strokeStyle = offscreen ? 'rgba(255,255,255,0.55)' : '#12161d'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(mx, my, offscreen ? 5 : 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        if (!offscreen) {
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(lm.icon, mx, my + 0.5)
        }
      }

      // Đích đang chạy tới: vòng tròn xanh nổi bật.
      if (travel && travel.active) {
        ctx.strokeStyle = '#06d6a0'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(toX(travel.destX), toY(travel.destZ), 10 + pulse * 3, 0, Math.PI * 2)
        ctx.stroke()
      }


      // Trực thăng: cánh quạt quay để phân biệt với mốc tĩnh, và khi người chơi đang
      // bay thì vòng ngoài cho biết bán kính tầm nhìn từ trên cao.
      const heli = world.heli
      if (heli) {
        const hx = toX(heli.x)
        const hy = toY(heli.z)
        ctx.strokeStyle = '#ef233c'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(hx, hy, 5, 0, Math.PI * 2)
        ctx.stroke()
        const blade = world.time * 8
        ctx.beginPath()
        for (let i = 0; i < 2; i++) {
          const a = blade + (i * Math.PI) / 2
          ctx.moveTo(hx - Math.cos(a) * 6, hy - Math.sin(a) * 6)
          ctx.lineTo(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6)
        }
        ctx.stroke()
      }

      // Cops.
      const flash = Math.floor(world.time * 6) % 2 === 0
      ctx.fillStyle = flash ? '#ff3355' : '#3f7bff'
      for (const cop of world.police) {
        if (!cop.active) continue
        ctx.beginPath()
        ctx.arc(toX(cop.x), toY(cop.z), 4, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const cop of world.footCops) {
        if (!cop.active) continue
        ctx.beginPath()
        ctx.arc(toX(cop.x), toY(cop.z), 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Player arrow.
      ctx.save()
      ctx.translate(SIZE / 2, SIZE / 2)
      ctx.rotate(-p.heading + Math.PI)
      ctx.fillStyle = '#ffd23f'
      ctx.strokeStyle = '#1b1b1b'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(5, 6)
      ctx.lineTo(0, 3)
      ctx.lineTo(-5, 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.restore()

      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
      ctx.stroke()
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [world])

  return (
    <div className="hud-panel hud-minimap">
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
    </div>
  )
}
