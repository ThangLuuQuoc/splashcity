// Bố cục hàng hoá trên kệ siêu thị - DỮ LIỆU THUẦN.
//
// Toạ độ ghi theo từng kệ (gốc kệ + độ lệch của viên hàng) cho dễ đọc, rồi dàn
// phẳng thành toạ độ tuyệt đối trong phòng. Một mảng duy nhất ở tầng module nghĩa
// là toàn bộ hàng hoá gộp được về vài InstancedMesh dùng chung.
//
// Thêm mặt hàng mới = thêm một dòng ở đây, không phải sửa cây JSX.

export const SHELF_LAYOUT = [
  // 1. Kệ Hóa Mỹ Phẩm (P/S Dâu Trẻ Em)
  {
    origin: [-12, 0, 0],
    items: [
      ['ps_strawberry', -1.5, 0.9, 0],
      ['ps_strawberry', -0.5, 0.9, 0],
      ['ps_strawberry', 0.5, 0.9, 0],
      ['ps_strawberry', 1.5, 0.9, 0],
      ['ps_strawberry', -1.0, 1.9, 0],
      ['ps_strawberry', 1.0, 1.9, 0],
    ],
  },
  // 2. Kệ Bánh Quy & Snack (Oreo, Lay's)
  {
    origin: [-4, 0, 0],
    items: [
      ['oreo', -1.5, 0.9, 0],
      ['oreo', -0.6, 0.9, 0],
      ['lays_classic', 0.5, 0.9, 0],
      ['lays_classic', 1.5, 0.9, 0],
      ['oreo', -1.0, 1.9, 0],
      ['lays_classic', 1.0, 1.9, 0],
    ],
  },
  // 3. Kệ Snack Ống Pringles
  {
    origin: [4, 0, 0],
    items: [
      ['pringles', -1.6, 0.9, 0],
      ['pringles', -0.8, 0.9, 0],
      ['pringles', 0, 0.9, 0],
      ['pringles', 0.8, 0.9, 0],
      ['pringles', 1.6, 0.9, 0],
      ['pringles', -0.8, 1.9, 0],
      ['pringles', 0.8, 1.9, 0],
    ],
  },
  // 4. Kệ Sô-cô-la (MrBeast Feastables, Meiji, KitKat)
  {
    origin: [-6, 0, -8],
    items: [
      ['feastables', -1.8, 0.9, 0],
      ['feastables', -0.8, 0.9, 0],
      ['meiji_choco', 0.4, 0.9, 0],
      ['kitkat', 1.5, 0.9, 0],
      ['feastables', -1.0, 1.9, 0],
      ['meiji_choco', 1.0, 1.9, 0],
    ],
  },
  // 5. Quầy Trái Cây Tươi (Chuối già Nam Mỹ, Nho, Táo Queen)
  {
    origin: [4, 0, -8],
    items: [
      ['banana', -1.8, 1.0, 0],
      ['banana', -0.9, 1.0, 0.2],
      ['queen_apple', 0.2, 1.0, -0.2],
      ['queen_apple', 0.9, 1.0, 0.2],
      ['grapes', 1.8, 1.0, 0],
    ],
  },
]

/** Toạ độ tuyệt đối trong phòng, dạng <ProductInstances /> nhận trực tiếp. */
export const SHELF_PRODUCTS = SHELF_LAYOUT.flatMap(({ origin, items }) =>
  items.map(([type, x, y, z]) => ({
    type,
    position: [origin[0] + x, origin[1] + y, origin[2] + z],
  })),
)
