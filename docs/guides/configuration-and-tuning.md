# Cẩm nang Tinh chỉnh Cấu hình Game (Configuration & Tuning)

Toàn bộ các tham số điều khiển cơ chế vật lý, độ khó AI, đồ họa và điểm số của trò chơi được tập trung tại một file duy nhất: [`src/game/config.js`](file:///f:/2027/splashcity/src/game/config.js). 

Tài liệu này cung cấp bảng tra cứu toàn diện và hướng dẫn cân bằng các thông số trong game.

---

## 1. Cấu hình Bản đồ & Thành phố (`CITY`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `seed` | `20260816` | Hạt giống ngẫu nhiên để tạo layout thành phố cố định. |
| `blocks` | `7` | Lưới khối nhà kích thước $7 \times 7$ ô. |
| `blockSize` | `44` | Chiều rộng của 1 khối nhà (bao gồm các tòa nhà và vỉa hè). |
| `roadWidth` | `14` | Chiều rộng lòng đường giữa các khối nhà. |
| `sidewalk` | `4` | Độ rộng dải vỉa hè dành cho người đi bộ. |
| `sidewalkHeight` | `0.35` | Độ cao nhô lên của vỉa hè so với lòng đường. |
| `buildingMin` / `buildingMax` | `9` / `46` | Chiều cao ngẫu nhiên tối thiểu và tối đa của các tòa nhà. |

---

## 2. Chu kỳ Thời gian & Thời tiết (`TIME`, `WEATHER`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `TIME.dayLength` | `480` | Thời gian thực (tính bằng giây) để trôi qua hết 24 giờ trong game (480s = 8 phút). |
| `TIME.startHour` | `9.5` | Giờ bắt đầu khi người chơi vào game (9.5 = 9:30 sáng). |
| `WEATHER.minDuration` / `maxDuration` | `55` / `115` | Thời gian tối thiểu/tối đa (giây) một kiểu thời tiết duy trì trước khi đổi. |
| `WEATHER.blendTime` | `12` | Thời gian chuyển tiếp (cross-fade) mượt mà giữa hai kiểu thời tiết. |
| `WEATHER.maxParticles` | `2800` | Số lượng hạt mưa hoặc tuyết tối đa trên màn hình. |
| `WEATHER.snowCoverRate` | `0.06` | Tốc độ tuyết phủ trắng mặt đường và tốc độ tuyết tan sau bão tuyết. |
| `WEATHER.windBalloonForce` | `9` | Lực gió thổi tạt đường bay của bóng nước khi trời nổi gió lớn. |
| `WEATHER.nightSightPenalty` | `0.45` | Tỉ lệ giảm tầm nhìn của cảnh sát vào ban đêm (giảm 45% tầm nhìn lúc nửa đêm). |
| `WEATHER.rainSightPenalty` | `0.25` | Tỉ lệ giảm tầm nhìn của cảnh sát khi trời mưa bão to. |

---

## 3. Điều khiển Người chơi & Camera (`PLAYER`, `CAMERA`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `PLAYER.walkSpeed` | `7.5` | Tốc độ đi bộ bình thường của người chơi. |
| `PLAYER.sprintSpeed` | `13` | Tốc độ chạy nước rút khi giữ `Shift` hoặc đẩy hết cần analog ảo. |
| `PLAYER.accel` | `60` | Độ nhạy gia tốc khi bắt đầu di chuyển. |
| `PLAYER.friction` | `14` | Lực ma sát phanh dừng lại khi nhả phím di chuyển. |
| `PLAYER.jumpSpeed` | `7.5` | Vận tốc nhảy ban đầu. |
| `PLAYER.gravity` | `24` | Gia tốc trọng lực kéo người chơi rơi xuống. |
| `PLAYER.enterRange` | `4.2` | Khoảng cách tối đa để có thể nhấn `E` lên xe hoặc vào tàu. |
| `CAMERA.footDistance` | `9` | Khoảng cách camera lùi ra xa khi người chơi đi bộ. |
| `CAMERA.carDistance` | `14` | Khoảng cách camera lùi ra xa khi lái xe hơi. |
| `CAMERA.trainDistance` | `16` | Khoảng cách camera khi người chơi đang đi tàu điện. |
| `CAMERA.followLerp` | `7` | Tốc độ mượt mà bám theo góc nhìn của người chơi. |

---

## 4. Vật lý Xe cộ & Xe Cảnh sát (`CAR`, `POLICE`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `CAR.maxSpeed` | `30` | Tốc độ tối đa của xe hơi dân dụng. |
| `CAR.policeMaxSpeed` | `33` | Tốc độ tối đa của xe cảnh sát (nhanh hơn xe dân để tạo kịch tính). |
| `CAR.trafficSpeed` | `12` | Tốc độ hành trình ổn định của xe AI tham gia giao thông. |
| `CAR.accel` | `22` | Gia tốc tăng tốc của xe hơi. |
| `CAR.brake` | `40` | Lực phanh khi nhấn `Space` (thắng tay). |
| `CAR.steerRate` | `2.3` | Tốc độ xoay vô lăng ở vận tốc thấp (radian/giây). |
| `CAR.steerSpeedFalloff` | `0.55` | Tỉ lệ giảm độ nhạy bẻ lái khi đạt vận tốc cao để tránh lật xe. |
| `CAR.bumpImpulse` | `0.9` | Độ nảy bật ra khi xe đụng vào xe khác (vật lý bumper car). |
| `CAR.wallBounce` | `0.4` | Tỉ lệ vận tốc giữ lại sau khi tông thẳng vào tường nhà. |
| `POLICE.spawnInterval` | `2.2` | Khoảng thời gian (giây) giữa các đợt xuất hiện xe cảnh sát mới. |
| `POLICE.chaseRange` | `42` | Khoảng cách cảnh sát chuyển từ đi theo đường ray sang rượt đuổi trực diện. |
| `POLICE.bustRange` | `3.4` | Bán kính áp sát để bắt đầu đếm thời gian bắt giữ (`bustTime = 1.1`s). |
| `POLICE.footCopSpeed` | `9.6` | Tốc độ cảnh sát chạy bộ rượt đuổi người chơi (chậm hơn sprint `13`). |

---

## 5. Mức độ Truy nã & Điểm số (`HEAT`, `SCORE`, `ACTIONS`)

```
Mức Nhiệt (Heat): 0 ────── 15 ────── 35 ────── 60 ────── 85 ────── 100
Số Sao:                 ⭐        ⭐⭐       ⭐⭐⭐      ⭐⭐⭐⭐
Số Cảnh sát:            1          2          4          6
```

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `HEAT.escapeDelay` | `6` | Số giây người chơi phải cắt đuôi tầm nhìn cảnh sát để bắt đầu hạ nhiệt. |
| `HEAT.coolPerSec` | `7` | Tốc độ giảm nhiệt độ truy nã mỗi giây khi đang trốn thoát thành công. |
| `SCORE.splashPed` | `50` | Điểm nhận được khi bắn bóng nước trúng người đi bộ. |
| `SCORE.splashCar` | `80` | Điểm nhận được khi bắn trúng xe hơi. |
| `SCORE.splashCop` | `250` | Điểm nhận được khi bắn trúng xe cảnh sát rượt đuổi. |
| `SCORE.bumpCar` | `30` | Điểm nhận được khi húc xe khác. |
| `SCORE.hitProp` | `10` | Điểm nhận được khi húc đổ cọc tiêu, thùng rác. |
| `SCORE.bustedPenalty` | `0.5` | Giữ lại 50% số điểm hiện có khi bị cảnh sát tóm (Busted). |
| `ACTIONS.maxAmmo` | `16` | Số lượng bóng nước tối đa mang theo. |
| `ACTIONS.throwSpeed` | `26` | Vận tốc ném bóng nước ra khỏi tay. |
| `ACTIONS.refillRadius` | `4` | Bán kính đài phun nước để tự động nạp đầy bóng nước. |

---

## 6. Thiên tai & Đường ray Tàu điện (`DISASTER`, `RAIL`, `TRAIN`)

| Tham số | Giá trị Mặc định | Ý nghĩa & Hướng dẫn Tinh chỉnh |
| :--- | :---: | :--- |
| `DISASTER.warningTime` | `6` | Số giây phát còi cảnh báo trên màn hình trước khi thiên tai quét qua. |
| `DISASTER.minGap` / `maxGap` | `90` / `190` | Khoảng thời gian yên bình tối thiểu/tối đa giữa 2 đợt thiên tai. |
| `DISASTER.tornado.duration` | `42` | Thời gian hoành hành của cơn lốc xoáy (giây). |
| `DISASTER.tornado.swirl` | `40` | Lực xoáy tiếp tuyến cuốn xe cộ vào tâm lốc. |
| `DISASTER.tsunami.speed` | `32` | Tốc độ bức tường sóng thần quét qua thành phố. |
| `DISASTER.tsunami.crest` | `16` | Chiều cao ngọn sóng thần (đơn vị). |
| `TRAIN.count` | `4` | Số lượng đoàn tàu chạy trên tuyến đường sắt trên cao. |
| `TRAIN.maxSpeed` | `26` | Tốc độ tối đa của tàu điện. |
| `TRAIN.dwell` | `5` | Thời gian dừng mở cửa đón khách tại mỗi nhà ga (giây). |
| `RAIL.trackY` | `9` | Độ cao của mặt đường ray và bệ ga trên cao so với mặt đường. |
