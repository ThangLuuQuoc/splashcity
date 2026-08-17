# Kế hoạch Triển khai: Khám phá Nội thất Trụ sở Cảnh sát & Siêu thị Việt Nam 2 Tầng (Interiors Exploration System)

Tài liệu này mô tả chi tiết kế hoạch thiết kế và triển khai tính năng cho phép người chơi bước vào (**Enter/Exit**) và khám phá 2 tòa nhà quan trọng trong thành phố: **Trụ sở Cảnh sát (Police Station)** và **Siêu thị Việt Nam 2 Tầng (Splash Mart Supermarket)**, đi kèm hệ thống kệ hàng Việt Nam, thang cuốn, quầy thu ngân, điện thoại quét mã QR thanh toán và tương tác vật phẩm.

---

## 1. Tổng quan Thiết kế & Kiến trúc Giải pháp

```
                      [Thế giới Mở (City Overworld)]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼ (Ấn E tại cửa đồn)                     ▼ (Ấn E tại cửa siêu thị)
    [Trụ sở Cảnh sát (Police HQ)]            [Siêu thị 2 Tầng (Splash Mart)]
    - Bàn trực ban & PC cảnh sát             - Tầng 1: Kệ hàng VN, Trái cây, Quầy tính tiền
    - Bảng truy nã (Wanted Board)            - Thang cuốn (Escalator) lên Tầng 2
    - Phòng tạm giữ (Holding Cells)          - Tầng 2: Đồ chơi, Nước giải khát, Ghế nghỉ
    - Kho vũ khí nước & Nút còi hú           - Phone QR Scan: Thanh toán MoMo / VNPay
                                             - Bỏ túi đồ & Sử dụng (Vỏ chuối, Snack, Oreo...)
```

### 1.1 Cơ chế Chuyển cảnh Không gian (Interior Space Architecture)
- Để giữ nguyên hiệu năng 60 FPS mượt mà và không làm phức tạp hóa lưới va chạm mặt đất, các không gian nội thất (Interiors) được đặt tại các tọa độ ảo biệt lập (Dedicated Interior Coords $y = -80$ hoặc vùng đệm riêng biệt) hoặc quản lý qua trạng thái `world.interior = 'none' | 'police_station' | 'supermarket'`.
- Khi người chơi tương tác cửa (`[E] Vào tòa nhà`):
  1. Hiệu ứng làm mờ màn hình ngắn (Fade to black ~0.25s).
  2. Cập nhật vị trí người chơi sang sảnh tòa nhà, chuyển camera sang chế độ góc nhìn phòng.
  3. Đổi nhạc nền & âm thanh môi trường (Tiếng bộ đàm cảnh sát trong đồn, nhạc siêu thị êm dịu tít tít máy quét mã trong siêu thị).
  4. Người chơi nhấn `[E]` tại cửa ra để quay trở lại đúng vị trí ngoài phố.

---

## 2. Chi tiết 2 Khu vực Tòa nhà

### 🏢 Khu vực 1: Trụ sở Cảnh sát (Police Station HQ)
- **Kiến trúc & Đồ họa**:
  - Sảnh lễ tân với logo huy hiệu cảnh sát, bàn làm việc trực ban, máy tính và cốc cà phê.
  - **Bảng Truy nã Động (Wanted Board)**: Hiển thị ảnh đại diện của người chơi, số sao hiện tại và tổng số điểm quậy phá đã gây ra trong thành phố.
  - **Phòng Giam Tạm Giữ (Holding Cells)**: Các phòng giam có song sắt, giường tầng và bóng nước bí mật được giấu trong góc phòng.
  - **Kho Tang vật & Vũ khí Nước (Armory)**:
    - Kệ trưng bày súng nước Super Soaker, bình bọt tuyết khổng lồ.
    - Người chơi có thể "trộm" bóng nước siêu cấp (Mega Balloon - bán kính tạt nước $2\times$).
  - **Nút Báo động Khẩn cấp (Alarm Button)**: Người chơi có thể nhấn để kích hoạt còi hú trêu chọc toàn bộ cảnh sát trong đồn.

---

### 🛒 Khu vực 2: Siêu thị Việt Nam 2 Tầng (Splash Mart Supermarket)

