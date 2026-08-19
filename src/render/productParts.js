// Mô tả hình học của từng mặt hàng siêu thị - DỮ LIỆU THUẦN, không React, không JSX.
//
// Tách riêng khỏi Products.jsx vì hai lý do:
//   1. Thêm / sửa mặt hàng là việc sửa dữ liệu, không phải sửa cây JSX.
//   2. Module thuần thì chạy được trong Node, nên toán biến đổi ma trận của bản
//      instanced kiểm chứng được bằng test thay vì phải soi bằng mắt.
//
// Tên `surface` trỏ tới bảng vật liệu trong Products.jsx (nơi biết về texture).

import * as THREE from 'three'
import { unitBox, unitCylinder, unitSphere, taperedCylinder, torusArc } from './assets.js'

// kind: 'box'  -> size [w, h, d]
//       'cyl'  -> size [radius, height] (+ seg)
//       'cylT' -> args [radiusTop, radiusBottom, height, seg] cho trụ vuốt nhỏ dần
//       'sph'  -> size radius (+ seg)
//       'arc'  -> args [radius, tube, arc] khúc cung tròn, dùng cho vật cong như quả chuối

// Món có bao bì in hình thì color LUÔN là trắng: bản instanced nhân instanceColor vào
// texture, nên tô màu vào đây là bôi bẩn cả hình vẽ - hộp Oreo từng bị nhân với #003566
// khiến chữ trắng hoá xanh đậm trên nền gần như đen, nhìn không ra là hộp gì.
const PRINTED = '#ffffff'

