'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseColor, toHex, toHsl, type ColorValues } from '@/utils/colors'

function hslToRgb(h: number, s: number, l: number): ColorValues {
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
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
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

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

type PaletteKind = 'complementary' | 'analogous' | 'triadic' | 'split' | 'mono'

function buildPalette(base: ColorValues, kind: PaletteKind): ColorValues[] {
  const { h, s, l } = toHsl(base)
  switch (kind) {
    case 'complementary':
      return [base, hslToRgb(normalizeHue(h + 180), s, l)]
    case 'analogous':
      return [
        hslToRgb(normalizeHue(h - 30), s, l),
        base,
        hslToRgb(normalizeHue(h + 30), s, l),
      ]
    case 'triadic':
      return [base, hslToRgb(normalizeHue(h + 120), s, l), hslToRgb(normalizeHue(h + 240), s, l)]
    case 'split': {
      const comp = h + 180
      return [base, hslToRgb(normalizeHue(comp - 30), s, l), hslToRgb(normalizeHue(comp + 30), s, l)]
    }
    case 'mono':
      return [
        hslToRgb(h, s, Math.max(8, l - 24)),
        hslToRgb(h, Math.max(12, s - 18), l),
        base,
        hslToRgb(h, Math.min(100, s + 15), Math.min(92, l + 12)),
        hslToRgb(h, s, Math.min(96, l + 22)),
      ]
    default:
      return [base]
  }
}

export function ColorPaletteGenerator() {
  const [hexInput, setHexInput] = useState('#6366f1')
  const [copied, setCopied] = useState<string | null>(null)

  const baseRgb = useMemo(() => parseColor(hexInput), [hexInput])

  const palettes = useMemo(() => {
    if (!baseRgb) return null
    return {
      complementary: buildPalette(baseRgb, 'complementary'),
      analogous: buildPalette(baseRgb, 'analogous'),
      triadic: buildPalette(baseRgb, 'triadic'),
      split: buildPalette(baseRgb, 'split'),
      mono: buildPalette(baseRgb, 'mono'),
    }
  }, [baseRgb])

  const tailwindConfigSnippet = useMemo(() => {
    if (!palettes) return ''
    const colorMap = Object.fromEntries(
      Object.entries(palettes).flatMap(([name, colors]) =>
        colors.map((c, j) => [`palette-${name}-${j + 1}`, toHex(c)]),
      ),
    )
    return [
      "/** @type {import('tailwindcss').Config} */",
      'module.exports = {',
      '  theme: {',
      '    extend: {',
      `      colors: ${JSON.stringify(colorMap, null, 2).split('\n').join('\n      ')},`,
      '    },',
      '  },',
      '}',
    ].join('\n')
  }, [palettes])

  const exportCss = useMemo(() => {
    if (!palettes || !baseRgb) return ''
    const lines: string[] = [':root {']
    for (const [name, colors] of Object.entries(palettes)) {
      colors.forEach((c, j) => {
        lines.push(`  --palette-${name}-${j + 1}: ${toHex(c)};`)
      })
    }
    lines.push('}')
    return lines.join('\n')
  }, [palettes, baseRgb])

  const copyHex = useCallback(async (hex: string, id: string) => {
    await navigator.clipboard.writeText(hex)
    setCopied(id)
    toast.success('Hex copied')
    setTimeout(() => setCopied(null), 1200)
  }, [])

  const copyExport = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  }, [])

  const displayHex = baseRgb ? toHex(baseRgb) : ''

  return (
    <ToolShell toolId="color-palette-generator">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="base-color-hex">Base color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="base-color-hex"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                className="font-mono w-44"
                placeholder="#6366f1"
              />
              <input
                type="color"
                value={displayHex || '#000000'}
                onChange={(e) => setHexInput(e.target.value)}
                className="h-9 w-12 rounded-md cursor-pointer border border-border"
                aria-label="Pick base color"
              />
            </div>
          </div>
          {baseRgb && (
            <div className="text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{toHex(baseRgb)}</span>
              <span className="mx-2">·</span>
              rgb({baseRgb.r}, {baseRgb.g}, {baseRgb.b})
            </div>
          )}
        </div>

        {!baseRgb && hexInput.trim() ? (
          <p className="text-sm text-destructive">Unrecognized color — try #hex or rgb()</p>
        ) : palettes ? (
          <>
            <div className="grid gap-6">
              {(
                [
                  ['complementary', 'Complementary'],
                  ['analogous', 'Analogous'],
                  ['triadic', 'Triadic'],
                  ['split', 'Split complementary'],
                  ['mono', 'Monochromatic (shades & tints)'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <h3 className="text-sm font-medium">{label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {palettes[key].map((c, idx) => {
                      const hex = toHex(c)
                      const id = `${key}-${idx}`
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => copyHex(hex, id)}
                          aria-label={`Copy ${hex}`}
                          className="group flex flex-col rounded-lg border border-border overflow-hidden w-24 sm:w-28 shadow-sm hover:ring-2 hover:ring-primary/40 transition-all text-left"
                        >
                          <div
                            className="h-14 w-full"
                            style={{ backgroundColor: hex }}
                            aria-hidden
                          />
                          <div className="p-2 bg-card text-[10px] font-mono">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 space-y-0.5 flex-1">
                                <div className="truncate font-semibold">{hex}</div>
                                <div className="truncate text-muted-foreground text-[9px]">
                                  rgb({c.r}, {c.g}, {c.b})
                                </div>
                              </div>
                              {copied === id ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" aria-hidden />
                              ) : (
                                <Copy className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 mt-0.5" aria-hidden />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Tabs defaultValue="css" className="w-full">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="css">CSS variables</TabsTrigger>
                <TabsTrigger value="tw">Tailwind-style</TabsTrigger>
              </TabsList>
              <TabsContent value="css" className="mt-3 space-y-2">
                <pre className="text-xs font-mono rounded-lg border border-border p-3 max-h-56 overflow-auto bg-background-secondary">
                  {exportCss}
                </pre>
                <Button variant="outline" size="sm" onClick={() => copyExport(exportCss)}>
                  Copy CSS
                </Button>
              </TabsContent>
              <TabsContent value="tw" className="mt-3 space-y-2">
                <pre className="text-xs font-mono rounded-lg border border-border p-3 max-h-56 overflow-auto bg-background-secondary">
                  {tailwindConfigSnippet}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyExport(tailwindConfigSnippet)}
                  >
                    Copy tailwind.config.js (extend)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyExport(
                        JSON.stringify(
                          Object.fromEntries(
                            Object.entries(palettes).flatMap(([name, colors]) =>
                              colors.map((c, j) => [`palette-${name}-${j + 1}`, toHex(c)]),
                            ),
                          ),
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    Copy colors JSON only
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </ToolShell>
  )
}
