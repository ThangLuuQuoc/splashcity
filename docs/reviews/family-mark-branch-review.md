# Code Review — Nhánh `gemini`: Family Mark, Bảng hiệu Phố, Quầy Thu Ngân & Nhân viên NPC

| | |
| :--- | :--- |
| **Nhánh** | `gemini` → `main` |
| **Commit** | `b8b30dd` — *feat(supermarket): upgrade Family Mark, dual escalators, bilingual i18n, modern checkout POS & cashier NPC, fix phone overlay hook* |
| **Phạm vi** | 20 files, +1920 / −821 |
| **Ngày review** | 2026-08-20 |
| **Kết luận** | ⚠️ **Chưa merge ngay** — 5 mục cần sửa trước (4 lỗi hiển thị + 1 lỗi tài liệu), 5 mục nên sửa sau |

---

## 1. Cách đã kiểm tra (Verification Method)

Review này **không** dựa trên đọc diff suông. Các bằng chứng đã thu được:

1. **Build production**: `npx vite build` → pass, 134 modules, bundle 1.23 MB (gzip 347 KB).
2. **Load runtime**: `npm run dev` + đọc console → **0 error**.
3. **Chạy `generateCity()` headless** bằng Node để đếm số liệu thật (xem §2).
4. **Tính toán toạ độ & AABB thủ công** cho từng khối hình mới (bảng hiệu, quầy thu ngân, NPC, thang cuốn) đối chiếu với hộp collision trong `interiors.js`.
5. **Đối chiếu tỉ lệ texture / mặt geometry** cho toàn bộ biển hiệu mới.

> ⚠️ **Giới hạn**: không chụp được screenshot trong phiên review (Browser pane không hiển thị nên trang không composite frame). Các kết luận hình ảnh dưới đây suy ra từ toạ độ hình học, **chưa được xác nhận bằng mắt**. Khi sửa, nên mở game xem trực tiếp để xác nhận lại.

---

## 2. Số liệu đo thực tế từ `generateCity()`

```
buildings                                    93
buildings có shop                            78
buildings có shopFace (bảng hiệu render)     78
bảng hiệu nằm ở mặt hông (rotY = ±π/2)        0
bảng hiệu rộng hơn mặt tường nó gắn vào       0
toà nhà thấp hơn đỉnh bảng hiệu (y=5.1)       0
```

Suy ra: **78 storefront × 3 mesh = 234 draw call** mới thêm vào thành phố (xem §4.1).

---

## 3. Những phần làm tốt (Xác nhận đạt)

### ✅ Bảng hiệu cửa hàng mặt phố
- 10 loại shop (`coffee`, `hotel`, `bank`, `pizza`, `bakery`, `pharmacy`, `cinema`, `bookstore`, `tech`, `gym`) trong `SHOP_CONFIGS`.
- Logic chọn mặt tiền trong `generateBuildings()` xoay **đúng** hướng ra đường ở cả 4 nhánh: `rotY = 0` cho mặt +z, `π` cho −z, `π/2` cho +x, `−π/2` cho −x — kiểm tra bằng phép quay quanh trục Y, local +z luôn map ra đúng phía ngoài.
- Không toà nào bị bảng hiệu tràn khỏi mặt tường, không toà nào quá thấp so với bảng (đo ở §2).

### ✅ Quầy thu ngân hiện đại
- Đầy đủ: băng chuyền + nẹp inox + thanh phân cách, POS 2 màn hình (mặt nhân viên chạy `FAMILY POS v2.6`, mặt khách chạy QR SplashPay), scanner phẳng, scanner cầm tay, máy in bill nhiệt, máy EDC, két tiền, kệ kẹo mini, trụ inox xếp hàng, biển đèn treo trần 2 mặt.
- Hộp collision cũ `resolveBoxCollision(p, scx-10.6, scx-5.4, scz+7.0, scz+9.0)` **vẫn khớp** thân quầy mới (mặt bàn `scx-10.5…-5.5`, `scz+6.9…+9.1`).
- Vùng prompt `SUPERMARKET_SPACE.cashier` bán kính 3.2 vẫn trùm hết đảo quầy → không phải sửa gì trong `interiors.js`.

