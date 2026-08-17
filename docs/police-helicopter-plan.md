# Trực thăng cảnh sát truy bắt trên không

> **Trạng thái: đã triển khai xong.** Tài liệu này giữ lại cả phần thiết kế ban đầu lẫn
> những gì phải sửa sau khi đo bằng mô phỏng — mục [§7](#7-những-gì-đo-đạc-bắt-phải-đổi)
> ghi lại ba chỗ kế hoạch ban đầu sai.

Mục tiêu: khi người chơi bay trực thăng để trốn, cảnh sát vẫn có cách đuổi theo và bắt
được — nhưng theo đúng tinh thần vô hại của game (nước, đèn pha, ép hạ cánh; không có
súng đạn).

---

## 1. Hiện trạng: vì sao bay lên là bất tử

| Chỗ | Hành vi hiện tại |
| :-- | :-- |
| `police.js:144` | `reachable = p.mode !== 'train' && p.invuln <= 0 && p.y < 3` — bay cao hơn 3m là không cảnh sát nào chạm tới được. |
| `police.js` (toàn bộ) | Cảnh sát chỉ có xe tuần tra + cảnh sát đi bộ, đều bám lưới đường bằng trường BFS. Không có đơn vị nào rời mặt đất. |
| `heat.js:29 policeCanSee` | Chỉ duyệt `world.police` và `world.footCops`, đo khoảng cách **2D** và kiểm tra `hasLineOfSight` ở mặt phẳng đường. Bay lên 60m thì mọi toà nhà đều chắn tia nhìn → `outOfSight` tăng → sau 6 giây (`HEAT.escapeDelay`) máu truy nã tự tụt 7/giây. |
| `helicopter.js` | Không hề đọc `world.stars`. Bay tự động ngắm cảnh vẫn chạy bình thường giữa lúc bị truy nã 4 sao. |

Tóm lại: lên trực thăng = xoá sạch sao trong khoảng 20 giây, không rủi ro.

---

## 2. Thiết kế cơ chế (vòng lặp chơi)

Không dùng "bắt tức thì trên không" — trẻ con bay ở 80m mà bị tóm đột ngột thì rất ức
chế. Thay vào đó là một chuỗi leo thang có tín hiệu rõ ràng, mỗi bước đều thoát được:

```
  1 sao + đang bay
        │
        ▼
  [1] Trực thăng cảnh sát xuất phát  ──► báo động trên HUD + chấm xanh nhấp nháy trên minimap
        │                                 (tour ngắm cảnh tự tắt, trả lái cho người chơi)
        ▼
  [2] Bám đuôi: bay chậm hơn người chơi (26 vs 34)
        │        → bay liên tục thì nới được khoảng cách; vòng vèo là bị bắt kịp
        ▼
  [3] Trong 26m: đèn pha khoá mục tiêu ──► máu truy nã KHÔNG nguội nữa (mấu chốt)
        │        Trong 22m: bắn đạn cao su ──► rung giật, tay lái còn một nửa 1.5 giây
        │
        ▼
  [4] Giữ khoá đủ 4 giây rồi mới trong 14m: vòi rồng phun ──► ướt 0→1 trong ~6 giây
        │                                cánh quạt ướt → mất dần lực nâng
        ▼
  [5] Trần bay bị ép xuống dần, buộc phải đáp
        │
        ├── Đáp xuống ► xe cảnh sát mặt đất bắt như bình thường (đã có sẵn)
        └── Cố lì trên không ở trạng thái ướt sũng ► sau 5 giây trong 12m thì bị bắt
        │
  [6] Sau 45 giây bám liên tục ► hết dầu, cả tốp về nghỉ 25 giây
```

**Đường thoát của người chơi** (bắt buộc phải có, nếu không thì tính năng chỉ là hình phạt):

1. **Bay liên tục cho hết dầu chúng**: trực thăng cảnh sát chậm hơn 24%, và sau 45 giây
   bám liên tục thì phải về tiếp dầu — cả tốp nghỉ 25 giây. Bay thẳng *nới* được khoảng
   cách nhưng không dứt hẳn được đuôi: thành phố chỉ rộng 420m, xem [§7](#7-những-gì-đo-đạc-bắt-phải-đổi).
2. **Ném bóng nước vào nó**: `projectiles.js` đã có cơ chế `soaked` cho cảnh sát. Trực
   thăng cảnh sát bị ướt sẽ lùi ra và ngừng phun trong 8 giây — đúng chất counter-play
   của game này.
3. **Đáp xuống, xuống máy bay, chui vào tàu điện / nội thất**: trực thăng mất dấu.
4. **Bay thấp luồn giữa các toà nhà**: trực thăng cảnh sát giữ cao độ an toàn (min 22m)
   nên bay sát nóc nhà sẽ khiến nó mất tầm ngắm vòi rồng.

---

## 3. Các giai đoạn triển khai

### Giai đoạn 1 — Thực thể & AI đuổi bám (lõi, chơi được ngay)

**File mới**: `src/game/systems/policeHeli.js`

- `createPoliceHelis()` — pool 2 chiếc, cấu trúc:
  `{ active, x, y, z, vx, vy, vz, heading, rotor, tiltRoll, state, soaked, lockTimer, bustTimer, giveUp, spotOn, cannonOn }`
- `updatePoliceHelis(world, dt)`:
  - **Sinh**: `world.stars >= POLICE_HELI.minStars` (2 sao) và `world.player.mode === 'heli'`
    (hoặc `player.y > 12`, để nóc tàu điện / mái nhà cũng tính). Sinh ở khoảng cách
    150–190m theo hướng ngẫu nhiên, cao độ 60m, cách nhau `spawnDelay` 3.5s.
  - **Bay**: không cần lưới đường — ghi thẳng vận tốc mong muốn giống `updateTour`
    (`helicopter.js:98`). Ngắm vào **vị trí dự đoán** của người chơi:
    `targetX = p.x + heli.vx * leadTime` (leadTime 1.1s), để nó cắt góc chứ không bám
    đuôi ngu ngốc.
  - **Giữ cự ly**: trong `hoverRange` (14m) thì chuyển sang bay vòng quanh mục tiêu thay
    vì đâm thẳng vào — tránh cảnh hai trực thăng dính vào nhau.
  - **Cao độ**: bám `p.y` nhưng kẹp trong `[minAltitude 22, HELI.maxAltitude]`.
  - **Va chạm**: dùng lại `resolveStatic(world.bp, h, bodyRadius, h.y)` và kẹp biên thành
    phố y hệt `helicopter.js:300-314`.
  - **Bỏ cuộc**: `stars === 0`, hoặc khoảng cách > `loseRange` 220m, hoặc mất dấu quá
    `giveUpTime` 8s → bay lên cao rồi tắt `active`.

**Sửa `src/game/world.js`**:
- `export const MAX_POLICE_HELIS = 2`
- Thêm `policeHelis: createPoliceHelis()` vào world.
- Tắt hết trong `respawnPlayer` và `resetGame` (cạnh vòng lặp `for (const c of world.police)`).

**Sửa `src/game/GameLoop.jsx`**: gọi `updatePoliceHelis(world, dt)` ngay sau
`updatePolice(world, dt)`, bên trong nhánh `if (world.interior === 'none')`.

**Sửa `src/game/systems/helicopter.js`**: khi chiếc đầu tiên xuất hiện thì
`world.heli.tour.active = false` — không để chế độ ngắm cảnh lái hộ giữa lúc bị đuổi.

### Giai đoạn 2 — Máu truy nã không còn nguội trên trời

**Sửa `src/game/systems/heat.js` → `policeCanSee`**: thêm vòng duyệt `world.policeHelis`:

```
khoảng cách 3D < sightRange (120m)  →  thấy
  · nếu người chơi ở trên cao (p.y > 8): bỏ qua hasLineOfSight — trên không không có
    toà nhà nào che được, đó chính là lý do trực thăng tồn tại.
  · nếu người chơi đã xuống đất: vẫn kiểm tra hasLineOfSight như cảnh sát thường.
  · nhân với visibilityFactor(world) — đêm tối và mưa to vẫn làm khó tầm nhìn, giữ
    nguyên hợp đồng với cảnh sát mặt đất.
```

Đây là thay đổi quan trọng nhất về mặt cân bằng: từ đây, bay lên không còn là nút "xoá
sao" nữa.

### Giai đoạn 3 — Đèn pha, vòi rồng, ép hạ cánh

**Trong `policeHeli.js`**:
- `spotOn` khi cự ly 3D < `spotRange` 26m → cộng `lockTimer`, HUD hiện cảnh báo.
- `cannonOn` khi cự ly < `cannonRange` 12m **và** `soaked <= 0` (nó chưa bị ướt) → mỗi
  giây cộng `soakPerSec` 0.35 vào `world.heli.soaked` (kẹp 0..1). Thoát được thì trừ
  `soakDrain` 0.2/giây.

**Sửa `src/game/systems/helicopter.js`** — hiệu ứng ướt lên máy bay người chơi:
- `climbRate` thực tế nhân `(1 - 0.75 * heli.soaked)` — ướt hết thì gần như không leo nổi.
- Trần bay tạm thời: `maxAltitude * (1 - 0.6 * soaked)` → bị ép tụt xuống từ từ, có
  cảnh báo bằng cả hình ảnh (nước bắn tung) lẫn con số cao độ trên HUD.
- `maxSpeed` nhân `(1 - 0.25 * soaked)` — nặng nề hơn nhưng vẫn chạy được.
- Đáp xuống đất thì `soaked` khô nhanh (0.5/giây) — về hạ cánh là được tha.

**Sửa `src/game/systems/police.js` → `reachable`**: nới điều kiện độ cao. Thay vì
`p.y < 3` cứng, tách hai đường bắt:
- Xe/cảnh sát bộ mặt đất: giữ nguyên `p.y < 3` (không đổi hành vi cũ).
- Trực thăng cảnh sát: bắt được khi `p.mode === 'heli'`, `heli.soaked >= 0.9`, cự ly 3D
  < `bustRange` 7m liên tục `bustTime` 3.0s → `bustPlayer(world)` (dùng lại nguyên hàm
  cũ, nên màn hình "bị bắt", trừ điểm, hồi sinh đều đã đúng).

**Phản đòn bằng bóng nước** — sửa `src/game/systems/projectiles.js`: thêm khối kiểm tra
va chạm bóng nước với `world.policeHelis` (dùng bán kính rộng hơn, ~4m, vì mục tiêu bay).
Trúng thì `soaked = 8`, cộng điểm `SCORE.splashCop`, và trong `policeHeli.js` khi
`soaked > 0` thì bay lùi ra `hoverRange * 2.2` và không phun vòi rồng.

### Giai đoạn 4 — Hình ảnh, âm thanh, HUD

**Render** — tách phần thân trực thăng trong `src/render/Helicopter.jsx` (dòng 99–150)
thành component dùng chung `HeliBody({ bodyColor })`, rồi thêm
`src/render/PoliceHelicopters.jsx`:
- Sơn xanh dương/trắng, đèn quay xanh nhấp nháy trên nóc (dùng `emissiveIntensity` đổi
  theo `world.time`, giống đèn xe cảnh sát).
- Đèn pha: một `coneGeometry` trong suốt, additive, gốc ở bụng máy bay, ngọn hướng về
  người chơi — rẻ hơn `SpotLight` thật rất nhiều và hợp phong cách procedural sẵn có.
- Vòi rồng: tái dùng pool `splashes` hoặc vài hạt hình cầu rơi theo tia.
- Mount trong `src/App.jsx` ngay dưới `<Helicopter world={world} />` (dòng 52).

**Âm thanh** (`src/game/audio.js`): `updateSiren` hiện chỉ tính `nearestDist` của cảnh
sát mặt đất trong `police.js:282`. Cho `nearestDist` tính cả khoảng cách 3D tới trực
thăng cảnh sát để còi hú vẫn to dần khi bị đuổi trên trời. Thêm tiếng cánh quạt (nhiễu
lọc thấp, tần số theo cự ly) là tuỳ chọn.

**Minimap** (`src/ui/Minimap.jsx`, sau khối vẽ trực thăng người chơi ở dòng ~163): vẽ
chấm xanh có vòng cánh quạt quay, nhấp nháy cùng nhịp `flash` của cảnh sát.

**HUD** (`src/ui/HUD.jsx` `flight` panel, dòng ~160): thêm chỉ báo trạng thái —
"🚁 Cảnh sát đang bám!" khi bị khoá đèn pha, và thanh/phần trăm ướt khi `soaked > 0`.

**i18n** (`src/game/strings.js`) — chuỗi mới, cả `vi` và `en`:
| Key | vi |
| :-- | :-- |
| `heli.copsScrambled` | 🚁 Trực thăng cảnh sát đã cất cánh! |
| `heli.spotted` | 🔦 Đèn pha đã khoá — bay đi ngay! |
| `heli.soaking` | 💦 Cánh quạt ướt sũng — phải hạ cánh! |
| `heli.copHeliSoaked` | 💦 Trúng rồi! Trực thăng cảnh sát phải lùi ra |
| `heli.escapedAir` | ✅ Đã cắt đuôi trực thăng cảnh sát |

### Giai đoạn 5 — Cấu hình & cân bằng

Khối mới trong `src/game/config.js`, đặt ngay sau `HELI`:

Khối `POLICE_HELI` nằm trong `src/game/config.js`, ngay sau `HELI`. Các số đã qua chỉnh
theo kết quả đo (bản đầy đủ kèm chú thích nằm trong chính file config).

Ràng buộc cần giữ khi chỉnh số:
- `maxSpeed (26) < HELI.maxSpeed (34)` và `climbRate (12) < HELI.climbRate (14)` — nếu
  không thì không bao giờ nới được khoảng cách, và game mất tính công bằng.
- `accel / drag > maxSpeed` — cùng cái bẫy đã ghi chú ở `HELI.maxSpeed`.
- **Cự ly treo < `cannonRange` < `spotRange` < `sightRange`.** `hoverRange` (8 ngang) và
  `hoverAbove` (5 cao) cộng độ trễ lái cho ra cự ly ổn định khoảng 11m; mọi ngưỡng hiệu
  ứng phải rộng hơn con số đó. Đây chính là chỗ bản kế hoạch đầu tiên sai.
- `bustRange (12)` cũng phải rộng hơn cự ly treo, nếu không lệnh bắt trên không không bao
  giờ có cơ hội chạy.

---

## 4. Danh sách file đụng tới

| File | Việc |
| :-- | :-- |
| `src/game/systems/policeHeli.js` | **mới** — pool, AI đuổi, đèn pha, vòi rồng, bắt |
| `src/render/PoliceHelicopters.jsx` | **mới** — dựng hình đội bay |
| `src/game/config.js` | thêm khối `POLICE_HELI` |
| `src/game/world.js` | pool + dọn dẹp khi hồi sinh / chơi lại |
| `src/game/GameLoop.jsx` | gọi hệ thống mới |
| `src/game/systems/heat.js` | `policeCanSee` nhìn được từ trên không |
| `src/game/systems/police.js` | `reachable` + còi hú tính cả trực thăng |
| `src/game/systems/helicopter.js` | hiệu ứng ướt, tắt tour khi bị đuổi |
| `src/game/systems/projectiles.js` | bóng nước bắn trúng trực thăng cảnh sát |
| `src/render/Helicopter.jsx` | tách `HeliBody` dùng chung |
| `src/App.jsx` | mount renderer mới |
| `src/ui/Minimap.jsx`, `src/ui/HUD.jsx`, `src/game/strings.js` | chỉ báo + chuỗi vi/en |
| `docs/architecture/game-systems.md` | ghi lại hệ thống mới |

---

## 5. Rủi ro & tình huống biên

| Tình huống | Xử lý |
| :-- | :-- |
| Người chơi rời trực thăng giữa lúc bị đuổi | Trực thăng cảnh sát chuyển sang bay vòng phía trên, giữ máu truy nã cháy; xe mặt đất bắt như cũ. |
| Người chơi vào nội thất (đồn / siêu thị) | `GameLoop` đã bọc trong `if (world.interior === 'none')`, hệ thống đứng yên; thêm bỏ cuộc khi `world.interior !== 'none'` quá 3 giây. |
| Bị bắt / hồi sinh / chơi lại | Tắt pool trong `respawnPlayer` và `resetGame`, cùng chỗ với `world.police`. |
| Lốc xoáy / sóng thần đang diễn ra | Bỏ qua giai đoạn 1; nếu về sau muốn, cho trực thăng cảnh sát rút lui khi có thiên tai (đúng logic và tránh việc tính toán vật lý chồng chéo). |
| Hai chiếc dính vào nhau | `hoverRange` khác nhau theo chỉ số i (14 và 20) + lệch góc vòng quanh 180°. |
| Hiệu năng | Tối đa 2 thực thể, không đụng lưới đường, không thêm đường BFS. Chi phí không đáng kể. |
| Quá khó với trẻ con | `minStars` là van an toàn; nếu play-test thấy gắt, nâng lên 3 hoặc giảm `soakPerSec`. |

---

## 6. Kiểm thử

1. Đạt 2 sao rồi lên trực thăng → trong ~4 giây phải thấy báo động + chấm xanh trên minimap.
2. Bay thẳng một mạch sang bên kia thành phố → cắt được đuôi, sao bắt đầu nguội.
3. Bay vòng vèo tại chỗ → bị bám kịp, đèn pha khoá, **sao không nguội** (đây là bài kiểm
   tra chính của giai đoạn 2).
4. Đứng yên treo máy bay → bị phun nước, tụt cao độ dần, cuối cùng bị bắt trong ~3 giây.
5. Ném bóng nước trúng trực thăng cảnh sát → nó lùi ra, được cộng điểm.
6. Bị bắt → hồi sinh sạch sẽ, không còn trực thăng cảnh sát nào lảng vảng.
7. Xuống 0 sao → đội bay rút lui đàng hoàng, không biến mất đột ngột.
8. Vào siêu thị giữa lúc bị đuổi → không lỗi, ra khỏi cửa thì tình hình hợp lý.

---

## 7. Những gì đo đạc bắt phải đổi

Cuộc rượt đuổi được chạy thử bằng một harness gọi thẳng các hàm `update*` ngoài trình
duyệt (60 khung hình/giây, không dựng hình). Ba chỗ bản kế hoạch ban đầu sai:

**1. Vòi rồng không bao giờ nổ được.** `hoverRange` 14 lớn hơn `cannonRange` 12, nên
trực thăng cảnh sát vòng quanh ở đúng cái cự ly mà nó không với tới. Chuỗi leo thang
dừng ở bước "khoá đèn pha" và người chơi có treo yên tại chỗ 40 giây cũng không sao.
Sửa: cự ly treo xuống 8+5, `cannonRange` lên 14, `bustRange` lên 12.

**2. "Bay thẳng là thoát" không đúng với một thành phố rộng 420m.** Chênh lệch 4 đơn vị
tốc độ ban đầu cần khoảng 26 giây bay thẳng để nới từ 15m ra ngoài tầm nhìn — dài hơn cả
chiều ngang bản đồ (12 giây là đụng tường biên). Sửa: hạ `maxSpeed` xuống 26, và quan
trọng hơn là thêm cơ chế **về tiếp dầu** (`maxChase` 45 giây, `regroupDelay` 25 giây).
Nhịp nghỉ này mới là thứ biến việc bay liên tục thành một đường thoát có thật. Đo lại:
người chơi bay liên tục 70 giây không bị bắt lần nào, và luôn có ít nhất một khoảng
trời quang.

**3. Cắt được đuôi mà không được nghỉ.** Chiếc mất dấu tự tắt, và ngay khung hình sau
một chiếc mới cất cánh cách đó 150m — công chạy thoát đổi lấy con số không. Sửa: mọi
lần rút lui đều đặt thời gian nghỉ cho cả tốp.

Ngoài ra, một lỗi có sẵn lộ ra khi đo: `updateHelicopter` kẹp toạ độ ở tường biên thành
phố nhưng **không** triệt vận tốc, nên người chơi bị dí vào góc bản đồ trong khi đồng hồ
vẫn báo 122 km/h. Đã sửa để vận tốc đâm vào tường bị triệt còn thành phần dọc theo tường
thì giữ nguyên — bay men theo biên giờ là một đường chạy thật.
