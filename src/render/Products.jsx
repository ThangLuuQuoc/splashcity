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
import { getMaterial } from './assets.js'
import { packagingTexture } from './packaging.js'
import { PRODUCT_PARTS, resolvePart, buildBuckets } from './productParts.js'

export { PRODUCT_TYPES } from './productParts.js'

// --- bảng vật liệu ---------------------------------------------------------
// Chỉ chứa tham số KHÔNG phải màu. Màu nằm ở từng bộ phận: bản dựng lẻ nung màu
// vào material, bản instanced đẩy màu vào instanceColor để nhiều màu khác nhau vẫn
// dùng chung một material - và chung một draw call.
//
// `pack` trỏ tới hình bao bì trong packaging.js. Mọi bộ phận dùng bề mặt có bao bì
// BẮT BUỘC để màu trắng, nếu không instanceColor sẽ nhân vào và làm bẩn hình in.

const SURFACES = {
  ps: { pack: 'ps' },
  oreo: { pack: 'oreo' },
  lays: { pack: 'lays' },
  pringles: { pack: 'pringles' },
  feastables: { pack: 'feastables' },
  meiji: { pack: 'meiji' },
  kitkat: { pack: 'kitkat' },
  coca_cola: { pack: 'coca_cola' },
  pepsi: { pack: 'pepsi' },
  matte: {},
  soft: { roughness: 0.4 },
  glossy: { roughness: 0.3 },
}

function surfaceParams(name) {
  const surface = SURFACES[name]
  const params = {}
  if (surface.pack) {
    params.map = packagingTexture(surface.pack)
    // Bao bì đã vẽ sẵn sáng tối vào hình, để bề mặt bóng nữa là loá mất chữ.
    params.roughness = 0.75
  }
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
