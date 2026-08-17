// Khối hình thân trực thăng, dùng chung cho máy bay của người chơi và của cảnh sát.
//
// Nhận vật liệu từ bên ngoài chứ không tự tạo: hai loại máy bay chỉ khác nhau nước sơn,
// còn hình khối thì y hệt. Vật liệu vẫn lấy qua assets.js nên dựng bao nhiêu chiếc cũng
// không sinh thêm tài nguyên GPU.

export default function HeliBody({ body, dark, glass, metal, rotorRef, tailRotorRef }) {
  return (
    <>
      {/* Khoang chính */}
      <mesh position={[0, 1.5, 0]} material={body}>
        <capsuleGeometry args={[1.25, 2.2, 6, 12]} />
      </mesh>
      {/* Kính buồng lái phía trước */}
      <mesh position={[0, 1.65, 1.6]} material={glass}>
        <sphereGeometry args={[1.05, 14, 12]} />
      </mesh>
      {/* Đuôi */}
      <mesh position={[0, 1.75, -3.1]} rotation={[Math.PI / 2, 0, 0]} material={body}>
        <cylinderGeometry args={[0.28, 0.5, 3.4, 10]} />
      </mesh>
      {/* Vây đuôi thẳng đứng */}
      <mesh position={[0, 2.55, -4.5]} material={body}>
        <boxGeometry args={[0.16, 1.5, 1.0]} />
      </mesh>
      {/* Càng đáp */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.0, 0.18, 0]} material={metal}>
            <boxGeometry args={[0.18, 0.18, 3.6]} />
          </mesh>
          <mesh position={[side * 0.75, 0.75, 0.7]} rotation={[0, 0, side * 0.5]} material={metal}>
            <boxGeometry args={[0.14, 1.3, 0.14]} />
          </mesh>
          <mesh position={[side * 0.75, 0.75, -0.7]} rotation={[0, 0, side * 0.5]} material={metal}>
            <boxGeometry args={[0.14, 1.3, 0.14]} />
          </mesh>
        </group>
      ))}
      {/* Trục cánh quạt */}
      <mesh position={[0, 2.85, 0]} material={dark}>
        <cylinderGeometry args={[0.2, 0.2, 0.7, 8]} />
      </mesh>
      {/* Cánh quạt chính */}
      <group ref={rotorRef} position={[0, 3.2, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} material={dark}>
            <boxGeometry args={[0.34, 0.07, 11]} />
          </mesh>
        ))}
      </group>
      {/* Cánh quạt đuôi */}
      <group ref={tailRotorRef} position={[0.35, 2.4, -4.5]}>
        {[0, 1].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 2, 0, 0]} material={dark}>
            <boxGeometry args={[0.06, 2.2, 0.22]} />
          </mesh>
        ))}
      </group>
    </>
  )
}
