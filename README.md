# Splash City

A small open-world 3D game in the browser. It borrows GTA's loop — wander a city,
grab a car, cause chaos, get chased by police — but every "crime" is harmless:
water balloons, bumper-car driving and washable rainbow paint. No weapons, no
blood, no violence. Get caught and you get a time-out at the police station.

Now featuring **interiors** (2-floor Splash Mart Supermarket & Police HQ), a **sightseeing helicopter**, an **interactive city map & GPS navigation**, **natural disasters** (tornadoes, tsunami waves), a **smartphone with SplashPay**, and **multilingual support (English / Tiếng Việt)**!

---

## 🚀 Run it

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`. 

To build for production:
```bash
npm run build
npm run preview
```

---

## 🎮 Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Walk / drive / fly |
| Mouse (or drag) | Look around |
| `Shift` | Sprint (on foot) / Fly up (in helicopter) |
| `Space` | Jump on foot / Handbrake in a car / Fly down in helicopter |
| `E` | Enter or exit a car, board or leave train / helicopter, enter buildings |
| Left click / `B` | Throw a water balloon / Throw items (apples, grapes) |
| `F` | Spray rainbow paint on a wall |
| `1` - `4` | Use inventory items (Oreo, Lay's, Banana, P/S Toothpaste, etc.) |
| `P` | Open / close Smartphone (SplashPay QR Scanner & inventory) |
| `M` | Open / close City Map & GPS Navigation / Fast Travel |
| `H` | Toggle Helicopter Sightseeing Autopilot Tour |
| `C` | Change the weather |
| `N` | Skip to the next time of day |
| `Q` / arrow keys | Turn the camera without a mouse |
| `Esc` | Release mouse pointer lock |

### 📱 On a Tablet or Phone

Touch controls appear automatically on touchscreens — no keyboard or mouse needed. Tapping Play also requests fullscreen.

| Touch | Action |
| --- | --- |
| **Left stick (floating)** | Walk, drive, or fly. Appears wherever your thumb lands. Push to the rim to sprint. |
| **Right half — drag** | Look around (camera rotation). |
| **💧 hold** | Throw water balloons / items. |
| **🚗 / 🚪 tap** | Get in or out of a car, train, helicopter, or enter/exit buildings. |
| **⬆️ / 🛑 hold** | Jump on foot, handbrake while driving, fly up/down in helicopter. |
| **🎨 hold** | Spray rainbow paint on walls. |
| **📱 tap** | Open Smartphone & SplashPay. |
| **🗺️ tap** | Open Interactive City Map & GPS Navigation. |
| **Top chips** | Tap to toggle Weather, Time of Day, or Language (🇻🇳 VN / 🇬🇧 EN). |

The HUD automatically optimizes for mobile: minimap and status stack safely out of thumb reach, DPR is capped at 1.5–1.75 to protect GPU battery life, and pinch-to-zoom is suppressed.

---

## 🌟 Key Features

### 🛒 1. Interiors & Shopping (Splash Mart & Police HQ)
- **Splash Mart Supermarket (2 Floors)**:
  - **1st Floor**: Authentic Vietnamese groceries — *P/S Strawberry Toothpaste for kids*, *Oreo cookies*, *Lay's potato chips*, *Pringles*, *Meiji chocolate*, *MrBeast Feastables*, *KitKat*, and fresh fruits (*South American bananas*, *grapes*, *Queen apples*).
  - **Mechanical Escalator**: Ride between the 1st and 2nd floors smoothly.
  - **2nd Floor**: Toy department (*Super Soaker water blasters*) and energy drinks (*Sting Strawberry*).
  - **Checkout Counter**: Scan items with your phone's **SplashPay** QR scanner to purchase.
- **Police Station HQ**:
  - Explore the reception, police computers, and **Dynamic Wanted Board** displaying your current mugshot and mischief score.
  - **Holding Cells & Armory**: Find secret stash balloons and the Mega Balloon.
  - **Emergency Alarm Button**: Sound the siren and trigger chaos inside the precinct!

### 🎒 2. Item Effects & Inventory
- 🍌 **Banana Peels**: Drop banana peels behind you to make police cars and pedestrians spin out 360°.
- 🍪 **Snacks & Sweets (Oreo, Lay's, Feastables)**: Consume for a **Sugar Rush** speed boost (+50% to +85% sprint speed).
- 🪥 **P/S Strawberry Toothpaste**: Squeeze fragrant pink slippery patches onto the floor.
- 🍎 **Fresh Fruit**: Hurl apples and grapes as fun projectiles.

### 🚁 3. Sightseeing Helicopter
- Board the helicopter at rooftop helipads or designated landing zones.
- **Full 3D Flight Dynamics**: Collective climb/descend, responsive cyclic steering, and rotor blade animation.
- **Autopilot Tour Mode (`H`)**: Sit back and enjoy an automatic cinematic aerial tour around the city's key landmarks.

### 🗺️ 4. Interactive City Map & GPS Navigation
- Press `M` to bring up the full vector street map.
- Click any landmark, supermarket, police station, or train station to set a GPS waypoint.
- Engage **Auto-Run mode** to sprint directly to your destination along the street grid.

### 🌪️ 5. Natural Disasters & Dynamic Ocean
- **Tornadoes**: Roam across the city, lifting cars and pedestrians into the swirling funnel before flinging them across the skyline.
- **Tsunami Waves**: Massive ocean surges sweep inland across the beach, washing props and traffic downstream.
- **Dynamic Water**: Procedural Gerstner wave shader surrounding the entire island.

### 🚂 6. Skyline Railway
- An elevated transit loop with 4 stations (*Fountain Square, East Market, North Park, West Gate*).
- Board moving trains to instantly break police line-of-sight and lose your wanted level.

### 🌐 7. Multilingual Support
- Instant one-tap toggle between **Tiếng Việt** and **English** with full UI and in-game localization.

---

## 🏆 How to Play

Earn **fun points** and raise your **wanted level** with harmless mischief:

| Mischief | Points | Heat |
| --- | --- | --- |
| Soak a pedestrian | 50 | +8 |
| Soak a parked or moving car | 80 | +12 |
| Soak a police car | 250 | +20 (they stop to wipe their face) |
| Bump another car | 30 | +10 |
| Knock over a cone or bin | 10 | +3 |
| Drive on the sidewalk | — | +12/sec |
| Finish a paint tag | 15 | +9/sec while spraying |
| Slip police with banana peel | 150 | — |

Stars appear at **15 / 35 / 60 / 85 heat**. Break line of sight for **6 seconds** to cool down. If pinned by police, you get **BUSTED**, keep half your score, and respawn safely outside the station.

---

## 🏗️ How It's Built

- **Engine**: React 18, React Three Fiber (Three.js v0.169), Vite 5.
- **State Architecture**: **React never owns simulation state.** Everything lives in a single mutable `world` object updated in-place at 60 FPS in a single `useFrame` loop. Zustand only synchronizes low-frequency HUD data.
- **Procedural Everything**: Zero external 3D models or audio files. All meshes are generated procedurally, and all sounds are real-time Web Audio API synthesizers.
- **Broadphase Collision**: 2.5D spatial hash grid with multi-height AABB checks.

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- 📐 [Technical Architecture](docs/architecture/technical-architecture.md) — Core state model, GameLoop pipeline & broadphase collision.
- 🧠 [Game Systems Specification](docs/architecture/game-systems.md) — Deep dive into AI, helicopter, interiors, navigation, disasters & railway.
- 🎨 [Rendering & Shaders](docs/architecture/rendering-and-shaders.md) — Instancing, procedural assets, water shaders & GPU budgets.
- 💻 [Developer Guide](docs/guides/developer-guide.md) — Setup, directory structure, debug console tools & golden rules.
- ⚙️ [Configuration & Tuning](docs/guides/configuration-and-tuning.md) — Reference for all tunable game parameters in `config.js`.
- 🚀 [Adding New Features](docs/guides/adding-new-features.md) — Step-by-step cookbooks for adding items, vehicles & interiors.
- 🚢 [Deployment Guide](docs/deployment/deployment-guide.md) — Production build, PWA manifest, and Vercel/GitHub Pages deployment.
