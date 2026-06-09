import { describe, expect, it } from 'vitest'
import { jsonToNdjson, ndjsonToJson } from '@/utils/converters/ndjson'

describe('jsonToNdjson', () => {
  it('emits one compact line per array item', () => {
    const out = jsonToNdjson('[{"a":1},{"b":2}]')
    expect(out).toBe('{"a":1}\n{"b":2}')
  })

  it('wraps a single object as one line', () => {
    expect(jsonToNdjson('{"a":1}')).toBe('{"a":1}')
  })

  it('throws on invalid JSON', () => {
    expect(() => jsonToNdjson('{nope}')).toThrow()
  })
})

describe('ndjsonToJson', () => {
  it('parses lines into a pretty array and ignores blanks', () => {
    const out = ndjsonToJson('{"a":1}\n\n{"b":2}\n')
    expect(JSON.parse(out)).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('reports the failing line number', () => {
    expect(() => ndjsonToJson('{"a":1}\n{bad}')).toThrow(/Line 2/)
  })

  it('round-trips with jsonToNdjson', () => {
    const original = '[{"id":1},{"id":2},{"id":3}]'
    expect(JSON.parse(ndjsonToJson(jsonToNdjson(original)))).toEqual(JSON.parse(original))
  })
})
