import { describe, it, expect } from 'vitest'
import {
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  toPascalCase,
  toTitleCase,
  toConstantCase,
  toSlug,
  escapeString,
  unescapeString,
  testRegex,
  parseEnv,
  envToJson,
  jsonToEnv,
} from '../strings'

describe('case converters', () => {
  it('toCamelCase', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld')
    expect(toCamelCase('hello_world')).toBe('helloWorld')
    expect(toCamelCase('Hello World')).toBe('helloWorld')
  })

  it('toSnakeCase', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world')
    expect(toSnakeCase('hello-world')).toBe('hello_world')
  })

  it('toKebabCase', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
    expect(toKebabCase('HelloWorld')).toBe('hello-world')
  })

  it('toPascalCase', () => {
    expect(toPascalCase('hello-world')).toBe('HelloWorld')
    expect(toPascalCase('hello_world')).toBe('HelloWorld')
  })

  it('toTitleCase', () => {
    expect(toTitleCase('hello-world')).toBe('Hello World')
    expect(toTitleCase('hello_world_test')).toBe('Hello World Test')
  })

  it('toConstantCase', () => {
    expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD')
  })
})

describe('toSlug', () => {
  it('creates URL-safe slugs', () => {
    expect(toSlug('Hello World!')).toBe('hello-world')
    expect(toSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
    expect(toSlug('Special @#$ Characters')).toBe('special-characters')
  })
})

describe('escape/unescape', () => {
  it('escapes special characters', () => {
    expect(escapeString('line1\nline2')).toBe('line1\\nline2')
    expect(escapeString('tab\there')).toBe('tab\\there')
  })

  it('round-trips', () => {
    const input = 'line1\nline2\ttab'
    expect(unescapeString(escapeString(input))).toBe(input)
  })
})

describe('testRegex', () => {
  it('finds global matches', () => {
    const result = testRegex('\\d+', 'g', 'abc 123 def 456')
    expect(result.valid).toBe(true)
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0].match).toBe('123')
    expect(result.matches[1].match).toBe('456')
  })

  it('returns error on invalid regex', () => {
    const result = testRegex('[invalid', '', 'test')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('captures groups', () => {
    const result = testRegex('(\\w+)@(\\w+)', '', 'user@host')
    expect(result.matches[0].groups).toEqual(['user', 'host'])
  })
})

describe('env parsing', () => {
  it('parseEnv handles basic key=value', () => {
    const result = parseEnv('PORT=3000\nNODE_ENV=production')
    expect(result).toEqual({ PORT: '3000', NODE_ENV: 'production' })
  })

  it('parseEnv handles quoted values', () => {
    const result = parseEnv('MSG="hello world"\nOTHER=\'foo bar\'')
    expect(result.MSG).toBe('hello world')
    expect(result.OTHER).toBe('foo bar')
  })

  it('parseEnv ignores comments and empty lines', () => {
    const result = parseEnv('# comment\n\nKEY=value')
    expect(Object.keys(result)).toEqual(['KEY'])
  })

  it('envToJson round-trips with jsonToEnv', () => {
    const env = 'PORT=3000\nHOST=localhost'
    const json = envToJson(env)
    const backToEnv = jsonToEnv(json)
    expect(backToEnv).toContain('PORT=3000')
    expect(backToEnv).toContain('HOST=localhost')
  })
})
