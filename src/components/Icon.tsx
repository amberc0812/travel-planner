import type { ComponentType } from 'react'
import {
  MapPin,
  Clock,
  Bus,
  Wallet,
  Paperclip,
  PenLine,
  Users,
  Map as MapIcon,
  Home,
  Share2,
  Download,
  Plus,
  Search,
  ArrowRight,
  GripVertical,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  ArrowDownUp,
  Link as LinkIcon,
  Mail,
  Image as ImageIcon,
  FileText,
  UserPlus,
  BedDouble,
  Settings as SettingsIcon,
  Plane,
  TrainFront,
  Car,
  Ship,
  Footprints,
  Bike,
  CarTaxiFront,
  Folder as FolderIcon,
  Sun,
  Moon,
  Globe as GlobeIcon,
  Minus,
  Utensils,
  Trees,
  Hotel,
} from 'lucide-react'

/**
 * One swappable Icon component. Today it maps names to lucide-react;
 * drop in custom SVGs later by editing only the REGISTRY below.
 */
export type IconName =
  | 'destination'
  | 'time'
  | 'transportation'
  | 'money'
  | 'doc'
  | 'note'
  | 'people'
  | 'map'
  | 'home'
  | 'share'
  | 'export'
  | 'plus'
  | 'search'
  | 'arrow-right'
  | 'grip'
  | 'trash'
  | 'close'
  | 'chevron-right'
  | 'chevron-down'
  | 'sort'
  | 'link'
  | 'mail'
  | 'image'
  | 'file'
  | 'invite'
  | 'accommodation'
  | 'settings'
  | 'flight'
  | 'train'
  | 'car'
  | 'ferry'
  | 'taxi'
  | 'walk'
  | 'bike'
  | 'folder'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'minus'
  | 'restaurant'
  | 'nature'
  | 'hotel'

type Glyph = ComponentType<{
  size?: number | string
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean
  'aria-label'?: string
}>

const REGISTRY: Record<IconName, Glyph> = {
  destination: MapPin,
  time: Clock,
  transportation: Bus,
  money: Wallet,
  doc: Paperclip,
  note: PenLine,
  people: Users,
  map: MapIcon,
  home: Home,
  share: Share2,
  export: Download,
  plus: Plus,
  search: Search,
  'arrow-right': ArrowRight,
  grip: GripVertical,
  trash: Trash2,
  close: X,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  sort: ArrowDownUp,
  link: LinkIcon,
  mail: Mail,
  image: ImageIcon,
  file: FileText,
  invite: UserPlus,
  accommodation: BedDouble,
  settings: SettingsIcon,
  flight: Plane,
  train: TrainFront,
  car: Car,
  ferry: Ship,
  taxi: CarTaxiFront,
  walk: Footprints,
  bike: Bike,
  folder: FolderIcon,
  sun: Sun,
  moon: Moon,
  globe: GlobeIcon,
  minus: Minus,
  restaurant: Utensils,
  nature: Trees,
  hotel: Hotel,
}

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  /** Provide a label for standalone/interactive icons; omit for decorative. */
  label?: string
}

export function Icon({ name, size = 18, strokeWidth = 1.75, className, label }: IconProps) {
  const Glyph = REGISTRY[name]
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  )
}
