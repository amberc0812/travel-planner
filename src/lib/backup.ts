/** localStorage keys that hold all of a person's data. */
export const DATA_KEYS = ['travel-planner:v2', 'travel-planner:folders:v1', 'travel-planner:settings']

/** Download every trip, collection, and setting as one JSON file. */
export function exportData() {
  const data = Object.fromEntries(DATA_KEYS.map((k) => [k, localStorage.getItem(k)]))
  const payload = { app: 'travel-planner', exportedAt: new Date().toISOString(), data }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `travel-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Replace everything on this device with the contents of a backup file. */
export function importData(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    let data: Record<string, unknown> | undefined
    try {
      const parsed = JSON.parse(String(reader.result)) as { data?: Record<string, unknown> }
      data = parsed.data ?? (parsed as Record<string, unknown>)
    } catch {
      window.alert('That file could not be read as a Travel Planner backup.')
      return
    }
    const keys = DATA_KEYS.filter((k) => typeof data?.[k] === 'string')
    if (keys.length === 0) {
      window.alert('No Travel Planner data was found in that file.')
      return
    }
    if (
      !window.confirm(
        'Replace everything in this app with the imported data? The trips currently here will be overwritten.',
      )
    ) {
      return
    }
    for (const k of keys) localStorage.setItem(k, data[k] as string)
    window.location.reload()
  }
  reader.readAsText(file)
}
