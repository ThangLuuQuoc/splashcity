import { useEffect, useState } from 'react'

/**
 * Chặn "ghost tap" khi overlay vừa mở ra.
 *
 * Trên điện thoại, nút mở overlay nằm ngay trong vùng ngón tay đang chạm. Overlay hiện
 * ra tức thì, nên phần còn lại của cùng một cú chạm (nhả tay / click sinh kèm) rơi luôn
 * vào thứ vừa xuất hiện dưới ngón tay - người chơi chưa kịp làm gì đã bị chọn hộ. Trong
 * bản đồ thì đó là một ghim khu vực: vừa bấm Map là tự động chạy tới siêu thị.
 *
 * Trả về false trong `delay` ms đầu sau khi mở, để mọi thao tác trong overlay bị bỏ qua
 * cho tới khi cú chạm cũ đã kết thúc hẳn.
 *
 * Cách này chặn cả lớp lỗi bất kể thao tác đến từ đường nào (nút cảm ứng, phím tắt,
 * chuột), và không ảnh hưởng điều hướng bằng bàn phím - 260ms là đã xong trước khi kịp
 * với tay tới phím mũi tên.
 */
export function useArmed(open, delay = 260) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!open) return setArmed(false)
    setArmed(false)
    const id = setTimeout(() => setArmed(true), delay)
    return () => clearTimeout(id)
  }, [open, delay])

  return armed
}
