import { useGame } from '../game/store.js'

const KEYBOARD_CONTROLS = [
  [['W', 'A', 'S', 'D'], 'walk / drive'],
  [['Mouse'], 'look around'],
  [['Shift'], 'run'],
  [['Space'], 'jump / handbrake'],
  [['E'], 'get in / out of a car or train'],
  [['Click'], 'throw a water balloon'],
  [['F'], 'spray rainbow paint'],
  [['C'], 'change the weather'],
  [['N'], 'skip to the next time of day'],
  [['Esc'], 'free the mouse'],
]

const TOUCH_CONTROLS = [
  [['Left thumb'], 'drag to walk or drive'],
  [['Right thumb'], 'drag to look around'],
  [['Push far'], 'run'],
  [['💧'], 'hold to throw water balloons'],
  [['🚗'], 'get in or out of a car or train'],
  [['⬆️'], 'jump, or brake while driving'],
  [['🎨'], 'hold to spray rainbow paint'],
  [['Top chips'], 'tap to change weather or time'],
]

export default function StartScreen({ onStart }) {
  const touch = useGame((s) => s.touch)
  const controls = touch ? TOUCH_CONTROLS : KEYBOARD_CONTROLS

  return (
    <div className="overlay start">
      <div className="title">SPLASH CITY</div>
      <div className="subtitle">
        Soak the town with water balloons, bump cars like dodgems and tag the walls with
        washable rainbow paint. Make enough mischief and the police will come after you —
        get caught and it's a time-out at the station. Too much heat? Run up to a Skyline
        platform and catch the train: nobody can follow you up there.
      </div>

      <div className={`controls${touch ? ' touch' : ''}`}>
        {controls.map(([keys, label]) => (
          <div className="row" key={label}>
            <span>{keys.map((k) => <span className="key" key={k}>{k}</span>)}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <button className="play-button" onClick={onStart}>Play</button>
    </div>
  )
}