#### A. Tầng 1: Thực phẩm, Snack, Hóa mỹ phẩm & Quầy Thu ngân
- **Các Kệ Hàng Sản Phẩm Việt Nam Đặc Trưng**:
  - *Hóa mỹ phẩm & Trẻ em*: **Kem đánh răng P/S Dâu cho bé** (hộp đỏ dâu tây), xà phòng bọt.
  - *Bánh kẹo & Snack*: **Bánh quy Oreo**, **Snack khoai tây Lay's** (vàng/đỏ), **Snack Pringles** (ống tròn đặc trưng), **Sô-cô-la Meiji**, **Thanh Feastables (MrBeast Chocolate)**, **Bánh KitKat**.
  - *Quầy Trái cây Tươi*: **Chuối già Nam Mỹ** (nải chuối vàng ươm), **Nho mẫu đơn / Nho Ninh Thuận** (chùm tím mọng), **Táo Queen** (đỏ bóng).
- **Quầy Tính Tiền & Thu Ngân (Checkout Counter)**:
  - Máy quét mã vạch Barcode Scanner phát âm thanh *"Tít! Tít!"*.
  - Màn hình POS hiển thị hóa đơn và mã QR động.
- **Thang Cuốn Cơ Học (Moving Escalator)**:
  - Băng chuyền thang cuốn tự động trượt đưa người chơi từ Tầng 1 lên Tầng 2 êm ái.

#### B. Tầng 2: Đồ gia dụng, Nước giải khát & Khu Đồ chơi Trẻ em
- Kệ nước ngọt đóng chai, nước tăng lực.
- Khu bày bán súng nước đồ chơi, bóng bay sắc màu.
- Bàn ghế nghỉ ngơi và ban công ngắm nhìn xuống sảnh Tầng 1.

#### C. Tính năng Smartphone Quét Mã Thanh Toán (Phone QR Scanner) & Túi đồ (Inventory)
- **Mở Điện Thoại**: Nhấn phím `P` hoặc chạm vào biểu tượng 📱 trên màn hình.
- **Quét Mã Thanh Toán**: Khi đứng trước quầy thu ngân hoặc kệ hàng, bật camera điện thoại quét mã QR (Giao diện **SplashPay / MoMo / VNPay** phong cách hoạt hình ngộ nghĩnh).
- **Thanh toán thành công**: Tiếng chuông *"Ting! Thanh toán thành công"* vang lên, vật phẩm được đưa vào túi đồ người chơi.
- **Tác dụng của các Vật phẩm khi Sử dụng**:
  - 🍌 **Chuối già Nam Mỹ**: Ăn để lấy lại sức, sau đó vứt vỏ chuối ra sàn nhà/mặt đường làm NPC và xe cảnh sát trượt ngã xoay 360 độ.
  - 🍫 **Feastables MrBeast / Oreo / Meiji**: Ăn vào nhận hiệu ứng **"Sugar Rush"** tăng 50% tốc độ chạy nước rút trong 10 giây.
  - 🪥 **Kem đánh răng P/S Dâu**: Dùng để bôi tạo vệt trơn trượt dâu tây màu hồng trên sàn.
  - 🍎 **Táo Queen / Nho**: Dùng làm đạn ném trúng mục tiêu phát ra tiếng *bốp* vui nhộn.

---

## 3. Quản lý Tài nguyên 3D & Shaders (Hybrid Asset Pipeline)

1. **Procedural Geometry kết hợp Canvas Textures (Mặc định)**:
   - Các hộp bánh Oreo, ống Pringles, gói Lay's, tuýp P/S, nải chuối, thang cuốn được tạo hình từ Box/Cylinder với nhãn bao bì được vẽ tự động bằng HTML5 Canvas 2D Texture (nhẹ, tải tức thì, 0 latency, sắc nét).
2. **Hỗ trợ Tích hợp 3D Model ngoài (GLTF Loader Pipeline)**:
   - Tích hợp sẵn module `useGLTF` / `GLTFLoader` của Three.js để dễ dàng nạp thêm các model 3D miễn phí từ các kho tài nguyên:
     - `https://threejsassets.com/assets/free`
     - `https://polyfork.dev/free-3d-models`
     - `https://sketchfab.com/tags/threejs`

---

## 4. Các Thay đổi Đề xuất trong Mã nguồn

