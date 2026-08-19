# Chi tiết các Hệ thống Gameplay (Game Systems)

Tài liệu này cung cấp đặc tả kỹ thuật chi tiết về cơ chế hoạt động, thuật toán và logic điều khiển của từng hệ thống trong **Splash City**.

---

## 1. Hệ thống Người chơi & Điều khiển Phương tiện

### 1.1 Trạng thái Người chơi (`player.js`)
Người chơi có thể chuyển đổi giữa 4 chế độ di chuyển (`mode`):
- `'foot'` (Đi bộ / Chạy nước rút)
- `'car'` (Lái xe hơi)
- `'train'` (Đi tàu điện trên cao)
- `'heli'` (Lái trực thăng ngắm cảnh)

```
              ┌──────── (Ấn E gần bãi đáp) ────────> [Trực thăng]
              │                                          │
              ▼                                          ▼ (Ấn E hạ cánh)
[Đi bộ] ──── (Ấn E gần xe) ────> [Lái xe] ─────────> [Đi bộ]
   │                                │
 (Ấn E gần cửa tàu)           (Ấn E ra xe)
   │                                │
   ▼                                ▼
[Lên tàu] <─── (Nhảy khỏi tàu) ── [Đi bộ]
```

- **Đi bộ & Chạy nước rút**:
  - Vận tốc đi bộ: `7.5` đơn vị/giây, chạy nước rút (`Shift` hoặc đẩy hết cần analog): `13` đơn vị/giây.
  - Hiệu ứng **Sugar Rush**: Khi ăn đồ ngọt/snack, tốc độ chạy nước rút được nhân thêm $1.5 \times - 1.85 \times$ trong $10 - 15$ giây.
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

## 2. Hệ thống Trực thăng Ngắm cảnh (Sightseeing Helicopter)

Được quản lý bởi `src/game/systems/helicopter.js` và render bởi `src/render/Helicopter.jsx`:

### 2.1 Động lực học Bay 3D (3D Flight Dynamics)
- **Vận tốc tối đa**: $34$ đơn vị/giây (~122 km/h), có thể bay qua toàn bộ chiều dài thành phố ($420$m) trong vòng $13$ giây.
- **Nâng hạ độ cao (Collective Pitch)**:
  - Giữ `Shift` để cất cánh dâng độ cao (tốc độ dâng `climbRate = 14`).
  - Giữ `Space` để hạ cánh từ từ (`landSpeed = 3.0`).
  - Lực cản giảm chấn độ cao (`climbDamp = 14`) giúp máy bay đứng yên bồng bềnh êm ái khi nhả nút.
- **Góc nghiêng khí động học (Aerodynamic Banking)**:
  - Khi bẻ lái hoặc tăng tốc, thân trực thăng nghiêng một góc $\theta_{\text{tilt}} \le 0.28$ radian tạo cảm giác bay chân thực.
  - Cánh quạt chính và cánh quạt đuôi quay với tốc độ `rotorSpin = 26` rad/s kết hợp hiệu ứng motion blur.

### 2.2 Chế độ Bay Tự động Ngắm cảnh (Tour Autopilot Mode - Phím `H`)
- Khi kích hoạt, trực thăng tự động cất cánh lên độ cao an toàn **$52$m** (vượt qua đỉnh tòa nhà cao nhất thành phố $43.7$m).
- Hệ thống định vị tuần tự bay qua các địa danh nổi tiếng (Quảng trường đài phun nước, Nhà ga trung tâm, Siêu thị Splash Mart, Trụ sở Cảnh sát).
- Máy bay tự động lượn tròn quanh mỗi địa danh với bán kính $34$m theo quỹ đạo cinematic mượt mà trước khi chuyển sang điểm tiếp theo.

---

## 3. Hệ thống Bản đồ & Điều hướng GPS (Navigation & Map)

Được quản lý bởi `src/game/systems/navigation.js` và render bởi `src/ui/MapOverlay.jsx`:

