// Mô tả hình học của từng mặt hàng siêu thị - DỮ LIỆU THUẦN, không React, không JSX.
//
// Tách riêng khỏi Products.jsx vì hai lý do:
//   1. Thêm / sửa mặt hàng là việc sửa dữ liệu, không phải sửa cây JSX.
//   2. Module thuần thì chạy được trong Node, nên toán biến đổi ma trận của bản
//      instanced kiểm chứng được bằng test thay vì phải soi bằng mắt.
//
// Tên `surface` trỏ tới bảng vật liệu trong Products.jsx (nơi biết về texture).

import * as THREE from 'three'
import { unitBox, unitCylinder, unitSphere, taperedCylinder } from './assets.js'

// kind: 'box'  -> size [w, h, d]
//       'cyl'  -> size [radius, height] (+ seg)
//       'cylT' -> args [radiusTop, radiusBottom, height, seg] cho trụ vuốt nhỏ dần
//       'sph'  -> size radius (+ seg)

export const PRODUCT_PARTS = {
  ps_strawberry: [
    // Hộp kem đánh răng chữ nhật thon dài
    { kind: 'box', size: [0.35, 0.35, 0.9], pos: [0, 0.2, 0], surface: 'ps', color: '#e63946' },
  ],
  oreo: [
    // Hộp bánh Oreo
    { kind: 'box', size: [0.7, 0.45, 0.3], pos: [0, 0.25, 0], surface: 'oreo', color: '#003566' },
  ],
  lays_classic: [
    // Gói snack Lay's phồng
    { kind: 'box', size: [0.6, 0.65, 0.25], pos: [0, 0.3, 0], surface: 'lays', color: '#ffb703' },
  ],
  pringles: [
    // Ống snack tròn Pringles
    { kind: 'cyl', size: [0.18, 0.8], seg: 16, pos: [0, 0.4, 0], surface: 'pringles', color: '#d90429' },
  ],
  feastables: [
    // Thanh MrBeast Feastables
    { kind: 'box', size: [0.4, 0.1, 0.85], pos: [0, 0.15, 0], surface: 'feastables', color: '#00b4d8' },
  ],
  meiji_choco: [
    // Thanh sô-cô-la Meiji
    { kind: 'box', size: [0.45, 0.08, 0.75], pos: [0, 0.12, 0], surface: 'meiji', color: '#3d1c06' },
  ],
  kitkat: [
    // Cùng khuôn thanh sô-cô-la, chỉ khác màu -> gộp chung draw call với Meiji
    { kind: 'box', size: [0.45, 0.08, 0.75], pos: [0, 0.12, 0], surface: 'meiji', color: '#c1121f' },
  ],
  banana: [
    // Nải chuối vàng cong cong
    { kind: 'cylT', args: [0.07, 0.09, 0.6, 8], pos: [-0.1, 0.15, 0], rot: [0.2, 0, 0.3], surface: 'soft', color: '#ffd166' },
    { kind: 'cylT', args: [0.07, 0.09, 0.6, 8], pos: [0.1, 0.15, 0], rot: [-0.2, 0, -0.3], surface: 'soft', color: '#ffe169' },
    { kind: 'cylT', args: [0.04, 0.05, 0.12, 6], pos: [0, 0.32, 0], surface: 'matte', color: '#4f772d' },
  ],
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
