// Dựng hình vật phẩm siêu thị Việt Nam bằng procedural mesh + canvas texture.
//
// Hình học của từng mặt hàng nằm ở productParts.js (dữ liệu thuần). File này chỉ
// lo phần vật liệu và hai kiểu dựng hình:
//
//   <Product3D />        - một vật thể lẻ, dùng khi đặt tay hoặc làm fallback.
//   <ProductInstances /> - hàng loạt vật thể trên kệ, gộp về InstancedMesh nên số
//                          draw call KHÔNG tăng theo số lượng hàng hoá.
//
// Texture / material / geometry đều lấy từ kho dùng chung trong assets.js.

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getCanvasTexture, getMaterial } from './assets.js'
import { PRODUCT_PARTS, resolvePart, buildBuckets } from './productParts.js'

export { PRODUCT_TYPES } from './productParts.js'

// --- nhãn bao bì -----------------------------------------------------------

const LABELS = {
  ps: ['P/S DÂU', '#d90429', '#ffffff', '🍓 Trẻ Em'],
  oreo: ['OREO', '#003049', '#ffffff', 'Vanilla Cream'],
  lays: ["Lay's", '#fcbf49', '#d62828', 'Classic 🥔'],
  pringles: ['PRINGLES', '#d00000', '#ffffff', 'Original'],
  feastables: ['FEASTABLES', '#00b4d8', '#ffffff', '⚡ MrBeast'],
  meiji: ['MEIJI', '#4a2810', '#ffd166', 'Milk Choco'],
}

function drawLabel(ctx, label, bgColor, textColor, subText) {
  // Nền
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, 256, 256)

  // Viền trang trí
  ctx.lineWidth = 10
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.strokeRect(10, 10, 236, 236)

  // Chữ chính
  ctx.fillStyle = textColor
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 128, 110)

  // Chữ phụ
  if (subText) {
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText(subText, 128, 160)
  }
}

/** Nhãn bao bì, dựng một lần cho cả phiên chơi (trước đây là 6 nhãn / mỗi viên hàng). */
function labelTexture(name) {
  const [label, bg, fg, sub] = LABELS[name]
  return getCanvasTexture(`label:${name}`, 256, 256, (ctx) => drawLabel(ctx, label, bg, fg, sub))
}

// --- bảng vật liệu ---------------------------------------------------------
// Chỉ chứa tham số KHÔNG phải màu. Màu nằm ở từng bộ phận: bản dựng lẻ nung màu
// vào material, bản instanced đẩy màu vào instanceColor để nhiều màu khác nhau vẫn
// dùng chung một material - và chung một draw call.

const SURFACES = {
  ps: { label: 'ps' },
  oreo: { label: 'oreo' },
  lays: { label: 'lays' },
  pringles: { label: 'pringles' },
  feastables: { label: 'feastables' },
  meiji: { label: 'meiji' },
  matte: {},
  soft: { roughness: 0.4 },
  glossy: { roughness: 0.3 },
}

function surfaceParams(name) {
  const surface = SURFACES[name]
  const params = {}
  if (surface.label) params.map = labelTexture(surface.label)
  if (surface.roughness !== undefined) params.roughness = surface.roughness
  return params
}

/** Material cho bản dựng lẻ: màu nung sẵn vào material. */
function soloMaterial(surface, color) {
  return getMaterial(
    `solo:${surface}:${color}`,
    () => new THREE.MeshStandardMaterial({ ...surfaceParams(surface), color }),
  )
}

/** Material cho bản instanced: màu trắng để instanceColor nhân vào. */
function instancedMaterial(surface) {
  return getMaterial(
    `inst:${surface}`,
    () => new THREE.MeshStandardMaterial({ ...surfaceParams(surface), color: 0xffffff }),
  )
}

// --- bản dựng lẻ -----------------------------------------------------------

/**
 * Một vật phẩm đơn. Geometry và material lấy từ kho chung nên đặt bao nhiêu cái
 * cũng không sinh thêm tài nguyên GPU - chỉ tốn thêm draw call, vì vậy hàng trên
 * kệ nên dùng <ProductInstances /> thay cho component này.
 */
export function Product3D({ type, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) {
  const parts = PRODUCT_PARTS[type]
  if (!parts) return null

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {parts.map((part, i) => {
        const resolved = resolvePart(part)
        if (!resolved) return null
        return (
          <mesh
            key={i}
            geometry={resolved.geometry}
            material={soloMaterial(part.surface, part.color)}
            position={part.pos}
            rotation={part.rot || [0, 0, 0]}
            scale={resolved.scale}
          />
        )
      })}
    </group>
  )
}

// --- bản dựng hàng loạt ----------------------------------------------------

function ProductBucket({ bucket }) {
  const ref = useRef()

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < bucket.matrices.length; i++) {
      mesh.setMatrixAt(i, bucket.matrices[i])
      mesh.setColorAt(i, bucket.colors[i])
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    // Bounding sphere bao trọn mọi instance, để frustum culling vẫn đúng.
    mesh.computeBoundingSphere()
  }, [bucket])

  return (
    <instancedMesh
      ref={ref}
      args={[bucket.geometry, instancedMaterial(bucket.surface), bucket.matrices.length]}
    />
  )
}

/**
 * Dựng cả một bảng hàng hoá.
 * `items`: [{ type, position: [x, y, z], rotation?, scale? }] - toạ độ tính theo
 * group cha. Nên là mảng hằng ở tầng module để không dựng lại mỗi lần render.
 */
export function ProductInstances({ items }) {
  const buckets = useMemo(() => buildBuckets(items), [items])
  return buckets.map((bucket) => <ProductBucket key={bucket.key} bucket={bucket} />)
}
