/** Minimal TOML ↔ plain-JSON helpers (common config shapes; not a full TOML 1.0 implementation). */

export type TomlJson = string | number | boolean | null | TomlJson[] | { [k: string]: TomlJson }

function formatBareKey(k: string): string {
  if (/^[A-Za-z0-9_-]+$/.test(k)) return k
  return `"${k.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function formatTomlScalar(v: unknown): string {
  if (v === null) return '""'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('Cannot serialize non-finite number to TOML')
    return Number.isInteger(v) ? String(v) : String(v)
  }
  if (typeof v === 'string') return JSON.stringify(v)
  throw new Error('Expected scalar')
}

function formatTomlArray(arr: unknown[]): string {
  return `[${arr.map((x) => (Array.isArray(x) ? formatTomlArray(x) : formatTomlScalar(x))).join(', ')}]`
}

function pathToHeader(segments: string[]): string {
  return segments.map(formatBareKey).join('.')
}

/** Emit TOML for config-style YAML/JSON (nested tables, primitives, primitive arrays, array of homogeneous objects). */
export function jsObjectToToml(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Root TOML document must be a mapping (object)')
  }
  const lines: string[] = []

  function emitTableBody(body: Record<string, unknown>, path: string[]): void {
    const scalars: [string, unknown][] = []
    const nestedObjs: [string, Record<string, unknown>][] = []
    const primArrays: [string, unknown[]][] = []
    const objArrays: [string, Record<string, unknown>[]][] = []

    for (const [k, v] of Object.entries(body)) {
      if (v === null || v === undefined) {
        scalars.push([k, v])
        continue
      }
      if (typeof v === 'object' && v instanceof Date) {
        scalars.push([k, (v as Date).toISOString()])
        continue
      }
      if (Array.isArray(v)) {
        if (
          v.length > 0 &&
          v.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
        ) {
          objArrays.push([k, v as Record<string, unknown>[]])
        } else if (v.some((item) => typeof item === 'object' && item !== null)) {
          throw new Error(`Array of mixed types is not supported for "${k}"`)
        } else {
          primArrays.push([k, v])
        }
        continue
      }
      if (typeof v === 'object') {
        nestedObjs.push([k, v as Record<string, unknown>])
        continue
      }
      scalars.push([k, v])
    }

    for (const [k, v] of scalars) {
      if (v === null || v === undefined) {
        lines.push(`# ${formatBareKey(k)} = null`)
      } else {
        lines.push(`${formatBareKey(k)} = ${formatTomlScalar(v)}`)
      }
    }
    for (const [k, arr] of primArrays) {
      lines.push(`${formatBareKey(k)} = ${formatTomlArray(arr)}`)
    }

    for (const [k, child] of nestedObjs) {
      const nextPath = [...path, k]
      lines.push('')
      lines.push(`[${pathToHeader(nextPath)}]`)
      emitTableBody(child, nextPath)
    }

    for (const [k, arr] of objArrays) {
      const tablePath = [...path, k]
      const tableKey = pathToHeader(tablePath)
      for (const row of arr) {
        lines.push('')
        lines.push(`[[${tableKey}]]`)
        emitTableBody(row, tablePath)
      }
    }
  }

  emitTableBody(obj as Record<string, unknown>, [])
  return lines.join('\n').trimEnd() + '\n'
}

function skipSpace(s: string, i: number): number {
  let j = i
  while (j < s.length && /\s/.test(s[j]!)) j++
  return j
}

function parseStringDouble(s: string, start: number): [string, number] {
  let j = start + 1
  let out = ''
  while (j < s.length) {
    const c = s[j]!
    if (c === '"') return [out, j + 1]
    if (c === '\\' && j + 1 < s.length) {
      const n = s[j + 1]!
      if (n === '\\') {
        out += '\\'
        j += 2
        continue
      }
      if (n === '"') {
        out += '"'
        j += 2
        continue
      }
      if (n === 'n') {
        out += '\n'
        j += 2
        continue
      }
      if (n === 't') {
        out += '\t'
        j += 2
        continue
      }
    }
    out += c
    j++
  }
  throw new Error('Unterminated string')
}

function parseStringSingle(s: string, start: number): [string, number] {
  let j = start + 1
  let out = ''
  while (j < s.length) {
    const c = s[j]!
    if (c === "'") return [out, j + 1]
    out += c
    j++
  }
  throw new Error('Unterminated string')
}