### ✅ Nhân viên thu ngân NPC (Mai Anh)
- Đồng phục xanh Family Mark, mũ lưỡi trai, thẻ tên texture riêng, animation đầu (`sin(t*1.2)`) + tay quét mã (`sin(t*2.8)`) độc lập nhau nên trông tự nhiên.
- Thẻ tên là mesh duy nhất có **tỉ lệ texture đúng**: plane 0.18×0.09 (2:1) ↔ texture 256×128 (2:1).

### ✅ Thang cuốn 2 làn — sửa đúng bug tiếp đất
- Làn lên chạy tới `zTop − 0.6` (trước: `zTop + 0.4`), sàn đón mở rộng tới `scz − 7.5` (trước `−8.5`), ngưỡng `supportY` hạ 4.0 → 3.5. Ba thay đổi này ăn khớp: người chơi lên tới `z = scz − 9.1` là đã đứng hẳn trên sàn đón, `onLanding2` nhận đúng, không còn rơi ở mép.
- Biên hai làn liền mạch tại `x = scx + 13.8` (`onDownEscX < 13.8`, `onUpEscX >= 13.8`) — không hở khe.
- `t = clamp(0, 1, …)` nên dù `p.z` vượt `zBottom` tới `+0.6` thì `targetY` vẫn không tụt xuống dưới sàn.
- Bậc thang giờ animate cả 2 làn, wrap `zSpan = 13.0` khớp chiều dài dốc.

### ✅ Đổi sản phẩm Sting → Cocacla / Pensi
- `grep -rn "sting" src/` → **0 kết quả** còn sót (ngoài `coasting` / `Math.sign` không liên quan).
- Bao bì vẽ mới (`packaging.js`): cả `coca_cola` và `pepsi` đều **balance đúng** `ctx.save()` / `ctx.restore()` trong vòng lặp 2 panel — không rò state canvas.
- `shelf_drinks` được thêm `altProductId: 'pepsi'`, và bố cục trong `martLayout.js` đặt Cocacla ở `x < 0`, Pensi ở `x > 0` — **khớp đúng** với luật chia `p.x > shelf.x` trong `interiors.js`.

### ✅ Cải thiện khác
- Sàn tầng 2 đổi `planeGeometry` → `boxGeometry` dày 0.15: nhìn từ tầng 1 lên không còn thấy sàn mỏng như tờ giấy.
- Cửa sổ tầng 1 mặt tiền siêu thị / đồn cảnh sát bị cull đúng (`y >= 7`) để nhường chỗ cho biển hiệu + cửa kính mới.
- `PhoneOverlay.jsx`: sửa `useGame((s) => s.lang)` từ hook gọi-mà-không-dùng thành biến thật, nhờ đó giỏ hàng và túi đồ mới đổi ngôn ngữ được.

---

## 4. 🔴 Cần sửa trước khi merge

### 4.1 Chữ trên toàn bộ bảng hiệu mới bị kéo méo ngang

**File**: `src/render/City.jsx:232`, `:256`, `:386`, `:410`, `:416`, `:420`, `:426`, `:464`

Texture được `map` trực tiếp lên `boxGeometry`. Đây đúng là cái bẫy mà `ShelfRack` trong `SupermarketInterior.jsx` **đã ghi chú tránh**:

> *"texture dán lên khối hộp thì bò ra cả 6 mặt và bị kéo méo theo tỉ lệ từng mặt"*

Hai hệ quả: (a) texture lặp ra cả mặt hông và mặt sau của khối hộp, (b) chữ bị scale phi tuyến.

