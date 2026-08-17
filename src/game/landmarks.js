// Danh sách các khu vực đặc biệt của thành phố - MỘT nguồn sự thật duy nhất, dùng
// chung cho cả minimap (vẽ mốc) và bản đồ chọn điểm đến (danh sách bấm được).
//
// Trước đây minimap tự hardcode riêng đồn cảnh sát và siêu thị, nên thêm một khu
// vực mới là phải sửa hai chỗ và rất dễ lệch. Giờ thêm một dòng ở đây là địa điểm
// tự xuất hiện trên cả minimap lẫn bản đồ, kèm luôn chức năng tự chạy tới.

/**
 * `dynamic: true` nghĩa là vị trí được tính lại theo chỗ người chơi đang đứng
 * (ví dụ "vòi nước gần nhất"), thay vì cố định một điểm.
 */
export function buildLandmarks(city) {
  const list = [
    {
      id: 'plaza',
      name: 'Quảng trường Trung tâm',
      icon: '⛲',
      color: '#4fc3f7',
      kind: 'plaza',
      desc: 'Sân nước giữa thành phố, chỗ bắt đầu quậy phá',
      x: city.plaza.x,
      z: city.plaza.z,
    },
    {
      id: 'police',
      name: 'Trụ sở Cảnh sát',
      icon: '🚓',
      color: '#1d3557',
      kind: 'interior',
      desc: 'Vào được: bảng truy nã, kho bóng nước siêu cấp, phòng giam',
      x: city.policeDoor.x,
      z: city.policeDoor.z,
      // Cửa nằm ngay trên mặt tiền toà nhà, sân trống chỉ ở phía +z. Không có điểm
      // tiếp cận này thì đường đi có thể dẫn từ phía sau và người chơi đâm vào tường.
      approach: { x: city.policeDoor.x, z: city.policeDoor.z + 9 },
      arriveRadius: 6.0,
      enterHint: 'Bấm E để vào',
    },
    {
      id: 'supermarket',
      name: 'Siêu thị Splash Mart',
      icon: '🛒',
      color: '#d62828',
      kind: 'interior',
      desc: 'Vào được: 2 tầng bách hoá, thang cuốn, quét QR thanh toán',
      x: city.supermarketDoor.x,
      z: city.supermarketDoor.z,
      approach: { x: city.supermarketDoor.x, z: city.supermarketDoor.z + 9 },
      arriveRadius: 6.0,
      enterHint: 'Bấm E để vào',
    },
  ]

  list.push({
    id: 'helipad',
    name: 'Sân đỗ Trực thăng',
    icon: '🚁',
    color: '#ffd166',
    kind: 'interior', // dùng chung kiểu "vào được" để có vòng nhấp nháy trên minimap
    desc: 'Có trực thăng đậu sẵn - bấm E để bay ngắm thành phố từ trên cao',
    x: city.helipad.x,
    z: city.helipad.z,
    enterHint: 'Bấm E để lên trực thăng',
  })

  city.parks.forEach((park, i) => {
    list.push({
      id: `park_${i}`,
      name: `Công viên ${i === 0 ? 'Cây Xanh' : 'Hồ Sen'}`,
      icon: '🌳',
      color: '#38b000',
      kind: 'park',
      desc: 'Bãi cỏ rộng, nhiều cây và người đi bộ',
      x: park.x,
      z: park.z,
    })
  })

  city.rail.stations.forEach((st) => {
    list.push({
      id: `station_${st.index}`,
      name: `Ga ${st.name}`,
      icon: '🚉',
      color: '#ffd23f',
      kind: 'station',
      desc: 'Ga tàu điện trên cao Skyline',
      x: st.x,
      z: st.z,
    })
  })

  // Vòi nước có hơn chục cái rải khắp thành phố, liệt kê hết thì rối mà chẳng ai
  // cần chọn đúng cái nào - nên gộp thành một mục tự tìm cái gần nhất.
  list.push({
    id: 'fountain_nearest',
    name: 'Vòi nước gần nhất',
    icon: '💧',
    color: '#4fc3f7',
    kind: 'fountain',
    desc: 'Nạp đầy bóng nước',
    dynamic: true,
    x: city.plaza.x,
    z: city.plaza.z,
  })

  return list
}

/** Toạ độ thật của một địa điểm, đã tính cả các mục động như "vòi nước gần nhất". */
export function landmarkPosition(world, landmark) {
  if (landmark.id !== 'fountain_nearest') return { x: landmark.x, z: landmark.z }

  const p = world.player
  let best = null
  let bestDist = Infinity
  for (const f of world.fountains) {
    const d = Math.hypot(f.x - p.x, f.z - p.z)
    if (d < bestDist) {
      bestDist = d
      best = f
    }
  }
  return best ? { x: best.x, z: best.z } : { x: landmark.x, z: landmark.z }
}
