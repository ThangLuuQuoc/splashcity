// Vẽ bao bì từng mặt hàng siêu thị bằng canvas 2D.
//
// Trước đây mỗi món chỉ là một ô màu kèm dòng chữ sans-serif, nên đứng trước kệ không
// tài nào biết mình đang xem hộp gì. Ở đây mỗi mặt hàng có một hình vẽ riêng bắt chước
// đúng dấu hiệu nhận biết của sản phẩm thật: chữ OREO trắng trên nền xanh coban kèm cái
// bánh quy, lon Pringles đỏ với bộ ria, gói Lay's vàng với vòng tròn đỏ...
//
// Toàn bộ vẽ bằng thủ tục, không có file ảnh nào - đúng nguyên tắc "không tài nguyên
// nhị phân" của cả dự án.
//
// Tỉ lệ canvas của mỗi món khớp với tỉ lệ MẶT TRƯỚC của khối hình trong productParts.js.
// Texture phủ lên cả 6 mặt hộp, nhưng chỉ mặt trước là mặt người chơi nhìn vào, nên đó
// là mặt phải đúng tỉ lệ - vẽ hình vuông rồi kéo lên mặt chữ nhật là chữ méo hết.

import { getCanvasTexture } from './assets.js'

// --- bộ đồ vẽ ---------------------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
}

/**
 * Chữ căn giữa, tự thu nhỏ cho vừa bề ngang cho trước.
 *
 * Cần thiết vì tên tiếng Việt có dấu ("BÁNH QUY SÔCÔLA") dài hơn hẳn tên tiếng Anh, mà
 * cùng một khuôn vẽ phải dùng cho cả hai ngôn ngữ.
 */
function fitText(ctx, text, cx, cy, maxWidth, size, style = 'bold') {
  let px = size
  do {
    ctx.font = `${style} ${px}px sans-serif`
    if (ctx.measureText(text).width <= maxWidth) break
    px -= 2
  } while (px > 8)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy)
  return px
}

/** Nền chuyển sắc dọc - làm bao bì bớt phẳng lì dưới ánh sáng của game. */
function verticalGradient(ctx, W, H, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

/** Cái bánh Oreo: vòng ngoài răng cưa, vành hoa văn, chữ nổi giữa bánh. */
function oreoCookie(ctx, cx, cy, r) {
  ctx.fillStyle = '#0f0d0e'
  ellipse(ctx, cx, cy, r, r)
  ctx.fill()

  // Vành răng cưa quanh mép bánh
  ctx.fillStyle = '#1c1819'
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    ellipse(ctx, cx + Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93, r * 0.09, r * 0.09)
    ctx.fill()
  }

  // Hai vòng hoa văn
  ctx.strokeStyle = '#3a3436'
  ctx.lineWidth = Math.max(2, r * 0.05)
  ellipse(ctx, cx, cy, r * 0.78, r * 0.78)
  ctx.stroke()
  ellipse(ctx, cx, cy, r * 0.44, r * 0.44)
  ctx.stroke()

  // Các vạch toả ra giữa hai vòng
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5)
    ctx.lineTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72)
    ctx.stroke()
  }

  ctx.fillStyle = '#4a4244'
  fitText(ctx, 'OREO', cx, cy, r * 0.7, Math.round(r * 0.3))
}

// --- bao bì từng mặt hàng ---------------------------------------------------
// Mỗi mục: kích thước canvas + hàm vẽ. Tỉ lệ canvas = tỉ lệ mặt trước của khối hình.

