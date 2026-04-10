import { format } from 'sql-formatter'

export function formatSql(sql: string): string {
  return format(sql, {
    language: 'postgresql',
    tabWidth: 2,
    keywordCase: 'upper',
    linesBetweenQueries: 2,
  })
}

interface SqlColumn {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  defaultValue?: string
}

function parseSqlCreateTable(sql: string): { tableName: string; columns: SqlColumn[] } | null {
  const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(/i)
  if (!tableMatch) return null

  const tableName = tableMatch[1]
  
  // Extract column definitions
  const columnsStart = sql.indexOf('(') + 1
  const columnsEnd = sql.lastIndexOf(')')
  const columnsPart = sql.slice(columnsStart, columnsEnd)
  
  const columns: SqlColumn[] = []
  
  // Split by comma but not inside parentheses
  let depth = 0
  let current = ''
  const parts: string[] = []
  
  for (const char of columnsPart) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())
  
  for (const part of parts) {
    // Skip constraints like PRIMARY KEY, FOREIGN KEY, etc.
    if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/i.test(part)) continue
    
    const match = part.match(/["'`]?(\w+)["'`]?\s+(\w+(?:\([^)]+\))?)/i)
    if (match) {
      const name = match[1]
      const type = match[2]
      
      columns.push({
        name,
        type: mapSqlTypeToTs(type),
        nullable: !/NOT\s+NULL/i.test(part),
        primaryKey: /PRIMARY\s+KEY/i.test(part),
        unique: /UNIQUE/i.test(part),
        defaultValue: part.match(/DEFAULT\s+([^\s,]+)/i)?.[1],
      })
    }
  }
  
  return { tableName, columns }
}

function mapSqlTypeToTs(sqlType: string): string {
  const type = sqlType.toUpperCase()
  
  if (type.startsWith('VARCHAR') || type.startsWith('CHAR') || type === 'TEXT' || type === 'UUID') {
    return 'string'
  }
  if (type.startsWith('INT') || type === 'INTEGER' || type === 'SMALLINT' || type === 'BIGINT') {
    return 'number'
  }
  if (type === 'BOOLEAN' || type === 'BOOL') {
    return 'boolean'
  }
  if (type.startsWith('DECIMAL') || type.startsWith('NUMERIC') || type === 'FLOAT' || type === 'DOUBLE') {
    return 'number'
  }
  if (type.startsWith('TIMESTAMP') || type === 'DATE' || type === 'DATETIME') {
    return 'Date'
  }
  if (type === 'JSON' || type === 'JSONB') {
    return 'Record<string, unknown>'
  }
  if (type.includes('[]')) {
    return 'unknown[]'
  }
  
  return 'unknown'
}

export function sqlToTypeOrm(sql: string): string {
  const parsed = parseSqlCreateTable(sql)
  if (!parsed) {
    throw new Error('Could not parse SQL CREATE TABLE statement')
  }
  
  const { tableName, columns } = parsed
  const className = toPascalCase(tableName)
  
  const lines: string[] = [
    "import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';",
    '',
    `@Entity('${tableName}')`,
    `export class ${className} {`,
  ]
  
  for (const col of columns) {
    if (col.primaryKey) {
      lines.push('  @PrimaryGeneratedColumn()')
    } else {
      const options: string[] = []
      if (col.nullable) options.push('nullable: true')
      if (col.unique) options.push('unique: true')
      
      const optStr = options.length > 0 ? `{ ${options.join(', ')} }` : ''
      lines.push(`  @Column(${optStr})`)
    }
    lines.push(`  ${col.name}: ${col.type};`)
    lines.push('')
  }
  
  lines.push('}')
  
  return lines.join('\n')
}

export function sqlToPrisma(sql: string): string {
  const parsed = parseSqlCreateTable(sql)
  if (!parsed) {
    throw new Error('Could not parse SQL CREATE TABLE statement')
  }
  
  const { tableName, columns } = parsed
  
  const lines: string[] = [`model ${toPascalCase(tableName)} {`]
  
  for (const col of columns) {
    let prismaType = mapTsPrismaType(col.type)
    let modifiers = ''
    
    if (col.primaryKey) {
      modifiers += ' @id'
      if (prismaType === 'Int') {
        modifiers += ' @default(autoincrement())'
      }
    }
    if (col.unique) modifiers += ' @unique'
    if (!col.nullable && !col.primaryKey) {
      // Type is already required by default in Prisma
    } else if (col.nullable) {
      prismaType += '?'
    }
    
    lines.push(`  ${col.name} ${prismaType}${modifiers}`)
  }
  
  lines.push('}')
  
  return lines.join('\n')
}

function mapTsPrismaType(tsType: string): string {
  switch (tsType) {
    case 'string': return 'String'
    case 'number': return 'Int'
    case 'boolean': return 'Boolean'
    case 'Date': return 'DateTime'
    default: return 'Json'
  }
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}
