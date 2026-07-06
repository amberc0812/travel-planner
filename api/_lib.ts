import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { Resend } from 'resend'

/** Minimal shapes of the Vercel serverless request/response (avoids a heavy types dep). */
export interface ApiRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
  body: unknown
}
export interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): ApiResponse
  setHeader(name: string, value: string): void
}

let client: NeonQueryFunction<false, false> | null = null

/** Lazily create the Neon SQL client, with a clear error if the DB isn't configured. */
export function getSql(): NeonQueryFunction<false, false> {
  if (client) return client
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) throw new Error('Database is not configured (missing DATABASE_URL).')
  client = neon(url)
  return client
}

/** Create the shares table on first use. Cheap enough to call per request. */
export async function ensureTable(): Promise<void> {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      id text PRIMARY KEY,
      trip jsonb NOT NULL,
      recipient text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `
}

/** Public base URL for building share links — honours an override, else the request host. */
export function baseUrl(req: ApiRequest): string {
  const override = process.env.PUBLIC_BASE_URL
  if (override) return override.replace(/\/+$/, '')
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https'
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? (req.headers.host as string) ?? ''
  return `${proto}://${host}`
}

interface ShareTrip {
  title?: string
  description?: string
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

/** Send the invite email via Resend. Never throws — returns a result the API can report honestly. */
export async function sendInviteEmail(
  to: string,
  trip: ShareTrip,
  link: string,
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    return { ok: false, error: 'Email is not configured (missing RESEND_API_KEY or EMAIL_FROM).' }
  }
  const title = trip.title?.trim() || 'a trip'
  const desc = trip.description?.trim()
  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `You're invited to plan "${title}"`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#021034;line-height:1.5;max-width:520px;">
          <h2 style="margin:0 0 8px;">You've been invited to "${escapeHtml(title)}"</h2>
          ${desc ? `<p style="color:#4a5568;margin:0 0 16px;">${escapeHtml(desc)}</p>` : ''}
          <p style="margin:0 0 20px;">Open the trip to view the itinerary and save your own copy:</p>
          <p><a href="${link}" style="display:inline-block;background:#021034;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">Open the trip</a></p>
          <p style="color:#8896a5;font-size:13px;margin-top:24px;">Or paste this link into your browser:<br>${link}</p>
        </div>
      `,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Email send failed.' }
  }
}
