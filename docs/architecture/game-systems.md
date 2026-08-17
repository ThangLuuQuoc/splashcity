# Chi tiết các Hệ thống Gameplay (Game Systems)

Tài liệu này cung cấp đặc tả kỹ thuật chi tiết về cơ chế hoạt động, thuật toán và logic điều khiển của từng hệ thống trong **Splash City**.

---

## 1. Hệ thống Người chơi & Điều khiển Phương tiện

### 1.1 Trạng thái Người chơi (`player.js`)
Người chơi có thể chuyển đổi giữa 3 chế độ di chuyển (`mode`):
- `'foot'` (Đi bộ / Chạy nước rút)
- `'car'` (Lái xe hơi)
- `'train'` (Đi tàu điện trên cao)

```
[Đi bộ] ──── (Ấn E gần xe) ────> [Lái xe]
   │                                │
 (Ấn E gần cửa tàu)           (Ấn E ra xe)
   │                                │
   ▼                                ▼
[Lên tàu] <─── (Nhảy khỏi tàu) ── [Đi bộ]
```

- **Đi bộ & Chạy nước rút**:
  - Vận tốc đi bộ: `7.5` đơn vị/giây, chạy nước rút (`Shift` hoặc đẩy hết cần analog): `13` đơn vị/giây.
  - Gia tốc xoay người mượt mà: `turnLerp = 14`, cơ thể người chơi tự động xoay mượt theo hướng chuyển động.
  - Nhảy & Trọng lực: Vận tốc nhảy `jumpSpeed = 7.5`, trọng lực `gravity = 24`.

### 1.2 Vật lý Xe hơi phong cách Arcade (`vehicle.js`)
Mô phỏng vật lý xe hơi không sử dụng mô hình raycast wheel phức tạp mà dùng mô hình arcade 2 bánh dẫn hướng:
- **Tăng tốc & Phanh**: Gia tốc `accel = 22`, lực phanh `brake = 40`, vận tốc lùi tối đa `maxReverse = 10`.
- **Góc lái phụ thuộc tốc độ (Speed-sensitive Steering)**:
  $$\text{steerRate} = \text{baseSteer} \times (1 - \text{speedFraction} \times \text{steerSpeedFalloff})$$
  Giúp xe dễ quay đầu ở tốc độ thấp nhưng ổn định, không bị văng mạnh ở tốc độ tối đa ($30$ đơn vị/giây).
- **Vật lý Bumper-car**: Khi hai xe va chạm, lực đẩy xung lượng phản xạ đối xứng (`resolveCircles` với `bumpImpulse = 0.9`) tạo cảm giác xe đụng vui nhộn.

---

## 2. Hệ thống Giao thông & Người đi bộ AI

### 2.1 Mạng lưới Giao thông Thành phố (`city.js`)
- Thành phố là một ma trận khối nhà $7 \times 7$.
- Các giao lộ tạo thành một **Đồ thị Giao thông (Road Graph)** gồm các `nodes` có tọa độ $(x, z)$ và danh sách các nút lân cận `nb: number[]`.
- **Quy tắc Lái xe Bên Phải (Right-hand Traffic)**:
  Hàm `laneOffset(dirX, dirZ)` tính toán vector pháp tuyến vuông góc với hướng đi để xe luôn chạy ở làn bên phải:
  $$\Delta x = -dirZ \times \frac{\text{roadWidth}}{4}, \quad \Delta z = dirX \times \frac{\text{roadWidth}}{4}$$

### 2.2 Trí tuệ Nhân tạo Xe Lưu thông (`traffic.js`)
- Mỗi xe AI lưu giữ `node` hiện tại và `next` node đích.
- Khi đến gần `next` node trong phạm vi $3.5$ đơn vị, xe sẽ chọn ngẫu nhiên một nút liên kết tiếp theo (loại trừ việc quay đầu $180^\circ$ trừ khi đường cụt).
- Xe tự động giảm tốc khi có vật cản hoặc xe phía trước cùng làn.

