'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EXAMPLE_ARABIC = '2024'
const EXAMPLE_ROMAN = 'MMXXIV'

const ROMAN_PAIRS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

function arabicToRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new Error('Arabic number must be an integer from 1 to 3999')
  }
  let x = n
  let out = ''
  for (const [val, sym] of ROMAN_PAIRS) {
    while (x >= val) {
      out += sym
      x -= val
    }
  }
  return out
}

function romanToArabic(s: string): number {
  const t = s.trim().toUpperCase()
  if (!t) throw new Error('Enter a Roman numeral')
  if (!/^[MDCLXVI]+$/.test(t)) {
    throw new Error('Use only I, V, X, L, C, D, M')
  }
  const weight: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 }
  let total = 0
  for (let i = 0; i < t.length; i++) {
    const v = weight[t[i]!]!
    const next = weight[t[i + 1]!] ?? 0
    if (next > v) total -= v
    else total += v
  }
  if (total < 1 || total > 3999) {
    throw new Error('Roman value must represent a number from 1 to 3999')
  }
  if (arabicToRoman(total) !== t) {
    throw new Error('Invalid or non-canonical Roman numeral (e.g. IL, VX, or wrong repeats)')
  }
  return total
}

type Mode = 'arabic-to-roman' | 'roman-to-arabic'

export function RomanNumeral() {
  const [mode, setMode] = useState<Mode>('arabic-to-roman')
  const [input, setInput] = useState(EXAMPLE_ARABIC)

  const handleModeChange = (v: string) => {
    const next = v as Mode
    setMode(next)
    setInput(next === 'arabic-to-roman' ? EXAMPLE_ARABIC : EXAMPLE_ROMAN)
  }

  const { arabic, roman, error } = useMemo(() => {
    const t = input.trim()
    if (!t) return { arabic: null as number | null, roman: null as string | null, error: null as string | null }
    try {
      if (mode === 'arabic-to-roman') {
        if (!/^\d+$/.test(t)) {
          throw new Error('Enter digits only (integer 1–3999)')
        }
        const n = Number.parseInt(t, 10)
        if (t !== String(n)) {
          throw new Error('Remove leading zeros')
        }
        const r = arabicToRoman(n)
        return { arabic: n, roman: r, error: null }
      }
      const n = romanToArabic(t)
      const r = arabicToRoman(n)
      return { arabic: n, roman: r, error: null }
    } catch (e) {
      return { arabic: null, roman: null, error: (e as Error).message }
    }
  }, [input, mode])

  return (
    <ToolShell
      toolId="roman-numeral"
      actions={
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="h-8 bg-background">
            <TabsTrigger value="arabic-to-roman" className="text-xs h-6 px-2.5">
              Arabic → Roman
            </TabsTrigger>
            <TabsTrigger value="roman-to-arabic" className="text-xs h-6 px-2.5">
              Roman → Arabic
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="plaintext"
            title={mode === 'arabic-to-roman' ? 'Arabic (1–3999)' : 'Roman numeral'}
            placeholder={mode === 'arabic-to-roman' ? 'e.g. 2024' : 'e.g. MMXXIV'}
            minHeight="280px"
          />
          <div className="flex flex-col gap-3 min-h-[280px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">
              <div className="rounded-lg border border-border bg-background-secondary flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Arabic
                  </span>
                </div>
                <div className="p-4 flex items-center justify-center flex-1">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-foreground">
                    {error ? '—' : arabic ?? '—'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background-secondary flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Roman
                  </span>
                </div>
                <div className="p-4 flex items-center justify-center flex-1">
                  <span className="text-2xl sm:text-3xl font-mono font-semibold tracking-wider text-foreground break-all text-center">
                    {error ? '—' : roman ?? '—'}
                  </span>
                </div>
              </div>
            </div>
            {error ? (
              <div
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Values are limited to <strong className="font-medium text-foreground">1–3999</strong> (classical Roman
          rules). Switch mode with the tabs above; input always appears in the editor on the left.
        </p>
      </div>
    </ToolShell>
  )
}
