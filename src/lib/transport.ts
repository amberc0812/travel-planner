import type { IconName } from '../components/Icon'

export interface TransportMode {
  key: string
  label: string
  icon: IconName
}

export const TRANSPORT_MODES: TransportMode[] = [
  { key: 'flight', label: 'Flight', icon: 'flight' },
  { key: 'train', label: 'Train', icon: 'train' },
  { key: 'bus', label: 'Bus', icon: 'transportation' },
  { key: 'car', label: 'Car', icon: 'car' },
  { key: 'ferry', label: 'Ferry', icon: 'ferry' },
  { key: 'taxi', label: 'Taxi', icon: 'taxi' },
  { key: 'walk', label: 'Walk', icon: 'walk' },
  { key: 'bike', label: 'Bike', icon: 'bike' },
]

export function modeMeta(key: string | undefined): TransportMode {
  return TRANSPORT_MODES.find((m) => m.key === key) ?? TRANSPORT_MODES[0]
}
