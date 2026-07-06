export interface Projected<T> {
  item: T
  x: number
  y: number
}

export interface Cluster<T> {
  key: string
  x: number
  y: number
  items: T[]
}

/**
 * Greedy distance clustering in projected (SVG) space. Points within `threshold`
 * units of a cluster's centroid merge into it. Stable `key` (sorted member ids)
 * keeps clusters identifiable across re-renders for enter/exit animation.
 */
export function clusterPoints<T>(
  points: Projected<T>[],
  threshold: number,
  idOf: (item: T) => string,
): Cluster<T>[] {
  const clusters: Cluster<T>[] = []
  for (const p of points) {
    let placed = false
    for (const c of clusters) {
      const dx = c.x - p.x
      const dy = c.y - p.y
      if (dx * dx + dy * dy <= threshold * threshold) {
        c.items.push(p.item)
        c.x = (c.x * (c.items.length - 1) + p.x) / c.items.length
        c.y = (c.y * (c.items.length - 1) + p.y) / c.items.length
        placed = true
        break
      }
    }
    if (!placed) clusters.push({ key: '', x: p.x, y: p.y, items: [p.item] })
  }
  for (const c of clusters) {
    c.key = c.items.map(idOf).sort().join('|')
  }
  return clusters
}
