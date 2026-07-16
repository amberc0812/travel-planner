import { useState } from 'react'
import { newTrip, uid, useStore } from '../lib/store'
import { Icon, type IconName } from '../components/Icon'
import { MobileHome } from './MobileHome'
import { MobileEditor } from './MobileEditor'
import { MobileSettings } from './MobileSettings'
import { SharedTrip } from '../screens/SharedTrip'
import type { Trip } from '../lib/types'

type Screen =
  | { name: 'home' }
  | { name: 'editor'; tripId: string }
  | { name: 'settings' }
  | { name: 'shared'; shareId: string }

function initialScreen(): Screen {
  const shared = new URLSearchParams(window.location.search).get('shared')
  return shared ? { name: 'shared', shareId: shared } : { name: 'home' }
}

function clearShareParam() {
  window.history.replaceState(null, '', window.location.pathname)
}

const TABS: { key: 'home' | 'settings'; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
]

/** The phone app — a distinct shell from the desktop rail layout. */
export function MobileApp() {
  const { trips, dispatch } = useStore()
  const [screen, setScreen] = useState<Screen>(initialScreen)

  const activeTab = screen.name === 'settings' ? 'settings' : 'home'
  const showFab = screen.name === 'home' && trips.length > 0

  function createTrip() {
    const trip = newTrip()
    dispatch({ type: 'addTrip', trip })
    // A new trip needs a city before days can go anywhere.
    dispatch({ type: 'addCity', tripId: trip.id, cityId: uid() })
    setScreen({ name: 'editor', tripId: trip.id })
  }

  function importSharedTrip(trip: Trip) {
    const copy = { ...trip, id: uid() }
    dispatch({ type: 'addTrip', trip: copy })
    clearShareParam()
    setScreen({ name: 'editor', tripId: copy.id })
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-canvas">
      <main className="flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]">
        {screen.name === 'home' && (
          <MobileHome onOpenTrip={(id) => setScreen({ name: 'editor', tripId: id })} onNewTrip={createTrip} />
        )}
        {screen.name === 'editor' && (
          <MobileEditor tripId={screen.tripId} onBack={() => setScreen({ name: 'home' })} />
        )}
        {screen.name === 'settings' && <MobileSettings />}
        {screen.name === 'shared' && (
          <SharedTrip
            shareId={screen.shareId}
            onImport={importSharedTrip}
            onBack={() => {
              clearShareParam()
              setScreen({ name: 'home' })
            }}
          />
        )}
      </main>

      {showFab && (
        <button
          type="button"
          onClick={createTrip}
          aria-label="New trip"
          className="absolute bottom-[82px] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-pill bg-dusty-blue text-surface shadow-pop"
        >
          <Icon name="plus" size={20} strokeWidth={2.2} />
        </button>
      )}

      <nav
        aria-label="Primary"
        className="relative z-20 flex border-t border-hairline bg-surface pb-[max(14px,env(safe-area-inset-bottom))] pt-2"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScreen(tab.key === 'home' ? { name: 'home' } : { name: 'settings' })}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center gap-1 py-1.5 ${
                isActive ? 'text-dusty-blue' : 'text-ink-45'
              }`}
            >
              <Icon name={tab.icon} size={20} strokeWidth={2} />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
