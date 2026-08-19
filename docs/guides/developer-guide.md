# Hướng dẫn Phát triển (Developer Guide)

Tài liệu này dành cho các kỹ sư phần mềm bắt đầu làm việc hoặc đóng góp mã nguồn cho dự án **Splash City**.

---

## 1. Yêu cầu Môi trường & Thiết lập Ban đầu

### Yêu cầu Hệ thống
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyến nghị LTS Node 20+)
- **NPM**: Phiên bản `>= 9.0.0`
- **Trình duyệt**: Bất kỳ trình duyệt hiện đại nào hỗ trợ WebGL 2.0 và Web Audio API (Chrome, Edge, Firefox, Safari).

### Cài đặt
1. Clone mã nguồn về máy:
   ```bash
   git clone https://github.com/ThangLuuQuoc/splashcity.git
   cd splashcity
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

---

## 2. Các Lệnh Thực thi (Available NPM Scripts)

| Lệnh | Mục đích |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển Vite với Hot Module Replacement (HMR) tại `http://localhost:5173`. |
| `npm run build` | Đóng gói toàn bộ ứng dụng thành các file tĩnh production trong thư mục `dist/`. |
| `npm run preview` | Khởi chạy máy chủ cục bộ để kiểm tra bản build production từ `dist/`. |
| `npm run icons` | Tự động sinh bộ icon PWA/Favicon thủ tục từ script `scripts/make-icons.mjs`. |

---

## 3. Cấu trúc Dự án (Directory Structure)