| Bảng hiệu | Mặt trước (tỉ lệ) | Texture (tỉ lệ) | Kéo ngang |
| :--- | :--- | :--- | :---: |
| Family Mark mặt tiền | 22 × 2.4 (9.2:1) | 1024×256 (4:1) | **2.3×** |
| Family Mark pano nóc | 22 × 3.4 (6.5:1) | 1024×256 (4:1) | **1.6×** |
| Police mặt tiền | 18 × 2.2 (8.2:1) | 1024×256 (4:1) | **2.0×** |
| Police pano nóc | 16 × 2.4 (6.7:1) | 1024×256 (4:1) | **1.7×** |
| Poster khuyến mãi 2 bên cửa | 8.0 × 3.6 (2.2:1) | 512×512 (1:1) | **2.2×** |
| Cửa kính Family Mark | 6.8 × 3.8 (1.8:1) | 512×512 (1:1) | **1.8×** |
| Bảng hiệu 78 shop phố | 10 × 1.6 (6.25:1) | 512×128 (4:1) | **1.6×** |

**Cách sửa** (theo đúng pattern `ShelfRack` đã dùng): giữ `boxGeometry` làm khung màu trơn, dán texture lên một `planeGeometry` riêng đặt ở mặt trước, với tỉ lệ plane khớp tỉ lệ texture. Hoặc đơn giản hơn: sửa kích thước canvas cho khớp tỉ lệ mặt (ví dụ biển Family Mark 22×2.4 → canvas 1024×112).

- [ ] Sửa 8 vị trí `map={…}` trên `boxGeometry` trong `City.jsx`

---

### 4.2 Nhân viên thu ngân đứng *bên trong* thân quầy

**File**: `src/render/SupermarketInterior.jsx:814`

Group NPC đặt ở local `z = −0.85`, nhưng:

| Khối | Trải theo local z |
| :--- | :--- |
| Thân quầy (`4.8 × 1.1 × 2.0` @ y 0.6) | **−1.0 … +1.0** |
| Mặt bàn đá (`5.0 × 0.08 × 2.2` @ y 1.18) | **−1.1 … +1.1** |
| NPC (chân ±0.11 quanh z=−0.85) | −0.96 … −0.74 |

Hệ quả hình học:
- Hai chân + đôi giày (y 0 … 0.8) **nằm trọn trong khối quầy đặc**.
- Thân mình (y 0.775 … 1.525) bị **mặt bàn đá cắt ngang** tại y 1.14 … 1.22.
- Cánh tay phải animate đưa bàn tay xuống tới y ≈ 0.85 → **xuyên qua mặt bàn**.

Nhìn chính diện từ phía khách thì tạm chấp nhận được, nhưng siêu thị này có **vách kính trong suốt cả 4 phía** (mới thêm ở commit này) và **lan can kính tầng 2 nhìn xuống sảnh** → sẽ thấy rõ chân người trong hộp.

**Cách sửa**: đẩy NPC ra sau quầy, `position={[0.7, 0, -1.6]}` là vừa (sau mép bàn 1.1 + nửa bề dày thân 0.18 + khoảng đứng thoải mái).

- [ ] Đổi `position` của group NPC từ `[0.7, 0, -0.85]` → `[0.7, 0, -1.6]`

---

### 4.3 Biển "XUỐNG TẦNG 1" vô hình khi đứng ở tầng 2

**File**: `src/render/SupermarketInterior.jsx:1048`

```jsx
<mesh position={[0, 6.9, -6.5]}>   {/* hộp nền đỏ */}
<mesh position={[0, 6.9, -6.44]}>  {/* plane texture — nằm ở phía +z của hộp */}
  <planeGeometry args={[1.5, 0.44]} />
```

`planeGeometry` mặc định pháp tuyến hướng **+z**, material mặc định `side: FrontSide` → chỉ thấy được từ phía +z. Nhưng người chơi ở tầng 2 đứng trên sàn đón (`z ≤ scz − 7.5`) và đi **về phía +z** để xuống thang, tức là nhìn vào **mặt sau** → bị backface-cull, không thấy gì.