### 3.1 Bản đồ Đô thị Tương tác (Interactive Vector Map - Phím `M`)
- Hiển thị toàn bộ sơ đồ $7 \times 7$ khối nhà, các tuyến đường, đường ray trên cao, vị trí người chơi và các địa danh (Landmarks).
- Người chơi có thể nhấp chuột hoặc chạm vào bất kỳ địa điểm nào trên bản đồ để ghim **Waypoint** dẫn đường.

### 3.2 Chế độ Chạy Tự động theo GPS (Auto-Run Mode)
- Khi đã chọn đích đến, người chơi có thể bật chế độ chạy tự động.
- **Thuật toán Tìm đường**: Sử dụng A* / Dijkstra trên đồ thị giao thông thành phố để tìm lộ trình ngắn nhất qua các giao lộ.
- **Tăng tốc hành trình**: Nhân tốc độ chạy lên $1.8 \times$ (`speedBoost = 1.8`) giúp di chuyển đường dài nhanh chóng.
- **Cơ chế Hủy thông minh (Smart Override)**: Nếu người chơi can thiệp bằng bàn phím hoặc cần analog ảo quá $30\%$ (`cancelDeflection = 0.3`), quyền điều khiển sẽ lập tức trả lại cho người chơi.

---

## 4. Hệ thống Khám phá Nội thất (Interiors) & Siêu thị 2 Tầng

Được quản lý bởi `src/game/systems/interiors.js`, `src/render/SupermarketInterior.jsx`, và `src/render/PoliceInterior.jsx`:

### 4.1 Không gian Biệt lập & Tọa độ Ảo ($y = -80$)
- Khi người chơi tương tác cửa (`[E] Vào tòa nhà`):
  - **Trụ sở Cảnh sát (Police HQ)**: Dịch chuyển đến $x: -400, y: -80, z: 0$.
  - **Siêu thị Splash Mart**: Dịch chuyển đến $x: 400, y: -80, z: 0$.
- Nhờ cách ly độ cao và không gian, các thực thể trong nhà không bị ảnh hưởng bởi xe cộ ngoài phố và ngược lại.

### 4.2 Siêu thị Splash Mart 2 Tầng
- **Tầng 1 - Kệ hàng Nông sản & Thực phẩm Việt Nam**:
  - Hóa mỹ phẩm: Kem đánh răng P/S Dâu Trẻ Em.
  - Bánh kẹo & Snack: Bánh Oreo, Snack Lay's, Pringles, MrBeast Feastables, Meiji Choco, KitKat.
  - Trái cây tươi: Chuối già Nam Mỹ, Nho mẫu đơn, Táo Queen New Zealand.
- **Thang cuốn Cơ học (Mechanical Escalator)**:
  - Băng chuyền tự động phát hiện người chơi bước lên và áp dụng vector vận tốc đẩy người chơi di chuyển êm dịu giữa Tầng 1 và Tầng 2.
- **Tầng 2 - Đồ chơi & Nước giải khát**:
  - Quầy súng nước Super Soaker Titan (nhận Mega Balloon).
  - Quầy nước tăng lực Sting Dâu.

### 4.3 Trụ sở Cảnh sát (Police Station HQ)
- **Bàn trực ban & PC cảnh sát**: Âm thanh bộ đàm và máy tính văn phòng.
- **Bảng Truy nã Động (Wanted Board)**: Hiển thị chân dung người chơi, số sao nhiệt và tổng điểm quậy phá.
- **Phòng Giam Tạm Giữ & Kho Vũ Khí**: Lấy trộm bóng nước ẩn và bình siêu bọt tuyết.
- **Nút Báo động Khẩn cấp (Alarm Button)**: Bấm để kích hoạt còi hú báo động toàn đồn.

---

## 5. Hệ thống Smartphone SplashPay & Túi đồ (Inventory)

