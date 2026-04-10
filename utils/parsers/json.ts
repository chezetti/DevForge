export function beautifyJson(input: string, indent: number = 2): string {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed, null, indent)
}

export function minifyJson(input: string): string {
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed)
}

export interface ValidationResult {
  valid: boolean
  error?: string
  line?: number
  column?: number
}

export function validateJson(input: string): ValidationResult {
  try {
    JSON.parse(input)
    return { valid: true }
  } catch (e) {
    const error = e as SyntaxError
    const match = error.message.match(/position (\d+)/)
    if (match) {
      const position = parseInt(match[1], 10)
      const lines = input.slice(0, position).split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      return {
        valid: false,
        error: error.message,
        line,
        column,
      }
    }
    return {
      valid: false,
      error: error.message,
    }
  }
}

export function jsonToTypeScript(
  json: unknown,
  rootName: string = 'Root',
  depth: number = 0
): string {
  const interfaces: string[] = []
  const seen = new Map<string, string>()

  function getType(value: unknown, name: string): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]'
      const itemTypes = new Set(value.map((item) => getType(item, name.slice(0, -1))))
      if (itemTypes.size === 1) return `${Array.from(itemTypes)[0]}[]`
      return `(${Array.from(itemTypes).join(' | ')})[]`
    }
    if (typeof value === 'object') {
      const interfaceName = toPascalCase(name)
      generateInterface(value as Record<string, unknown>, interfaceName)
      return interfaceName
    }
    return typeof value
  }

  function generateInterface(obj: Record<string, unknown>, name: string): void {
    const signature = JSON.stringify(Object.keys(obj).sort())
    if (seen.has(signature)) return
    seen.set(signature, name)

    const fields = Object.entries(obj).map(([key, value]) => {
      const fieldType = getType(value, key)
      const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
      return `  ${safeName}: ${fieldType};`
    })

    interfaces.push(`interface ${name} {\n${fields.join('\n')}\n}`)
  }

  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    generateInterface(json as Record<string, unknown>, rootName)
  } else if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
    generateInterface(json[0] as Record<string, unknown>, rootName)
  }

  return interfaces.reverse().join('\n\n')
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

export function jsonToZod(json: unknown, rootName: string = 'schema'): string {
  function getZodType(value: unknown): string {
    if (value === null) return 'z.null()'
    if (Array.isArray(value)) {
      if (value.length === 0) return 'z.array(z.unknown())'
      return `z.array(${getZodType(value[0])})`
    }
    if (typeof value === 'object') {
      const fields = Object.entries(value as Record<string, unknown>).map(
        ([key, val]) => `  ${key}: ${getZodType(val)}`
      )
      return `z.object({\n${fields.join(',\n')}\n})`
    }
    if (typeof value === 'string') return 'z.string()'
    if (typeof value === 'number') return Number.isInteger(value) ? 'z.number().int()' : 'z.number()'
    if (typeof value === 'boolean') return 'z.boolean()'
    return 'z.unknown()'
  }

  return `import { z } from 'zod';\n\nconst ${rootName} = ${getZodType(json)};`
}

export function jsonToMongoose(json: unknown, schemaName: string = 'Schema'): string {
  function getMongooseType(value: unknown): string {
    if (value === null) return 'Schema.Types.Mixed'
    if (Array.isArray(value)) {
      if (value.length === 0) return '[Schema.Types.Mixed]'
      return `[${getMongooseType(value[0])}]`
    }
    if (typeof value === 'object') {
      const fields = Object.entries(value as Record<string, unknown>).map(
        ([key, val]) => `  ${key}: ${getMongooseType(val)}`
      )
      return `{\n${fields.join(',\n')}\n}`
    }
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return 'Number'
    if (typeof value === 'boolean') return 'Boolean'
    return 'Schema.Types.Mixed'
  }

  const schemaBody = getMongooseType(json)
  return `import mongoose from 'mongoose';\n\nconst ${schemaName} = new mongoose.Schema(${schemaBody});\n\nexport default mongoose.model('${schemaName.replace('Schema', '')}', ${schemaName});`
}

export function jsonToSql(json: unknown, tableName: string = 'data'): string {
  if (!Array.isArray(json)) {
    json = [json]
  }

  const arr = json as Record<string, unknown>[]
  if (arr.length === 0) return '-- No data to convert'

  const columns = Object.keys(arr[0])
  const values = arr.map((row) => {
    const vals = columns.map((col) => {
      const val = row[col]
      if (val === null) return 'NULL'
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
      return String(val)
    })
    return `(${vals.join(', ')})`
  })

  return `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n${values.join(',\n')};`
}

export function jsonToCsv(json: unknown, includeHeaders: boolean = true): string {
  if (!Array.isArray(json)) {
    json = [json]
  }

  const arr = json as Record<string, unknown>[]
  if (arr.length === 0) return ''

  const headers = Object.keys(arr[0])
  const rows = arr.map((row) =>
    headers
      .map((header) => {
        const val = row[header]
        if (val === null || val === undefined) return ''
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )

  if (includeHeaders) {
    return [headers.join(','), ...rows].join('\n')
  }
  return rows.join('\n')
}

export function mergeJson(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  deep: boolean = true
): Record<string, unknown> {
  if (!deep) {
    return { ...obj1, ...obj2 }
  }

  const result: Record<string, unknown> = { ...obj1 }

  for (const key of Object.keys(obj2)) {
    if (
      typeof obj2[key] === 'object' &&
      obj2[key] !== null &&
      !Array.isArray(obj2[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeJson(
        result[key] as Record<string, unknown>,
        obj2[key] as Record<string, unknown>,
        true
      )
    } else {
      result[key] = obj2[key]
    }
  }

  return result
}
