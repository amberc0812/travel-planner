import type { CurrencyCode } from './types'

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
  { code: 'JPY', symbol: '¥', label: 'JPY' },
  { code: 'CNY', symbol: '¥', label: 'CNY' },
]

export function symbolOf(code: CurrencyCode | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '$'
}

/** Pull a plain number out of any string (drops symbols, commas, words). */
export function parseAmount(text: string): number {
  const n = parseFloat(String(text).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Strip currency symbols for the editable amount field. */
export function stripSymbols(text: string): string {
  return text.replace(/[$€£¥]/g, '').trim()
}

/**
 * Best-effort amount from a free-text Money line. Prefers numbers attached to a
 * currency symbol (summed), else falls back to the largest number present.
 */
export function parseMoney(text: string): number {
  const tagged = [...text.matchAll(/[$€£¥]\s?([\d.,]+)/g)].map((m) => parseAmount(m[1]))
  if (tagged.length) return tagged.reduce((a, b) => a + b, 0)
  const nums = [...text.matchAll(/(\d[\d.,]*)/g)].map((m) => parseAmount(m[1]))
  return nums.length ? Math.max(...nums) : 0
}

export function formatAmount(n: number, code: CurrencyCode | undefined): string {
  return symbolOf(code) + Math.round(n).toLocaleString('en-US')
}