export const PACKAGING = {
  // Gói Oreo: nền xanh coban, chữ OREO trắng viền xanh nhạt, bánh quy nằm bên phải.
  oreo: {
    w: 512, h: 340,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#2a4fb8', '#0a1f6b')

      // Vệt sữa trắng chạy dưới đáy gói
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.beginPath()
      ctx.moveTo(0, H)
      ctx.quadraticCurveTo(W * 0.3, H * 0.82, W * 0.62, H * 0.93)
      ctx.quadraticCurveTo(W * 0.85, H, W, H * 0.9)
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()

      oreoCookie(ctx, W * 0.8, H * 0.46, H * 0.33)

      // Chữ OREO: nét trắng dày, viền xanh nhạt - dấu hiệu nhận biết mạnh nhất của gói.
      ctx.save()
      ctx.translate(W * 0.36, H * 0.42)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#7fd3f7'
      ctx.lineWidth = 9
      ctx.font = `bold italic ${Math.round(H * 0.36)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText('OREO', 0, 0)
      ctx.fillText('OREO', 0, 0)
      ctx.restore()

      ctx.fillStyle = '#7fd3f7'
      fitText(ctx, 'Original', W * 0.36, H * 0.65, W * 0.4, Math.round(H * 0.14), 'bold italic')

      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      fitText(ctx, 'BÁNH QUY SÔCÔLA', W * 0.36, H * 0.85, W * 0.55, Math.round(H * 0.1))
    },
  },

  // Lon Pringles: vẽ HAI lần cạnh nhau vì texture cuốn quanh thân trụ - nhìn từ hướng
  // nào cũng thấy trọn một khuôn mặt thay vì đúng một mặt còn ba phía kia là lưng lon.
  pringles: {
    w: 1024, h: 800,
    draw(ctx, W, H) {
      const panel = W / 2
      for (let i = 0; i < 2; i++) {
        ctx.save()
        ctx.translate(i * panel, 0)
        pringlesPanel(ctx, panel, H)
        ctx.restore()
      }
    },
  },

  // Gói Lay's: nền vàng, vòng tròn đỏ, chữ trắng - kèm mấy lát khoai tây.
  lays: {
    w: 440, h: 512,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#ffd93b', '#f0a500')

      // Vòng tròn đỏ đặc trưng
      ctx.fillStyle = '#e01a22'
      ellipse(ctx, W / 2, H * 0.38, W * 0.36, W * 0.36)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 8
      ellipse(ctx, W / 2, H * 0.38, W * 0.36, W * 0.36)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      fitText(ctx, "Lay's", W / 2, H * 0.38, W * 0.55, Math.round(W * 0.28), 'bold italic')

      ctx.fillStyle = '#7a3b00'
      fitText(ctx, 'CLASSIC', W / 2, H * 0.74, W * 0.6, Math.round(W * 0.12))

      // Mấy lát khoai tây vàng rộm nằm dưới
      for (const [dx, dy, r] of [[-0.24, 0.89, 0.14], [0.04, 0.93, 0.16], [0.29, 0.87, 0.12]]) {
        ctx.fillStyle = '#ffe08a'
        ellipse(ctx, W / 2 + W * dx, H * dy, W * r, W * r * 0.62)
        ctx.fill()
        ctx.strokeStyle = '#d69100'
        ctx.lineWidth = 4
        ctx.stroke()
      }
    },
  },

  // Thanh KitKat: nền đỏ, chữ trắng trong khung bo tròn.
  kitkat: {
    w: 300, h: 512,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#e01f26', '#9c0c11')

      ctx.save()
      ctx.translate(W / 2, H * 0.42)
      ctx.rotate(-0.08)
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, -W * 0.42, -H * 0.11, W * 0.84, H * 0.22, H * 0.06)
      ctx.fill()
      ctx.fillStyle = '#e01f26'
      fitText(ctx, 'KitKat', 0, 0, W * 0.72, Math.round(H * 0.13), 'bold italic')
      ctx.restore()

      // Bốn thanh bánh xốp gợi ý bên dưới
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#8a4a1e' : '#a05a26'
        roundRect(ctx, W * (0.1 + i * 0.2), H * 0.62, W * 0.15, H * 0.28, 6)
        ctx.fill()
      }
    },
  },

  // Thanh Meiji: nâu sô-cô-la, logo đỏ, ô vuông sô-cô-la.
  meiji: {
    w: 300, h: 512,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#5a3216', '#2e1708')

      ctx.fillStyle = '#d81e28'
      roundRect(ctx, W * 0.1, H * 0.28, W * 0.8, H * 0.16, H * 0.08)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      fitText(ctx, 'meiji', W / 2, H * 0.36, W * 0.66, Math.round(H * 0.1), 'bold italic')

      ctx.fillStyle = '#ffe9c9'
      fitText(ctx, 'MILK', W / 2, H * 0.52, W * 0.6, Math.round(H * 0.075))
      fitText(ctx, 'CHOCOLATE', W / 2, H * 0.6, W * 0.8, Math.round(H * 0.06))

      // Lưới ô sô-cô-la
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = '#7a4520'
          roundRect(ctx, W * (0.14 + c * 0.25), H * (0.68 + r * 0.09), W * 0.2, H * 0.07, 4)
          ctx.fill()
        }
      }
    },
  },

  // Thanh Feastables: nền xanh da trời, huy hiệu MR BEAST đen trên đỉnh, chữ Feastables
  // trắng to bản, thẻ hồng "MILK CHOCOLATE" và mấy mẩu sô-cô-la rắc quanh.
  feastables: {
    w: 340, h: 512,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#5ad2ee', '#22a8d6')

      // Mấy mẩu sô-cô-la và vụn rắc rải khắp nền
      const chunks = [
        [0.16, 0.16, -0.5], [0.84, 0.2, 0.4], [0.12, 0.55, 0.3],
        [0.88, 0.6, -0.35], [0.24, 0.88, 0.5], [0.76, 0.9, -0.45],
        [0.5, 0.68, 0.18], [0.2, 0.72, -0.6], [0.8, 0.75, 0.55], [0.5, 0.96, -0.2],
      ]
      for (const [fx, fy, rot] of chunks) {
        ctx.save()
        ctx.translate(W * fx, H * fy)
        ctx.rotate(rot)
        ctx.fillStyle = '#4a2810'
        roundRect(ctx, -W * 0.09, -H * 0.028, W * 0.18, H * 0.056, 5)
        ctx.fill()
        ctx.fillStyle = '#6b3d1c'
        roundRect(ctx, -W * 0.075, -H * 0.022, W * 0.15, H * 0.02, 3)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = 'rgba(74, 40, 16, 0.55)'
      for (let i = 0; i < 22; i++) {
        const a = i * 2.399
        ellipse(ctx, W * (0.5 + Math.cos(a) * 0.42), H * (0.5 + Math.sin(a * 1.7) * 0.45), 4, 4)
        ctx.fill()
      }

      // Huy hiệu MR BEAST
      ctx.fillStyle = '#101418'
      roundRect(ctx, W * 0.22, H * 0.1, W * 0.56, H * 0.09, H * 0.045)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      fitText(ctx, 'MR BEAST', W / 2, H * 0.145, W * 0.48, Math.round(H * 0.052))

      // Chữ Feastables - phần nhận ra thanh kẹo ngay từ xa
      ctx.save()
      ctx.translate(W / 2, H * 0.34)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#0f3f52'
      ctx.lineWidth = 7
      ctx.font = `bold italic ${Math.round(H * 0.115)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText('Feastables', 0, 0)
      ctx.fillText('Feastables', 0, 0)
      ctx.restore()

      // Thẻ hồng ghi loại sô-cô-la
      ctx.fillStyle = '#e8467c'
      roundRect(ctx, W * 0.16, H * 0.45, W * 0.68, H * 0.085, H * 0.042)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      fitText(ctx, 'MILK CHOCOLATE', W / 2, H * 0.4925, W * 0.6, Math.round(H * 0.045))

      ctx.fillStyle = 'rgba(15, 63, 82, 0.75)'
      fitText(ctx, '35 g', W / 2, H * 0.58, W * 0.2, Math.round(H * 0.035))
    },
  },

  // Hộp kem đánh răng P/S dâu trẻ em: trắng - đỏ, quả dâu to.
  ps: {
    w: 260, h: 512,
    draw(ctx, W, H) {
      verticalGradient(ctx, W, H, '#ffffff', '#ffd9de')

      ctx.fillStyle = '#d81e3f'
      ctx.fillRect(0, 0, W, H * 0.26)
      ctx.fillStyle = '#ffffff'
      fitText(ctx, 'P/S', W / 2, H * 0.13, W * 0.7, Math.round(H * 0.15))

      // Quả dâu
      ctx.fillStyle = '#e63946'
      ctx.beginPath()
      ctx.moveTo(W * 0.5, H * 0.72)
      ctx.bezierCurveTo(W * 0.16, H * 0.62, W * 0.2, H * 0.36, W * 0.5, H * 0.4)
      ctx.bezierCurveTo(W * 0.8, H * 0.36, W * 0.84, H * 0.62, W * 0.5, H * 0.72)
      ctx.fill()
      ctx.fillStyle = '#ffe066'
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        ellipse(ctx, W * 0.5 + Math.cos(a) * W * 0.16, H * 0.54 + Math.sin(a) * H * 0.07, 5, 4)
        ctx.fill()
      }
      ctx.fillStyle = '#2f7d32'
      for (let i = -2; i <= 2; i++) {
        ctx.save()
        ctx.translate(W * 0.5, H * 0.4)
        ctx.rotate(i * 0.45)
        ctx.fillRect(-W * 0.04, -H * 0.07, W * 0.08, H * 0.08)
        ctx.restore()
      }

      ctx.fillStyle = '#d81e3f'
      fitText(ctx, 'TRẺ EM', W / 2, H * 0.85, W * 0.8, Math.round(H * 0.09))
    },
  },

  // Lon nước ngọt Cocacla đỏ tươi mát với dải lượn sóng trắng
  coca_cola: {
    w: 768, h: 620,
    draw(ctx, W, H) {
      const panel = W / 2
      for (let i = 0; i < 2; i++) {
        ctx.save()
        ctx.translate(i * panel, 0)
        verticalGradient(ctx, panel, H, '#e50914', '#9e0000')

        // Dải lượn sóng trắng đặc trưng
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.beginPath()
        ctx.moveTo(0, H * 0.62)
        ctx.bezierCurveTo(panel * 0.35, H * 0.48, panel * 0.65, H * 0.72, panel, H * 0.55)
        ctx.lineTo(panel, H * 0.62)
        ctx.bezierCurveTo(panel * 0.65, H * 0.78, panel * 0.35, H * 0.55, 0, H * 0.68)
        ctx.closePath()
        ctx.fill()

        // Chữ Cocacla uốn lượn phong cách thư pháp
        ctx.fillStyle = '#ffffff'
        ctx.save()
        ctx.translate(panel / 2, H * 0.38)
        ctx.rotate(-0.1)
        fitText(ctx, 'Cocacla', 0, 0, panel * 0.85, Math.round(H * 0.28), 'bold italic')
        ctx.restore()

        // Phụ đề vị nguyên bản
        ctx.fillStyle = '#ffffff'
        fitText(ctx, 'ORIGINAL TASTE', panel / 2, H * 0.76, panel * 0.65, Math.round(H * 0.075))
        fitText(ctx, '330ml', panel / 2, H * 0.88, panel * 0.35, Math.round(H * 0.055))
        ctx.restore()
      }
    },
  },

  // Lon nước ngọt Pensi xanh dương với biểu tượng quả cầu đỏ-trắng-xanh
  pepsi: {
    w: 768, h: 620,
    draw(ctx, W, H) {
      const panel = W / 2
      for (let i = 0; i < 2; i++) {
        ctx.save()
        ctx.translate(i * panel, 0)
        verticalGradient(ctx, panel, H, '#0055b8', '#002255')

        // Biểu tượng tròn Pensi đỏ - trắng - xanh ở giữa
        const cx = panel / 2
        const cy = H * 0.36
        const r = H * 0.16

        // Nửa trên màu đỏ
        ctx.fillStyle = '#e60012'
        ctx.beginPath()
        ctx.arc(cx, cy, r, Math.PI, 0)
        ctx.bezierCurveTo(cx + r * 0.5, cy + r * 0.35, cx - r * 0.5, cy - r * 0.35, cx - r, cy)
        ctx.fill()

        // Nửa dưới màu xanh
        ctx.fillStyle = '#004b93'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI)
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.35, cx + r * 0.5, cy + r * 0.35, cx + r, cy)
        ctx.fill()

        // Viền trắng quả cầu
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()

        // Chữ Pensi in đậm hiện đại
        ctx.fillStyle = '#ffffff'
        fitText(ctx, 'PENSI', panel / 2, H * 0.62, panel * 0.75, Math.round(H * 0.18), 'bold')

        // Phụ đề mát lạnh
        ctx.fillStyle = '#90e0ef'
        fitText(ctx, 'ICE COLD SẢNG KHOÁI', panel / 2, H * 0.77, panel * 0.7, Math.round(H * 0.07))
        ctx.fillStyle = '#ffffff'
        fitText(ctx, '330ml', panel / 2, H * 0.88, panel * 0.35, Math.round(H * 0.055))
        ctx.restore()
      }
    },
  },
}