```
splashcity/
├── docs/                      # Toàn bộ tài liệu kiến trúc & hướng dẫn phát triển
├── public/                    # Tài nguyên tĩnh công khai (manifest, icons, service worker)
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── *.png
├── scripts/                   # Script tiện ích dòng lệnh (sinh icon PWA thủ tục)
│   └── make-icons.mjs
├── src/
│   ├── App.jsx                # Component gốc, khởi tạo Canvas R3F & Quản lý vòng đời
│   ├── main.jsx               # Điểm nhập ứng dụng React
│   │
│   ├── game/                  # LÕI MÔ PHỎNG GAMEPLAY & VẬT LÝ
│   │   ├── config.js          # TOÀN BỘ hằng số cân bằng game (tốc độ, điểm, sao, màu sắc)
│   │   ├── world.js           # Đối tượng trạng thái thế giới mutable & Hàm khởi tạo/respawn
│   │   ├── GameLoop.jsx       # useFrame duy nhất điều phối toàn bộ các systems
│   │   ├── store.js           # Zustand store cho dữ liệu hiển thị trên UI/HUD
│   │   ├── city.js            # Thuật toán sinh thành phố ngẫu nhiên & Đồ thị đường sá
│   │   ├── landmarks.js       # Vị trí các địa danh đặc biệt (Bãi đáp trực thăng, Siêu thị, Đồn CA)
│   │   ├── collision.js       # Hệ thống va chạm Broadphase Grid & Line-of-sight raycast
│   │   ├── rail.js            # Tuyến đường ray trên cao & Bệ ga hành khách
│   │   ├── weather.js         # Máy trạng thái thời tiết & Bộ đếm chu kỳ ngày/đêm
│   │   ├── audio.js           # Bộ tổng hợp âm thanh Web Audio API thời gian thực
│   │   ├── device.js          # Phát hiện thiết bị cảm ứng & Điều chỉnh pixel ratio
│   │   ├── i18n.js            # Quản lý ngôn ngữ & chuyển đổi tức thì
│   │   ├── strings.js         # Từ điển song ngữ Việt - Anh toàn diện
│   │   ├── rng.js             # Bộ sinh số ngẫu nhiên theo Seed xác định
│   │   └── systems/           # CÁC HỆ THỐNG LOGIC RIÊNG BIỆT:
│   │       ├── player.js      # Di chuyển, nhảy, xoay người & camera bám theo
│   │       ├── vehicle.js     # Vật lý lái xe, phanh, trôi dạt (drift)
│   │       ├── helicopter.js  # Cơ chế bay trực thăng 3D, cất/hạ cánh & Autopilot Tour
│   │       ├── interiors.js   # Khám phá nội thất Siêu thị 2 tầng & Trụ sở cảnh sát, thang cuốn
│   │       ├── inventory.js   # Quản lý túi đồ, hiệu ứng Sugar Rush, bẫy vỏ chuối & kem đánh răng
│   │       ├── navigation.js  # Tìm đường GPS, lộ trình tự động chạy (Auto-run)
│   │       ├── traffic.js     # AI xe lưu thông tự động theo đồ thị giao thông
│   │       ├── pedestrians.js # AI người đi bộ, phản ứng hoảng sợ & tìm chỗ trú mưa
│   │       ├── police.js      # BFS tìm đường, rượt đuổi bằng xe & truy đuổi đi bộ
│   │       ├── heat.js        # Điểm nhiệt, cấp độ sao truy nã & cơ chế làm nguội
│   │       ├── train.js       # Vận hành đoàn tàu trên cao, đón/trả khách tại 4 ga
│   │       ├── actions.js     # Xử lý ném bóng nước, xịt sơn tường, mở điện thoại / bản đồ
│   │       ├── projectiles.js # Quỹ đạo đạn đạo bóng nước, táo & nho
│   │       ├── physics.js     # Xử lý va chạm xe đụng xe, bẫy trượt sàn & thùng rác bay
│   │       ├── disasters.js   # Mô phỏng Lốc xoáy & Sóng thần
│   │       ├── weather.js     # Cập nhật thông số ánh sáng, mưa, tuyết
│   │       └── input.js       # Quản lý sự kiện bàn phím, chuột và Pointer Lock
│   │
│   ├── render/                # HỆ THỐNG RENDER 3D & SHADERS (R3F Components)
│   │   ├── Atmosphere.jsx     # Bầu trời gradient, mặt trời động, ánh sáng & sương mù
│   │   ├── City.jsx           # InstancedMesh các tòa nhà, vỉa hè và mặt đường
│   │   ├── Cars.jsx           # InstancedMesh xe dân, xe cảnh sát & bánh xe quay
│   │   ├── Helicopter.jsx     # Render trực thăng 3D & cánh quạt quay mờ
│   │   ├── SupermarketInterior.jsx # Render 2 tầng siêu thị Splash Mart & thang cuốn
│   │   ├── PoliceInterior.jsx # Render sảnh đồn, bàn trực ban, bảng truy nã & phòng giam
│   │   ├── Products.jsx       # Render bao bì sản phẩm bánh kẹo & trái cây
│   │   ├── productParts.js    # Hình học & nhãn Canvas 2D sản phẩm thủ tục
│   │   ├── martLayout.js      # Bố cục sơ đồ quầy kệ siêu thị
│   │   ├── Pedestrians.jsx    # InstancedMesh người đi bộ & hoạt ảnh bước đi
│   │   ├── Player.jsx         # Render mô hình nhân vật người chơi
│   │   ├── Rail.jsx           # Render đường ray, cột trụ viaduct và nhà ga
│   │   ├── Trains.jsx         # Render đoàn tàu điện di chuyển
│   │   ├── Ocean.jsx          # Mặt nước biển với Vertex wave shader
│   │   ├── Disasters.jsx      # Render lốc xoáy xoay tít và bức tường sóng thần
│   │   ├── Precipitation.jsx  # Hệ thống hạt mưa, tuyết và lá cây bay theo gió
│   │   ├── Effects.jsx        # Bóng nước, vỏ chuối, vệt kem đánh răng, sơn tường, bóng đổ
│   │   ├── Props.jsx          # Thùng rác, cọc tiêu chóp nón, đài phun nước
│   │   └── instancing.js      # Tiện ích cập nhật ma trận biến đổi InstancedMesh
│   │
│   └── ui/                    # GIAO DIỆN NGƯỜI DÙNG 2D (HTML/CSS)
│       ├── HUD.jsx            # Đồng hồ, sao truy nã, thanh điểm số, số bóng nước
│       ├── Minimap.jsx        # Bản đồ thu nhỏ thời gian thực với Canvas 2D
│       ├── MapOverlay.jsx     # Bản đồ thành phố toàn màn hình tương tác & GPS
│       ├── PhoneOverlay.jsx   # Giao diện Smartphone SplashPay quét mã QR
│       ├── DisasterBanner.jsx # Cảnh báo thiên tai trên màn hình
│       ├── LangChip.jsx       # Nút chuyển đổi ngôn ngữ Việt / Anh
│       ├── StartScreen.jsx    # Màn hình bắt đầu game
│       ├── BustedOverlay.jsx  # Hiệu ứng màn hình bị cảnh sát bắt giữ
│       ├── TouchControls.jsx  # Cần điều khiển ảo (Virtual Joystick) & nút cảm ứng
│       ├── WeatherWidget.jsx  # Nút bấm đổi thời tiết và thời gian nhanh
│       └── ui.css             # Định kiểu toàn bộ giao diện người dùng
```

