import { randomUUID } from 'node:crypto'
import { type ApiRequest, type ApiResponse, baseUrl, ensureTable, getSql, sendInviteEmail } from './_lib'

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** POST /api/share — store a trip snapshot and (optionally) email a link to a recipient. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) as
    | { trip?: { id?: unknown; title?: string; description?: string }; recipient?: unknown }
    | undefined
  const trip = body?.trip
  const recipient =
    typeof body?.recipient === 'string' && body.recipient.trim() ? body.recipient.trim() : undefined

  if (!trip || typeof trip !== 'object' || typeof trip.id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid trip' })
  }

  const id = randomUUID().replace(/-/g, '').slice(0, 12)
  try {
    await ensureTable()
    const sql = getSql()
    await sql`INSERT INTO shares (id, trip, recipient)
              VALUES (${id}, ${JSON.stringify(trip)}::jsonb, ${recipient ?? null})`
  } catch (e) {
    return res.status(500).json({ error: 'Could not save the shared trip', detail: msg(e) })
  }

  const link = `${baseUrl(req)}/?shared=${id}`
  let emailed = false
  let emailError: string | undefined
  if (recipient) {
    const r = await sendInviteEmail(recipient, trip, link)
    emailed = r.ok
    emailError = r.error
  }

  return res.status(200).json({ id, link, emailed, emailError })
}
