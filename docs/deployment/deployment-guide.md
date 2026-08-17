# Hướng dẫn Đóng gói & Triển khai (Deployment Guide)

Tài liệu này hướng dẫn chi tiết quy trình đóng gói ứng dụng (Production Build), cấu hình máy chủ web tĩnh, và triển khai **Splash City** lên các nền tảng đám mây phổ biến như Vercel, GitHub Pages, Netlify và Cloudflare Pages.

---

## 1. Quy trình Đóng gói Production (Production Build)

Splash City được xây dựng dựa trên Vite, giúp quá trình đóng gói ra các file tĩnh HTML/CSS/JS diễn ra cực kỳ nhanh chóng:

```bash
# 1. Tự động sinh Favicon và Icon PWA nếu có thay đổi
npm run icons

# 2. Đóng gói mã nguồn ra thư mục dist/
npm run build

# 3. Chạy thử nghiệm bản build tĩnh trên môi trường giả lập cục bộ
npm run preview
```

Cấu trúc thư mục đầu ra `dist/`:
```
dist/
├── index.html                 # Điểm nhập HTML chính (đã minify)
├── manifest.json              # Web App Manifest hỗ trợ cài đặt PWA
├── icon-192.png / icon-512.png # Icon các kích thước
└── assets/                    # Chứa mã nguồn JS & CSS đã được bundle và nén tối đa
```

---

## 2. Triển khai lên Vercel (Khuyến nghị)

Dự án đã có sẵn cấu hình tối ưu tại [`vercel.json`](file:///f:/2027/splashcity/vercel.json):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Các bước Triển khai:
1. Cài đặt Vercel CLI (nếu muốn deploy từ dòng lệnh):
   ```bash
   npm install -g vercel
   vercel
   ```
2. Hoặc liên kết trực tiếp kho lưu trữ GitHub của bạn trên [Vercel Dashboard](https://vercel.com/):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 3. Triển khai lên GitHub Pages

Để triển khai tự động mỗi khi đẩy mã nguồn lên nhánh `main`, tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

> [!NOTE]
> Nếu deploy lên GitHub Pages với tên repo dạng `username.github.io/splashcity`, hãy cấu hình `base: '/splashcity/'` trong `vite.config.js`.

---

## 4. Tối ưu Trải nghiệm Cài đặt Ứng dụng Web (PWA)

Splash City được thiết kế như một Progressive Web App (PWA):
- Thẻ `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` ngăn ngừa thao tác zoom vô ý trên màn hình cảm ứng.
- Khi người dùng truy cập từ Safari (iOS) hoặc Chrome (Android), họ có thể chọn **"Add to Home Screen"** (Thêm vào màn hình chính) để chơi toàn màn hình không có thanh địa chỉ trình duyệt, mang lại trải nghiệm như một native app 60 FPS.