/** Một khuôn mặt Pringles trên nền đỏ - phần nhận biết chính của lon. */
function pringlesPanel(ctx, W, H) {
  verticalGradient(ctx, W, H, '#e4002b', '#a30020')

  // Khuôn mặt hình bầu dục
  const cx = W / 2
  const cy = H * 0.4
  const rx = W * 0.34
  const ry = H * 0.22
  ctx.fillStyle = '#f8f2e6'
  ellipse(ctx, cx, cy, rx, ry)
  ctx.fill()

  // Hai chỏm tóc. Để cao và nhọn thì hoá ra hai cái tai mèo, nên vuốt thấp và bẹt hẳn.
  ctx.fillStyle = '#1a1a1a'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + side * rx * 0.62, cy - ry * 0.66)
    ctx.quadraticCurveTo(cx + side * rx * 0.55, cy - ry * 1.12, cx + side * rx * 0.1, cy - ry * 0.98)
    ctx.quadraticCurveTo(cx + side * rx * 0.34, cy - ry * 0.82, cx + side * rx * 0.62, cy - ry * 0.66)
    ctx.fill()
  }

  // Lông mày và mắt
  ctx.fillStyle = '#1a1a1a'
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(cx + side * rx * 0.32, cy - ry * 0.34)
    ctx.rotate(side * 0.2)
    ctx.fillRect(-rx * 0.16, -ry * 0.07, rx * 0.32, ry * 0.11)
    ctx.restore()
    ellipse(ctx, cx + side * rx * 0.32, cy - ry * 0.02, rx * 0.07, ry * 0.1)
    ctx.fill()
  }

  // Bộ ria - chi tiết ai cũng nhận ra ngay
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.moveTo(cx, cy + ry * 0.28)
  ctx.bezierCurveTo(cx - rx * 0.3, cy + ry * 0.1, cx - rx * 0.95, cy + ry * 0.3, cx - rx * 0.72, cy + ry * 0.78)
  ctx.bezierCurveTo(cx - rx * 0.5, cy + ry * 0.95, cx - rx * 0.16, cy + ry * 0.72, cx, cy + ry * 0.52)
  ctx.bezierCurveTo(cx + rx * 0.16, cy + ry * 0.72, cx + rx * 0.5, cy + ry * 0.95, cx + rx * 0.72, cy + ry * 0.78)
  ctx.bezierCurveTo(cx + rx * 0.95, cy + ry * 0.3, cx + rx * 0.3, cy + ry * 0.1, cx, cy + ry * 0.28)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  fitText(ctx, 'Pringles', cx, H * 0.73, W * 0.82, Math.round(H * 0.14), 'bold italic')

  // Dải vàng ghi vị
  ctx.fillStyle = '#ffd60a'
  roundRect(ctx, W * 0.18, H * 0.83, W * 0.64, H * 0.11, H * 0.055)
  ctx.fill()
  ctx.fillStyle = '#7a1000'
  fitText(ctx, 'ORIGINAL', cx, H * 0.885, W * 0.56, Math.round(H * 0.07))
}

/** Texture bao bì, dựng một lần cho cả phiên chơi. */
export function packagingTexture(id) {
  const art = PACKAGING[id]
  if (!art) return null
  return getCanvasTexture(`pack:${id}`, art.w, art.h, (ctx) => art.draw(ctx, art.w, art.h))
}
