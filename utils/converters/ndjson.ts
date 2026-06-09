/**
 * Convert a JSON value to NDJSON (newline-delimited JSON / JSON Lines).
 * Arrays become one compact JSON object per line; a single object yields one line.
 * Throws on invalid JSON.
 */
export function jsonToNdjson(input: string): string {
  const data = JSON.parse(input)
  const rows = Array.isArray(data) ? data : [data]
  return rows.map((row) => JSON.stringify(row)).join('\n')
}

/**
 * Convert NDJSON (one JSON value per non-empty line) to a pretty JSON array.
 * Blank lines are ignored. Throws with the offending line number on parse error.
 */
export function ndjsonToJson(input: string, indent = 2): string {
  const lines = input.split(/\r?\n/)
  const rows: unknown[] = []
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      rows.push(JSON.parse(trimmed))
    } catch (error) {
      throw new Error(`Line ${index + 1}: ${(error as Error).message}`)
    }
  })
  return JSON.stringify(rows, null, indent)
}
