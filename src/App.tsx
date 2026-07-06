import { useState } from 'react'
import { StoreProvider, useStore, newTrip, uid } from './lib/store'
import { SettingsProvider } from './lib/settings'
import { NavRail, type NavView } from './components/NavRail'
import { Home } from './screens/Home'
import { Editor } from './screens/Editor'
import { MapView } from './screens/Map'
import { Settings } from './screens/Settings'
import { SharedTrip } from './screens/SharedTrip'
import type { Trip } from './lib/types'

type View =
  | { name: 'home' }
  | { name: 'editor'; tripId: string }
  | { name: 'map' }
  | { name: 'settings' }
  | { name: 'shared'; shareId: string }

function initialView(): View {
  const shared = new URLSearchParams(window.location.search).get('shared')
  return shared ? { name: 'shared', shareId: shared } : { name: 'home' }
}

/** Drop the ?shared=… param so a refresh doesn't reopen the shared view. */
function clearShareParam() {
  window.history.replaceState(null, '', window.location.pathname)
}

function Shell() {
  const { dispatch } = useStore()
  const [view, setView] = useState<View>(initialView)

  const navActive: NavView = view.name === 'map' ? 'map' : view.name === 'settings' ? 'settings' : 'home'

  function handleNav(key: string) {
    if (key === 'home') setView({ name: 'home' })
    else if (key === 'map') setView({ name: 'map' })
    else if (key === 'settings') setView({ name: 'settings' })
  }

  function openTrip(id: string) {
    setView({ name: 'editor', tripId: id })
  }

  function importSharedTrip(trip: Trip) {
    const copy = { ...trip, id: uid() }
    dispatch({ type: 'addTrip', trip: copy })
    clearShareParam()
    setView({ name: 'editor', tripId: copy.id })
  }

  function leaveSharedTrip() {
    clearShareParam()
    setView({ name: 'home' })
  }

  function createTrip() {
    const trip = newTrip()
    dispatch({ type: 'addTrip', trip })
    openTrip(trip.id)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {view.name === 'home' && <Home onOpenTrip={openTrip} onNewTrip={createTrip} />}
        {view.name === 'editor' && (
          <Editor tripId={view.tripId} onBack={() => setView({ name: 'home' })} />
        )}
        {view.name === 'map' && <MapView />}
        {view.name === 'settings' && <Settings />}
        {view.name === 'shared' && (
          <SharedTrip shareId={view.shareId} onImport={importSharedTrip} onBack={leaveSharedTrip} />
        )}
      </main>
      <NavRail active={navActive} onSelect={handleNav} />
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SettingsProvider>
  )
}