### 5.1 Thanh toán Mã QR SplashPay (`PhoneOverlay.jsx`)
- Nhấn phím `P` hoặc chạm biểu tượng 📱 để mở điện thoại thông minh.
- Đứng trước quầy thu ngân / kệ hàng siêu thị để quét mã QR thanh toán tức thì theo phong cách ví điện tử MoMo/VNPay.

### 5.2 Hiệu ứng của Vật phẩm trong Túi đồ (`inventory.js`)
Nhấn các phím `1` đến `4` để sử dụng:
- 🍌 **Chuối già Nam Mỹ**: Thả vỏ chuối xuống sàn. Bất kỳ xe cảnh sát hoặc người đi bộ nào dẫm phải sẽ bị trượt mất lái và xoay vòng 360°.
- 🍪 **Bánh kẹo & Snack (Oreo, Lay's, Feastables, KitKat)**: Tăng tốc độ chạy nước rút từ $+50\%$ đến $+85\%$ (Sugar Rush).
- 🪥 **Kem đánh răng P/S Dâu**: Bôi vệt trơn trượt màu hồng lên sàn làm mọi người đi qua bị trượt ngã.
- 🍎 **Táo Queen / Nho**: Dùng làm đạn ném gây tiếng kêu vui nhộn.

---

## 6. Hệ thống Thiên tai Tự nhiên (Natural Disasters)

Được quản lý bởi `src/game/systems/disasters.js` và render bởi `src/render/Disasters.jsx`:

### 6.1 Lốc xoáy (Tornado)
- Di chuyển cắt ngang thành phố với tốc độ `13` đơn vị/giây.
- **Trường vector xoáy**:
  $$\vec{F}_{\text{total}} = \vec{F}_{\text{pull}} (\text{hướng tâm}) + \vec{F}_{\text{swirl}} (\text{tiếp tuyến}) + \vec{F}_{\text{lift}} (\text{nâng thẳng đứng})$$
- Xe cộ và người đi bộ trong bán kính $32$ đơn vị sẽ bị hút vào lõi, xoay tít và hất tung lên độ cao tối đa $30$m trước khi rơi tự do an toàn.

### 6.2 Sóng thần (Tsunami)
- Một bức tường sóng biển cao $16$ đơn vị quét từ bờ biển qua toàn bộ thành phố với vận tốc $32$ đơn vị/giây.
- Đẩy toàn bộ xe cộ, người và thùng rác trôi dạt theo hướng sóng tràn, để lại lớp nước ngập nông rút dần sau 10 giây.

---

## 7. Hệ thống AI Cảnh sát & Độ Truy nã (Police & Heat)

### 7.1 Hệ thống Nhiệt & Số Sao Truy nã (`heat.js`)
Điểm nhiệt `heat` dao động từ $0$ đến $100$:

| Mức Sao | Ngưỡng Nhiệt | Cảnh sát tối đa | Hành vi |
| :---: | :---: | :---: | :--- |
| ⭐ (1 Sao) | $\ge 15$ | 1 xe | Rượt đuổi cơ bản |
| ⭐⭐ (2 Sao) | $\ge 35$ | 2 xe | Tăng tốc độ tuần tra |
| ⭐⭐⭐ (3 Sao) | $\ge 60$ | 4 xe | Chặn đầu, cảnh sát rời xe rượt bộ |
| ⭐⭐⭐⭐ (4 Sao) | $\ge 85$ | 6 xe | Rượt đuổi gắt gao toàn lực |

- **Cơ chế Làm nguội (Cooling down)**: Cắt tầm nhìn của toàn bộ cảnh sát trong **6 giây** (`escapeDelay`) để bắt đầu hạ nhiệt với tốc độ `7` điểm/giây.

### 7.2 Thuật toán Tìm đường BFS (Breadth-First Search)
- Mỗi $0.33$ giây (3 Hz), chạy BFS trên đồ thị đường phố từ giao lộ gần người chơi nhất để cập nhật ma trận khoảng cách `distanceField`.
- Cảnh sát chuyển sang rượt đuổi trực diện khi khoảng cách $\le 42$ đơn vị và có tầm nhìn trực tiếp (`hasLineOfSight`).

### 7.3 Đội bay Trực thăng Cảnh sát (`policeHeli.js`)
Đơn vị duy nhất rời được mặt đất, điều động khi người chơi đạt **1 sao** *và* đang ở trên không (`mode === 'heli'` hoặc $y > 12$). Không dùng lưới đường — trên trời không có đường — nên AI chỉ gồm ngắm vào vị trí **dự đoán** của người chơi (`leadTime` $1.1$s) rồi giữ cự ly.

| Bước | Ngưỡng | Hiệu ứng |
| :--- | :---: | :--- |
| Thấy | $90$m (nhân `visibilityFactor`) | `policeCanSee` trả về true **không cần** `hasLineOfSight` khi người chơi ở trên cao — đây là lý do bay lên không còn tự làm nguội sao |
| Khoá đèn pha | $26$m | Cảnh báo đỏ trên đồng hồ bay |
| Đạn cao su | $22$m | Bắn mỗi $1.4$s. Trúng thì máy bay rung giật, tay lái chỉ còn một nửa trong $1.5$ giây. Đang loạng choạng dở thì phát sau nảy ra chứ **không** cộng dồn — cộng dồn là mất hẳn đường bay thoát |
| Giữ khoá | $4$ giây | Phải giữ được đèn pha ngần ấy giây mới phun được nước — quãng để người chơi kịp bẻ lái chạy |
| Vòi rồng | $14$m | `heli.soaked` $0 \to 1$ trong $6$ giây, tính theo thời gian bị phun chứ **không** cộng dồn theo số vòi đang chĩa vào |
| Bắt trên không | $12$m trong $5$ giây | Chỉ khi `soaked \ge 0.9`; thoát khỏi tia nước là khô lại sau khoảng $3$ giây |

- **Ướt cánh quạt**: giảm $75\%$ sức leo, $25\%$ tốc độ, và hạ trần bay còn $40\%$ — ép người chơi phải hạ cánh chứ không tóm gọn giữa trời.
- **Nhịp nghỉ**: mỗi chiếc chỉ bám được $45$ giây (`maxChase`) rồi phải về tiếp dầu, và mọi lần rút lui đều đặt thời gian nghỉ cho cả tốp. Thành phố chỉ rộng $420$m nên không có nhịp này thì cắt được đuôi cũng vô nghĩa — chiếc mới cất cánh ngay lập tức.
- **Phản đòn**: bóng nước trúng thân (bán kính rộng tay $\approx 4.2$m) khiến nó lùi ra $8$ giây và ngừng phun, tính điểm như phun trúng cảnh sát.

---

## 8. Đạo diễn Thời tiết & Chu kỳ Ngày/Đêm (`weather.js`)

- **Chu kỳ Ngày/Đêm**: Một ngày trôi qua trong 8 phút thực tế (`dayLength = 480`s).
- **Pha trộn 6 Kiểu Thời tiết**: `sunny`, `cloudy`, `windy`, `rainy`, `thunderstorm`, `snowy`.
- Quá trình chuyển đổi diễn ra mượt mà trong 12 giây (`blendTime`), tự động điều chỉnh độ bám đường, sức gió đẩy bóng nước, tầm nhìn cảnh sát và hành vi người đi bộ dạo phố.

---

## 9. Hệ thống Đa ngôn ngữ (Localization)

Được quản lý bởi `src/game/i18n.js` và từ điển dịch `src/game/strings.js`:
- Hỗ trợ chuyển đổi tức thì giữa **Tiếng Việt (`vi`)** và **English (`en`)**.
- Toàn bộ nhãn nút bấm, tên sản phẩm siêu thị, thông báo nhiệm vụ, lời thoại cảnh sát và banner cảnh báo thiên tai đều được dịch tự động thông qua hàm `t(key)`.
