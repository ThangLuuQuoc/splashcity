import { Object3D, Color } from 'three'

const dummy = new Object3D()
const color = new Color()

/**
 * Write a list of { x, y, z, rx, ry, rz, sx, sy, sz, color } descriptors into an
 * InstancedMesh. Used for everything static in the city.
 */
export function writeInstances(mesh, items) {
  if (!mesh) return
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    dummy.position.set(it.x || 0, it.y || 0, it.z || 0)
    dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0)
    dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (it.color) {
      color.set(it.color)
      mesh.setColorAt(i, color)
    }
  }
  mesh.count = items.length
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
}

/**
 * Draw at most as many instances as the buffer actually holds.
 *
 * InstancedMesh silently drops setMatrixAt calls past its capacity but happily
 * renders whatever `count` you ask for, so an under-sized buffer shows up as
 * geometry parked at uninitialised positions - carriages floating over the
 * city, that sort of thing. Always route `count` through here.
 */
export function setInstanceCount(mesh, n) {
  mesh.count = Math.min(n, mesh.instanceMatrix.count)
  return mesh.count
}

export { dummy as instanceDummy, color as instanceColor }