Bản `main` dùng hộp màu trơn nên không có vấn đề này → **đây là hồi quy do commit này**.

Đối chiếu: biển "LÊN TẦNG 2" (`:995`) thì **đúng** — người chơi ở tầng 1 đứng ở `z > 4.86` nhìn về −z, thấy đúng mặt +z.

**Cách sửa**: đặt plane ở phía −z của hộp và quay lại:
```jsx
<mesh position={[0, 6.9, -6.56]} rotation={[0, Math.PI, 0]}>
```

- [ ] Đảo hướng plane biển thang xuống

---

### 4.4 Hai dây ty treo biển thu ngân lơ lửng giữa không khí

**File**: `src/render/SupermarketInterior.jsx:553`

| | Giá trị |
| :--- | :--- |
| Group biển treo | y = 4.2 |
| Dây ty (`cylinder` cao 2.0 @ y +1.0) | y 4.2 … **6.2** |
| Trần siêu thị | y = **13** |
| Sàn tầng 2 phía trên quầy? | Không — sàn 2 chỉ trải `z −17 … 0`, quầy ở `z = +8` |

Thiếu **6.8 m**: hai thanh inox kết thúc giữa không khí, không neo vào đâu.

**Cách sửa** (chọn 1):
- Kéo dài dây: `cylinderGeometry args={[0.025, 0.025, 8.8, 8]}` + `position={[±1.4, 4.4, 0]}`.
- Hoặc thêm một tấm giả trần cục bộ phía trên khu thu ngân ở y ≈ 6.4 (hợp lý hơn về mặt kiến trúc siêu thị thật).

- [ ] Neo dây treo vào trần hoặc thêm giả trần cục bộ

---

### 4.5 Tài liệu vừa viết lại nhưng vẫn còn tên sản phẩm / thương hiệu đã xoá

Commit này rewrite gần như toàn bộ `docs/`, nhưng:

**Nghiêm trọng** — `docs/guides/configuration-and-tuning.md:102` **thêm mới** dòng tài liệu cho một product id **đã bị xoá khỏi code**:
```
- `sting_strawberry`: Nước Tăng Lực Sting Dâu (15.000đ) - Buff chạy nước rút 12s.
```
Phải đổi thành `coca_cola` + `pepsi`.

**Còn sót tên "Splash Mart"**:

| File | Dòng |
| :--- | :--- |
| `docs/architecture/game-systems.md` | 60, 88, 91, **100** (*"Quầy nước tăng lực Sting Dâu"*) |
| `docs/architecture/technical-architecture.md` | 179 |
| `docs/guides/adding-new-features.md` | 7 |
| `docs/guides/configuration-and-tuning.md` | 87 |
| `docs/guides/developer-guide.md` | 92, 156 |
| `docs/README.md` | 40 |
| `README.md` | 8 |
| `docs/implementation_plan.md` | 3, 14, 46, 105, 122 *(tài liệu kế hoạch lịch sử — có thể giữ nguyên)* |

**Còn sót trong code** — `src/game/systems/interiors.js:91`: comment `// Cửa Siêu Thị Splash Mart`.

- [ ] Sửa `configuration-and-tuning.md:102` (sting → coca_cola + pepsi)
- [ ] Đổi "Splash Mart" → "Family Mark" ở các file docs đang hoạt động
- [ ] Sửa comment `interiors.js:91`

---

## 5. 🟡 Nên sửa (không chặn merge)

### 5.1 Rủi ro hiệu năng: 234 mesh không instanced

78 storefront × 3 mesh (bảng hiệu + mái hiên + kính mặt tiền) = **234 draw call**, mỗi mesh tạo một `geometry` + một `material` riêng. Trước commit này, toàn bộ thân / mái / cửa sổ toà nhà đều gộp vào `InstancedMesh`.

