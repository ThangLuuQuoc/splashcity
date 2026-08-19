import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import { CITY, PALETTE } from '../game/config.js'
import { roadCenter } from '../game/city.js'
import { writeInstances } from './instancing.js'
import { getCanvasTexture } from './assets.js'
import { useGame } from '../game/store.js'

const SNOW = new Color('#eef4fa')
const DAY_WINDOW = new Color('#bfe7ff')
const LIT_WINDOW = new Color('#ffd98a')
const DARK_WINDOW = new Color('#2b3445')
const tmp = new Color()

const SLAB = CITY.sidewalkHeight
const MAX_WINDOWS = 6000

function buildInstanceLists(city) {
  const slabs = []
  const bodies = []
  const roofs = []
  const windows = []
  const dashes = []
  const trunks = []
  const leaves = []

  // Sidewalk / lot slabs, one per block.
  for (const block of city.blocks) {
    slabs.push({
      x: block.cx, y: SLAB / 2, z: block.cz,
      sx: CITY.blockSize, sy: SLAB, sz: CITY.blockSize,
      color: block.type === 'park' ? '#7fbf6a' : block.type === 'plaza' ? '#ded7c4' : PALETTE.sidewalk,
    })
  }

  // Buildings: a coloured body, a darker roof cap, and a grid of windows.
  for (const b of city.buildings) {
    bodies.push({
      x: b.x, y: SLAB + b.h / 2, z: b.z,
      sx: b.w, sy: b.h, sz: b.d,
      color: b.color,
    })
    roofs.push({
      x: b.x, y: SLAB + b.h + 0.35, z: b.z,
      sx: b.w + 0.6, sy: 0.7, sz: b.d + 0.6,
      color: b.roof,
    })

    if (windows.length < MAX_WINDOWS) {
      const rows = Math.max(1, Math.floor((b.h - 3) / 4.5))
      const colsW = Math.max(1, Math.floor(b.w / 4.5))
      const colsD = Math.max(1, Math.floor(b.d / 4.5))
      for (let r = 0; r < rows; r++) {
        const y = SLAB + 3 + r * 4.5
        if (y > b.h - 1.2) break
        // `lit` decides whether this window glows once it gets dark.
        for (let c = 0; c < colsW; c++) {
          const x = b.x - b.w / 2 + (c + 0.5) * (b.w / colsW)
          if ((!b.supermarket && !b.station) || y >= 7) {
            windows.push({ x, y, z: b.z + b.d / 2 + 0.06, ry: 0, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
          }
          windows.push({ x, y, z: b.z - b.d / 2 - 0.06, ry: Math.PI, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
        }
        for (let c = 0; c < colsD; c++) {
          const z = b.z - b.d / 2 + (c + 0.5) * (b.d / colsD)
          windows.push({ x: b.x + b.w / 2 + 0.06, y, z, ry: Math.PI / 2, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
          windows.push({ x: b.x - b.w / 2 - 0.06, y, z, ry: -Math.PI / 2, sx: 1.7, sy: 2.1, lit: Math.random() < 0.55 })
        }
      }
    }
  }

  // Dashed centre lines down every road.
  const span = CITY.half + CITY.roadWidth / 2
  for (let i = 0; i <= CITY.blocks; i++) {
    const c = roadCenter(i)
    for (let t = -span; t < span; t += 8) {
      dashes.push({ x: c, y: 0.02, z: t + 2, sx: 0.5, sy: 1, sz: 3.4 })
      dashes.push({ x: t + 2, y: 0.02, z: c, sx: 3.4, sy: 1, sz: 0.5 })
    }
  }

  for (const tree of city.trees) {
    trunks.push({
      x: tree.x, y: SLAB + 1.4 * tree.scale, z: tree.z,
      sx: 1, sy: tree.scale, sz: 1,
    })
    leaves.push({
      x: tree.x, y: SLAB + 3.6 * tree.scale, z: tree.z,
      ry: tree.rot,
      sx: 2.3 * tree.scale, sy: 2.6 * tree.scale, sz: 2.3 * tree.scale,
    })
  }

  return { slabs, bodies, roofs, windows: windows.slice(0, MAX_WINDOWS), dashes, trunks, leaves }
}

function Fountain({ x, z }) {
  return (
    <group position={[x, SLAB, z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.7, 20]} />
        <meshLambertMaterial color="#cfd6dc" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[2.85, 2.85, 0.3, 20]} />
        <meshLambertMaterial color="#57b6e5" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 1.8, 10]} />
        <meshLambertMaterial color="#cfd6dc" />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.75, 12, 10]} />
        <meshLambertMaterial color="#8fd8ff" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

const SHOP_CONFIGS = {
  coffee: {
    bg: '#4a2810', border: '#ffd166', text: '#ffffff', canopy: '#4a2810',
    title_vi: '☕ HIGHLANDS COFFEE', sub_vi: 'Cà Phê Rang Xay • Trà Sữa & Bánh Ngọt',
    title_en: '☕ HIGHLANDS COFFEE', sub_en: 'Fresh Roasted Coffee • Milk Tea & Bakery',
  },
  hotel: {
    bg: '#0d1b2a', border: '#e0a96d', text: '#f8f9fa', canopy: '#0d1b2a',
    title_vi: '🏨 GRAND PALACE HOTEL', sub_vi: 'Khách Sạn Sang Trọng • Suite & Spa',
    title_en: '🏨 GRAND PALACE HOTEL', sub_en: 'Luxury Hotel & Suites • Spa & Resort',
  },
  bank: {
    bg: '#143628', border: '#d4af37', text: '#ffffff', canopy: '#143628',
    title_vi: '🏦 CITY CENTRAL BANK', sub_vi: 'Ngân Hàng Trung Tâm • ATM 24/7',
    title_en: '🏦 CITY CENTRAL BANK', sub_en: 'Central Financial Bank • ATM 24/7',
  },
  pizza: {
    bg: '#9b2226', border: '#ee9b00', text: '#ffffff', canopy: '#9b2226',
    title_vi: '🍕 PIZZA & FAST FOOD', sub_vi: 'Pizza Nướng Củi • Burger & Gà Rán',
    title_en: '🍕 PIZZA & FAST FOOD', sub_en: 'Wood-Fired Pizza • Burgers & Chicken',
  },
  bakery: {
    bg: '#7f4f24', border: '#ffdd95', text: '#ffffff', canopy: '#7f4f24',
    title_vi: '🥐 PARIS BAGUETTE', sub_vi: 'Tiệm Bánh Tươi • Bánh Kem Sinh Nhật',
    title_en: '🥐 PARIS BAGUETTE', sub_en: 'Fresh French Bakery • Birthday Cakes',
  },
  pharmacy: {
    bg: '#005f73', border: '#0a9396', text: '#ffffff', canopy: '#005f73',
    title_vi: '💊 PHARMACITY 24H', sub_vi: 'Thuốc Kê Đơn • Dược Phẩm & Y Tế',
    title_en: '💊 PHARMACITY 24H', sub_en: 'Prescription Drugs • Health & Care',
  },
  cinema: {
    bg: '#3c096c', border: '#ff0054', text: '#ffffff', canopy: '#3c096c',
    title_vi: '🎬 STARLIGHT CINEMA', sub_vi: 'Rạp Chiếu Phim 3D • Bắp Rang Bơ',
    title_en: '🎬 STARLIGHT CINEMA', sub_en: '3D IMAX Movie Theater • Fresh Popcorn',
  },
  bookstore: {
    bg: '#003566', border: '#ffc300', text: '#ffffff', canopy: '#003566',
    title_vi: '📚 FAHASA BOOKSTORE', sub_vi: 'Nhà Sách Tri Thức • Văn Phòng Phẩm',
    title_en: '📚 FAHASA BOOKSTORE', sub_en: 'Books & Knowledge • Gifts & Stationery',
  },
  tech: {
    bg: '#1d2d44', border: '#00b4d8', text: '#ffffff', canopy: '#1d2d44',
    title_vi: '💻 TECH WORLD STORE', sub_vi: 'Smartphone • Laptop • Phụ Kiện',
    title_en: '💻 TECH WORLD STORE', sub_en: 'Smartphones • Laptops & Gadgets',
  },
  gym: {
    bg: '#1b1b1b', border: '#f72585', text: '#ffffff', canopy: '#1b1b1b',
    title_vi: '⚡ TITAN FITNESS & GYM', sub_vi: 'Phòng Tập Thể Hình • Boxing 24/7',
    title_en: '⚡ TITAN FITNESS & GYM', sub_en: 'Fitness & Bodybuilding • Boxing 24/7',
  },
}

function getShopTexture(shopKey, lang = 'vi') {
  const cfg = SHOP_CONFIGS[shopKey] || SHOP_CONFIGS.coffee
  const title = lang === 'en' ? cfg.title_en : cfg.title_vi
  const sub = lang === 'en' ? cfg.sub_en : cfg.sub_vi

  return getCanvasTexture(`shop:${shopKey}:${lang}`, 512, 128, (ctx) => {
    ctx.fillStyle = cfg.bg
    ctx.fillRect(0, 0, 512, 128)
    ctx.strokeStyle = cfg.border
    ctx.lineWidth = 6
    ctx.strokeRect(4, 4, 504, 120)

    ctx.fillStyle = cfg.border
    ctx.font = 'bold 34px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, 256, 44)

    ctx.fillStyle = cfg.text
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(sub, 256, 92)
  })
}

function policeSignTexture(lang = 'vi') {
  return getCanvasTexture(`city:police_sign:${lang}`, 1024, 256, (ctx) => {
    ctx.fillStyle = '#1d3557'
    ctx.fillRect(0, 0, 1024, 256)
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 10
    ctx.strokeRect(6, 6, 1012, 244)

    ctx.fillStyle = '#ffd166'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 6
    const title = lang === 'en' ? '⭐ POLICE HEADQUARTERS • CITY POLICE ⭐' : '⭐ TRỤ SỞ CẢNH SÁT • POLICE STATION ⭐'
    ctx.fillText(title, 512, 85)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 30px sans-serif'
    const sub = lang === 'en' ? 'SECURITY ZONE • PROTECTING THE CITY 24/7' : 'KHU VỰC AN NINH • GIỮ GÌN TRẬT TỰ THÀNH PHỐ'
    ctx.fillText(sub, 512, 175)
  })
}

function PoliceStationSign({ city, lang = 'vi' }) {
  const s = city.policeStation
  if (!s) return null
  const policeTex = policeSignTexture(lang)
  return (
    <group position={[s.x, SLAB, s.z]}>
      {/* Biển hiệu chính POLICE STATION ngay mặt tiền cửa */}
      <mesh position={[0, 5.0, 0.25]}>
        <boxGeometry args={[18, 2.2, 0.4]} />
        <meshStandardMaterial map={policeTex} />
      </mesh>
      {/* Đèn tín hiệu khẩn cấp chớp sáng (Đỏ & Xanh cảnh sát) */}
      <mesh position={[-4, 6.3, 0.2]}>
        <boxGeometry args={[1.6, 0.4, 0.3]} />
        <meshBasicMaterial color="#d90429" />
      </mesh>
      <mesh position={[4, 6.3, 0.2]}>
        <boxGeometry args={[1.6, 0.4, 0.3]} />
        <meshBasicMaterial color="#0077b6" />
      </mesh>
      {/* Mái đón đồn cảnh sát */}
      <mesh position={[0, 3.8, 1.0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[12, 0.25, 2.0]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      {/* Cửa kính ra vào đồn */}
      <mesh position={[0, 1.9, 0.15]}>
        <boxGeometry args={[5.2, 3.6, 0.15]} />
        <meshStandardMaterial color="#457b9d" transparent opacity={0.7} />
      </mesh>
      {/* Pano biểu tượng cảnh sát trên nóc tòa nhà */}
      <mesh position={[0, 12.8, -4.0]}>
        <boxGeometry args={[16, 2.4, 0.4]} />
        <meshStandardMaterial map={policeTex} />
      </mesh>
    </group>
  )
}

function familyMarkSignTexture(lang = 'vi') {
  return getCanvasTexture(`city:family_mark_sign:${lang}`, 1024, 256, (ctx) => {
    // 3 dải màu xanh lá - trắng - xanh dương phong cách Family Mark
    ctx.fillStyle = '#009e49'
    ctx.fillRect(0, 0, 1024, 80)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 80, 1024, 96)
    ctx.fillStyle = '#0070ba'
    ctx.fillRect(0, 176, 1024, 80)

    // Khung viền sáng
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, 1016, 248)

    // Chữ FAMILY MARK ở dải giữa
    ctx.fillStyle = '#0070ba'
    ctx.font = 'bold 78px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 6
    ctx.fillText('FAMILY MARK', 512, 128)

    // Chữ siêu thị tiện lợi ở dải trên
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px sans-serif'
    ctx.shadowBlur = 2
    const topText = lang === 'en' ? '🏪 2-STOREY CONVENIENCE STORE 🏪' : '🏪 SIÊU THỊ TIỆN LỢI 2 TẦNG 🏪'
    ctx.fillText(topText, 512, 40)

    // Chữ 24/7 ở dải dưới
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px sans-serif'
    const bottomText = lang === 'en' ? '⭐ OPEN 24/7 • SPLASHPAY QR ACCEPTED ⭐' : '⭐ 24/7 CONVENIENCE STORE • QUÉT MÃ QR SPLASHPAY ⭐'
    ctx.fillText(bottomText, 512, 216)
  })
}

function familyMarkDoorTexture(lang = 'vi') {
  return getCanvasTexture(`city:family_mark_door:${lang}`, 512, 512, (ctx) => {
    ctx.fillStyle = 'rgba(230, 245, 255, 0.85)'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = '#009e49'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 10, 492, 492)

    // Dải nhận diện Family Mark trên cửa
    ctx.fillStyle = '#009e49'
    ctx.fillRect(20, 40, 472, 50)
    ctx.fillStyle = '#0070ba'
    ctx.fillRect(20, 90, 472, 50)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('FAMILY MARK', 256, 90)

    ctx.fillStyle = '#0070ba'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText(lang === 'en' ? '🛒 WELCOME TO FAMILY MARK 🛒' : '🛒 KÍNH CHÀO QUÝ KHÁCH 🛒', 256, 240)

    ctx.fillStyle = '#d90429'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillText(lang === 'en' ? 'PRESS [E] TO ENTER STORE' : 'BẤM [E] ĐỂ VÀO SIÊU THỊ', 256, 340)

    ctx.fillStyle = '#2b2d42'
    ctx.font = '22px sans-serif'
    ctx.fillText(lang === 'en' ? 'FLOOR 1: GROCERY • FLOOR 2: TOY ZONE' : 'TẦNG 1: BÁCH HÓA • TẦNG 2: ĐỒ CHƠI', 256, 420)
  })
}

function familyMarkPosterTexture(type, lang = 'vi') {
  return getCanvasTexture(`city:family_mark_poster_${type}:${lang}`, 512, 512, (ctx) => {
    ctx.fillStyle = type === 'left' ? '#e63946' : '#0077b6'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 10
    ctx.strokeRect(8, 8, 496, 496)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (type === 'left') {
      ctx.font = 'bold 42px sans-serif'
      ctx.fillText(lang === 'en' ? '🥤 SOFT DRINKS' : '🥤 NƯỚC GIẢI KHÁT', 256, 90)
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#ffd166'
      ctx.fillText('COCACLA & PENSI', 256, 170)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 64px sans-serif'
      ctx.fillText('15.000 đ', 256, 280)
      ctx.font = '26px sans-serif'
      ctx.fillText(lang === 'en' ? '⚡ +50% SPRINT SPEED BOOST' : '⚡ TĂNG 50% TỐC ĐỘ CHẠY', 256, 380)
    } else {
      ctx.font = 'bold 42px sans-serif'
      ctx.fillText(lang === 'en' ? '🍪 SNACKS & TOYS' : '🍪 SNACK & ĐỒ CHƠI', 256, 90)
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#ffd166'
      ctx.fillText('OREO & SUPER SOAKER', 256, 170)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(lang === 'en' ? 'SPECIAL PROMOTION' : 'ƯU ĐÃI ĐẶC BIỆT', 256, 280)
      ctx.font = '26px sans-serif'
      ctx.fillText(lang === 'en' ? '📱 PAY WITH SPLASHPAY' : '📱 THANH TOÁN SPLASHPAY', 256, 380)
    }
  })
}

function SupermarketSign({ city, lang = 'vi' }) {
  const s = city.supermarket
  if (!s) return null
  const signTex = familyMarkSignTexture(lang)
  const doorTex = familyMarkDoorTexture(lang)
  const posterLeft = familyMarkPosterTexture('left', lang)
  const posterRight = familyMarkPosterTexture('right', lang)

  return (
    <group position={[s.x, SLAB, s.z]}>
      {/* 1. BIỂN HIỆU MẶT TIỀN CHÍNH (FAMILY MARK) NGAY TRÊN CỬA RA VÀO */}
      <mesh position={[0, 5.4, 0.25]}>
        <boxGeometry args={[22, 2.4, 0.4]} />
        <meshStandardMaterial map={signTex} roughness={0.2} />
      </mesh>
      {/* Khung viền nhôm đen cho biển hiệu */}
      <mesh position={[0, 5.4, 0.05]}>
        <boxGeometry args={[22.4, 2.6, 0.2]} />
        <meshStandardMaterial color="#212529" metalness={0.8} />
      </mesh>

      {/* 2. MÁI HIÊN VÒM ĐÓN KHÁCH MÀU XANH LÁ FAMILY MARK */}
      <mesh position={[0, 4.0, 1.2]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[18, 0.25, 2.4]} />
        <meshStandardMaterial color="#009e49" roughness={0.3} />
      </mesh>
      {/* Cột trụ kim loại đỡ mái hiên */}
      {[-8.5, 8.5].map((xp) => (
        <mesh key={xp} position={[xp, 2.0, 2.2]}>
          <cylinderGeometry args={[0.1, 0.1, 4.0, 8]} />
          <meshStandardMaterial color="#ced4da" metalness={0.9} />
        </mesh>
      ))}

      {/* 3. CỬA KÍNH TRƯỢT TỰ ĐỘNG CÓ DECAL HƯỚNG DẪN [E] VÀO SIÊU THỊ */}
      <mesh position={[0, 1.9, 0.15]}>
        <boxGeometry args={[6.8, 3.8, 0.15]} />
        <meshStandardMaterial map={doorTex} transparent opacity={0.9} roughness={0.1} />
      </mesh>

      {/* 4. VÁCH KÍNH TRƯNG BÀY POSTER KHUYẾN MÃI (2 BÊN CỬA) */}
      <mesh position={[-9.5, 1.9, 0.12]}>
        <boxGeometry args={[8.0, 3.6, 0.12]} />
        <meshStandardMaterial map={posterLeft} roughness={0.3} />
      </mesh>
      <mesh position={[9.5, 1.9, 0.12]}>
        <boxGeometry args={[8.0, 3.6, 0.12]} />
        <meshStandardMaterial map={posterRight} roughness={0.3} />
      </mesh>

      {/* 5. BIỂN HIỆU PANO NÓC NHÀ SIÊU THỊ (NHÌN TỪ XA / TRÊN CAO) */}
      <mesh position={[0, 15.6, -4.0]}>
        <boxGeometry args={[22, 3.4, 0.5]} />
        <meshStandardMaterial map={signTex} roughness={0.2} />
      </mesh>
      {/* Khung giàn giáo thép đỡ pano trên nóc */}
      {[-8, 8].map((xp) => (
        <mesh key={xp} position={[xp, 14.8, -5.5]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.2, 3.2, 0.2]} />
          <meshStandardMaterial color="#343a40" metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function BuildingShopSigns({ city, lang = 'vi' }) {
  const shops = useMemo(() => {
    return city.buildings
      .filter((b) => b.shop && b.shopFace)
      .map((b) => ({
        shop: b.shop,
        face: b.shopFace,
        h: b.h,
      }))
  }, [city.buildings])

  return (
    <group>
      {shops.map((s, idx) => {
        const cfg = SHOP_CONFIGS[s.shop] || SHOP_CONFIGS.coffee
        const tex = getShopTexture(s.shop, lang)
        const signW = Math.min(s.face.w - 1.2, 10)
        return (
          <group
            key={idx}
            position={[s.face.x, SLAB, s.face.z]}
            rotation={[0, s.face.rotY, 0]}
          >
            {/* Biển hiệu cửa hàng mặt tiền */}
            <mesh position={[0, 4.3, 0.22]}>
              <boxGeometry args={[signW, 1.6, 0.35]} />
              <meshStandardMaterial map={tex} roughness={0.3} />
            </mesh>
            {/* Mái hiên thương hiệu */}
            <mesh position={[0, 3.3, 0.9]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[signW - 0.2, 0.2, 1.5]} />
              <meshStandardMaterial color={cfg.canopy} roughness={0.4} />
            </mesh>
            {/* Cửa kính & mặt tiền tầng 1 */}
            <mesh position={[0, 1.6, 0.1]}>
              <boxGeometry args={[Math.min(signW - 0.8, 7.5), 3.0, 0.12]} />
              <meshStandardMaterial color="#2b3445" transparent opacity={0.6} roughness={0.1} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function City({ world }) {
  const lang = useGame((s) => s.lang)
  const city = world.city
  const lists = useMemo(() => buildInstanceLists(city), [city])

  const slabRef = useRef()
  const bodyRef = useRef()
  const roofRef = useRef()
  const windowRef = useRef()
  const dashRef = useRef()
  const trunkRef = useRef()
  const leafRef = useRef()

  const groundRef = useRef()
  const roadRef = useRef()
  const lastNight = useRef(-1)
  const lastSnow = useRef(-1)

  useLayoutEffect(() => {
    writeInstances(slabRef.current, lists.slabs)
    writeInstances(bodyRef.current, lists.bodies)
    writeInstances(roofRef.current, lists.roofs)
    writeInstances(windowRef.current, lists.windows)
    writeInstances(dashRef.current, lists.dashes)
    writeInstances(trunkRef.current, lists.trunks)
    writeInstances(leafRef.current, lists.leaves)
    lastNight.current = -1
    lastSnow.current = -1
  }, [lists])

  useFrame(() => {
    const w = world.weather
    if (!w) return

    // Windows glow at night. Rewriting 6000 instance colours is only worth
    // doing when the light has actually moved on.
    const night = w.night
    if (Math.abs(night - lastNight.current) > 0.02 && windowRef.current) {
      lastNight.current = night
      const mesh = windowRef.current
      for (let i = 0; i < lists.windows.length; i++) {
        const target = lists.windows[i].lit ? LIT_WINDOW : DARK_WINDOW
        tmp.copy(DAY_WINDOW).lerp(target, night)
        mesh.setColorAt(i, tmp)
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    // Settled snow whitens the ground, the roads and the sidewalks.
    const cover = w.snowCover
    if (Math.abs(cover - lastSnow.current) > 0.01) {
      lastSnow.current = cover
      if (groundRef.current) {
        groundRef.current.material.color.copy(tmp.set(PALETTE.ground)).lerp(SNOW, cover * 0.9)
      }
      if (roadRef.current) {
        roadRef.current.material.color.copy(tmp.set(PALETTE.road)).lerp(SNOW, cover * 0.75)
      }
      if (slabRef.current) {
        for (let i = 0; i < lists.slabs.length; i++) {
          tmp.set(lists.slabs[i].color).lerp(SNOW, cover * 0.85)
          slabRef.current.setColorAt(i, tmp)
        }
        if (slabRef.current.instanceColor) slabRef.current.instanceColor.needsUpdate = true
      }
      if (roofRef.current) {
        for (let i = 0; i < lists.roofs.length; i++) {
          tmp.set(lists.roofs[i].color).lerp(SNOW, cover * 0.9)
          roofRef.current.setColorAt(i, tmp)
        }
        if (roofRef.current.instanceColor) roofRef.current.instanceColor.needsUpdate = true
      }
    }
  })

  const extent = CITY.extent + CITY.roadWidth

  return (
    <group>
      {/* grass surround + asphalt */}
      {/* Grass stops at the sea wall - beyond it Ocean.jsx takes over with sand
          and then open water, which is where a tsunami comes from. */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshLambertMaterial color={PALETTE.ground} />
      </mesh>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshLambertMaterial color={PALETTE.road} />
      </mesh>

      <instancedMesh ref={dashRef} args={[null, null, lists.dashes.length]}>
        <boxGeometry args={[1, 0.04, 1]} />
        <meshBasicMaterial color={PALETTE.roadLine} />
      </instancedMesh>

      <instancedMesh ref={slabRef} args={[null, null, lists.slabs.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={bodyRef} args={[null, null, lists.bodies.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={roofRef} args={[null, null, lists.roofs.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>

      <instancedMesh ref={windowRef} args={[null, null, lists.windows.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#bfe7ff" />
      </instancedMesh>

      <instancedMesh ref={trunkRef} args={[null, null, lists.trunks.length]}>
        <cylinderGeometry args={[0.28, 0.36, 2.8, 6]} />
        <meshLambertMaterial color="#7a5230" />
      </instancedMesh>

      <instancedMesh ref={leafRef} args={[null, null, lists.leaves.length]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#4f9e4a" flatShading />
      </instancedMesh>

      {city.fountains.map((f, i) => <Fountain key={i} x={f.x} z={f.z} />)}
      <PoliceStationSign city={city} lang={lang} />
      <SupermarketSign city={city} lang={lang} />
      <BuildingShopSigns city={city} lang={lang} />


      {/* boundary hedge */}
      {city.walls.map((w, i) => (
        <mesh
          key={i}
          position={[(w.minX + w.maxX) / 2, 3, (w.minZ + w.maxZ) / 2]}
        >
          <boxGeometry args={[w.maxX - w.minX, 6, w.maxZ - w.minZ]} />
          <meshLambertMaterial color="#3f7a45" />
        </mesh>
      ))}
    </group>
  )
}