### Nhóm 1: Hệ thống Lõi & Cấu hình
- [MODIFY] [`src/game/config.js`](file:///f:/2027/splashcity/src/game/config.js): Thêm cấu hình `INTERIORS`, tọa độ, danh mục sản phẩm siêu thị, hiệu ứng vật phẩm.
- [MODIFY] [`src/game/world.js`](file:///f:/2027/splashcity/src/game/world.js): Thêm trạng thái `interior: 'none' | 'supermarket' | 'police_station'`, túi đồ `inventory: []`, danh sách vật phẩm trên kệ.
- [MODIFY] [`src/game/city.js`](file:///f:/2027/splashcity/src/game/city.js): Đặt vị trí tòa nhà Siêu thị lớn trên bản đồ thành phố, tạo cửa ra vào cho cả Đồn cảnh sát và Siêu thị.

### Nhóm 2: Các Hệ thống Gameplay & Tương tác
- [NEW] `src/game/systems/interiors.js`: Quản lý vào/ra tòa nhà, kiểm tra va chạm trong phòng, thang cuốn, quầy thu ngân.
- [NEW] `src/game/systems/inventory.js`: Quản lý vật phẩm trong túi, ăn/dùng/ném vật phẩm (vỏ chuối trượt, ăn snack tăng tốc).
- [MODIFY] [`src/game/systems/actions.js`](file:///f:/2027/splashcity/src/game/systems/actions.js): Thêm tương tác cửa `[E]`, quét mã `[P]`.
- [MODIFY] [`src/game/GameLoop.jsx`](file:///f:/2027/splashcity/src/game/GameLoop.jsx): Tích hợp `updateInteriors()` và `updateInventory()`.

### Nhóm 3: Dựng hình 3D & Shaders
- [NEW] `src/render/SupermarketInterior.jsx`: Render toàn bộ không gian siêu thị 2 tầng, thang cuốn, kệ hàng, quầy thu ngân, ánh sáng đèn led trần.
- [NEW] `src/render/PoliceInterior.jsx`: Render đồn cảnh sát, bàn làm việc, phòng giam, bảng truy nã, kho tang vật.
- [NEW] `src/render/Products.jsx`: Render các vật phẩm (P/S, Oreo, Lay's, Pringles, Chuối, Táo, Meiji, Feastables) bằng procedural mesh & canvas textures.
- [MODIFY] [`src/render/City.jsx`](file:///f:/2027/splashcity/src/render/City.jsx): Thêm mặt tiền biển hiệu Siêu thị Splash Mart và cửa kính tự động.

### Nhóm 4: Giao diện Người dùng (UI / HUD)
- [NEW] `src/ui/PhoneOverlay.jsx`: Giao diện Smartphone pop-up quét mã QR thanh toán (SplashPay/MoMo style) và xem giỏ hàng/túi đồ.
- [MODIFY] [`src/ui/HUD.jsx`](file:///f:/2027/splashcity/src/ui/HUD.jsx): Thêm thanh Quick Slot túi đồ và nút mở Phone trên màn hình cảm ứng di động.

---

## 5. Kế hoạch Xác minh (Verification Plan)

### Kiểm tra Tự động & Build:
- Chạy `npm run build` để đảm bảo bundle không phát sinh lỗi compile/syntax.

### Kiểm tra Tính năng Thủ công (Play-testing):
1. **Kiểm tra Cửa & Chuyển cảnh**:
   - Di chuyển người chơi đến trước Đồn cảnh sát ➔ Nhấn `E` ➔ Vào trong đồn trơn tru.
   - Nhấn `E` tại cửa đồn ➔ Ra lại mặt phố đúng vị trí.
   - Di chuyển đến Siêu thị Splash Mart ➔ Nhấn `E` ➔ Vào siêu thị tầng 1.
2. **Kiểm tra Siêu thị & Kệ hàng**:
   - Tiến lại các kệ hàng (Oreo, P/S dâu, Chuối già, Lay's, Feastables) ➔ Nhìn thấy nhãn hiệu và prompt nhặt hàng.
   - Đi lên thang cuốn ➔ Tự động trượt lên Tầng 2 êm ái.
3. **Kiểm tra Phone QR Pay & Sử dụng Vật phẩm**:
   - Nhấn `P` mở điện thoại tại quầy thu ngân ➔ Quét mã QR thanh toán.
   - Nhận chuối vào túi đồ ➔ Sử dụng chuối ➔ Vỏ chuối rớt ra sàn ➔ NPC đạp trúng bị trượt chân ngã.
   - Ăn Feastables/Oreo ➔ Người chơi tăng tốc độ chạy nước rút (Sugar Rush).
4. **Kiểm tra trên Thiết bị Di động**:
   - Mở Touch Controls ➔ Có nút 📱 để mở điện thoại thanh toán mượt mà.
