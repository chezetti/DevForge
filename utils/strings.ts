export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toLowerCase())
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase()
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .replace(/^-/, '')
    .toLowerCase()
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

export function toTitleCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function toSentenceCase(str: string): string {
  const normalized = str.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

export function toDotCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, ".");
}

export function toPathCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, "/");
}

export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase()
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

export function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

export interface RegexMatch {
  match: string
  index: number
  groups: string[]
}

export function testRegex(
  pattern: string,
  flags: string,
  testString: string
): { valid: boolean; matches: RegexMatch[]; error?: string } {
  try {
    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []

    if (flags.includes('g')) {
      let match
      while ((match = regex.exec(testString)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        })
        if (!match[0]) break // Prevent infinite loop on empty matches
      }
    } else {
      const match = regex.exec(testString)
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        })
      }
    }

    return { valid: true, matches }
  } catch (e) {
    return { valid: false, matches: [], error: (e as Error).message }
  }
}

export function parseEnv(input: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = input.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

export function envToJson(input: string, pretty: boolean = true): string {
  const parsed = parseEnv(input)
  return JSON.stringify(parsed, null, pretty ? 2 : 0)
}

export function jsonToEnv(jsonString: string): string {
  const parsed = JSON.parse(jsonString)
  return Object.entries(parsed)
    .map(([key, value]) => {
      const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
      if (val.includes(' ') || val.includes('"') || val.includes("'")) {
        return `${key}="${val.replace(/"/g, '\\"')}"`
      }
      return `${key}=${val}`
    })
    .join('\n')
}
