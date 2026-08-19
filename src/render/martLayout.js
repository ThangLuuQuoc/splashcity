// Bố cục hàng hoá trên kệ siêu thị - DỮ LIỆU THUẦN.
//
// Toạ độ ghi theo từng kệ (gốc kệ + độ lệch của viên hàng) cho dễ đọc, rồi dàn
// phẳng thành toạ độ tuyệt đối trong phòng. Một mảng duy nhất ở tầng module nghĩa
// là toàn bộ hàng hoá gộp được về vài InstancedMesh dùng chung.
//
// Thêm mặt hàng mới = thêm một dòng ở đây, không phải sửa cây JSX.

// Mặt đợt kệ nằm ở y = 0.8 và 1.8, dày 0.08 -> mặt trên là 0.84 và 1.84. Hàng hoá đặt
// đúng hai cao độ đó thì đứng trên đợt kệ, thay vì lơ lửng bên trên như trước.
const TIER_1 = 0.84
const TIER_2 = 1.84

export const SHELF_LAYOUT = [
  // 1. Kệ Hóa Mỹ Phẩm (P/S Dâu Trẻ Em)
  {
    origin: [-12, 0, 0],
    items: [
      ['ps_strawberry', -1.5, TIER_1, 0],
      ['ps_strawberry', -0.5, TIER_1, 0],
      ['ps_strawberry', 0.5, TIER_1, 0],
      ['ps_strawberry', 1.5, TIER_1, 0],
      ['ps_strawberry', -1.0, TIER_2, 0],
      ['ps_strawberry', 1.0, TIER_2, 0],
    ],
  },
  // 2. Kệ Bánh Quy & Snack (Oreo, Lay's)
  {
    origin: [-4, 0, 0],
    items: [
      ['oreo', -1.6, TIER_1, 0],
      ['oreo', -0.8, TIER_1, 0],
      ['lays_classic', 0.5, TIER_1, 0],
      ['lays_classic', 1.5, TIER_1, 0],
      ['oreo', -1.2, TIER_2, 0],
      ['oreo', -0.4, TIER_2, 0],
      ['lays_classic', 1.0, TIER_2, 0],
    ],
  },
  // 3. Kệ Snack Ống Pringles
  {
    origin: [4, 0, 0],
    items: [
      ['pringles', -1.6, TIER_1, 0],
      ['pringles', -0.8, TIER_1, 0],
      ['pringles', 0, TIER_1, 0],
      ['pringles', 0.8, TIER_1, 0],
      ['pringles', 1.6, TIER_1, 0],
      ['pringles', -0.8, TIER_2, 0],
      ['pringles', 0.8, TIER_2, 0],
    ],
  },
  // 4. Kệ Sô-cô-la (MrBeast Feastables, Meiji, KitKat)
  {
    origin: [-6, 0, -8],
    items: [
      ['feastables', -1.8, TIER_1, 0],
      ['feastables', -1.2, TIER_1, 0],
      ['meiji_choco', 0.2, TIER_1, 0],
      ['meiji_choco', 0.7, TIER_1, 0],
      ['kitkat', 1.6, TIER_1, 0],
      ['kitkat', 2.1, TIER_1, 0],
      ['feastables', -1.5, TIER_2, 0],
      ['meiji_choco', 0.4, TIER_2, 0],
      ['kitkat', 1.8, TIER_2, 0],
    ],
  },
  // 5. Quầy Trái Cây Tươi (Chuối già Nam Mỹ, Nho, Táo Queen)
  {
    origin: [4, 0, -8],
    tagZ: 1.15, // quầy trái cây là cái bàn rộng, không phải kệ -> bảng giá đặt xa hơn
    tagY: 0.95,
    items: [
      ['banana', -1.8, 1.0, 0],
      ['banana', -0.9, 1.0, 0.2],
      ['queen_apple', 0.2, 1.0, -0.2],
      ['queen_apple', 0.9, 1.0, 0.2],
      ['grapes', 1.8, 1.0, 0],
    ],
  },
  // 6. Tầng 2 - Kệ Súng Nước Super Soaker Titan
  {
    origin: [-6, 6.0, -8],
    items: [
      ['supersoaker_titan', -1.8, TIER_1, 0],
      ['supersoaker_titan', -0.3, TIER_1, 0],
      ['supersoaker_titan', 1.2, TIER_1, 0],
      ['supersoaker_titan', -0.9, TIER_2, 0],
    ],
  },
  // 7. Tầng 2 - Kệ Nước Giải Khát Lon Cocacla & Lon Pensi
  {
    origin: [2, 6.0, -8],
    items: [
      ['coca_cola', -1.5, TIER_1, 0],
      ['coca_cola', -1.1, TIER_1, 0],
      ['coca_cola', -0.7, TIER_1, 0],
      ['pepsi', 0.3, TIER_1, 0],
      ['pepsi', 0.7, TIER_1, 0],
      ['pepsi', 1.1, TIER_1, 0],
      ['coca_cola', -1.1, TIER_2, 0],
      ['coca_cola', -0.7, TIER_2, 0],
      ['pepsi', 0.7, TIER_2, 0],
      ['pepsi', 1.1, TIER_2, 0],
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

/**
 * Bảng giá gắn ở mép đợt kệ: mỗi loại hàng trên mỗi tầng đợt một bảng, đặt ngay dưới
 * viên hàng đầu tiên của loại đó.
 *
 * Suy ra từ chính SHELF_LAYOUT thay vì chép tay: thêm một dòng hàng hoá là bảng giá
 * tự có, không bao giờ lệch với thứ đang thật sự nằm trên kệ.
 */
export const SHELF_TAGS = SHELF_LAYOUT.flatMap(({ origin, items, tagZ = 0.66, tagY }) => {
  const seen = new Set()
  const tags = []
  for (const [type, x, y] of items) {
    const key = `${type}@${y}`
    if (seen.has(key)) continue
    seen.add(key)
    tags.push({
      type,
      position: [origin[0] + x, origin[1] + (tagY ?? y) - 0.12, origin[2] + tagZ],
    })
  }
  return tags
})
