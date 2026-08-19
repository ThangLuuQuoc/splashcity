# Cẩm nang Tinh chỉnh Cấu hình Game (Configuration & Tuning)

Toàn bộ các tham số điều khiển cơ chế vật lý, độ khó AI, đồ họa, trực thăng, nội thất và giá cả siêu thị được tập trung tại một file duy nhất: `src/game/config.js`. 

Tài liệu này cung cấp bảng tra cứu toàn diện và hướng dẫn cân bằng các thông số trong game.

---

## 1. Cấu hình Bản đồ & Thành phố (`CITY`, `OCEAN`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `CITY.seed` | `20260816` | Hạt giống ngẫu nhiên để tạo layout thành phố cố định. |
| `CITY.blocks` | `7` | Lưới khối nhà kích thước $7 \times 7$ ô. |
| `CITY.blockSize` | `44` | Chiều rộng của 1 khối nhà (bao gồm các tòa nhà và vỉa hè). |
| `CITY.roadWidth` | `14` | Chiều rộng lòng đường giữa các khối nhà. |
| `CITY.sidewalk` | `4` | Độ rộng dải vỉa hè dành cho người đi bộ. |
| `CITY.buildingMin` / `buildingMax` | `9` / `46` | Chiều cao ngẫu nhiên tối thiểu và tối đa của các tòa nhà. |
| `OCEAN.beachWidth` | `52` | Độ rộng bãi cát bao quanh thành phố trước khi chạm mặt nước biển. |
| `OCEAN.waterY` | `-1.8` | Cao độ mặt nước biển. |

---

## 2. Chu kỳ Thời gian & Thời tiết (`TIME`, `WEATHER`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `TIME.dayLength` | `480` | Thời gian thực (tính bằng giây) để trôi qua hết 24 giờ trong game (480s = 8 phút). |
| `TIME.startHour` | `9.5` | Giờ bắt đầu khi người chơi vào game (9.5 = 9:30 sáng). |
| `WEATHER.minDuration` / `maxDuration` | `55` / `115` | Thời gian tối thiểu/tối đa (giây) một kiểu thời tiết duy trì. |
| `WEATHER.blendTime` | `12` | Thời gian chuyển tiếp (cross-fade) mượt mà giữa hai kiểu thời tiết. |
| `WEATHER.maxParticles` | `2800` | Số lượng hạt mưa hoặc tuyết tối đa trên màn hình. |
| `WEATHER.snowCoverRate` | `0.06` | Tốc độ tuyết phủ trắng mặt đường và tốc độ tuyết tan sau bão. |
| `WEATHER.windBalloonForce` | `9` | Lực gió thổi tạt đường bay của bóng nước khi trời nổi gió lớn. |

---

## 3. Điều khiển Người chơi & Camera (`PLAYER`, `CAMERA`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `PLAYER.walkSpeed` | `7.5` | Tốc độ đi bộ bình thường của người chơi. |
| `PLAYER.sprintSpeed` | `13` | Tốc độ chạy nước rút khi giữ `Shift` hoặc đẩy hết cần analog ảo. |
| `PLAYER.accel` | `60` | Độ nhạy gia tốc khi bắt đầu di chuyển. |
| `PLAYER.jumpSpeed` | `7.5` | Vận tốc nhảy ban đầu. |
| `PLAYER.gravity` | `24` | Gia tốc trọng lực kéo người chơi rơi xuống. |
| `CAMERA.footDistance` / `carDistance` | `9` / `14` | Khoảng cách camera lùi ra xa khi đi bộ / lái xe. |
| `CAMERA.trainDistance` / `heliDistance` | `16` / `24` | Khoảng cách camera khi đi tàu điện / lái trực thăng. |
| `CAMERA.followLerp` | `7` | Tốc độ mượt mà bám theo góc nhìn của người chơi. |

---

## 4. Trực thăng Ngắm cảnh (`HELI`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `HELI.maxSpeed` | `34` | Tốc độ bay tối đa (~122 km/h). |
| `HELI.accel` | `52` | Gia tốc động cơ phản lực trực thăng. |
| `HELI.drag` | `1.5` | Lực cản không khí khí động học. |
| `HELI.climbRate` | `14` | Tốc độ nâng/hạ độ cao khi bấm `Shift` hoặc `Space`. |
| `HELI.climbDamp` | `14` | Lực giảm chấn dừng độ cao giúp trực thăng treo lơ lửng ổn định. |
| `HELI.maxAltitude` | `110` | Độ cao bay tối đa cho phép. |
| `HELI.rotorSpin` | `26` | Tốc độ quay cánh quạt (rad/giây). |
| `HELI.tour.altitude` | `52` | Độ cao an toàn khi bay tự động (vượt qua tòa nhà cao nhất 43.7m). |
| `HELI.tour.orbitRadius` | `34` | Bán kính lượn vòng quanh mỗi địa danh trong tour ngắm cảnh. |
| `HELI.tour.cruiseSpeed` | `19` | Tốc độ hành trình ngắm cảnh êm dịu. |

---

