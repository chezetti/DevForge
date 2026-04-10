export interface ColorValues {
  r: number
  g: number
  b: number
}

export interface ColorFormats {
  hex: string
  rgb: ColorValues
  hsl: { h: number; s: number; l: number }
  rgbString: string
  hslString: string
}

export function parseColor(input: string): ColorValues | null {
  const trimmed = input.trim().toLowerCase()

  // Try HEX
  const hexMatch = trimmed.match(/^#?([a-f0-9]{3}|[a-f0-9]{6})$/i)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    const parsed = hexToAll(hex)
    return parsed.rgb
  }

  // Try RGB
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)$/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1])
    const g = parseInt(rgbMatch[2])
    const b = parseInt(rgbMatch[3])
    const parsed = rgbToAll(r, g, b)
    return parsed.rgb
  }

  // Try HSL
  const hslMatch = trimmed.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*[\d.]+)?\s*\)$/)
  if (hslMatch) {
    const h = parseInt(hslMatch[1])
    const s = parseInt(hslMatch[2])
    const l = parseInt(hslMatch[3])
    const parsed = hslToAll(h, s, l)
    return parsed.rgb
  }

  return null
}

function hexToAll(hex: string): ColorFormats {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return rgbToAll(r, g, b)
}

function rgbToAll(r: number, g: number, b: number): ColorFormats {
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  const hsl = rgbToHsl(r, g, b)

  return {
    hex,
    rgb: { r, g, b },
    hsl,
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToAll(h: number, s: number, l: number): ColorFormats {
  const rgb = hslToRgb(h, s, l)
  return rgbToAll(rgb.r, rgb.g, rgb.b)
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

export function toHex(color: ColorValues): string {
  return (
    "#" +
    [color.r, color.g, color.b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  )
}

export function toRgb(color: ColorValues): ColorValues {
  return { ...color }
}

export function toHsl(color: ColorValues): { h: number; s: number; l: number } {
  return rgbToHsl(color.r, color.g, color.b)
}

export function toHsv(color: ColorValues): { h: number; s: number; v: number } {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s: Math.round(s * 100), v: Math.round(v * 100) }
}

export function toCmyk(color: ColorValues): { c: number; m: number; y: number; k: number } {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const k = 1 - Math.max(r, g, b)

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}
