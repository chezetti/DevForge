import { describe, it, expect } from 'vitest'
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  decodeJwt,
  generateUUID,
  validateUUID,
  generateNanoId,
  generateObjectId,
  parseObjectId,
} from '../security'

describe('base64', () => {
  it('encodes and decodes ASCII strings', () => {
    expect(base64Decode(base64Encode('hello world'))).toBe('hello world')
  })

  it('encodes and decodes Unicode strings', () => {
    const input = 'Привет мир 🌍'
    expect(base64Decode(base64Encode(input))).toBe(input)
  })

  it('handles empty string', () => {
    expect(base64Encode('')).toBe('')
    expect(base64Decode('')).toBe('')
  })
})

describe('url encode/decode', () => {
  it('encodes special characters', () => {
    expect(urlEncode('hello world')).toBe('hello%20world')
    expect(urlEncode('a=1&b=2')).toBe('a%3D1%26b%3D2')
  })

  it('round-trips', () => {
    const input = 'foo bar?baz=1&q=hello world'
    expect(urlDecode(urlEncode(input))).toBe(input)
  })
})

describe('JWT', () => {
  it('decodes a valid JWT', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const result = decodeJwt(token)
    expect(result.header.alg).toBe('HS256')
    expect(result.payload.sub).toBe('1234567890')
    expect(result.payload.name).toBe('John Doe')
  })

  it('throws on invalid JWT', () => {
    expect(() => decodeJwt('not.a.valid')).toThrow()
    expect(() => decodeJwt('only-one-part')).toThrow()
  })
})

describe('UUID', () => {
  it('generates valid UUID v4', () => {
    const uuid = generateUUID()
    expect(validateUUID(uuid)).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    expect(validateUUID('not-a-uuid')).toBe(false)
    expect(validateUUID('')).toBe(false)
  })
})

describe('NanoID', () => {
  it('generates correct length', () => {
    expect(generateNanoId(10)).toHaveLength(10)
    expect(generateNanoId(21)).toHaveLength(21)
    expect(generateNanoId()).toHaveLength(21)
  })

  it('uses valid characters', () => {
    const id = generateNanoId(100)
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('ObjectId', () => {
  it('generates 24-character hex', () => {
    const id = generateObjectId()
    expect(id).toMatch(/^[0-9a-f]{24}$/)
  })

  it('parses timestamp from ObjectId', () => {
    const id = generateObjectId()
    const parsed = parseObjectId(id)
    const now = Date.now()
    expect(Math.abs(parsed.timestamp.getTime() - now)).toBeLessThan(5000)
  })

  it('throws on invalid ObjectId', () => {
    expect(() => parseObjectId('xyz')).toThrow('Invalid ObjectId format')
  })
})
