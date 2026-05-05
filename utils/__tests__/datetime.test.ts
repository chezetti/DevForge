import { describe, it, expect } from 'vitest'
import {
  dateDiff,
  addToDate,
  parseCron,
  parseCronExpression,
} from '../datetime'

describe('dateDiff', () => {
  it('calculates difference between two dates', () => {
    const d1 = new Date('2024-01-01')
    const d2 = new Date('2024-01-31')
    const result = dateDiff(d1, d2)
    expect(result.totalDays).toBe(30)
    expect(result.totalHours).toBe(720)
  })

  it('handles same date', () => {
    const d = new Date('2024-06-15')
    const result = dateDiff(d, d)
    expect(result.totalDays).toBe(0)
    expect(result.totalSeconds).toBe(0)
  })

  it('is symmetric (absolute)', () => {
    const d1 = new Date('2024-01-01')
    const d2 = new Date('2024-03-01')
    const r1 = dateDiff(d1, d2)
    const r2 = dateDiff(d2, d1)
    expect(r1.totalDays).toBe(r2.totalDays)
  })
})

describe('addToDate', () => {
  it('adds days', () => {
    const d = new Date('2024-01-01')
    const result = addToDate(d, 10, 'days')
    expect(result.toISOString().startsWith('2024-01-11')).toBe(true)
  })

  it('adds weeks', () => {
    const d = new Date('2024-01-01')
    const result = addToDate(d, 2, 'weeks')
    expect(result.toISOString().startsWith('2024-01-15')).toBe(true)
  })

  it('adds months', () => {
    const d = new Date('2024-01-15')
    const result = addToDate(d, 3, 'months')
    expect(result.getMonth()).toBe(3) // April
  })

  it('subtracts with negative values', () => {
    const d = new Date('2024-06-15')
    const result = addToDate(d, -1, 'years')
    expect(result.getFullYear()).toBe(2023)
  })
})

describe('parseCron', () => {
  it('parses every minute', () => {
    const result = parseCron('* * * * *')
    expect(result).toContain('every minute')
    expect(result).toContain('every hour')
  })

  it('parses specific time', () => {
    const result = parseCron('30 14 * * *')
    expect(result).toContain('minute 30')
    expect(result).toContain('14:00')
  })

  it('throws on invalid cron', () => {
    expect(() => parseCron('invalid')).toThrow()
  })
})

describe('parseCronExpression', () => {
  it('returns valid for correct expression', () => {
    const result = parseCronExpression('0 0 * * *')
    expect(result.isValid).toBe(true)
    expect(result.humanReadable.length).toBeGreaterThan(0)
  })

  it('returns invalid for bad expression', () => {
    const result = parseCronExpression('bad')
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })
})
