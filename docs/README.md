# Splash City — Tài liệu Dự án & Kiến trúc Kỹ thuật

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của **Splash City** — tựa game thế giới mở 3D phong cách arcade chạy hoàn toàn trên trình duyệt web, lấy cảm hứng từ lối chơi sandbox hỗn loạn nhưng 100% thân thiện và vô hại (bóng nước, xe đụng bumper car, sơn cầu vồng).

---

## 📚 Sơ đồ Cấu trúc Tài liệu

Thư mục `docs/` được tổ chức thành các chuyên mục chuyên sâu từ kiến trúc tổng thể đến hướng dẫn triển khai thực tế:

```
docs/
├── README.md                              # Trang chỉ mục & tổng quan tài liệu (Tài liệu này)
│
├── architecture/                          # Tài liệu Thiết kế & Kiến trúc Kỹ thuật
│   ├── technical-architecture.md          # Kiến trúc cốt lõi, State Model, Game Loop & Collision
│   ├── game-systems.md                    # Chi tiết các hệ thống gameplay (AI, Xe, Cảnh sát, Tàu, Thiên tai)
│   └── rendering-and-shaders.md           # Hệ thống đồ họa, Instancing, Shaders & Tối ưu GPU
│
├── guides/                                # Tài liệu Hướng dẫn Phát triển & Vận hành
│   ├── developer-guide.md                 # Hướng dẫn Setup môi trường, Workflow, Debug & Quy tắc cốt lõi
│   ├── configuration-and-tuning.md        # Cẩm nang thông số cân bằng game (config.js reference)
│   └── adding-new-features.md             # Cookbook: Hướng dẫn từng bước mở rộng tính năng mới
│
└── deployment/                            # Tài liệu Đóng gói & Triển khai
    └── deployment-guide.md                # Quy trình Build, Tối ưu hóa Static Bundle & Deploy
```

---

## 🗺️ Điều hướng Nhanh theo Mục tiêu

| Bạn muốn... | Tài liệu nên đọc |
| :--- | :--- |
| **Tìm hiểu kiến trúc tổng thể, luồng dữ liệu & vòng lặp game** | 📐 [`technical-architecture.md`](file:///f:/2027/splashcity/docs/architecture/technical-architecture.md) |
| **Hiểu thuật toán AI cảnh sát (BFS), giao thông, thời tiết, thiên tai** | 🧠 [`game-systems.md`](file:///f:/2027/splashcity/docs/architecture/game-systems.md) |
| **Nghiên cứu kỹ thuật dựng hình, Shaders, InstancedMesh không dùng 3D model ngoài** | 🎨 [`rendering-and-shaders.md`](file:///f:/2027/splashcity/docs/architecture/rendering-and-shaders.md) |
| **Thiết lập môi trường dev, debug qua Console và nắm bắt các quy tắc vàng** | 💻 [`developer-guide.md`](file:///f:/2027/splashcity/docs/guides/developer-guide.md) |
| **Điều chỉnh tốc độ xe, độ trơn trượt của tuyết, độ gắt của cảnh sát, điểm số** | ⚙️ [`configuration-and-tuning.md`](file:///f:/2027/splashcity/docs/guides/configuration-and-tuning.md) |
| **Thêm xe mới, thêm thời tiết mới, thêm trò quậy phá (mischief) mới** | 🚀 [`adding-new-features.md`](file:///f:/2027/splashcity/docs/guides/adding-new-features.md) |
| **Build production, cấu hình Vercel, kiểm tra hiệu năng thiết bị di động** | 🚢 [`deployment-guide.md`](file:///f:/2027/splashcity/docs/deployment/deployment-guide.md) |

---

## ⚡ Tổng quan Công nghệ (Tech Stack Overview)

- **Frontend Core**: React 18, Vite 5
- **3D Graphics**: Three.js (v0.169), React Three Fiber (`@react-three/fiber` v8)
- **State Management**: 
  - *Simulation State*: Plain Mutable Object (`world.js` — 60 FPS in-place mutation)
  - *HUD/UI State*: Zustand (chỉ sync dữ liệu hiển thị cần thiết)
- **Procedural Audio**: Web Audio API (Synthesized âm thanh thời gian thực, 0 file mp3/wav nhị phân)
- **Procedural Geometry**: 100% generated meshes & GLSL custom shaders (0 file `.gltf` / `.obj` tải ngoài)
- **Deployment**: Static SPA (Vercel / GitHub Pages / bất kỳ CDN tĩnh nào)