## 5. Bản đồ & Điều hướng GPS (`NAV`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `NAV.speedBoost` | `1.8` | Nhân tốc độ chạy nước rút trong chế độ Auto-run để đi nhanh hơn. |
| `NAV.waypointRadius` | `5.0` | Khoảng cách đến giao lộ để chuyển sang waypoint kế tiếp. |
| `NAV.arriveRadius` | `4.0` | Bán kính coi như đã đến đích. |
| `NAV.cancelDeflection` | `0.3` | Ngưỡng tác động phím/cần analog để người chơi giành lại quyền điều khiển. |
| `NAV.stuckTimeout` | `1.6` | Số giây bị kẹt vào chướng ngại vật trước khi tự động hủy Auto-run. |

---

## 6. Không gian Nội thất & Sản phẩm Siêu thị (`INTERIORS`, `SUPERMARKET_PRODUCTS`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `INTERIORS.enterDistance` | `7.5` | Khoảng cách đến cửa để hiện gợi ý bấm `E` vào trong. |
| `INTERIORS.supermarketOffset` | `{400, -80, 0}` | Tọa độ ảo cách ly của Siêu thị Splash Mart. |
| `INTERIORS.policeOffset` | `{-400, -80, 0}` | Tọa độ ảo cách ly của Trụ sở Cảnh sát. |
| `INTERIORS.floorHeight` | `6.0` | Khoảng cách độ cao giữa Tầng 1 và Tầng 2 siêu thị. |

### Danh mục Sản phẩm Siêu thị:
- `ps_strawberry`: Kem đánh răng P/S Dâu Trẻ Em (32.000đ) - Bôi vệt trơn trượt lên sàn.
- `oreo`: Bánh Quy Oreo (24.000đ) - Tăng 50% tốc độ chạy (Sugar Rush).
- `lays_classic`: Snack Lay's (22.000đ) - Tăng tốc độ chạy.
- `pringles`: Snack Pringles (48.000đ) - Tăng tốc độ chạy.
- `feastables`: Sô-cô-la MrBeast Feastables (65.000đ) - Tăng 85% tốc độ chạy trong 15s.
- `meiji_choco`: Sô-cô-la Meiji (38.000đ) - Thưởng thức ngọt ngào.
- `kitkat`: Bánh KitKat (26.000đ) - Nghỉ xả hơi xơi KitKat tăng tốc.
- `banana`: Chuối Già Nam Mỹ (28.000đ) - Thả vỏ chuối làm trượt ngã xoay 360°.
- `grapes` & `queen_apple`: Nho Mẫu Đơn & Táo Queen (75.000đ & 45.000đ) - Đạn ném trêu chọc.
- `supersoaker_titan`: Súng Nước Super Soaker Titan (150.000đ) - Nhận Mega Balloon siêu cấp.
- `sting_strawberry`: Nước Tăng Lực Sting Dâu (15.000đ) - Buff chạy nước rút 12s.

---

## 7. Mức độ Truy nã & Điểm số (`HEAT`, `SCORE`, `ACTIONS`, `POLICE`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `HEAT.stars` | `[15, 35, 60, 85]` | Các ngưỡng nhiệt để đạt 1, 2, 3, 4 sao truy nã. |
| `HEAT.copsPerStar` | `[0, 1, 2, 4, 6]` | Số lượng xe cảnh sát tối đa tương ứng từng cấp sao. |
| `HEAT.escapeDelay` | `6` | Số giây người chơi phải cắt đuôi tầm nhìn cảnh sát để bắt đầu hạ nhiệt. |
| `HEAT.coolPerSec` | `7` | Tốc độ giảm nhiệt độ truy nã mỗi giây khi đang trốn thoát thành công. |
| `SCORE.splashCop` | `250` | Điểm nhận được khi bắn trúng xe cảnh sát rượt đuổi. |
| `SCORE.slipCop` | `150` | Điểm thưởng khi bẫy cảnh sát bằng vỏ chuối. |
| `ACTIONS.maxAmmo` | `16` | Số lượng bóng nước tối đa mang theo. |
| `ACTIONS.throwSpeed` | `26` | Vận tốc ném bóng nước ra khỏi tay. |
| `POLICE.footCopSpeed` | `9.6` | Tốc độ cảnh sát chạy bộ rượt đuổi người chơi (chậm hơn sprint `13`). |

---

## 8. Thiên tai & Đường ray Tàu điện (`DISASTER`, `RAIL`, `TRAIN`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `DISASTER.warningTime` | `6` | Số giây phát còi cảnh báo trên màn hình trước khi thiên tai quét qua. |
| `DISASTER.tornado.duration` | `42` | Thời gian hoành hành của cơn lốc xoáy (giây). |
| `DISASTER.tornado.swirl` | `40` | Lực xoáy tiếp tuyến cuốn xe cộ vào tâm lốc. |
| `DISASTER.tsunami.speed` | `32` | Tốc độ bức tường sóng thần quét qua thành phố. |
| `DISASTER.tsunami.crest` | `16` | Chiều cao ngọn sóng thần (đơn vị). |
| `TRAIN.count` | `4` | Số lượng đoàn tàu chạy trên tuyến đường sắt trên cao. |
| `TRAIN.maxSpeed` | `26` | Tốc độ tối đa của tàu điện. |
| `TRAIN.dwell` | `5` | Thời gian dừng mở cửa đón khách tại mỗi nhà ga (giây). |
