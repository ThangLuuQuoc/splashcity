# Hệ thống Đồ họa, Shaders & Tối ưu Render (Rendering & Shaders)

Tài liệu này giải thích chi tiết kiến trúc đồ họa, kỹ thuật dựng hình theo lô (Batching & Instancing), hệ thống hình học thủ tục (Procedural Geometry), và các shader GLSL tùy biến trong **Splash City**.

---

## 1. Dựng hình Thủ tục Không Dùng Asset Ngoài (Zero-Asset Architecture)

Thay vì tải hàng chục megabyte các mô hình `.gltf` hoặc texture bitmap, toàn bộ thế giới của Splash City được sinh hoàn toàn trong mã nguồn:

```
[Toán học Procedural / Box / Cylinder / Extrude / Canvas Textures]
                                │
                                ▼
                    [BufferGeometry tổng hợp]
                                │
                                ▼
         [InstancedMesh với Ma trận Động (Per-instance Matrix)]
```

### 1.1 Khối nhà & Thành phố (`City.jsx`)
- Từng tòa nhà là một `BoxGeometry` có chiều cao ngẫu nhiên ($9 \dots 46$ đơn vị).
- Khối mái nhà và các khối cửa sổ được ghép chung geometry để giảm thiểu draw call.
- Bảng màu pastel (`PALETTE.buildings`) được gán trực tiếp qua thuộc tính màu của từng instance (`instancedMesh.setColorAt`).

### 1.2 Xe cộ (`Cars.jsx`)
- Mỗi chiếc xe gồm: Khối thân xe chính, buồng lái kính trong suốt, 4 bánh xe hình trụ và đèn xe.
- Khi xe rẽ, ma trận con của 2 bánh trước được xoay theo góc `steer`, bánh xe tự xoay quanh trục ngang theo quãng đường di chuyển `wheelSpin`.

### 1.3 Trực thăng Ngắm cảnh (`Helicopter.jsx`)
- Thân máy bay khí động học được ghép từ khối elip chính, kính chắn gió vát cong, đuôi hình nón và 2 thanh càng đáp bằng thép.
- Cánh quạt chính (Main Rotor) và cánh quạt đuôi (Tail Rotor) được tạo hình từ các tấm mỏng bán trong suốt với hoạt ảnh xoay tốc độ cao tạo hiệu ứng làm mờ cánh quạt (motion blur disc).

### 1.4 Không gian Nội thất & Sản phẩm Siêu thị (`SupermarketInterior.jsx`, `Products.jsx`)
- **Quầy kệ & Thang cuốn**: Bố trí theo sơ đồ `martLayout.js` với các tấm vách trang trí, biển hiệu siêu thị và bậc thang cuốn di chuyển.
- **Bao bì Sản phẩm Thủ tục (`productParts.js`)**:
  - Gói bánh Oreo, snack Lay's, ống Pringles, thanh Feastables MrBeast được tạo từ hình hộp hoặc hình trụ cơ bản.
  - Nhãn thương hiệu và màu sắc được vẽ bằng Canvas 2D Texture sắc nét, nhẹ và không tốn bộ nhớ.

---

## 2. Đường ống Instancing (`instancing.js`)

Để đảm bảo hàng ngàn đối tượng có thể hiển thị trong 1 draw call duy nhất, hệ thống sử dụng lớp bao bọc ma trận tối ưu trong `src/render/instancing.js`:

```javascript
import * as THREE from 'three'

const dummy = new THREE.Object3D()

export function setInstanceTransform(mesh, index, { x, y = 0, z, heading = 0, pitch = 0, roll = 0, scale = 1, scaleY = 1 }) {
  dummy.position.set(x, y, z)
  dummy.rotation.set(pitch, heading, roll, 'YXZ')
  dummy.scale.set(scale, scale * scaleY, scale)
  dummy.updateMatrix()
  mesh.setMatrixAt(index, dummy.matrix)
}
```

- **Quy tắc quan trọng**: Sau khi cập nhật ma trận của toàn bộ thực thể trong frame, luôn phải đánh dấu:
  ```javascript
  mesh.instanceMatrix.needsUpdate = true
  ```

---

## 3. Các Custom GLSL Shaders

### 3.1 Bầu trời & Khí quyển (`Atmosphere.jsx`)
Bầu trời sử dụng một bán cầu nghịch đảo khổng lồ với Custom Shader Material tính toán gradient màu theo thời gian thực:

```glsl
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunPosition;
uniform float uFogDensity;

varying vec3 vWorldPosition;

void main() {
  vec3 dir = normalize(vWorldPosition);
  float h = max(0.0, dir.y);
  
  // Gradient từ chân trời lên đỉnh trời
  vec3 sky = mix(uHorizonColor, uTopColor, pow(h, 0.6));
  
  // Vầng sáng hào quang quanh mặt trời
  float sunDot = max(0.0, dot(dir, normalize(uSunPosition)));
  sky += vec3(1.0, 0.9, 0.7) * pow(sunDot, 64.0) * 0.4;

  gl_FragColor = vec4(sky, 1.0);
  #include <colorspace_fragment>
}
```

