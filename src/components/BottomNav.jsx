import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faClock, faPlus, faMagnifyingGlass, faUser } from '@fortawesome/free-solid-svg-icons'
import { faClock as faClockOutline, faUser as faUserOutline } from '@fortawesome/free-regular-svg-icons'

const NAV_ITEMS = [
  { id: 'home',    outline: faHouse,          filled: faHouse },
  { id: 'recent',  outline: faClockOutline,   filled: faClock },
  { id: 'record',  outline: faPlus,           filled: faPlus },
  { id: 'search',  outline: faMagnifyingGlass, filled: faMagnifyingGlass },
  { id: 'profile', outline: faUserOutline,    filled: faUser },
]

export default function BottomNav({ active, onChange, sessionActive = false }) {
  return (
    <nav
      className="fixed left-4 right-4 h-16 bg-white/8 backdrop-blur-xl rounded-full flex items-center justify-around border border-white/10 z-30"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {NAV_ITEMS.map(({ id, outline, filled }) => {
        const isActive = active === id
        const isRecord = id === 'record'

        if (isRecord) {
          const recordActive = isActive || sessionActive
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex items-center justify-center w-12 h-12"
              aria-label="Record"
            >
              <span className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                recordActive ? 'bg-brand-red text-white' : 'text-brand-silver'
              }`}>
                <FontAwesomeIcon icon={outline} className="w-6 h-6" />
              </span>
            </button>
          )
        }

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center justify-center w-12 h-12"
            aria-label={id}
          >
            <span className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              isActive ? 'bg-brand-red text-white' : 'text-brand-silver'
            }`}>
              <FontAwesomeIcon icon={isActive ? filled : outline} className="w-6 h-6" />
            </span>
          </button>
        )
      })}
    </nav>
  )
}
