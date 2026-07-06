import type { Detail, Trip } from './types'
import { dateRangeLabel, dayDate, durationLabel, fmtDayLabel } from './date'
import { DETAIL_META } from './details'
import { modeMeta } from './transport'
import { stripSymbols, symbolOf } from './currency'
import { lookupCountry } from './geo-cities'

const NAVY = '#021034'
const MUTED = 'rgba(2,16,52,0.62)'
const PAPER = '#ffffff'
const HAIR = 'rgba(2,16,52,0.14)'
const SERIF = "'Fraunces', Georgia, serif"
const SANS = "'Inter', system-ui, sans-serif"

/** Content width for US Letter (816px @96dpi) minus 16px margins each side. */
const DOC_WIDTH = 784

function el(
  tag: string,
  style: Partial<CSSStyleDeclaration>,
  text?: string,
): HTMLElement {
  const node = document.createElement(tag)
  Object.assign(node.style, style)
  if (text != null) node.textContent = text
  return node
}

function stripMarkdown(s: string): string {
  return s.replace(/[*_`>#]/g, '').trim()
}

/** One clean text line for a child detail — returns '' when there's nothing to show. */
function childLine(c: Detail): string {
  if (c.type === 'transportation') {
    const parts = [modeMeta(c.mode).label]
    if (c.mode === 'car' || c.mode === 'walk' || c.mode === 'bike') {
      if (c.durationMin) parts.push(`${c.durationMin} min`)
    } else {
      const route = [c.fromCity?.trim(), c.toCity?.trim()].filter(Boolean).join(' → ')
      if (route) parts.push(route)
      const times = [c.depTime, c.arrTime].filter(Boolean).join(' → ')
      if (times) parts.push(times)
    }
    return parts.join(' · ')
  }
  if (c.type === 'time') return c.text ? `Time — ${c.text}` : ''
  if (c.type === 'note') return c.text.trim() ? stripMarkdown(c.text) : ''
  if (!c.text.trim()) return ''
  return `${DETAIL_META[c.type]?.label ?? ''} — ${c.text.trim()}`
}

/** Build an off-screen, literary document of the trip (no UI chrome). */
function buildTripDoc(trip: Trip): HTMLDivElement {
  const root = el('div', {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${DOC_WIDTH}px`,
    background: PAPER,
    color: NAVY,
    fontFamily: SANS,
    boxSizing: 'border-box',
  }) as HTMLDivElement

  root.appendChild(
    el('div', { fontFamily: SERIF, fontSize: '34px', fontWeight: '600', lineHeight: '1.15' }, trip.title || 'Untitled trip'),
  )
  const country = trip.country ?? lookupCountry(trip.title)
  if (country) root.appendChild(el('div', { fontSize: '13px', color: MUTED, marginTop: '2px' }, country))
  if (trip.description)
    root.appendChild(
      el('div', { fontSize: '16px', fontStyle: 'italic', color: MUTED, marginTop: '10px', lineHeight: '1.5' }, trip.description),
    )

  const meta: string[] = [
    dateRangeLabel(trip.startDate, trip.days.length),
    durationLabel(trip.days.length),
  ]
  if (stripSymbols(trip.budget)) meta.push(symbolOf(trip.currency) + stripSymbols(trip.budget))
  if (trip.solo) meta.push('Solo trip')
  else if (trip.people.trim()) meta.push(trip.people.trim())
  root.appendChild(el('div', { fontSize: '13px', color: MUTED, marginTop: '14px', letterSpacing: '0.2px' }, meta.join('   ·   ')))

  root.appendChild(el('div', { borderTop: `1px solid ${HAIR}`, marginTop: '18px' }))

  const extraCities = trip.cities ?? []
  const groups: { name?: string; country?: string; days: Trip['days'] }[] = [
    { days: trip.days.filter((d) => (d.cityId ?? 'main') === 'main') },
    ...extraCities.map((c) => ({
      name: c.name,
      country: c.country ?? lookupCountry(c.name),
      days: trip.days.filter((d) => d.cityId === c.id),
    })),
  ]

  let dayNo = 0
  for (const g of groups) {
    if (g.name !== undefined) {
      const h = el('div', { fontFamily: SERIF, fontSize: '22px', fontWeight: '600', marginTop: '22px' }, g.name || 'Untitled city')
      if (g.country)
        h.appendChild(el('span', { fontFamily: SANS, fontSize: '13px', fontWeight: '400', color: MUTED }, `   ·   ${g.country}`))
      root.appendChild(h)
    }
    for (const day of g.days) {
      dayNo += 1
      root.appendChild(
        el('div', { fontFamily: SERIF, fontSize: '18px', fontWeight: '600', marginTop: '16px' }, `Day ${dayNo} — ${fmtDayLabel(dayDate(trip.startDate, dayNo - 1))}`),
      )
      if (day.accommodation) root.appendChild(el('div', { fontSize: '13px', color: MUTED, marginTop: '2px' }, `Staying: ${day.accommodation}`))
      if (day.details.length === 0) {
        root.appendChild(el('div', { fontSize: '14px', color: MUTED, fontStyle: 'italic', marginTop: '6px' }, 'No plans yet.'))
        continue
      }
      for (const dest of day.details) {
        root.appendChild(el('div', { fontSize: '15px', fontWeight: '500', marginTop: '9px' }, `• ${dest.text || 'Untitled place'}`))
        for (const c of dest.children ?? []) {
          const line = childLine(c)
          if (line)
            root.appendChild(el('div', { fontSize: '14px', color: MUTED, marginLeft: '16px', marginTop: '3px', lineHeight: '1.5' }, line))
        }
      }
    }
  }

  return root
}

const safeName = (s: string) => (s.trim() || 'trip').replace(/[^\w-]+/g, '-').toLowerCase()

export async function downloadTrip(trip: Trip, kind: 'pdf' | 'jpg'): Promise<void> {
  const node = buildTripDoc(trip)
  document.body.appendChild(node)
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(node, { backgroundColor: PAPER, scale: 2 })
    const name = safeName(trip.title)

    if (kind === 'jpg') {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/jpeg', 0.92)
      a.download = `${name}.jpg`
      a.click()
      return
    }

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'px', format: 'letter', hotfixes: ['px_scaling'] })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 16
    const imgW = pageW - margin * 2
    const scaleFactor = imgW / canvas.width // canvas px -> pdf px
    const pageRows = Math.floor((pageH - margin * 2) / scaleFactor) // canvas rows per page

    let srcY = 0
    let first = true
    while (srcY < canvas.height) {
      const sliceH = Math.min(pageRows, canvas.height - srcY)
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = sliceH
      slice.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
      if (!first) pdf.addPage()
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, imgW, sliceH * scaleFactor)
      srcY += sliceH
      first = false
    }
    pdf.save(`${name}.pdf`)
  } finally {
    document.body.removeChild(node)
  }
}
