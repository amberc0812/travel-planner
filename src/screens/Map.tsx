import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { geoOrthographic, geoEquirectangular, geoPath, geoGraticule10, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import ReactMarkdown from 'react-markdown'
import worldData from 'world-atlas/countries-110m.json'
import { useStore } from '../lib/store'
import { collectPlaces, type Place } from '../lib/places'
import { lookupCountry } from '../lib/geo-cities'
import { statusMeta } from '../lib/status'
import { fmtDayLabel } from '../lib/date'
import { Chip } from '../components/Chip'
import { Icon } from '../components/Icon'
import { Switch } from '../components/Switch'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WORLD: any = feature(worldData as any, (worldData as any).objects.countries)
const GRATICULE = geoGraticule10()
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const OCEAN = '#e9e3d4'
const LAND = '#d6cdb6'
const RIM = 'rgba(2,16,52,0.14)'
const GRAT = 'rgba(2,16,52,0.05)'
const DOT_STROKE = '#fbf7ee'
const SPIN_DEG_PER_SEC = 7

/** Stable pseudo-random hue per name. */
function hashHue(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % 360
}

/** Soft, delightful random fill for a country the traveler has been to. */
function countryColor(name: string): string {
  return `hsl(${hashHue(name)}, 52%, 74%)`
}

/** Bridge our country names to the world-atlas feature names. */
const COUNTRY_ALIASES: Record<string, string> = {
  'United States': 'United States of America',
  'United States of America': 'United States',
  Türkiye: 'Turkey',
  Turkey: 'Türkiye',
  Czechia: 'Czech Republic',
  'Czech Republic': 'Czechia',
}

function addVisited(set: Set<string>, name: string) {
  set.add(name)
  const alias = COUNTRY_ALIASES[name]
  if (alias) set.add(alias)
}

export function MapView() {
  const { trips } = useStore()
  const allPlaces = useMemo(() => collectPlaces(trips), [trips])

  const visitedCountries = useMemo(() => {
    const set = new Set<string>()
    for (const t of trips) {
      if (t.status !== 'done') continue
      const c = t.country ?? lookupCountry(t.title)
      if (c) addVisited(set, c)
      for (const city of t.cities ?? []) {
        const cc = city.country ?? lookupCountry(city.name)
        if (cc) addVisited(set, cc)
      }
    }
    return set
  }, [trips])

  const [yearFilter, setYearFilter] = useState('all')
  const [selected, setSelected] = useState<Place | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [is3d, setIs3d] = useState(true)
  const [zoom, setZoom] = useState(1)

  const yearOptions = useMemo(() => {
    const set = new Set<number>()
    allPlaces.forEach((p) => set.add(p.year))
    return [...set].sort((a, b) => a - b)
  }, [allPlaces])

  const filtered = useMemo(
    () => allPlaces.filter((p) => yearFilter === 'all' || String(p.year) === yearFilter),
    [allPlaces, yearFilter],
  )

  const activePlace =
    selected && filtered.some((p) => p.id === selected.id)
      ? selected
      : hoveredId
        ? filtered.find((p) => p.id === hoveredId) ?? null
        : null

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Globe
        places={filtered}
        visited={visitedCountries}
        mode={is3d ? '3d' : '2d'}
        zoom={zoom}
        selectedId={selected?.id ?? null}
        onHover={setHoveredId}
        onSelect={(p) => setSelected(p)}
      />

      {!is3d && (
        <div className="pointer-events-auto absolute bottom-6 left-6 flex flex-col overflow-hidden rounded-button border border-hairline bg-surface">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.5).toFixed(2)))}
            disabled={zoom >= 2.5}
            aria-label="Zoom in"
            className="focusable flex h-9 w-9 items-center justify-center border-b border-hairline text-ink-60 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon name="plus" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.5).toFixed(2)))}
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
            className="focusable flex h-9 w-9 items-center justify-center text-ink-60 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon name="minus" size={16} />
          </button>
        </div>
      )}

      {/* Top-left overlay: title + filters */}
      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-3">
        <div className="pointer-events-auto">
          <h1 className="font-display text-[28px] leading-none">Map</h1>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <FilterSelect
            label="Year"
            value={yearFilter}
            onChange={setYearFilter}
            options={[['all', 'All years'], ...yearOptions.map((y) => [String(y), String(y)] as [string, string])]}
          />
          <span className="text-caption text-ink-45">
            {filtered.length} {filtered.length === 1 ? 'place' : 'places'}
          </span>
          <div className="ml-1 inline-flex items-center gap-1.5">
            <span className={`text-caption ${!is3d ? 'font-medium text-ink' : 'text-ink-45'}`}>2D</span>
            <Switch checked={is3d} onChange={setIs3d} ariaLabel="Toggle 3D globe" />
            <span className={`text-caption ${is3d ? 'font-medium text-ink' : 'text-ink-45'}`}>3D</span>
          </div>
        </div>
      </div>

        {filtered.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-button bg-surface/85 px-4 py-2 text-body text-ink-60 backdrop-blur-sm">
              No places match these filters.
            </p>
          </div>
        )}

        <AnimatePresence>
          {activePlace && (
            <motion.div
              key={activePlace.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute right-6 top-6 max-h-[calc(100%-3rem)] w-[300px] overflow-auto rounded-card border border-hairline bg-surface p-5 shadow-pop"
            >
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setHoveredId(null)
                }}
                aria-label="Close"
                className="float-right -mr-1 -mt-1 rounded p-1 text-ink-40 transition-colors hover:text-ink"
              >
                <Icon name="close" size={16} />
              </button>
              <p className="text-caption text-ink-45">{activePlace.tripTitle}</p>
              <h3 className="mt-0.5 font-display text-[22px] leading-tight text-ink">{activePlace.name}</h3>
              <div className="mt-2.5 flex items-center gap-2">
                <Chip status={activePlace.status} />
                <span className="text-caption text-ink-60">{fmtDayLabel(activePlace.date)}</span>
              </div>
              {activePlace.note && (
                <div className="prose-note mt-3 border-t border-hairline pt-3 text-body text-ink">
                  <ReactMarkdown>{activePlace.note}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}

interface GlobeProps {
  places: Place[]
  visited: Set<string>
  mode: '2d' | '3d'
  zoom: number
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (place: Place) => void
}

function Globe({ places, visited, mode, zoom, selectedId, onHover, onSelect }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const placesRef = useRef(places)
  const visitedRef = useRef(visited)
  const modeRef = useRef(mode)
  const zoomRef = useRef(zoom)
  const selectedRef = useRef(selectedId)
  const hoveredRef = useRef<string | null>(null)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const rot = useRef({ lambda: 0, tilt: -14 })
  const dragging = useRef(false)
  const moved = useRef(false)
  const pauseSpin = useRef(false)
  const lastPtr = useRef({ x: 0, y: 0 })
  const pan = useRef({ x: 0, y: 0 })
  const screen = useRef<{ p: Place; x: number; y: number }[]>([])

  useEffect(() => {
    placesRef.current = places
  }, [places])
  useEffect(() => {
    visitedRef.current = visited
  }, [visited])
  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])
  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])
  useEffect(() => {
    onHoverRef.current = onHover
    onSelectRef.current = onSelect
  }, [onHover, onSelect])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const ortho = geoOrthographic().precision(0.4)
    const flat = geoEquirectangular().precision(0.4)
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const size = { w: 0, h: 0 }
    let fitBase = 0

    function resize() {
      const r = canvas.getBoundingClientRect()
      size.w = r.width
      size.h = r.height
      canvas.width = Math.round(size.w * dpr)
      canvas.height = Math.round(size.h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ortho.translate([size.w / 2, size.h / 2]).scale(Math.min(size.w, size.h) / 2 - 12)
      // Paper map: at 100% the whole map fits inside the view (contain).
      fitBase = Math.min(size.w / (2 * Math.PI), size.h / Math.PI)
      flat.scale(fitBase * zoomRef.current).translate([size.w / 2, size.h / 2])
    }

    /** Keep the 2D pan within bounds so the map edges never enter the view. */
    function clampPan() {
      const scale = fitBase * zoomRef.current
      const maxX = Math.max(0, (2 * Math.PI * scale - size.w) / 2)
      const maxY = Math.max(0, (Math.PI * scale - size.h) / 2)
      pan.current.x = Math.max(-maxX, Math.min(maxX, pan.current.x))
      pan.current.y = Math.max(-maxY, Math.min(maxY, pan.current.y))
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    let raf = 0
    let last = performance.now()
    function frame(t: number) {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const is3d = modeRef.current === '3d'
      const proj = is3d ? ortho : flat
      if (is3d) {
        if (!dragging.current && !pauseSpin.current) rot.current.lambda += SPIN_DEG_PER_SEC * dt
        proj.rotate([rot.current.lambda, rot.current.tilt])
      } else {
        // 2D paper map: still at 100%, pans once zoomed in (map larger than view).
        clampPan()
        proj.rotate([0, 0])
        proj.scale(fitBase * zoomRef.current)
        proj.translate([size.w / 2 + pan.current.x, size.h / 2 + pan.current.y])
      }
      const gp = geoPath(proj, ctx)

      ctx.clearRect(0, 0, size.w, size.h)
      ctx.beginPath()
      gp({ type: 'Sphere' })
      ctx.fillStyle = OCEAN
      ctx.fill()
      if (is3d) {
        ctx.lineWidth = 1
        ctx.strokeStyle = RIM
        ctx.stroke()

        ctx.beginPath()
        gp(GRATICULE)
        ctx.strokeStyle = GRAT
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Land, with visited countries lit up in their own color
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const f of WORLD.features as any[]) {
        const nm = f.properties?.name as string | undefined
        ctx.beginPath()
        gp(f)
        ctx.fillStyle = nm && visitedRef.current.has(nm) ? countryColor(nm) : LAND
        ctx.fill()
        ctx.lineWidth = 0.3
        ctx.strokeStyle = 'rgba(2,16,52,0.06)'
        ctx.stroke()
      }

      const center: [number, number] = [-rot.current.lambda, -rot.current.tilt]
      const visible: { p: Place; x: number; y: number }[] = []
      for (const p of placesRef.current) {
        if (is3d && geoDistance([p.lon, p.lat], center) > Math.PI / 2) continue
        const xy = proj([p.lon, p.lat])
        if (!xy) continue
        const active = p.id === hoveredRef.current || p.id === selectedRef.current
        const radius = active ? 6 : 3.8
        ctx.beginPath()
        ctx.arc(xy[0], xy[1], radius, 0, Math.PI * 2)
        ctx.fillStyle = statusMeta(p.status).dot
        ctx.fill()
        ctx.lineWidth = 1.3
        ctx.strokeStyle = DOT_STROKE
        ctx.stroke()
        visible.push({ p, x: xy[0], y: xy[1] })
      }
      screen.current = visible
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  function pick(clientX: number, clientY: number): Place | null {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = clientX - rect.left
    const my = clientY - rect.top
    let best: Place | null = null
    let bestD = 11 * 11
    for (const s of screen.current) {
      const dx = s.x - mx
      const dy = s.y - my
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = s.p
      }
    }
    return best
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full touch-none"
      style={{ cursor: mode === '3d' || zoom > 1 ? 'grab' : 'default' }}
      role="img"
      aria-label={mode === '3d' ? 'Rotating globe of destinations' : 'Map of destinations'}
      onPointerDown={(e) => {
        dragging.current = true
        moved.current = false
        lastPtr.current = { x: e.clientX, y: e.clientY }
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* noop */
        }
        if (modeRef.current === '3d' || zoomRef.current > 1) e.currentTarget.style.cursor = 'grabbing'
      }}
      onPointerMove={(e) => {
        if (dragging.current) {
          const dx = e.clientX - lastPtr.current.x
          const dy = e.clientY - lastPtr.current.y
          if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true
          if (modeRef.current === '3d') {
            rot.current.lambda += dx * 0.45
            rot.current.tilt = Math.max(-85, Math.min(85, rot.current.tilt - dy * 0.45))
          } else {
            // Pan the flat map; clampPan() in the render loop keeps it in bounds.
            pan.current.x += dx
            pan.current.y += dy
          }
          lastPtr.current = { x: e.clientX, y: e.clientY }
        } else {
          const p = pick(e.clientX, e.clientY)
          const id = p ? p.id : null
          if (id !== hoveredRef.current) {
            hoveredRef.current = id
            onHoverRef.current(id)
          }
          const canPan = modeRef.current === '3d' || zoomRef.current > 1
          e.currentTarget.style.cursor = p ? 'pointer' : canPan ? 'grab' : 'default'
        }
      }}
      onPointerUp={(e) => {
        if (dragging.current && !moved.current) {
          const p = pick(e.clientX, e.clientY)
          if (p) onSelectRef.current(p)
        }
        dragging.current = false
        e.currentTarget.style.cursor = modeRef.current === '3d' || zoomRef.current > 1 ? 'grab' : 'default'
      }}
      onPointerEnter={() => {
        pauseSpin.current = true
      }}
      onPointerLeave={() => {
        pauseSpin.current = false
        dragging.current = false
        if (hoveredRef.current) {
          hoveredRef.current = null
          onHoverRef.current(null)
        }
      }}
    />
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-caption text-ink-45">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focusable h-9 rounded-button border border-hairline bg-surface px-2.5 text-caption text-ink"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
