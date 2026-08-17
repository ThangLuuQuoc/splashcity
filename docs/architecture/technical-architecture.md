# Kiến trúc Kỹ thuật (Technical Architecture)

Tài liệu này mô tả chi tiết toàn bộ kiến trúc nền tảng của **Splash City**, từ triết lý thiết kế, mô hình quản lý trạng thái, vòng lặp mô phỏng vật lý, cho tới hệ thống không gian và tối ưu hiệu năng.

---

## 1. Triết lý Thiết kế Cốt lõi (Core Architectural Philosophy)

### Nguyên tắc Vàng: *React KHÔNG BAO GIỜ sở hữu Trạng thái Mô phỏng*
```
[React Tree / UI Components]
           │
           │ (Đọc snapshot có chọn lọc qua Zustand Store @ ~5Hz)
           ▼
[Zustand Store (store.js)] <── [GameLoop sync / throttling]
                                     ▲
                                     │ (Mutation trực tiếp in-place @ 60 FPS)
                             [World State (world.js)]
                                     ▲
                                     │ (Cập nhật tuần tự)
                             [Game Systems Pipeline]
```

1. **Hiệu năng 60 FPS với số lượng thực thể lớn**:
   - Nếu đưa vị trí của 80+ thực thể (xe cộ, người đi bộ, cảnh sát, tàu điện, bóng nước) vào `useState` hoặc React State truyền thống, toàn bộ React component tree sẽ re-render 60 lần/giây, gây sập hiệu năng (thường giảm xuống < 15 FPS chỉ với ~30 thực thể).
   - Trong Splash City, **toàn bộ trạng thái thế giới là một plain JavaScript object có thể đột biến trực tiếp** (`src/game/world.js`).
2. **Tách biệt Triệt để giữa Mô phỏng (Simulation) và Hiển thị (Rendering)**:
   - Các hệ thống (`src/game/systems/*`) chỉ thao tác logic trên đối tượng `world`.
   - Các component đồ họa (`src/render/*`) chỉ đọc từ `world` để cập nhật ma trận biến đổi của `InstancedMesh` hoặc shader uniforms trong frame hiện tại.
   - UI 2D (HUD, Minimap, Menu) chỉ lắng nghe các giá trị tóm tắt (điểm, sao nhiệt, đạn) thông qua Zustand store được đồng bộ có chọn lọc khi có thay đổi thực sự.
3. **Zero External Assets (100% Procedural)**:
   - Không chứa bất kỳ file nhị phân 3D (`.glb`, `.fbx`), texture hình ảnh lớn (`.png`, `.jpg`), hay file audio (`.mp3`, `.wav`).
   - Mọi hình học 3D được sinh bằng thuật toán procedural geometry.
   - Mọi âm thanh (tiếng động cơ, còi hụ, sấm sét, tiếng tạt nước) được tổng hợp bằng Web Audio API oscillators/noise nodes.

---

## 2. Mô hình Dữ liệu Thế giới (`world.js`)

