// Kho tài nguyên GPU dùng chung ở tầng module.
//
// Texture / material / geometry được tạo đúng MỘT lần cho cả phiên chơi rồi cache
// lại vĩnh viễn. Lý do: các component nội thất unmount mỗi khi người chơi bước ra
// phố, nên nếu tài nguyên nằm trong useMemo của component thì mỗi lần vào nhà lại
// dựng canvas + upload texture lên GPU từ đầu (và bản cũ rò rỉ vì không ai dispose).
//
// Số lượng tài nguyên ở đây là hữu hạn và nhỏ, nên giữ chúng sống suốt đời app rẻ
// hơn nhiều so với việc tạo lại. Cố tình KHÔNG dispose.

import * as THREE from 'three'

const textures = new Map()
const materials = new Map()
const geometries = new Map()

/** Canvas 2D đã vẽ sẵn - tiện cho các factory nhãn bao bì. */
export function drawCanvas(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), canvas)
  return canvas
}

/**
 * Texture cache theo key. `factory` chỉ chạy lần gọi đầu tiên; mọi lần sau trả
 * về đúng instance cũ nên GPU không phải upload lại.
 */
export function getTexture(key, factory) {
  let tex = textures.get(key)
  if (!tex) {
    tex = factory()
    textures.set(key, tex)
  }
  return tex
}

/** CanvasTexture sRGB dựng từ một hàm vẽ - dạng dùng phổ biến nhất. */
export function getCanvasTexture(key, width, height, draw, configure) {
  return getTexture(key, () => {
    const tex = new THREE.CanvasTexture(drawCanvas(width, height, draw))
    tex.colorSpace = THREE.SRGBColorSpace
    if (configure) configure(tex)
    return tex
  })
}

/** Material cache theo key. Dùng chung material giúp three gộp draw call. */
export function getMaterial(key, factory) {
  let mat = materials.get(key)
  if (!mat) {
    mat = factory()
    materials.set(key, mat)
  }
  return mat
}

function getGeometry(key, factory) {
  let geo = geometries.get(key)
  if (!geo) {
    geo = factory()
    geometries.set(key, geo)
  }
  return geo
}

// --- geometry đơn vị -------------------------------------------------------
// Kích thước thật được đưa vào `scale` của mesh (hoặc vào ma trận instance), nhờ
// vậy hàng trăm vật thể khác cỡ nhau vẫn dùng chung một BufferGeometry duy nhất.
// Hình học sau khi scale trùng khít hình học tạo trực tiếp theo số đo, nên không
// có sai khác hình ảnh nào.

/** Hộp 1×1×1. Scale bằng [width, height, depth]. */
export function unitBox() {
  return getGeometry('box', () => new THREE.BoxGeometry(1, 1, 1))
}

/** Trụ đường kính 1, cao 1. Scale bằng [2r, height, 2r]. */
export function unitCylinder(segments = 16) {
  return getGeometry(`cyl:${segments}`, () => new THREE.CylinderGeometry(0.5, 0.5, 1, segments))
}

/** Cầu đường kính 1. Scale đều bằng 2r. */
export function unitSphere(segments = 12) {
  return getGeometry(`sph:${segments}`, () => new THREE.SphereGeometry(0.5, segments, segments))
}

/**
 * Trụ vuốt nhỏ dần (bán kính trên khác bán kính dưới) - loại này không thể suy ra
 * từ trụ đơn vị bằng scale, nên cache theo đúng bộ số đo.
 */
export function taperedCylinder(radiusTop, radiusBottom, height, segments = 8) {
  const key = `cylT:${radiusTop}:${radiusBottom}:${height}:${segments}`
  return getGeometry(key, () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments))
}

/**
 * Một khúc cung tròn tiết diện tròn - dùng dựng những vật cong như quả chuối.
 *
 * Cung luôn quét từ góc 0 nên hình lệch hẳn sang một bên; xoay sẵn -arc/2 quanh trục Z
 * ngay trong geometry để tâm cung nằm giữa, nhờ vậy chỗ đặt vật phẩm chỉ việc lo vị trí
 * chứ không phải bù trừ hình học.
 */
export function torusArc(radius, tube, arc, radialSeg = 6, tubularSeg = 12) {
  const key = `torus:${radius}:${tube}:${arc}:${radialSeg}:${tubularSeg}`
  return getGeometry(key, () => {
    const geo = new THREE.TorusGeometry(radius, tube, radialSeg, tubularSeg, arc)
    geo.rotateZ(-arc / 2)
    return geo
  })
}

/** Số tài nguyên đang cache - dùng khi cần soi hiệu năng trong console. */
export function assetStats() {
  return { textures: textures.size, materials: materials.size, geometries: geometries.size }
}