function parseValue(s: string, start: number): [TomlJson, number] {
  let i = skipSpace(s, start)
  if (i >= s.length) throw new Error('Expected value')
  const head = s[i]!

  if (head === '"') return parseStringDouble(s, i)
  if (head === "'") return parseStringSingle(s, i)

  if (s.slice(i, i + 4) === 'true') return [true, i + 4]
  if (s.slice(i, i + 5) === 'false') return [false, i + 5]

  if (head === '[') {
    const arr: TomlJson[] = []
    i++
    i = skipSpace(s, i)
    if (s[i] === ']') return [[], i + 1]
    while (true) {
      const [v, ni] = parseValue(s, i)
      arr.push(v)
      i = skipSpace(s, ni)
      if (s[i] === ']') return [arr, i + 1]
      if (s[i] === ',') {
        i = skipSpace(s, i + 1)
        continue
      }
      throw new Error('Expected , or ] in array')
    }
  }

  if (head === '{') {
    const obj: Record<string, TomlJson> = {}
    i++
    i = skipSpace(s, i)
    if (s[i] === '}') return [obj, i + 1]
    while (true) {
      const keyStart = i
      while (i < s.length && /[A-Za-z0-9_-]/.test(s[i]!)) i++
      const key = s.slice(keyStart, i).trim()
      if (!key) throw new Error('Expected key in inline table')
      i = skipSpace(s, i)
      if (s[i] !== '=') throw new Error('Expected = in inline table')
      i = skipSpace(s, i + 1)
      const [v, ni] = parseValue(s, i)
      obj[key] = v
      i = skipSpace(s, ni)
      if (s[i] === '}') return [obj, i + 1]
      if (s[i] === ',') {
        i = skipSpace(s, i + 1)
        continue
      }
      throw new Error('Expected , or } in inline table')
    }
  }

  const numMatch = s.slice(i).match(/^[-+]?(?:\d+\.\d+([eE][+-]?\d+)?|\d+)/)
  if (numMatch) {
    const raw = numMatch[0]!
    return [raw.includes('.') || /[eE]/.test(raw) ? parseFloat(raw) : parseInt(raw, 10), i + raw.length]
  }

  throw new Error(`Unsupported value at: ${s.slice(i, i + 20)}…`)
}

function stripLineComment(line: string): string {
  let inS = false
  let inD = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (inD) {
      if (c === '\\' && line[i + 1]) {
        i++
        continue
      }
      if (c === '"') inD = false
      continue
    }
    if (inS) {
      if (c === "'") inS = false
      continue
    }
    if (c === '"') {
      inD = true
      continue
    }
    if (c === "'") {
      inS = true
      continue
    }
    if (c === '#') return line.slice(0, i).trimEnd()
  }
  return line.trim()
}

function navigatePath(root: Record<string, TomlJson>, parts: string[]): Record<string, TomlJson> {
  if (parts.length === 0) return root
  let cur: unknown = root
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null || Array.isArray(cur)) {
      throw new Error(`Cannot add "${p}" — parent is not a table`)
    }
    const o = cur as Record<string, TomlJson>
    if (!(p in o)) o[p] = {}
    cur = o[p]
  }
  return cur as Record<string, TomlJson>
}

function setDeep(target: Record<string, TomlJson>, dotted: string[], value: TomlJson): void {
  if (dotted.length === 1) {
    target[dotted[0]!] = value
    return
  }
  const [head, ...rest] = dotted
  let next = target[head!] as Record<string, TomlJson> | undefined
  if (next === undefined || typeof next !== 'object' || Array.isArray(next)) {
    next = {}
    target[head!] = next
  }
  setDeep(next as Record<string, TomlJson>, rest, value)
}

/** Parse common TOML: `[tables]`, `key = val`, dotted keys, arrays, inline `{ tables }`. */
export function parseTomlToJson(input: string): Record<string, TomlJson> {
  const root: Record<string, TomlJson> = {}
  const lines = input.split(/\r?\n/)
  let tablePath: string[] = []

  for (const rawLine of lines) {
    const line = stripLineComment(rawLine)
    if (!line) continue

    const table = line.match(/^\[([^\]]+)\]$/)
    if (table) {
      tablePath = table[1]!.split('.').map((s) => s.trim())
      navigatePath(root, tablePath)
      continue
    }

    const eq = line.indexOf('=')
    if (eq === -1) throw new Error(`Invalid TOML line: ${line}`)
    const keyPart = line.slice(0, eq).trim()
    const valPart = line.slice(eq + 1).trim()
    if (!keyPart) throw new Error('Missing key')

    const [val] = parseValue(valPart, 0)
    const keySegments = keyPart.split('.').map((s) => s.trim())
    const parent = tablePath.length ? navigatePath(root, tablePath) : root
    setDeep(parent, keySegments, val)
  }

  return root
}