### 2.3 Người đi bộ Dạo phố (`pedestrians.js`)
- Người đi bộ di chuyển trên các vòng vỉa hè (`ringPoint`) bao quanh từng khối nhà theo chiều kim đồng hồ hoặc ngược lại.
- **Trạng thái Hoảng sợ (Flee State)**: Khi bị bóng nước bắn trúng, bị xe đụng trúng, hoặc nghe sấm sét/lốc xoáy gần đó, người đi bộ chuyển sang trạng thái hoảng sợ trong `5` giây, chạy trốn khỏi tâm nguy hiểm với tốc độ gấp 3 lần (`7.0` đơn vị/giây).
- **Tránh mưa & Trú ẩn**: Mỗi người đi bộ có chỉ số nhút nhát `shy` ngẫu nhiên ($0.15 \dots 0.85$). Khi chỉ số mưa/bão trong `world.weather.params.rain` vượt ngưỡng này, người đi bộ sẽ tự động đi vào cửa tòa nhà gần nhất (`indoors = true`) và biến mất khỏi đường phố.

---

## 3. Hệ thống Cảnh sát & Độ Truy nã (Police & Heat System)

### 3.1 Hệ thống Nhiệt & Số Sao Truy nã (`heat.js`)
Điểm nhiệt `heat` dao động từ $0$ đến $100$.

| Mức Sao | Ngưỡng Nhiệt | Số lượng Cảnh sát tối đa | Hành vi |
| :---: | :---: | :---: | :--- |
| ⭐ (1 Sao) | $\ge 15$ | 1 xe | Rượt đuổi cơ bản |
| ⭐⭐ (2 Sao) | $\ge 35$ | 2 xe | Tăng tốc độ tuần tra |
| ⭐⭐⭐ (3 Sao) | $\ge 60$ | 4 xe | Chặn đầu, cảnh sát rời xe rượt bộ |
| ⭐⭐⭐⭐ (4 Sao) | $\ge 85$ | 6 xe | Rượt đuổi gắt gao toàn lực |

- **Cơ chế Mất dấu (Cooling down)**: Nếu người chơi cắt được tầm nhìn của tất cả cảnh sát trong vòng **6 giây** (`escapeDelay`), các ngôi sao sẽ nhấp nháy và điểm nhiệt giảm dần với tốc độ `7` điểm/giây.

