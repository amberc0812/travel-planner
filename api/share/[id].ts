import { type ApiRequest, type ApiResponse, ensureTable, getSql } from '../_lib'

/** GET /api/share/:id — load a shared trip snapshot. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id) return res.status(400).json({ error: 'Missing id' })

  try {
    await ensureTable()
    const sql = getSql()
    const rows = await sql`SELECT trip FROM shares WHERE id = ${id} LIMIT 1`
    if (rows.length === 0) return res.status(404).json({ error: 'Shared trip not found' })
    return res.status(200).json({ trip: rows[0].trip })
  } catch (e) {
    return res
      .status(500)
      .json({ error: 'Could not load the shared trip', detail: e instanceof Error ? e.message : String(e) })
  }
}