> [!IMPORTANT]
> **Quy tắc Quản lý Không gian Màu (Color Space)**:
> Mọi custom `ShaderMaterial` trong Three.js phiên bản mới bắt buộc phải kết thúc bằng `#include <colorspace_fragment>`. 
> Nếu thiếu chỉ thị này, màu sắc sẽ bị tính toán ở Linear space và xuất thẳng ra sRGB canvas, khiến bầu trời và cảnh vật bị tối đen hoặc bệt màu nghiêm trọng.

### 3.2 Mặt biển Sóng động (`Ocean.jsx`)
Mặt biển bao quanh thành phố sử dụng shader đỉnh (Vertex Shader) tính sóng Gerstner nhiều tầng:

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Sóng biển đa tần số
  float wave1 = sin(pos.x * 0.05 + uTime * 1.5) * cos(pos.z * 0.05 + uTime * 1.2);
  float wave2 = sin(pos.x * 0.12 - uTime * 2.0 + pos.z * 0.08) * 0.5;
  pos.y += (wave1 + wave2) * 0.6;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### 3.3 Hạt Thời tiết & Biến dạng do Gió (`Precipitation.jsx`)
- Hệ thống hạt mưa và tuyết (`2800` particles tối đa) được phân bổ trong một hình hộp ảo di chuyển theo camera của người chơi (Camera-relative Bounding Box).
- Khi hạt rơi qua đáy $y < 0$, nó được bọc lại lên đỉnh hộp $y = \text{top}$.
- Gió (`windStrength` và `windAngle`) tác động trực tiếp vào Vertex Shader làm nghiêng các vệt mưa theo thời gian thực.

### 3.4 Hiệu ứng Thiên tai (`Disasters.jsx`)
- **Phễu Lốc xoáy**: Khối nón cụt nhiều tầng với ma trận xoay biến thiên theo độ cao và nhiễu sóng tạo cảm giác vặn xoắn.
- **Bức tường Sóng thần**: Mặt lưới cong chuyển động với shader bọt sóng trắng xóa ở đỉnh ngọn sóng.

---

## 4. Hệ thống Vết sơn (Decal System) & Bóng Đổ Giả lập (Blob Shadows)

### 4.1 Vết sơn Cầu vồng (`PaintDecals`)
- Khi người chơi nhấn `F` hoặc giữ nút xịt sơn, hệ thống thực hiện phép chiếu raycast tới bức tường tòa nhà gần nhất.
- Mỗi vết sơn là một quad phẳng nhỏ được căn chỉnh theo pháp tuyến bề mặt tường, lưu trữ màu sắc từ bảng màu `PALETTE.paint`.
- Sử dụng mảng xoay vòng (Ring buffer) tối đa `260` decals (`sprayMaxDecals`), tự động ghi đè vết cũ khi đạt giới hạn để không gây tràn bộ nhớ GPU.

### 4.2 Bóng Đổ Giả lập Hiệu năng Cao (`Blob Shadows`)
- Game thiết lập `shadows={false}` trên R3F `<Canvas>` để tránh chi phí đổ bóng Shadow Map đắt đỏ.
- Thay vào đó, một `InstancedMesh` chứa các hình tròn dẹt trong suốt màu đen (`opacity = 0.35`) được đặt tại $y = 0.02$ dưới chân mỗi chiếc xe, người đi bộ, trực thăng và chướng ngại vật.
- Khi xe hoặc người nhảy lên không trung, độ co giãn (scale) và độ mờ của bóng đổ sẽ giảm dần theo hàm tỷ lệ nghịch với độ cao $y$.

---

## 5. Chiến lược Tối ưu hóa cho Thiết bị Di động & GPU Yếu

```
+-------------------------------------------------------------------+
|                        Tự động Nhận diện                          |
|                       (src/game/device.js)                        |
+---------------------------------+---------------------------------+
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[Desktop / GPU Mạnh]                              [Mobile / Tablet]
- DPR: [1, 2.0]                                   - DPR: [1, 1.5] (maxPixelRatio)
- Hạt mưa/tuyết: 2800 hạt                         - Hạt mưa/tuyết: 1200 hạt
- TouchControls: Tắt                              - TouchControls: Bật tự động
- Đầy đủ lá bay & hiệu ứng sấm chớp               - Tối ưu hóa UI góc ngón tay cái
```

1. **Giới hạn DPR thông minh (`maxPixelRatio`)**:
   Màn hình điện thoại Retina có thể đạt DPR 3x - 4x khiến GPU bị nghẽn pixel fill-rate. Splash City khóa trần DPR ở mức **1.5x - 1.75x**, mang lại hình ảnh sắc nét nhưng vẫn duy trì 60 FPS mượt mà.
2. **Không sử dụng Post-processing Passes nặng**:
   Tránh dùng Bloom, SSAO, hoặc Screen-space reflections để giữ GPU load luôn dưới $40\%$ trên hầu hết các dòng máy tính bảng và laptop văn phòng.