Ngoài ra `City` giờ subscribe `useGame((s) => s.lang)` → mỗi lần đổi ngôn ngữ, React dựng lại toàn bộ 234 mesh (spike GC).

**Cách sửa**: `City.jsx` đã có sẵn helper `writeInstances`. Gộp thành:
- 10 `InstancedMesh` cho bảng hiệu (1 per shop type, dùng chung geometry + texture).
- 1 `InstancedMesh` cho mái hiên (màu qua `instanceColor`).
- 1 `InstancedMesh` cho kính mặt tiền.

→ 234 draw call giảm còn ~12.

- [ ] Instance hoá `BuildingShopSigns`

### 5.2 Cửa sổ tầng 1 chọc vào kính storefront trên cả 78 toà

**File**: `src/render/City.jsx:60`

| Khối | Trải y | Trải z |
| :--- | :--- | :--- |
| Hàng cửa sổ thứ nhất | 2.30 … 4.40 | face + 0.06 |
| Kính storefront mới (opacity 0.6) | 0.45 … 3.45 | face + 0.04 … 0.16 |
| Bảng hiệu shop | 3.85 … 5.45 | face + 0.045 … 0.395 |

Ô cửa sổ nằm **lọt bên trong** tấm kính bán trong suốt → sẽ thấy một tấm kính nổi lơ lửng trong lòng mặt tiền, kèm nguy cơ lỗi sort thứ tự alpha.

Bộ cull hiện tại chỉ áp cho siêu thị và đồn cảnh sát:
```js
if ((!b.supermarket && !b.station) || y >= 7) { … }
```
Cần bổ sung `&& !b.shopFace`.

- [ ] Thêm `b.shopFace` vào điều kiện cull cửa sổ tầng 1

### 5.3 Trụ inox xếp hàng & kệ kẹo mini thò ra ngoài hộp collision

**File**: `src/game/systems/interiors.js:130`

| Vật thể | Toạ độ world | Hộp chặn hiện tại |
| :--- | :--- | :--- |
| Trụ inox xếp hàng | x = `scx − 10.8` | x tới `scx − 10.6` |
| Kệ kẹo mini | z = `scz + 9.23` | z tới `scz + 9.0` |

Người chơi đi xuyên qua dây nhung đỏ và kệ kẹo.

**Cách sửa**: nới hộp → `resolveBoxCollision(p, scx - 11.0, scx - 5.4, scz + 6.8, scz + 9.3)`.

- [ ] Nới hộp collision quầy thu ngân

### 5.4 Còn hở i18n ở prompt và định dạng tiền

**File**: `src/game/systems/interiors.js:227`

```js
world.prompt = t('mart.pickUp', { item: prod.shortName, … })
```

Vẫn dùng `prod.shortName` (chỉ tiếng Việt) dù `shortName_en` đã được thêm ở commit này. Chơi tiếng Anh: bảng giá trên kệ ghi *"Cocacla Can"* nhưng prompt dưới màn hình ghi *"Lon Cocacla"*.

Định dạng tiền cũng lệch nhau:

| Nơi | Locale |
| :--- | :--- |
| `SupermarketInterior.jsx:1157` (bảng giá) | `lang === 'en' ? 'en-US' : 'vi-VN'` ✅ |
| `interiors.js:210` (prompt thanh toán) | `'vi-VN'` hard-code ❌ |
| `interiors.js:227` (prompt nhặt hàng) | `'vi-VN'` hard-code ❌ |
| `PhoneOverlay.jsx:100`, `:119`, `:128` | `'vi-VN'` hard-code ❌ |

**Cách sửa**: tách một helper `productLabel(prod, lang)` + `formatPrice(n, lang)` trong `i18n.js` rồi dùng chung.

- [ ] Thống nhất tên sản phẩm & định dạng tiền theo `lang`

### 5.5 Các mục nhỏ