Đối tượng `world` được khởi tạo bởi `createWorld()` trong [`src/game/world.js`](file:///f:/2027/splashcity/src/game/world.js) và tồn tại xuyên suốt vòng đời của game:

```typescript
interface World {
  city: CityData;               // Dữ liệu bản đồ, khối nhà, mạng lưới đường
  bp: BroadphaseGrid;           // Lưới không gian va chạm Broadphase
  time: number;                 // Tổng thời gian game đã trôi qua (giây)
  timeOfDay: number;            // Giờ trong ngày (0..24, mặc định bắt đầu lúc 9.5)
  weather: WeatherDirector;     // Bộ quản lý thời tiết và tham số pha trộn
  disaster: DisasterState;      // Trạng thái thiên tai (Tornado, Tsunami)
  phase: 'menu' | 'playing' | 'busted';

  player: PlayerState;          // Tọa độ (x, y, z), vận tốc, góc xoay, trạng thái di chuyển
  camera: CameraState;          // Góc xoay yaw, pitch, tọa độ và độ rung lắc (shake)
  
  cars: CarEntity[];            // Danh sách xe lưu thông và xe đỗ
  peds: PedestrianEntity[];     // Danh sách người đi bộ
  props: PropEntity[];          // Đồ đạc trên phố (thùng rác, cọc tiêu, vòi nước)
  trains: TrainEntity[];        // Đoàn tàu điện trên cao
  fountains: Point2D[];         // Điểm phun nước để nạp đạn bóng nước

  police: PoliceCarEntity[];    // Danh sách xe cảnh sát (Object Pool: MAX_POLICE = 8)
  footCops: FootCopEntity[];    // Danh sách cảnh sát đi bộ (Object Pool: MAX_FOOT_COPS = 8)
  balloons: BalloonEntity[];    // Đạn bóng nước đang bay (Object Pool: MAX_BALLOONS = 40)
  splashes: SplashEntity[];     // Hiệu ứng nước bắn tung tóe (Object Pool: MAX_SPLASHES = 28)
  decals: PaintDecal[];         // Vết sơn cầu vồng trên tường

  heat: number;                 // Mức độ truy nã (0..100)
  stars: number;                // Số sao cảnh sát (0..4)
  score: number;                // Điểm số quậy phá
  ammo: number;                 // Số lượng bóng nước dự trữ (tối đa 16)
  stats: GameStats;             // Thống kê thành tích
}
```

### Kỹ thuật Object Pooling
Để tránh Garbage Collection (GC) pauses gây giật khung hình (frame drops) trên trình duyệt, các thực thể có tần suất sinh/hủy cao (cảnh sát, đạn bóng nước, vệt nước) được khởi tạo sẵn trong các mảng cố định (fixed-size pools) với cờ `active: boolean`.

---

## 3. Vòng lặp Game Tích hợp Đơn nhất (`GameLoop.jsx`)

Game chỉ đăng ký **duy nhất một hook `useFrame`** tại [`src/game/GameLoop.jsx`](file:///f:/2027/splashcity/src/game/GameLoop.jsx). Hook này điều phối toàn bộ các hệ thống theo một thứ tự thực thi xác định nghiêm ngặt:

```mermaid
graph TD
    A[Bắt đầu Frame: useFrame delta] --> B[1. updateWeather: Cập nhật chu kỳ ngày/đêm & thời tiết]
    B --> C{Kiểm tra world.phase}
    
    C -->|menu| D[Camera quỹ đạo quay quanh quảng trường -> endFrame]
    C -->|busted| E[Camera dâng cao lùi lại -> Hết thời gian: Respawn -> endFrame]
    
    C -->|playing| F[2. updateCamera: Tính góc chuột / touch]
    F --> G[3. updateTrains: Di chuyển tàu trên ray]
    G --> H[4. updatePlayer: Nhận phím/cần ảo, tính vận tốc người/xe]
    H --> I[5. updateTraffic: Xe AI đi theo đồ thị giao thông]
    I --> J[6. updatePedestrians: Người đi bộ dạo phố / chạy trốn]
    J --> K[7. resolveVehicleCollisions: Va chạm xe vs xe & vật lý nảy]
    K --> L[8. carsVersusPedestrians: Va chạm xe húc người]
    L --> M[9. updateProps: Thùng rác/chóp nón bị húc văng]
    M --> N[10. updateActions: Ném bóng nước & Xịt sơn lên tường]
    N --> O[11. updateProjectiles: Quỹ đạo đạn đạo bóng nước]
    O --> P[12. updateDisasters: Lốc xoáy / Sóng thần hất tung xe & người]
    P --> Q[13. updatePolice: BFS tìm đường & rượt đuổi người chơi]
    Q --> R[14. updateHeat: Tính toán sao & làm nguội truy nã]
    R --> S[15. Cập nhật Camera Lerp & Camera Shake]
    S --> T[16. Đồng bộ HUD Zustand Store nếu có thay đổi]
    T --> U[endFrame: Reset delta chuột/touch]
```

### Tại sao thứ tự này lại quan trọng?
- **Tàu điện chạy trước Người chơi**: Người chơi đứng trên nóc toa tàu sẽ được kế thừa tọa độ của tàu ngay trong frame đó, loại bỏ hiện tượng giật lắc hoặc trễ 1 frame (frame lag).
- **Thiên tai chạy sau hệ thống di chuyển thông thường**: Lốc xoáy và sóng thần có quyền ghi đè vị trí cuối cùng của xe cộ và người đi bộ khi chúng bị cuốn lên không trung.

---

## 4. Hệ thống Không gian & Xử lý Va chạm (`collision.js`)

Splash City sử dụng mô hình vật lý arcade phẳng tùy biến 2.5D (Flat 2D Plane với chiều cao Z/Y), không phụ thuộc vào các engine vật lý cồng kềnh như Cannon.js hay Rapier.

### 4.1 Cấu trúc Lưới Broadphase (Uniform Grid Spatial Hash)
- Toàn bộ các khối tĩnh của thành phố (tòa nhà, cột trụ đường ray, bệ ga) được đóng gói thành các Axis-Aligned Bounding Boxes (AABB).
- Không gian được chia thành các ô lưới kích thước `CELL_SIZE = 24` đơn vị.
- Hàm băm: `key = (cx, cz) => cx * 100000 + cz`.
- Khi kiểm tra va chạm của một hình tròn bán kính $R$ tại $(x, z)$, hệ thống chỉ truy vấn các ô lưới xung quanh trong phạm vi $[(x-R)/24, (x+R)/24]$, giảm độ phức tạp từ $O(N)$ xuống $O(1)$.

```
+-----------+-----------+-----------+
| (cx-1,cz+1)| (cx, cz+1)|(cx+1,cz+1)|
+-----------+-----------+-----------+
| (cx-1, cz)|   (O)     | (cx+1, cz)|  <- Vị trí thực thể (x, z)
+-----------+-----------+-----------+
| (cx-1,cz-1)| (cx, cz-1)|(cx+1,cz-1)|
+-----------+-----------+-----------+
```

### 4.2 Giải quyết Va chạm Đa độ cao (`resolveStatic`)
Hàm `resolveStatic(bp, ent, radius, entY)` hỗ trợ tham số độ cao `entY`:
- Các chướng ngại vật có thuộc tính `height`. Nếu `b.height <= entY + 0.1`, đối tượng sẽ đi xuyên qua đỉnh chướng ngại vật mà không bị chặn.
- **Ứng dụng thực tế**: Người chơi đứng trên bệ ga trên cao ($y = 9$) có thể đi bộ tự do qua không gian phía trên các cột trụ đỡ đường ray, trong khi xe hơi chạy dưới mặt đường ($y = 0$) sẽ va đập và bật nảy khi tông vào các cột trụ đó.

### 4.3 Kiểm tra Tầm nhìn (Line-of-Sight Raycasting)
Hàm `hasLineOfSight(bp, ax, az, bx, bz)` chia đoạn thẳng từ điểm $A$ đến $B$ thành các bước nhỏ $\le 3$ đơn vị và kiểm tra sự tồn tại của tòa nhà. Đây là thuật toán cốt lõi để cảnh sát phát hiện người chơi và xác định thời gian mất dấu (out-of-sight timer).

---

## 5. Kiến trúc Âm thanh Tự tổng hợp (`audio.js`)

Hệ thống âm thanh của game sử dụng trực tiếp **Web Audio API** mà không cần tải bất kỳ file audio nào:

1. **Engine Synthesizer (Tiếng động cơ xe)**:
   - Sử dụng `OscillatorNode` dạng sóng `sawtooth` kết hợp bộ lọc `BiquadFilterNode` low-pass. Tần số và độ mở filter biến thiên tuyến tính theo tốc độ di chuyển của xe.
2. **Police Siren (Còi hú cảnh sát)**:
   - Hai bộ dao động tạo hiệu ứng chênh lệch pha (dual-tone LFO) quét tần số giữa 600Hz và 900Hz. Âm lượng được điều chỉnh theo khoảng cách từ xe cảnh sát gần nhất đến người chơi.
3. **Thunder & Impacts (Sấm sét & Va chạm)**:
   - Tạo từ Buffer chứa nhiễu trắng (white noise) đi qua Envelope giảm dần theo hàm mũ kết hợp Low-pass filter.
4. **Water Splashes & Spray (Nước văng & Xịt sơn)**:
   - Sử dụng Bandpass noise filter với tần số quét nhanh để mô phỏng bọt nước và áp lực bình xịt.

---

## 6. Ngân sách Hiệu năng & Tối ưu hóa (Performance Budget)

| Thành phần | Cơ chế Tối ưu | Mục tiêu |
| :--- | :--- | :--- |
| **Draw Calls** | Gom cụm bằng `InstancedMesh` cho tòa nhà, xe cộ, người đi bộ, ray tàu | $\le 25$ draw calls/frame |
| **Garbage Collection** | Object pools cho đạn, hiệu ứng, cảnh sát; tái sử dụng scratch vectors | Không có GC spike |
| **Physics Step** | Bỏ qua mô phỏng 3D đầy đủ, dùng Circle-AABB và Ballistic Euler tích phân | $< 2$ms CPU time / frame |
| **Di động / Tablet** | Giới hạn `dpr` tối đa 1.75 (`maxPixelRatio`), giảm hạt thời tiết | Đạt 60 FPS ổn định |

---

## 7. Ba Hợp Đồng Tích Hợp Hệ Thống Cốt Lõi (Integration Contracts)

Nhằm đảm bảo sự phối hợp hoàn hảo và không xung đột giữa các hệ thống (Gameplay, UI, Interiors, Inventory, Physics):

### 7.1 Hợp Đồng Sở Hữu Input (Input Ownership Contract)
- Do `keyPressed(code)` là một **edge-flag** được lưu trong frame và không bị tiêu thụ (consumed) tự động, **mỗi phím chỉ được một hệ thống duy nhất chịu trách nhiệm xử lý logic**:
  - `KeyP` (Smartphone / SplashPay): Độc quyền sở hữu bởi `actions.js`. Các hệ thống khác (`interiors.js`, `HUD.jsx`) tuyệt đối không gọi `keyPressed('KeyP')` để tránh tình trạng toggle kép trong cùng frame.
  - `KeyE` (Tương tác / Vào ra nhà / Lên xe): Xử lý theo thứ tự ưu tiên trong frame: `interiors.js` xử lý nếu người chơi ở gần cửa / kệ hàng / quầy; `player.js` xử lý nếu ở gần xe hoặc tàu.
  - `Digit1 - Digit4` (Dùng Item): Độc quyền sở hữu bởi `actions.js`.

### 7.2 Hợp Đồng Trạng Thái Một Chiều (Unidirectional State Contract: World is Truth)
- `world` (Plain Mutable Object) là **Nguồn Chân Lý duy nhất (Single Source of Truth)** của toàn bộ trò chơi.
- Zustand `useGame` Store chỉ đóng vai trò là một **tấm gương phản chiếu (mirror)** được `GameLoop.jsx` đồng bộ định kỳ sang React UI.
- **Quy tắc bắt buộc**: Mọi tương tác người dùng từ React UI (nút bấm mở/đóng Smartphone, mua hàng, bấm nút Mute) **PHẢI ghi trực tiếp vào `world` trước** (`world.phoneOpen = false`), sau đó mới cập nhật store (`setPhoneOpen(false)`). Điều này ngăn chặn 100% tình trạng UI bị đồng bộ đè ngược lại sau chu kỳ tick.

### 7.3 Hợp Đồng Cô Lập Không Gian Ảo (Virtual Space Isolation Contract)
- Các không gian nội thất được đặt tại tọa độ ảo biệt lập ($y = -80$) và cách ly trục $X, Z$ ra khỏi trung tâm thành phố:
  - **Siêu thị Splash Mart**: `x: 400, y: -80, z: 0`
  - **Trụ sở Cảnh sát**: `x: -400, y: -80, z: 0`
- **Quy tắc bắt buộc**: Mọi vòng lặp vật lý và tương tác va chạm (vỏ chuối `resolveBananas`, vệt trơn `resolveToothpastePatches`, ném bóng nước `updateProjectiles`, quét xe) **PHẢI lọc theo độ cao $y$** (`Math.abs(item.y - target.y) < 1.5`) hoặc kiểm tra `world.interior !== 'none'`. Không bao giờ được dùng khoảng cách 2D thuần túy $(x, z)$ mà bỏ qua $y$.