export const PRODUCT_PARTS = {
  ps_strawberry: [
    // Hộp kem đánh răng dựng đứng, mặt in quay ra lối đi
    { kind: 'box', size: [0.28, 0.72, 0.13], pos: [0, 0.36, 0], surface: 'ps', color: PRINTED },
  ],
  oreo: [
    // Gói Oreo mỏng như thanh bánh thật, không phải khối hộp dày
    { kind: 'box', size: [0.62, 0.4, 0.14], pos: [0, 0.2, 0], surface: 'oreo', color: PRINTED },
  ],
  lays_classic: [
    // Gói snack Lay's phồng, cao hơn bề ngang
    { kind: 'box', size: [0.5, 0.58, 0.22], pos: [0, 0.29, 0], surface: 'lays', color: PRINTED },
  ],
  pringles: [
    // Lon Pringles: cao gấp 2.5 lần đường kính, cho ra đúng dáng lon thật
    { kind: 'cyl', size: [0.145, 0.72], seg: 20, pos: [0, 0.36, 0], surface: 'pringles', color: PRINTED },
    // Nắp nhựa trắng - chi tiết nhỏ nhưng nhận ra lon Pringles ngay từ xa
    { kind: 'cyl', size: [0.152, 0.06], seg: 20, pos: [0, 0.75, 0], surface: 'matte', color: '#f1f3f5' },
  ],
  feastables: [
    // Thanh sô-cô-la dựng đứng như bày trong hộp trưng bày, thay vì nằm sấp trên kệ
    { kind: 'box', size: [0.34, 0.58, 0.1], pos: [0, 0.29, 0], surface: 'feastables', color: PRINTED },
  ],
  meiji_choco: [
    { kind: 'box', size: [0.3, 0.52, 0.09], pos: [0, 0.26, 0], surface: 'meiji', color: PRINTED },
  ],
  kitkat: [
    // Cùng khuôn thanh sô-cô-la nhưng bao bì riêng: đỏ KitKat khác hẳn nâu Meiji
    { kind: 'box', size: [0.3, 0.52, 0.09], pos: [0, 0.26, 0], surface: 'kitkat', color: PRINTED },
  ],
  coca_cola: [
    // Lon Cocacla 330ml dáng tiêu chuẩn: thân in hình + nắp nhôm bạc
    { kind: 'cyl', size: [0.12, 0.46], seg: 18, pos: [0, 0.23, 0], surface: 'coca_cola', color: PRINTED },
    { kind: 'cyl', size: [0.105, 0.04], seg: 18, pos: [0, 0.48, 0], surface: 'glossy', color: '#c9ced6' },
  ],
  pepsi: [
    // Lon Pensi 330ml mát lạnh: thân in hình + nắp nhôm bạc
    { kind: 'cyl', size: [0.12, 0.46], seg: 18, pos: [0, 0.23, 0], surface: 'pepsi', color: PRINTED },
    { kind: 'cyl', size: [0.105, 0.04], seg: 18, pos: [0, 0.48, 0], surface: 'glossy', color: '#c9ced6' },
  ],
  supersoaker_titan: [
    // Súng nước: bình chứa + thân + nòng + báng, đủ để nhìn ra là khẩu súng nước
    { kind: 'cyl', size: [0.14, 0.3], seg: 12, pos: [-0.05, 0.42, 0], rot: [0, 0, Math.PI / 2], surface: 'glossy', color: '#48cae4' },
    { kind: 'box', size: [0.5, 0.16, 0.14], pos: [0, 0.26, 0], surface: 'glossy', color: '#06d6a0' },
    { kind: 'cyl', size: [0.05, 0.34], seg: 10, pos: [0.35, 0.26, 0], rot: [0, 0, Math.PI / 2], surface: 'glossy', color: '#ff9f1c' },
    { kind: 'box', size: [0.12, 0.24, 0.12], pos: [-0.14, 0.12, 0], rot: [0, 0, 0.25], surface: 'matte', color: '#264653' },
  ],
  // Nải chuối: bốn quả cong toả ra từ một cuống nâu, đúng dáng nải chuối thật. Trước
  // đây là hai khúc trụ thẳng bắt chéo nhau, nhìn ra hai que vàng chứ không ra quả chuối
  // - trụ thì không cong được, nên mới có khuôn 'arc'.
  //
  // Mỗi quả nằm ngửa (xoay -90° quanh X để cung nằm trong mặt phẳng ngang) rồi xoè
  // quanh trục đứng, thân hơi chúc xuống như nải chuối đặt trên quầy.
  banana: (() => {
    const CURVE = [0.3, 0.052, 1.5] // bán kính cung, bề dày quả, độ quét
    const SKINS = ['#ffd53e', '#ffe066', '#f7c948', '#ffd95c']
    const parts = [
      // Cuống nâu chung, chỗ bốn quả dính vào nhau
      { kind: 'sph', size: 0.075, seg: 8, pos: [0, 0.11, 0], surface: 'matte', color: '#6b4423' },
    ]
    for (let i = 0; i < 4; i++) {
      const spread = (i - 1.5) * 0.42 // xoè hình quạt quanh trục đứng
      parts.push({
        kind: 'arc',
        args: CURVE,
        pos: [Math.sin(spread) * 0.055, 0.085 + (i % 2) * 0.035, Math.cos(spread) * 0.055],
        // -90° quanh X đưa cung nằm ngang; quay tiếp quanh Y để xoè; nghiêng nhẹ quanh Z
        // cho hai đầu quả chúc xuống.
        rot: [-Math.PI / 2, spread, 0.12],
        surface: 'soft',
        color: SKINS[i],
      })
    }
    return parts
  })(),
  queen_apple: [
    // Quả táo đỏ mọng
    { kind: 'sph', size: 0.22, seg: 12, pos: [0, 0.2, 0], surface: 'glossy', color: '#c1121f' },
    // Cuống táo
    { kind: 'cyl', size: [0.02, 0.1], seg: 4, pos: [0, 0.42, 0], surface: 'matte', color: '#582f0e' },
  ],
  grapes: [
    // Chùm nho tím - 4 quả khác cỡ khác màu nhưng chung một InstancedMesh
    { kind: 'sph', size: 0.12, seg: 8, pos: [0, 0.22, 0], surface: 'glossy', color: '#7209b7' },
    { kind: 'sph', size: 0.11, seg: 8, pos: [0.1, 0.18, 0.08], surface: 'glossy', color: '#560bad' },
    { kind: 'sph', size: 0.11, seg: 8, pos: [-0.08, 0.16, -0.06], surface: 'glossy', color: '#7209b7' },
    { kind: 'sph', size: 0.1, seg: 8, pos: [0, 0.1, 0], surface: 'glossy', color: '#3a0ca3' },
  ],
}