- [ ] `src/game/city.js:69` — `SHOP_TYPES` khai báo **trong vòng lặp trong cùng**, cấp phát lại mảng cho mỗi toà nhà. Đưa ra module scope.
- [ ] `src/render/City.jsx:455` — `signW` dùng `s.face.w` cho **cả mặt hông**, đúng ra mặt hông phải dùng `s.face.d`. Hiện **chưa trigger** (đo thực tế: 0 mặt hông, vì `rows ≤ 2` với `blockSize` hiện tại) nhưng sẽ thành lỗi ngay khi tăng `CITY.blockSize`.
- [ ] `SupermarketInterior.jsx` — `SHELF_LABELS.cashier` khai báo nhưng **không dùng ở đâu** (biển treo dùng `cashierOverheadTexture` riêng). Xoá hoặc dùng lại.
- [ ] `SupermarketInterior.jsx:990` — hộp nền màu xanh `#38b000` của biển "LÊN TẦNG 2" bị plane texture (nền đỏ `#d62828`) **che kín 100%** → biển "lên" hiển thị màu đỏ giống biển "xuống". Nên cho `shelfSignTexture` nhận màu nền, hoặc bỏ hộp nền.
- [ ] `SupermarketInterior.jsx` — két đựng tiền ở y = 1.0, **chôn hoàn toàn** trong thân quầy đặc (y 0.05…1.15) → geometry chết, không bao giờ thấy.
- [ ] `City.jsx:254` — pano nóc đồn cảnh sát trải y 11.6 … 14.0, mái nhà ở 13.05 → **lún nửa dưới** vào mái. Nâng lên `y = 14.2`.

---

## 6. Lỗi có sẵn từ trước (không do nhánh này)

**`grapes` và `kitkat` bày trên kệ, có bảng giá, nhưng không thể nhặt.**

Cơ chế trong `interiors.js:224` chỉ hỗ trợ **2 món / kệ**:
```js
const targetId = (shelf.altProductId && p.x > shelf.x) ? shelf.altProductId : shelf.productId
```

| Kệ | Bày trên kệ | Nhặt được |
| :--- | :--- | :--- |
| `shelf_fruits` | banana, queen_apple, **grapes** | banana, queen_apple |
| `shelf_sweets` | feastables, meiji_choco, **kitkat** | feastables, meiji_choco |

**Đề xuất**: đổi `productId` / `altProductId` thành mảng `productIds` chia theo khoảng x, để một kệ đỡ được n món.

---

## 7. Bảng tổng hợp Checklist

| # | Mục | Mức độ | File |
| :---: | :--- | :--- | :--- |
| 4.1 | Chữ bảng hiệu kéo méo (`map` trên `boxGeometry`) | 🔴 Chặn | `City.jsx` ×8 |
| 4.2 | NPC thu ngân đứng trong thân quầy | 🔴 Chặn | `SupermarketInterior.jsx:814` |
| 4.3 | Biển thang xuống vô hình từ tầng 2 | 🔴 Chặn | `SupermarketInterior.jsx:1048` |
| 4.4 | Dây treo biển thu ngân lơ lửng | 🔴 Chặn | `SupermarketInterior.jsx:553` |
| 4.5 | Docs còn `sting_strawberry` & "Splash Mart" | 🔴 Chặn | `docs/` ×8, `interiors.js:91` |
| 5.1 | 234 draw call không instanced | 🟡 Nên | `City.jsx:440` |
| 5.2 | Cửa sổ chọc vào kính storefront | 🟡 Nên | `City.jsx:60` |
| 5.3 | Trụ inox & kệ kẹo ngoài hộp collision | 🟡 Nên | `interiors.js:130` |
| 5.4 | Hở i18n prompt & định dạng tiền | 🟡 Nên | `interiors.js`, `PhoneOverlay.jsx` |
| 5.5 | 6 mục nhỏ (dead code, magic number, z-fighting) | 🟢 Nhỏ | nhiều file |
| 6 | `grapes` / `kitkat` không nhặt được | ⚪ Có sẵn | `interiors.js:224` |