---

## 4. Các Quy tắc Vàng khi Lập trình (Golden Rules)

1. **KHÔNG ĐƯA THỰC THỂ GAME VÀO REACT STATE**:
   - Mọi thay đổi vị trí, vận tốc, trạng thái thực thể phải được sửa đổi trực tiếp trên đối tượng `world`.
   - Tuyệt đối không gọi `useState` hoặc `useReducer` bên trong các hệ thống game chạy mỗi frame.
2. **ĐỒNG BỘ UI THÔNG QUA ZUSTAND VỚI TẦN SUẤT HỢP LÝ**:
   - Chỉ đồng bộ vào Zustand store khi giá trị hiển thị (điểm, sao, số đạn, trạng thái menu) có sự thay đổi thực sự hoặc qua bộ đếm thời gian trễ ($5$ Hz).
3. **TRÁNH PHÂN BỔ BỘ NHỚ TRONG GAME LOOP (Zero Allocations in useFrame)**:
   - Tái sử dụng các biến nháp cục bộ (`scratch = []`, vector tạm thời). Không tạo mới `new THREE.Vector3()` hay mảng mới bên trong hàm `update*` chạy mỗi frame để tránh Garbage Collection.
4. **BẢO TỒN ĐỘ CHÍNH XÁC CỦA KHÔNG GIAN MÀU**:
   - Khi viết shader mới, luôn kết thúc bằng `#include <colorspace_fragment>`.
5. **CÂN BẰNG THÔNG SỐ TẠI `config.js`**:
   - Không hardcode các con số ma thuật (magic numbers) trong logic hệ thống. Hãy đưa chúng vào `src/game/config.js` để dễ dàng play-testing.

---

## 5. Hướng dẫn Debugging qua Trình duyệt (Browser Console)

Trong chế độ phát triển, đối tượng thế giới và các thành phần cốt lõi được gắn sẵn vào `window`:

```javascript
// Mở F12 -> Console trong trình duyệt:

// 1. Kiểm tra trạng thái người chơi & vị trí hiện tại
console.log(window.world.player)

// 2. Thêm điểm số quậy phá ngay lập tức
window.world.score += 5000

// 3. Tăng mức độ truy nã lên 4 sao
window.world.heat = 90

// 4. Dịch chuyển nhanh (Teleport) đến Siêu thị Splash Mart
window.world.player.x = 400; window.world.player.y = -80; window.world.player.z = 0;
window.world.interior = 'supermarket';

// 5. Thêm tất cả các vật phẩm vào túi đồ
window.world.inventory.push({ id: 'banana', count: 5 }, { id: 'oreo', count: 3 })

// 6. Kích hoạt trực thăng Autopilot Tour
window.world.player.mode = 'heli';
window.world.helicopter.tourActive = true;

// 7. Kích hoạt thiên tai thủ công
import('./src/game/systems/disasters.js').then(m => m.triggerDisaster(window.world, 'tornado'))
```

---

## 6. Phím tắt Dành cho Nhà phát triển (Developer Hotkeys)

Khi đang trong game, bạn có thể sử dụng các phím tắt sau để kiểm tra tính năng nhanh:

| Phím | Chức năng |
| :--- | :--- |
| `C` | Đổi sang trạng thái thời tiết tiếp theo (Nắng ➔ Mây ➔ Gió ➔ Mưa ➔ Bão ➔ Tuyết). |
| `N` | Nhảy nhanh thời gian trong ngày sang mốc tiếp theo (Sáng ➔ Trưa ➔ Chiều ➔ Tối ➔ Nửa đêm). |
| `T` | Kích hoạt ngay lập tức một cơn Lốc xoáy (Tornado). |
| `Y` | Kích hoạt ngay lập tức một cơn Sóng thần (Tsunami). |
| `P` | Mở / Đóng Smartphone SplashPay. |
| `M` | Mở / Đóng Bản đồ thành phố & Điều hướng GPS. |
| `H` | Bật / Tắt chế độ Trực thăng Bay tự động ngắm cảnh (Tour Autopilot). |
| `1` - `4` | Sử dụng nhanh các vật phẩm trong túi đồ (Vỏ chuối, Bánh kẹo, Kem đánh răng). |
| `Esc` | Mở khóa con trỏ chuột (Release Pointer Lock). |
