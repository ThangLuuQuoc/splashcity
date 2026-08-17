// Từ điển ngôn ngữ. Hai bản dịch nằm CẠNH NHAU trong cùng một mục, để thiếu bản nào là
// nhìn thấy ngay khi đọc, và để sửa câu là sửa cả hai cùng lúc.
//
// Chỗ cần chèn giá trị thì dùng {tên} - xem hàm t() trong i18n.js.
//
// Quy ước khoá: <vùng>.<việc>. Vùng theo màn hình / hệ thống, không theo file, để đổi
// chỗ hiển thị không phải đổi khoá.

export const STRINGS = {
  // --- màn hình bắt đầu ---------------------------------------------------
  'start.subtitle': {
    vi: 'Tạt nước ướt cả thành phố, đụng xe như xe điện tử và vẽ sơn cầu vồng lên tường (loại rửa được thôi). Quậy đủ nhiều là cảnh sát tới tìm bạn — bị bắt thì phải ngồi chờ ở đồn một lát. Nóng quá thì chạy lên ga tàu Skyline mà nhảy tàu: trên đó không ai theo được.',
    en: "Soak the town with water balloons, bump cars like dodgems and tag the walls with washable rainbow paint. Make enough mischief and the police will come after you — get caught and it's a time-out at the station. Too much heat? Run up to a Skyline platform and catch the train: nobody can follow you up there.",
  },
  'start.play': { vi: 'CHƠI', en: 'Play' },
  'start.install': { vi: '⬇️ Cài vào màn hình chính', en: '⬇️ Install to home screen' },
  'start.installIos': {
    vi: 'Chạm Chia sẻ rồi <strong>Thêm vào MH chính</strong> để cài',
    en: 'Tap Share then <strong>Add to Home Screen</strong> to install',
  },

  // --- bảng điều khiển: bàn phím -----------------------------------------
  'keys.move': { vi: 'đi bộ / lái xe', en: 'walk / drive' },
  'keys.look': { vi: 'nhìn quanh', en: 'look around' },
  'keys.map': { vi: 'mở bản đồ, tự chạy tới khu vực đã chọn', en: 'open the map and auto-run to a place' },
  'keys.runToggle': { vi: 'bật/tắt chế độ chạy (không cần giữ phím)', en: 'toggle run mode (no need to hold a key)' },
  'keys.shift': { vi: 'giữ để chạy — hoặc để đi chậm khi đang bật chế độ chạy', en: 'run while held — or walk while run mode is on' },
  'keys.turnCam': { vi: 'quay camera sang trái / phải', en: 'turn the camera left / right' },
  'keys.jump': { vi: 'nhảy / phanh tay', en: 'jump / handbrake' },
  'keys.enter': { vi: 'lên / xuống xe, tàu hoặc trực thăng', en: 'get in / out of a car, train or helicopter' },
  'keys.fly': { vi: 'lái: W/S bay, A/D quay, Space lên, Shift xuống', en: 'fly it: W/S move, A/D turn, Space up, Shift down' },
  'keys.autopilot': { vi: 'khi đang bay: tự bay vòng quanh các khu vực đẹp', en: 'in the air: autopilot tours the city sights on its own' },
  'keys.throw': { vi: 'tạt một quả bóng nước', en: 'throw a water balloon' },
  'keys.spray': { vi: 'xịt sơn cầu vồng', en: 'spray rainbow paint' },
  'keys.weather': { vi: 'đổi thời tiết', en: 'change the weather' },
  'keys.time': { vi: 'nhảy sang buổi tiếp theo trong ngày', en: 'skip to the next time of day' },
  'keys.esc': { vi: 'nhả chuột ra', en: 'free the mouse' },
  'keys.mouse': { vi: 'Chuột', en: 'Mouse' },
  'keys.click': { vi: 'Bấm chuột', en: 'Click' },

  // --- bảng điều khiển: cảm ứng ------------------------------------------
  'touchKeys.leftThumb': { vi: 'Ngón trái', en: 'Left thumb' },
  'touchKeys.rightThumb': { vi: 'Ngón phải', en: 'Right thumb' },
  'touchKeys.pushFar': { vi: 'Đẩy hết', en: 'Push far' },
  'touchKeys.topChips': { vi: 'Chip trên', en: 'Top chips' },
  'touchKeys.stickMove': { vi: 'kéo để đi bộ hoặc lái xe', en: 'drag to walk or drive' },
  'touchKeys.stickLook': { vi: 'kéo để nhìn quanh', en: 'drag to look around' },
  'touchKeys.run': { vi: 'chạy', en: 'run' },
  'touchKeys.throwHold': { vi: 'giữ để tạt bóng nước', en: 'hold to throw water balloons' },
  'touchKeys.sprayHold': { vi: 'giữ để xịt sơn cầu vồng', en: 'hold to spray rainbow paint' },
  'touchKeys.jump': { vi: 'nhảy, hoặc phanh khi đang lái xe', en: 'jump, or brake while driving' },
  'touchKeys.heliUpDown': { vi: 'cho trực thăng lên và xuống', en: 'fly the helicopter up and down' },
  'touchKeys.autopilot': { vi: 'tự bay: trực thăng tự vòng quanh các khu vực đẹp', en: 'autopilot: the helicopter tours the sights by itself' },
  'touchKeys.weatherChips': { vi: 'chạm để đổi thời tiết hoặc giờ', en: 'tap to change weather or time' },

  // --- nhãn nút cảm ứng ---------------------------------------------------
  'btn.throw': { vi: 'Tạt nước', en: 'Throw' },
  'btn.interact': { vi: 'Tương tác', en: 'Interact' },
  'btn.getOut': { vi: 'Xuống', en: 'Get out' },
  'btn.land': { vi: 'Hạ cánh', en: 'Land' },
  'btn.phone': { vi: 'Điện thoại', en: 'Phone' },
  'btn.map': { vi: 'Bản đồ', en: 'Map' },
  'btn.auto': { vi: 'Tự bay', en: 'Auto' },
  'btn.jump': { vi: 'Nhảy', en: 'Jump' },
  'btn.brake': { vi: 'Phanh', en: 'Brake' },
  'btn.up': { vi: 'Lên', en: 'Up' },
  'btn.down': { vi: 'Xuống', en: 'Down' },
  'btn.spray': { vi: 'Xịt sơn', en: 'Spray' },

  // --- HUD ----------------------------------------------------------------
  'hud.score': { vi: 'Điểm vui', en: 'Fun points' },
  'hud.allClear': { vi: 'yên bình', en: 'all clear' },
  'hud.losingThem': { vi: 'đang cắt đuôi...', en: 'losing them...' },
  'hud.chasing': { vi: 'cảnh sát đang đuổi!', en: 'police are chasing!' },
  'hud.bag': { vi: '🎒 Túi đồ:', en: '🎒 Bag:' },
  'hud.walkMode': { vi: 'ĐI BỘ', en: 'WALK' },
  'hud.runMode': { vi: 'CHẠY', en: 'RUN' },
  'hud.runModeOnTitle': { vi: 'Đang bật chế độ chạy - giữ Shift để đi chậm [X]', en: 'Run mode on - hold Shift to walk [X]' },
  'hud.runModeOffTitle': { vi: 'Bật chế độ chạy liên tục [X]', en: 'Turn on run mode [X]' },
  'hud.mapButton': { vi: '🗺️ Bản đồ', en: '🗺️ Map' },
  'hud.mapButtonTitle': { vi: 'Mở bản đồ, chọn khu vực để tự động chạy tới [M]', en: 'Open the map and pick a place to auto-run to [M]' },
  'hud.phoneButton': { vi: '📱 Điện thoại', en: '📱 Phone' },
  'hud.phoneButtonTitle': { vi: 'Mở điện thoại / Quét mã QR thanh toán [P]', en: 'Open the phone / scan the QR code to pay [P]' },

  // --- bay ----------------------------------------------------------------
  'flight.landed': { vi: '🛬 Đã đáp — ra được', en: '🛬 Landed — you can get out' },
  'flight.flying': { vi: 'Đang bay', en: 'Flying' },
  'flight.goingTo': { vi: 'Đang bay tới {place}', en: 'Heading to {place}' },
  'flight.orbiting': { vi: 'Đang vòng quanh {place}', en: 'Circling {place}' },

  // --- tự động chạy -------------------------------------------------------
  'travel.running': { vi: 'Đang chạy tới', en: 'Running to' },
  'travel.stop': { vi: '⏹ Dừng', en: '⏹ Stop' },
  'travel.stopHint': { vi: ' (hoặc bấm WASD)', en: ' (or press WASD)' },
  'travel.stopped': { vi: 'Đã dừng tự động di chuyển', en: 'Auto-run stopped' },
  'travel.arrived': { vi: '{icon} Đã tới {place}!', en: '{icon} Arrived at {place}!' },
  'travel.alreadyThere': { vi: 'Bạn đang ở {place} rồi!', en: 'You are already at {place}!' },
  'travel.noRoute': { vi: 'Không tìm được đường tới đó', en: 'No route to there' },
  'travel.blocked': { vi: 'Bị chặn đường - hãy tự đi tiếp nhé!', en: 'The way is blocked - carry on yourself!' },
  'travel.notPlaying': { vi: 'Chưa vào ván chơi', en: 'Game not started' },
  'travel.leaveBuilding': { vi: 'Hãy ra khỏi toà nhà trước khi tự động di chuyển', en: 'Leave the building first' },
  'travel.leaveCar': { vi: 'Hãy xuống xe trước khi tự động chạy', en: 'Get out of the car first' },
  'travel.leaveTrain': { vi: 'Hãy xuống tàu trước khi tự động chạy', en: 'Get off the train first' },
  'travel.landFirst': { vi: 'Hãy hạ cánh trước khi tự động chạy', en: 'Land the helicopter first' },

  // --- bản đồ -------------------------------------------------------------
  'map.title': { vi: '🗺️ BẢN ĐỒ SPLASH CITY', en: '🗺️ SPLASH CITY MAP' },
  'map.hint': {
    vi: 'Chọn một khu vực để tự động chạy tới — bấm chuột, hoặc dùng ↑ ↓ rồi Enter. Đang chạy mà bấm WASD là dừng. Esc đóng bản đồ.',
    en: 'Pick a place to auto-run to — click, or use ↑ ↓ then Enter. Press WASD while running to stop. Esc closes the map.',
  },
  'map.travellingTo': { vi: '🏃 Đang tự động chạy tới', en: '🏃 Auto-running to' },
  'map.stopButton': { vi: '⏹ DỪNG LẠI', en: '⏹ STOP' },
  'map.youAreHere': { vi: 'Bạn đang ở đây', en: 'You are here' },

  // --- điện thoại ---------------------------------------------------------
  'phone.brand': { vi: '📱 SplashPhone 15 Pro', en: '📱 SplashPhone 15 Pro' },
  'phone.payReady': { vi: '● Sẵn sàng quét mã QR thanh toán', en: '● Ready to scan a QR code' },
  // Giờ là chữ chạy trên chính nút thanh toán trong lúc quét, nên phải ngắn gọn
  'phone.scanning': { vi: '📷 ĐANG QUÉT MÃ QR...', en: '📷 SCANNING...' },
  'phone.cart': { vi: '🛒 Giỏ hàng ({count} món):', en: '🛒 Cart ({count} items):' },
  'phone.total': { vi: 'Tổng thanh toán:', en: 'Total:' },
  'phone.payNow': { vi: '⚡ QUÉT MÃ QR THANH TOÁN NGAY', en: '⚡ SCAN THE QR CODE TO PAY' },
  'phone.bag': { vi: '🎒 Túi đồ cá nhân (Nhấn để dùng):', en: '🎒 Your bag (tap to use):' },
  'phone.bagEmpty': { vi: 'Túi đồ đang trống.', en: 'Your bag is empty.' },
  'phone.bagEmptyHint': {
    vi: 'Hãy vào Siêu thị Splash Mart để nhặt bánh Oreo, Snack Lay\'s, Chuối già Nam Mỹ, P/S dâu...',
    en: 'Go into Splash Mart for Oreos, Lay\'s crisps, bananas, strawberry toothpaste...',
  },
  'phone.use': { vi: 'DÙNG', en: 'USE' },
  'phone.paid': { vi: '✨ Thanh toán thành công! Hàng đã vào túi đồ!', en: '✨ Paid! Everything is in your bag!' },

  // --- thời tiết & thiên tai ---------------------------------------------
  'weather.clear': { vi: 'Nắng', en: 'Sunny' },
  'weather.cloudy': { vi: 'Nhiều mây', en: 'Cloudy' },
  'weather.windy': { vi: 'Có gió', en: 'Windy' },
  'weather.rain': { vi: 'Mưa', en: 'Rainy' },
  'weather.storm': { vi: 'Mưa dông', en: 'Thunderstorm' },
  'weather.snow': { vi: 'Có tuyết', en: 'Snowy' },
  'weather.clearNight': { vi: 'Đêm quang', en: 'Clear night' },
  'weather.muteOn': { vi: 'Bật âm thanh', en: 'Sound on' },
  'weather.muteOff': { vi: 'Tắt âm thanh', en: 'Mute' },
  'weather.changeTitle': { vi: 'Đổi thời tiết (C)', en: 'Change the weather (C)' },
  'weather.timeTitle': { vi: 'Chuyển ngày / đêm (N)', en: 'Switch day / night (N)' },
  'disaster.tornado': { vi: 'LỐC XOÁY', en: 'TORNADO' },
  'disaster.tsunami': { vi: 'SÓNG THẦN', en: 'TSUNAMI' },
  'disaster.incoming': { vi: '{name} ĐANG TỚI — {secs}', en: '{name} INCOMING — {secs}' },
  'disaster.passing': { vi: '{name} đang đi qua', en: '{name} passing' },
  'disaster.sendTornado': { vi: 'Gọi một cơn lốc xoáy (T)', en: 'Send a tornado (T)' },
  'disaster.sendTsunami': { vi: 'Gọi một cơn sóng thần (Y)', en: 'Send a tsunami (Y)' },

  // --- bị bắt -------------------------------------------------------------
  'busted.title': { vi: 'BỊ BẮT RỒI!', en: 'BUSTED!' },
  'busted.note': { vi: 'Cảnh sát dẫn bạn về đồn. Bạn mất {lost} điểm vui.', en: 'The police walked you back to the station. You lost {lost} fun points.' },
  'busted.kept': { vi: 'Còn lại {kept} — quay ra ngay thôi…', en: 'Kept {kept} — back out in a moment…' },

  // --- prompt ngoài phố ---------------------------------------------------
  'prompt.enterPolice': { vi: '[E] Vào Trụ sở Cảnh sát', en: '[E] Enter the police station' },
  'prompt.enterMart': { vi: '[E] Vào Siêu thị Splash Mart', en: '[E] Enter Splash Mart' },
  'prompt.leaveMart': { vi: '[E] Rời Siêu thị ra ngoài', en: '[E] Leave Splash Mart' },
  'prompt.leavePolice': { vi: '[E] Rời Trụ sở Cảnh sát', en: '[E] Leave the police station' },
  'prompt.boardHeli': { vi: '[E] Lên trực thăng bay ngắm thành phố', en: '[E] Board the helicopter for a city tour' },
  'prompt.boardTrain': { vi: 'Lên tàu điện [E]', en: 'Board the train [E]' },
  'prompt.boardCar': { vi: 'Lên xe [E]', en: 'Get in the car [E]' },
  'prompt.refilling': { vi: 'Đang nạp bóng nước...', en: 'Refilling water balloons...' },
  'prompt.refillFull': { vi: 'Bóng nước đầy!', en: 'Water balloons full!' },
  'prompt.trainRiding': { vi: 'Đang đi tàu trên cao Skyline', en: 'Riding the Skyline train' },
  'prompt.trainStation': { vi: '{name} — ga tàu dừng', en: '{name} — train stopped' },
  'prompt.carControls': { vi: 'E xuống xe • Space phanh tay • Bấm chuột ném bóng nước', en: 'E get out • Space handbrake • Click to throw' },
  'prompt.footControls': { vi: 'Bấm chuột ném • F xịt sơn • P điện thoại • X bật chế độ chạy • 1-4 dùng đồ', en: 'Click to throw • F spray • P phone • X run mode • 1-4 use an item' },
  'prompt.footControlsRunning': { vi: 'Bấm chuột ném • F xịt sơn • P điện thoại • X tắt chạy • Shift đi chậm', en: 'Click to throw • F spray • P phone • X run off • Shift to walk' },
  'prompt.heliControls': {
    vi: '🚁 Cao {alt}m • W/S bay tiến lùi • A/D quay • Space lên • Shift xuống • X bay tự động • E hạ cánh',
    en: '🚁 {alt}m up • W/S move • A/D turn • Space up • Shift down • X autopilot • E land',
  },
  'prompt.heliTour': {
    vi: '🛩️ Bay tự động — đang ngắm {icon} {place} • chạm cần lái để tự lái lại',
    en: '🛩️ Autopilot — showing you {icon} {place} • touch the stick to fly it yourself',
  },

  // --- siêu thị -----------------------------------------------------------
  'mart.pickUp': { vi: '[E] Nhặt {item} ({price}đ) | [P] Xem Túi/Giỏ', en: '[E] Pick up {item} ({price}) | [P] See bag/cart' },
  'mart.checkout': { vi: 'Quầy Thu Ngân • [P] Mở SplashPay Quét Mã QR ({total} đ)', en: 'Checkout • [P] Open SplashPay to scan the QR code ({total})' },
  'mart.checkoutEmpty': { vi: 'Quầy Thu Ngân Splash Mart • Hãy nhặt hàng trên kệ trước', en: 'Splash Mart checkout • Pick something off a shelf first' },
  'mart.idle': { vi: 'Siêu thị Splash Mart • [P] Smartphone SplashPay • Phím 1-4: Dùng Item', en: 'Splash Mart • [P] SplashPay phone • Keys 1-4: use an item' },

  // --- đồn cảnh sát -------------------------------------------------------
  'police.wantedBoard': { vi: 'BẢNG TRUY NÃ: {stars} ⭐ | Điểm quậy phá: {score} Fun Points', en: 'WANTED BOARD: {stars} ⭐ | Mischief: {score} fun points' },
  'police.armory': { vi: '[E] Lấy Bóng Nước Siêu Cấp 2× (Mega Balloon) & Nạp Đầy Đạn', en: '[E] Take the 2× Mega Balloon & fill up' },
  'police.armoryTaken': { vi: '⭐ Đã nhận Bóng Nước Siêu Cấp 2× Bán Kính Nổ!', en: '⭐ Got the Mega Balloon with 2× splash!' },
  'police.searchCells': { vi: '[E] Lục lọi góc buồng giam tìm vật phẩm bí mật', en: '[E] Search the cell corner for a secret' },
  'police.secretFound': { vi: '🎉 Tìm thấy Bóng Nước Bí Mật giấu trong buồng giam! (+500 Fun Points)', en: '🎉 Found the secret balloon hidden in the cell! (+500 fun points)' },
  'police.cellsEmpty': { vi: 'Buồng giam tạm giữ cảnh sát (Đã lục lọi sạch sẽ)', en: 'Police holding cells (already searched clean)' },
  'police.alarm': { vi: '[E] Bấm còi báo động trêu chọc cảnh sát!', en: '[E] Set off the alarm to tease the police!' },
  'police.idle': { vi: 'Trụ sở Cảnh sát • [E] Tương tác • [P] Smartphone', en: 'Police station • [E] Interact • [P] Phone' },

  // --- vật phẩm -----------------------------------------------------------
  'item.bananaDropped': { vi: '🍌 Đã thả vỏ chuối! Cảnh sát & NPC đạp trúng sẽ trượt ngã 360°!', en: '🍌 Banana peel dropped! Police and people who step on it spin out!' },
  'item.sugarRush': { vi: '⚡ Đã dùng {item}! Tốc độ chạy tăng 50% trong 12s!', en: '⚡ Used {item}! 50% faster running for 12s!' },
  'item.superRush': { vi: '🔥 Đã nạp năng lượng {item}! Siêu tốc độ kích hoạt!', en: '🔥 {item} powered up! Super speed!' },
  'item.soaker': { vi: '🔫 Đã trang bị Super Soaker Titan! Đạn đầy & nhận Bóng Nước Siêu Cấp 2×!', en: '🔫 Super Soaker Titan equipped! Full ammo and a 2× Mega Balloon!' },
  'item.toothpaste': { vi: '🍓 Đã bôi kem đánh răng P/S dâu tạo vùng trơn trượt vật lý trên sàn!', en: '🍓 Strawberry toothpaste smeared into a real slippery patch!' },
  'item.thrown': { vi: '🎯 Đã ném {item}!', en: '🎯 Threw the {item}!' },

  // --- trực thăng ---------------------------------------------------------
  'heli.exited': { vi: 'Đã xuống trực thăng', en: 'Out of the helicopter' },
  'heli.landFirst': { vi: 'Hạ cánh xuống đất trước khi ra khỏi trực thăng!', en: 'Land before getting out of the helicopter!' },
  'heli.tourOff': { vi: 'Đã tắt bay tự động - giữ 🔽 để hạ cánh', en: 'Autopilot off - hold 🔽 to land' },

  // --- bị trực thăng cảnh sát truy bắt ------------------------------------
  'heli.scramble': { vi: '🚁 Trực thăng cảnh sát đã cất cánh!', en: '🚁 Police helicopter scrambled!' },
  'heli.chased': { vi: '🚁 Trực thăng cảnh sát đang bám theo', en: '🚁 Police helicopter on your tail' },
  'heli.spotted': { vi: '🔦 Đèn pha đã khoá - bay đi ngay!', en: '🔦 Searchlight locked on - fly!' },
  'heli.soaking': { vi: '💦 Cánh quạt ướt sũng - phải hạ cánh!', en: '💦 Rotors soaked - you have to land!' },
  'heli.wet': { vi: 'Ướt', en: 'Wet' },
  'heli.rubberHit': { vi: '💥 Trúng đạn cao su - máy bay mất thăng bằng!', en: '💥 Rubber round hit - the helicopter is reeling!' },

  // --- thanh toán & buff --------------------------------------------------
  'cart.empty': { vi: 'Giỏ hàng trống!', en: 'Your cart is empty!' },
  'cart.noMoney': { vi: 'Số dư SplashPay không đủ!', en: 'Not enough SplashPay balance!' },
  'buff.sugarRush': { vi: 'Sugar Rush (Tăng 50% Tốc độ)', en: 'Sugar Rush (+50% speed)' },
  'buff.mrbeast': { vi: 'MrBeast Energy (Tăng 85% Tốc độ)', en: 'MrBeast Energy (+85% speed)' },

  // --- tên khu vực --------------------------------------------------------
  'place.plaza': { vi: 'Quảng trường Trung tâm', en: 'Central Plaza' },
  'place.plazaDesc': { vi: 'Sân nước giữa thành phố, chỗ bắt đầu quậy phá', en: 'The water yard in the middle of town, where the mischief starts' },
  'place.police': { vi: 'Trụ sở Cảnh sát', en: 'Police Station' },
  'place.policeDesc': { vi: 'Vào được: bảng truy nã, kho bóng nước siêu cấp, phòng giam', en: 'You can go in: wanted board, mega balloon store, holding cells' },
  'place.mart': { vi: 'Siêu thị Splash Mart', en: 'Splash Mart Supermarket' },
  'place.martDesc': { vi: 'Vào được: 2 tầng bách hoá, thang cuốn, quét QR thanh toán', en: 'You can go in: two floors, escalators, QR checkout' },
  'place.helipad': { vi: 'Sân đỗ Trực thăng', en: 'Helipad' },
  'place.helipadDesc': { vi: 'Có trực thăng đậu sẵn - bấm E để bay ngắm thành phố từ trên cao', en: 'A helicopter is parked here - press E to tour the city from the air' },
  'place.park1': { vi: 'Công viên Cây Xanh', en: 'Green Park' },
  'place.park2': { vi: 'Công viên Hồ Sen', en: 'Lotus Lake Park' },
  'place.parkDesc': { vi: 'Bãi cỏ rộng, nhiều cây và người đi bộ', en: 'Wide lawns, plenty of trees and people' },
  'place.station': { vi: 'Ga {name}', en: '{name} Station' },
  'place.stationDesc': { vi: 'Ga tàu điện trên cao Skyline', en: 'A Skyline elevated train station' },
  'place.fountain': { vi: 'Vòi nước gần nhất', en: 'Nearest fountain' },
  'place.fountainDesc': { vi: 'Nạp đầy bóng nước', en: 'Refill your water balloons' },
  'place.enterHint': { vi: 'Bấm E để vào', en: 'Press E to enter' },
  'place.heliHint': { vi: 'Bấm E để lên trực thăng', en: 'Press E to board the helicopter' },
}
