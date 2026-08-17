# Hướng dẫn Mở rộng Tính năng Mới (Adding New Features)

Tài liệu này là một cẩm nang (Cookbook) từng bước hướng dẫn các kỹ sư phần mềm mở rộng các tính năng mới cho **Splash City** theo đúng chuẩn kiến trúc của dự án.

---

## 1. Hướng dẫn Thêm một Trò Quậy Phá / Vũ Khí Mới (New Mischief / Action)

*Ví dụ: Thêm tính năng đặt **Vỏ Chuối (Banana Peel)** làm trượt bánh xe cảnh sát.*

```
[Bấm phím X] ──> [actions.js: Thả vỏ chuối] ──> [world.bananas pool]
                                                       │
                                  ┌────────────────────┴───────────────────┐
                                  ▼                                        ▼
                   [physics.js: Kiểm tra xe đè trúng]       [Effects.jsx: Render vỏ chuối]
                                  │
                                  ▼
                   [Xe mất lái, xoay 360 độ + Điểm thưởng]
```

### Bước 1: Khai báo Cấu hình trong `src/game/config.js`
```javascript
export const ACTIONS = {
  // ... cấu hình cũ
  bananaCooldown: 1.0,
  bananaSpinDuration: 2.0,
  maxBananas: 20,
}

export const SCORE = {
  // ...
  slipCop: 150, // Thưởng 150 điểm khi làm cảnh sát trượt vỏ chuối
}
```

### Bước 2: Thêm Object Pool vào `src/game/world.js`
```javascript
export function createWorld() {
  // ...
  world.bananas = pool(ACTIONS.maxBananas, () => ({
    active: false,
    x: 0,
    z: 0,
    y: 0,
    life: 0,
  }))
  return world
}
```

### Bước 3: Xử lý Kích hoạt trong `src/game/systems/actions.js`
```javascript
import { keyPressed } from './input.js'

export function updateActions(world, dt) {
  // ...
  if (keyPressed('KeyX') && world.player.mode === 'car') {
    spawnBanana(world)
  }
}

function spawnBanana(world) {
  const banana = world.bananas.find(b => !b.active)
  if (!banana) return
  
  const p = world.player
  banana.active = true
  banana.x = p.x
  banana.z = p.z
  banana.y = 0
  banana.life = 30 // Tồn tại trong 30 giây
}
```

### Bước 4: Kiểm tra Va chạm & Hiệu ứng trong `src/game/systems/physics.js`
```javascript
export function resolveBananas(world, dt) {
  for (const b of world.bananas) {
    if (!b.active) continue
    b.life -= dt
    if (b.life <= 0) { b.active = false; continue }

    for (const cop of world.police) {
      if (!cop.active) continue
      const dist = Math.hypot(cop.x - b.x, cop.z - b.z)
      if (dist < 2.0) {
        // Cảnh sát trượt vỏ chuối: Mất lái xoay vòng
        cop.steer = (Math.random() - 0.5) * 10
        cop.heading += 6 * dt
        b.active = false
        world.score += SCORE.slipCop
        break
      }
    }
  }
}
```

### Bước 5: Render Hình ảnh trong `src/render/Effects.jsx`
Tạo một `InstancedMesh` nhỏ hiển thị mô hình vỏ chuối màu vàng tại tọa độ $(x, y, z)$ của từng quả chuối đang `active`.

---

## 2. Hướng dẫn Thêm một Kiểu Thời tiết Mới (New Weather State)

*Ví dụ: Thêm trạng thái **Sương mù Dày đặc (Dense Fog)**.*

### Bước 1: Định nghĩa Trạng thái trong `src/game/weather.js`
```javascript
export const WEATHER_STATES = {
  // ... các trạng thái sunny, rainy ...
  foggy: {
    name: 'foggy',
    skyDarkness: 0.3,
    sunDim: 0.7,
    fogDensity: 0.025,       // Sương mù cực dày
    rain: 0.0,
    snow: 0.0,
    windStrength: 0.1,
    windAngle: 0.0,
    lightning: 0.0,
    wetness: 0.2,
    snowCover: 0.0,
  }
}
```

### Bước 2: Bổ sung vào Ma trận Chuyển tiếp (Transition Table)
```javascript
export const WEATHER_TRANSITIONS = {
  cloudy: ['sunny', 'rainy', 'windy', 'foggy'],
  foggy: ['cloudy', 'sunny'],
  // ...
}
```

### Bước 3: Thêm Biểu tượng Icon trên UI trong `src/ui/WeatherWidget.jsx`
```javascript
const ICONS = {
  sunny: '☀️',
  cloudy: '☁️',
  windy: '🍃',
  rainy: '🌧️',
  thunderstorm: '⛈️',
  snowy: '🌨️',
  foggy: '🌫️',
}
```

Nhờ kiến trúc pha trộn (blending params), bầu trời, tầm nhìn sương mù và ánh sáng Three.js sẽ tự động chuyển đổi mượt mà mà không cần chỉnh sửa shader!

---

## 3. Hướng dẫn Thêm một Loại Xe Mới (New Vehicle Variant)

*Ví dụ: Thêm **Xe Tải Kem (Ice Cream Truck)** chạy phát nhạc dạo phố.*

1. **Thêm loại xe vào `src/game/world.js`**:
   ```javascript
   cars.push({
     // ... các thuộc tính cũ
     kind: 'ice_cream', // 'traffic' | 'parked' | 'police' | 'ice_cream'
     chimeTimer: 0,
   })
   ```
2. **Xử lý Logic riêng trong `src/game/systems/traffic.js`**:
   Khi người chơi đến gần Xe Kem trong bán kính $6$ đơn vị, phát âm thanh chuông kem từ Web Audio API.
3. **Mở rộng Render trong `src/render/Cars.jsx`**:
   Bổ sung thêm hộp trang trí (mô hình que kem 3D trên nóc xe) trong `Cars.jsx` cho các xe có `kind === 'ice_cream'`.

---

## 4. Danh sách Kiểm tra trước khi Merge Code (PR Checklist)

- [ ] Không có `useState` hay phân bổ bộ nhớ mới (`new Array`, `new Object`) bên trong vòng lặp `useFrame`.
- [ ] Mọi tham số mới đã được khai báo tập trung trong `src/game/config.js`.
- [ ] Không sử dụng file binary 3D / audio ngoài, giữ vững kiến trúc 100% Procedural.
- [ ] Kiểm tra mượt mà 60 FPS trên máy tính bảng hoặc chế độ Device Emulation của Chrome DevTools.
- [ ] Đã chạy thử lệnh `npm run build` và kiểm tra không có lỗi cú pháp hoặc cảnh báo build.
