# Splash City — Tài liệu Dự án & Kiến trúc Kỹ thuật

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của **Splash City** — tựa game thế giới mở 3D phong cách arcade chạy hoàn toàn trên trình duyệt web, lấy cảm hứng từ lối chơi sandbox hỗn loạn nhưng 100% thân thiện và vô hại (bóng nước, xe đụng bumper car, sơn cầu vồng, khám phá siêu thị, lái trực thăng, bản đồ GPS và thiên tai).

---

## 📚 Sơ đồ Cấu trúc Tài liệu

Thư mục `docs/` được tổ chức thành các chuyên mục chuyên sâu từ kiến trúc tổng thể đến hướng dẫn triển khai thực tế:

```
docs/
├── README.md                              # Trang chỉ mục & tổng quan tài liệu (Tài liệu này)
│
├── architecture/                          # Tài liệu Thiết kế & Kiến trúc Kỹ thuật
│   ├── technical-architecture.md          # Kiến trúc cốt lõi, State Model, Game Loop & 3 Hợp đồng tích hợp
│   ├── game-systems.md                    # Chi tiết các hệ thống gameplay (AI, Trực thăng, Nội thất, GPS, Thiên tai)
│   └── rendering-and-shaders.md           # Hệ thống đồ họa, Instancing, Shaders, Nội thất & Tối ưu GPU
│
├── guides/                                # Tài liệu Hướng dẫn Phát triển & Vận hành
│   ├── developer-guide.md                 # Hướng dẫn Setup môi trường, Workflow, Debug & Quy tắc cốt lõi
│   ├── configuration-and-tuning.md        # Cẩm nang thông số cân bằng game (config.js full reference)
│   └── adding-new-features.md             # Cookbook: Hướng dẫn từng bước mở rộng tính năng mới
│
└── deployment/                            # Tài liệu Đóng gói & Triển khai
    └── deployment-guide.md                # Quy trình Build, PWA Manifest, Tối ưu Static Bundle & Deploy
```

---

## 🗺️ Điều hướng Nhanh theo Mục tiêu

| Bạn muốn... | Tài liệu nên đọc |
| :--- | :--- |
| **Tìm hiểu kiến trúc tổng thể, luồng dữ liệu & vòng lặp game** | 📐 [`technical-architecture.md`](architecture/technical-architecture.md) |
| **Hiểu logic Trực thăng, Siêu thị 2 tầng, GPS Map, AI cảnh sát, Thiên tai** | 🧠 [`game-systems.md`](architecture/game-systems.md) |
| **Nghiên cứu kỹ thuật dựng hình, Shaders sóng nước, InstancedMesh, Procedural Products** | 🎨 [`rendering-and-shaders.md`](architecture/rendering-and-shaders.md) |
| **Thiết lập môi trường dev, debug qua Console và nắm bắt các quy tắc vàng** | 💻 [`developer-guide.md`](guides/developer-guide.md) |
| **Điều chỉnh tốc độ trực thăng, độ trơn vỏ chuối, giá hàng siêu thị, điểm số** | ⚙️ [`configuration-and-tuning.md`](guides/configuration-and-tuning.md) |
| **Thêm mặt hàng mới vào Splash Mart, thêm xe/trực thăng mới, thêm câu dịch đa ngôn ngữ** | 🚀 [`adding-new-features.md`](guides/adding-new-features.md) |
| **Build production, cấu hình PWA/Vercel, kiểm tra hiệu năng thiết bị di động** | 🚢 [`deployment-guide.md`](deployment/deployment-guide.md) |

---

## ⚡ Tổng quan Công nghệ (Tech Stack Overview)

- **Frontend Core**: React 18, Vite 5
- **3D Graphics**: Three.js (v0.169), React Three Fiber (`@react-three/fiber` v8)
- **State Management**: 
  - *Simulation State*: Plain Mutable Object (`world.js` — 60 FPS in-place mutation)
  - *HUD/UI State*: Zustand (chỉ sync dữ liệu hiển thị cần thiết @ 5Hz)
- **Localization**: Hệ thống dịch từ điển song ngữ tức thì Việt / Anh (`src/game/i18n.js`, `src/game/strings.js`)
- **Procedural Audio**: Web Audio API (Synthesized âm thanh thời gian thực cho động cơ, còi hụ, máy bay, thang cuốn, quét mã QR, 0 file mp3/wav nhị phân)
- **Procedural Geometry**: 100% generated meshes, Canvas 2D dynamic textures & GLSL custom shaders (0 file `.gltf` / `.obj` tải ngoài)
- **Deployment**: Static SPA / PWA (Vercel / GitHub Pages / bất kỳ CDN tĩnh nào)
