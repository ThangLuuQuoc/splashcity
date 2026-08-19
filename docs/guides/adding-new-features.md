# Hướng dẫn Mở rộng Tính năng Mới (Adding New Features)

Tài liệu này là một cẩm nang (Cookbook) từng bước hướng dẫn các kỹ sư phần mềm mở rộng các tính năng mới cho **Splash City** theo đúng chuẩn kiến trúc của dự án.

---

## 1. Thêm một Sản phẩm Mới vào Siêu thị Splash Mart

*Ví dụ: Thêm sản phẩm **Trà Sữa Trân Châu (Boba Milk Tea)** vào kệ đồ uống Tầng 2.*

### Bước 1: Khai báo trong `src/game/config.js`
Thêm sản phẩm vào mảng `SUPERMARKET_PRODUCTS`:
```javascript
export const SUPERMARKET_PRODUCTS = [
  // ...
  {
    id: 'boba_tea',
    name: 'Trà Sữa Trân Châu Đường Đen',
    shortName: 'Trà Sữa Boba',
    category: 'drinks',
    price: 40000,
    shelf: 'shelf_drinks',
    color: '#8b5a2b',
    icon: '🧋',
    desc: 'Hút trân châu nhận Sugar Rush siêu tốc độ trong 15s',
    type: 'snack_speed',
  },
]
```

### Bước 2: Tạo Hình học & Nhãn Bao bì trong `src/render/productParts.js`
Thêm hàm vẽ ly trà sữa thủ tục:
```javascript
export function createBobaCupGeometry() {
  // Tạo hình trụ thon dần về đáy (CylinderGeometry)
  return new THREE.CylinderGeometry(0.18, 0.14, 0.42, 16)
}
```

### Bước 3: Xử lý Hiệu ứng khi Sử dụng trong `src/game/systems/inventory.js`
```javascript
export function useItem(world, item) {
  if (item.id === 'boba_tea') {
    // Kích hoạt buff tăng 70% tốc độ chạy trong 15 giây
    addBuff(world, { type: 'speed', multiplier: 1.7, duration: 15.0 })
    playBobaSound() // Web Audio API sound
  }
}
```

---

## 2. Thêm một Bãi đáp Trực thăng / Địa danh Mới (New Helipad Landmark)

*Ví dụ: Thêm bãi đáp trực thăng trên nóc Khách sạn Grand Hotel.*

### Bước 1: Khai báo Địa danh trong `src/game/landmarks.js`
```javascript
export const LANDMARKS = [
  // ...
  {
    id: 'hotel_helipad',
    name: 'Bãi đáp Khách sạn Grand Hotel',
    type: 'helipad',
    x: 120,
    y: 38.5, // Tọa độ nóc tòa nhà
    z: -88,
    icon: '🚁',
  },
]
```

### Bước 2: Cập nhật Lộ trình Bay Tự động trong `src/game/systems/helicopter.js`
Trực thăng Autopilot Tour sẽ tự động nhận diện địa danh mới và bổ sung vào danh sách các điểm lượn tròn ngắm cảnh!

---

## 3. Thêm một Câu Dịch Đa Ngôn ngữ Mới (Localization)

*Ví dụ: Thêm thông báo mới khi nhặt được siêu vũ khí.*

### Bước 1: Khai báo chuỗi song ngữ trong `src/game/strings.js`
```javascript
export const STRINGS = {
  vi: {
    // ...
    mega_balloon_acquired: 'Đã nhận được Siêu Bóng Nước Khổng Lồ!',
  },
  en: {
    // ...
    mega_balloon_acquired: 'Mega Water Balloon Acquired!',
  },
}
```

### Bước 2: Sử dụng trong UI hoặc Gameplay thông qua `t()`
```javascript
import { t } from '../i18n.js'

// Trong HUD hoặc Toast thông báo:
showMessage(t('mega_balloon_acquired'))
```

---

## 4. Thêm một Kiểu Thời tiết Mới (New Weather State)

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

## 5. Danh sách Kiểm tra trước khi Merge Code (PR Checklist)

- [ ] Không có `useState` hay phân bổ bộ nhớ mới (`new Array`, `new Object`) bên trong vòng lặp `useFrame`.
- [ ] Mọi phím tắt mới tuân thủ **Hợp đồng Sở hữu Input** (chỉ 1 hệ thống duy nhất xử lý).
- [ ] Mọi tham số mới đã được khai báo tập trung trong `src/game/config.js`.
- [ ] Các chuỗi văn bản hiển thị cho người dùng đều được bọc qua `t('key')` trong `src/game/strings.js`.
- [ ] Không sử dụng file binary 3D / audio ngoài, giữ vững kiến trúc 100% Procedural.
- [ ] Kiểm tra mượt mà 60 FPS trên thiết bị di động hoặc chế độ Device Emulation của Chrome DevTools.
- [ ] Đã chạy thử lệnh `npm run build` và kiểm tra không có lỗi cú pháp hoặc cảnh báo build.
