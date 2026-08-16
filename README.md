# Splash City

A small open-world 3D game in the browser. It borrows GTA's loop — wander a city,
grab a car, cause chaos, get chased by police — but every "crime" is harmless:
water balloons, bumper-car driving and washable rainbow paint. No weapons, no
blood, no violence. Get caught and you get a time-out at the police station.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a static `dist/`
you can host anywhere, and `npm run preview` serves it.

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Walk / drive |
| Mouse (or drag) | Look around |
| `Shift` | Run |
| `Space` | Jump on foot, handbrake in a car |
| `E` | Get in or out of a car, or board / leave a train |
| Left click / `B` | Throw a water balloon |
| `F` | Spray rainbow paint on a wall |
| `C` | Change the weather |
| `N` | Skip to the next time of day |
| `Q` / arrow keys | Turn the camera without a mouse |
| `Esc` | Release the mouse |

### On a tablet or phone

Touch controls appear automatically on a touchscreen — no keyboard or mouse
needed. Tapping Play also asks for fullscreen, since browser chrome eats a lot
of a tablet screen.

| Touch | Action |
| --- | --- |
| Left half — drag | Walk or drive. The stick appears wherever your thumb lands, so you never have to look for it |
| Left half — push to the rim | Run. Push halfway and you walk; it's analog, and so is steering |
| Right half — drag | Look around, replacing mouse-look |
| 💧 hold | Throw water balloons |
| 🚗 / 🚪 tap | Get in or out of a car or train |
| ⬆️ / 🛑 hold | Jump on foot, brake while driving |
| 🎨 hold | Spray paint (greyed out while driving) |
| Chips at the top | Tap to change the weather or the time of day |

The HUD rearranges itself for touch: the minimap moves to the right edge with
the balloon count under it, leaving both bottom corners free for your thumbs.
Pixel ratio and the weather particle budget are also reduced on mobile GPUs.

## How to play

Make mischief to earn **fun points** and raise your **wanted level**:

| Mischief | Points | Heat |
| --- | --- | --- |
| Soak a pedestrian | 50 | +8 |
| Soak a parked or moving car | 80 | +12 |
| Soak a police car | 250 | +20 (they stop to wipe their face) |
| Bump another car | 30 | +10 |
| Knock over a cone or bin | 10 | +3 |
| Drive on the sidewalk | — | +12/sec |
| Finish a paint tag | 15 | +9/sec while spraying |

Stars appear at 15 / 35 / 60 / 85 heat, and each star sends more and faster
police after you. Break line of sight for **6 seconds** and the stars start
flashing — stay hidden and they burn off one at a time.

Out of balloons? Drive or walk over any **fountain** (the blue dots on the
minimap) to refill.

### The Skyline

An elevated railway loops through the middle of the city on concrete pillars,
with four stations — Fountain Square, East Market, North Park and West Gate
(the yellow squares on the minimap). Walk up a station ramp, wait on the
platform, and press `E` to board a train with its doors open.

The railway is your escape hatch. Police can't reach you up on a platform, but
they can still see you, so the heat keeps burning while they gather below. Only
once you're actually **on a moving train** do they lose you completely and the
stars start to drop. Press `E` at the next station to step off — or press it
between stations to leap off and drop to the street.

The pillars holding the viaduct up sit on the sidewalk, so they're fair game for
bumper-car driving too.

### Weather and the clock

A full day passes every eight minutes. The sun rises in the east at 06:00 and
sets in the west at 18:00, and the sky, the sunlight, the fog and the horizon
glow all move with it. After dark the stars and moon come out, windows
light up across the city, and every car switches its headlights on.

Six weather states roll around on their own, cross-fading over about twelve
seconds and following plausible sequences — sun clouds over before it rains, a
thunderstorm rains itself out rather than snapping back to blue sky:

| Weather | What changes |
| --- | --- |
| ☀️ Sunny | Clear sky, long views, light breeze |
| ☁️ Cloudy | Grey and flat, sun dimmed |
| 🍃 Windy | Leaves tumbling down the street, balloons blown off course |
| 🌧️ Rainy | Rain, short views, slippery roads, streets emptying |
| ⛈️ Thunderstorm | Downpour, hard gusts, lightning flashes and thunder |
| 🌨️ Snowy | Snow settling white over the roads and rooftops, very slippery |

Weather is not just paint:

- **Grip** falls with the weather — snow costs you about half your acceleration,
  braking and cornering bite, and the car slides wide out of turns.
- **Wind** shoves water balloons off line, so you have to aim into a gust.
- **Rain, snow and darkness** all shorten how far the police can spot you, which
  makes a stormy night the best time to cause trouble.
- **Pedestrians go indoors** when it turns bad — a thunderstorm empties the
  streets, so there is nobody left to soak.

Press `C` to change the weather yourself and `N` to jump to the next time of
day, or click the two chips at the top of the screen. Taking manual control
stops the automatic cycle.

If a police car pins you for just over a second — or an officer on foot catches
you while you're walking — you're **BUSTED**: you keep half your points and
restart outside the station with a couple of seconds of grace.

## How it's built

React Three Fiber over Three.js, with Vite. No external assets: every mesh is
generated geometry and every sound is a small WebAudio synth, so the repo has no
binary files.

The one architectural rule: **React never owns simulation state.** Everything
lives in a plain mutable object (`src/game/world.js`) that systems mutate in
place inside a single `useFrame` (`src/game/GameLoop.jsx`). React only renders,
and the zustand store (`src/game/store.js`) holds just the handful of numbers the
HUD displays. Putting entities in React state re-renders the tree every frame and
dies at ~30 entities; this way ~80 moving things hold 60fps.

```
src/
  game/
    config.js        every tunable number - speeds, heat values, thresholds
    city.js          procedural city: blocks, buildings, road graph
    rail.js          the elevated loop, stations, and walkable surfaces
    weather.js       weather states, transition table, blending
    collision.js     circle-vs-AABB with a uniform-grid broadphase
    world.js         the mutable world object
    GameLoop.jsx     the single useFrame, runs systems in a fixed order
    systems/         player, vehicle, traffic, pedestrians, police, heat,
                     actions, projectiles, physics, train, weather, input
  render/            instanced renderers - city, cars, crowd, props, effects
  ui/                HUD, minimap, start screen, busted overlay
```

Physics is deliberately custom and arcade, not a physics engine: the city is
flat, so everything is a circle on a plane colliding with axis-aligned boxes.
That is a couple hundred lines, is fully deterministic, and gives the bouncy
bumper-car feel the game is built around.

Police navigate with a breadth-first distance field rebuilt from the player's
nearest intersection three times a second (`systems/police.js`). Each cop walks
downhill on that field, switches to direct pursuit within 42 units of clear line
of sight, and bails out to chase on foot — a little slower than your sprint, so
escaping is always possible.

The railway is one arc-length-parameterised polyline (`rail.js`). Trains, station
placement, pillar spacing and the minimap all read positions off it via
`railAt(s)`, and trains brake into each platform on a `v = sqrt(2·a·d)` curve.
Station platforms and ramps are the game's only walkable surfaces above the
street, so `resolveStatic` takes the entity's height: a player up on a platform
walks straight over the pillars holding it up, while a car at street level still
bounces off them.

Weather is a director that cross-fades between named states into one set of
blended numbers (`world.weather.params`). Nothing downstream ever reads the
state name, only those numbers, so every transition is smooth for free and rain
can fade into snow without the particle system jumping. `render/Atmosphere.jsx`
owns the sky, both directional lights, the hemisphere light and the fog together,
because a sky that disagrees with the light falling on the city looks broken.

One trap worth knowing: a custom `ShaderMaterial` must end with
`#include <colorspace_fragment>`. Uniform colours arrive already converted to
linear space, and writing them raw into an sRGB target renders the sky far
darker than the colours you chose.

## Tuning

Open `src/game/config.js`. Every speed, score, heat value and threshold is there.
The game also exposes `window.world` in the browser console, so you can poke at
the live simulation while it runs.