export const PRODUCT_TYPES = Object.keys(PRODUCT_PARTS)

/**
 * Geometry dùng chung cho một bộ phận, kèm scale khôi phục lại số đo gốc.
 * `key` để gộp các bộ phận cùng khuôn về một InstancedMesh.
 *
 * Geometry đơn vị + scale cho ra hình học trùng khít với geometry tạo trực tiếp
 * theo số đo (cùng số phân đoạn), nên không có sai khác hình ảnh.
 */
export function resolvePart(part) {
  switch (part.kind) {
    case 'box': {
      const [w, h, d] = part.size
      return { geometry: unitBox(), scale: [w, h, d], key: 'box' }
    }
    case 'cyl': {
      const [r, h] = part.size
      const seg = part.seg ?? 16
      return { geometry: unitCylinder(seg), scale: [r * 2, h, r * 2], key: `cyl:${seg}` }
    }
    case 'sph': {
      const d = part.size * 2
      const seg = part.seg ?? 12
      return { geometry: unitSphere(seg), scale: [d, d, d], key: `sph:${seg}` }
    }
    case 'cylT': {
      const [rt, rb, h, seg] = part.args
      return {
        geometry: taperedCylinder(rt, rb, h, seg),
        scale: [1, 1, 1],
        key: `cylT:${rt}:${rb}:${h}:${seg}`,
      }
    }
    case 'arc': {
      const [radius, tube, arc] = part.args
      return {
        geometry: torusArc(radius, tube, arc),
        scale: part.stretch ?? [1, 1, 1],
        key: `arc:${radius}:${tube}:${arc}`,
      }
    }
    default:
      return null
  }
}

/**
 * Gom mọi bộ phận của mọi vật phẩm thành các nhóm (khuôn geometry + bề mặt). Mỗi
 * nhóm sẽ được dựng thành một InstancedMesh, nên số draw call bằng số nhóm - cố
 * định, không phụ thuộc kệ có 30 hay 300 món hàng.
 *
 * `items`: [{ type, position: [x, y, z], rotation?, scale? }] - toạ độ theo group cha.
 * Trả về mảng nhóm, mỗi nhóm mang sẵn ma trận thế giới và màu của từng instance.
 */
export function buildBuckets(items) {
  const buckets = new Map()
  const parentMatrix = new THREE.Matrix4()
  const localMatrix = new THREE.Matrix4()
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const euler = new THREE.Euler()
  const scl = new THREE.Vector3()

  for (const item of items) {
    const parts = PRODUCT_PARTS[item.type]
    if (!parts) continue

    const s = item.scale ?? 1
    parentMatrix.compose(
      pos.set(...(item.position || [0, 0, 0])),
      quat.setFromEuler(euler.set(...(item.rotation || [0, 0, 0]))),
      scl.set(s, s, s),
    )

    for (const part of parts) {
      const resolved = resolvePart(part)
      if (!resolved) continue

      const key = `${resolved.key}|${part.surface}`
      let bucket = buckets.get(key)
      if (!bucket) {
        bucket = { key, geometry: resolved.geometry, surface: part.surface, matrices: [], colors: [] }
        buckets.set(key, bucket)
      }

      localMatrix.compose(
        pos.set(...part.pos),
        quat.setFromEuler(euler.set(...(part.rot || [0, 0, 0]))),
        scl.set(...resolved.scale),
      )

      bucket.matrices.push(new THREE.Matrix4().multiplyMatrices(parentMatrix, localMatrix))
      bucket.colors.push(new THREE.Color(part.color))
    }
  }

  return [...buckets.values()]
}
