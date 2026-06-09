import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor, rateContrast, relativeLuminance } from '@/utils/colors'

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 5)
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 1)
  })

  it('is symmetric', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(contrastRatio(BLACK, WHITE), 5)
  })

  it('is 1 for identical colors', () => {
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5)
  })
})

describe('rateContrast', () => {
  it('passes all tiers for black on white', () => {
    const r = rateContrast(BLACK, WHITE)
    expect(r.aaNormal).toBe(true)
    expect(r.aaaNormal).toBe(true)
    expect(r.aaLarge).toBe(true)
  })

  it('fails normal AA for a low-contrast gray pair', () => {
    const fg = parseColor('#777777')!
    const bg = parseColor('#999999')!
    const r = rateContrast(fg, bg)
    expect(r.aaNormal).toBe(false)
  })
})