### 3.2 Thuật toán Tìm đường BFS (Breadth-First Distance Field)
Trong [`src/game/systems/police.js`](file:///f:/2027/splashcity/src/game/systems/police.js):
- Cứ mỗi $0.33$ giây (3 Hz), hệ thống lấy giao lộ gần người chơi nhất làm gốc (Root) và chạy thuật toán loang BFS trên đồ thị đường phố để tính ma trận khoảng cách `distanceField`.
- Xe cảnh sát ở xa chỉ cần đi theo hướng giảm dần của trường khoảng cách (Gradient Descent trên lưới giao thông).

```
[Người chơi tại Nút 0]
      ▲ (d = 0)
   [Nút 1] (d = 1) ◄── [Nút 4] (d = 2)
      ▲                     ▲
   [Nút 2] (d = 2)     [Cảnh sát tại Nút 5] (d = 3)
```

- **Chuyển sang Rượt đuổi Trực tiếp (Direct Pursuit)**:
  Khi khoảng cách $\le 42$ đơn vị VÀ `hasLineOfSight()` trả về `true` (không bị nhà che), xe cảnh sát chuyển từ đi theo đồ thị sang rẽ thẳng về phía người chơi.
- **Rời xe Rượt bộ (Bail Out)**:
  Nếu người chơi chạy bộ vào ngõ hẹp hoặc trèo lên cầu thang ga tàu (nơi xe hơi không vào được) trong phạm vi $16$ đơn vị, cảnh sát sẽ phanh xe và nhảy xuống đuổi bộ (`footCopSpeed = 9.6` đơn vị/giây, chậm hơn tốc độ chạy nước rút $13$ của người chơi để luôn có cơ hội trốn thoát).

---

## 4. Hệ thống Đường sắt Đô thị Trên cao (Skyline Rail)

### 4.1 Mô hình Tham số hóa theo Độ dài Cung (`rail.js`)
Toàn bộ tuyến đường sắt là một đường cong khép kín được tham số hóa theo độ dài cung $s \in [0, L]$:
- Hàm `railAt(s)` trả về tọa độ chính xác $(x, z)$ và vector tiếp tuyến $(\text{tx}, \text{tz})$ tại bất kỳ vị trí nào trên đường ray.
- Bốn ga tàu (Fountain Square, East Market, North Park, West Gate) được bố trí cách đều dọc theo tuyến ray.

### 4.2 Đường cong Hãm phanh Giải tích (`train.js`)
Khi tàu tiếp cận ga, vận tốc được tính toán chính xác theo công thức động học giải tích:
$$v = \sqrt{2 \cdot a \cdot d}$$
*(trong đó $a$ là gia tốc hãm phanh `brake = 8`, $d$ là khoảng cách còn lại đến điểm dừng ga)*.
Điều này đảm bảo đoàn tàu dừng mượt mà đúng vị trí cửa ga mà không cần thuật toán PID controller phức tạp.

---

## 5. Đạo diễn Thời tiết & Chu kỳ Ngày/Đêm (Weather Director)

### 5.1 Chu kỳ Nhật dụng (Day/Night Orbital Cycle)
- Một ngày trong game kéo dài **8 phút thực tế** (`dayLength = 480`s).
- Góc mặt trời di chuyển liên tục: Bình minh lúc 06:00 (đông), đỉnh trưa lúc 12:00, hoàng hôn lúc 18:00 (tây), và đêm trăng sao.

### 5.2 Máy trạng thái Pha trộn Thời tiết (Cross-fading Blending)
Bao gồm 6 trạng thái thời tiết: `sunny`, `cloudy`, `windy`, `rainy`, `thunderstorm`, `snowy`.
- Quá trình chuyển đổi giữa hai trạng thái diễn ra từ từ trong vòng **12 giây** (`blendTime`).
- Các hệ thống phía sau (đồ họa, vật lý, AI) không đọc trực tiếp tên trạng thái mà chỉ đọc đối tượng số thực đã được pha trộn mượt mà:
  ```javascript
  world.weather.params = {
    skyDarkness: 0.0,    // 0..1
    sunDim: 0.0,         // 0..1
    fogDensity: 0.001,   // Độ dày sương mù
    rain: 0.0,           // Mật độ mưa (0..1)
    snow: 0.0,           // Mật độ tuyết (0..1)
    windStrength: 0.2,   // Sức gió
    windAngle: 1.57,     // Hướng gió
    lightning: 0.0,      // Chớp sấm sét
    wetness: 0.0,        // Độ bóng ướt mặt đường
    snowCover: 0.0,      // Độ phủ tuyết trắng xóa
  }
  ```

---

## 6. Hệ thống Thiên tai Tự nhiên (Natural Disasters)

Thiên tai mang tính chất hài hước vô hại (bị ướt, bị hất tung, rơi xuống an toàn):

### 6.1 Lốc xoáy (Tornado)
- Di chuyển cắt ngang thành phố với tốc độ `13` đơn vị/giây.
- Trường vector xoáy:
  $$\vec{F}_{\text{total}} = \vec{F}_{\text{pull}} (\text{hướng tâm}) + \vec{F}_{\text{swirl}} (\text{tiếp tuyến}) + \vec{F}_{\text{lift}} (\text{nâng thẳng đứng})$$
- Xe cộ và người đi bộ trong bán kính $32$ đơn vị sẽ bị hút vào lõi, xoay tít và hất tung lên độ cao tối đa $30$ đơn vị trước khi bay ra ngoài theo quỹ đạo đạn đạo.

### 6.2 Sóng thần (Tsunami)
- Một bức tường sóng biển cao $16$ đơn vị tràn từ 1 trong 4 bờ biển qua toàn bộ thành phố với vận tốc $32$ đơn vị/giây.
- Đẩy toàn bộ xe cộ, người và thùng rác trôi dạt theo hướng sóng tràn, để lại lớp nước ngập nông rút dần sau 10 giây.

---

## 7. Cơ chế Quậy phá, Vũ khí & Điểm số

| Hành vi Quậy phá (Mischief) | Điểm số (`SCORE`) | Nhiệt tăng (`HEAT`) |
| :--- | :---: | :---: |
| **Bắn trúng người đi bộ** | +50 | +8 |
| **Bắn trúng xe dân / xe đỗ** | +80 | +12 |
| **Bắn trúng xe cảnh sát** | +250 | +20 *(Cảnh sát dừng lại lau kính xe)* |
| **Đụng xe khác** | +30 | +10 |
| **Tông đổ cọc tiêu / thùng rác** | +10 | +3 |
| **Lái xe trên vỉa hè** | — | +12 / giây |
| **Hoàn thành hình phun sơn** | +15 / decal | +9 / giây |

- **Nạp lại bóng nước**: Khi hết 16 quả bóng nước, người chơi lái xe hoặc đi bộ qua các đài phun nước công cộng (chấm xanh dương trên minimap) để nạp đầy đạn ngay lập tức.

---

## 8. Hệ thống Khám phá Nội thất (Interiors) & Mua sắm Siêu thị

### 8.1 Không gian Nội thất Biệt lập (`interiors.js`)
- Người chơi có thể bước vào (**Enter**) và rời khỏi (**Exit**) 2 tòa nhà chính bằng phím `E` hoặc nút chạm `⚡ Interact`:
  - **Trụ sở Cảnh sát (Police Station)**: Khám phá sảnh đồn, bàn trực ban, máy vi tính, Bảng truy nã động (Wanted Board), Phòng giam tạm giữ (Holding Cells), Kho vũ khí nước (Mega Balloon) và Nút báo động khẩn cấp.
  - **Siêu thị Việt Nam 2 Tầng (Splash Mart)**: Không gian siêu thị bách hóa 2 tầng rộng lớn.

### 8.2 Kệ hàng Sản phẩm Việt Nam & Thang cuốn Tầng 2
- **Tầng 1**: Bày bán các sản phẩm thân thuộc tại Việt Nam:
  - Kem đánh răng P/S Dâu cho bé
  - Bánh quy Oreo, Snack khoai tây Lay's, Snack ống Pringles
  - Sô-cô-la Meiji, MrBeast Feastables, Bánh xốp KitKat
  - Quầy trái cây: Chuối già Nam Mỹ, Nho mẫu đơn, Táo Queen New Zealand
- **Thang cuốn cơ học (Escalator)**: Băng chuyền tự động đưa người chơi trượt mượt mà giữa Tầng 1 và Tầng 2.

### 8.3 Điện thoại Quét Mã QR Thanh Toán (SplashPay) & Sử dụng Vật phẩm
- Nhấn phím `P` hoặc nút 📱 trên màn hình để mở Smartphone SplashPay (MoMo/VNPay style) quét mã QR thanh toán tại quầy thu ngân.
- **Hiệu ứng khi sử dụng vật phẩm (`inventory.js`)**:
  - 🍌 **Chuối già Nam Mỹ**: Thả vỏ chuối ra sàn làm xe cảnh sát và NPC trượt ngã xoay vòng 360 độ.
  - 🍪 **Bánh Oreo / Snack Lay's / Meiji / MrBeast**: Ăn vào nhận hiệu ứng **Sugar Rush** tăng $50\% - 85\%$ tốc độ chạy nước rút.
  - 🪥 **Kem đánh răng P/S Dâu**: Bôi vệt trơn trượt màu hồng dâu tây lên sàn.
  - 🍎 **Táo Queen / Nho**: Dùng làm đạn ném vui nhộn.

