'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Search } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

const UNICODE_BLOCKS: { start: number; end: number; label: string }[] = [
  { start: 0x0000, end: 0x007f, label: 'Basic Latin' },
  { start: 0x0080, end: 0x00ff, label: 'Latin-1 Supplement' },
  { start: 0x0100, end: 0x017f, label: 'Latin Extended-A' },
  { start: 0x0180, end: 0x024f, label: 'Latin Extended-B' },
  { start: 0x0250, end: 0x02af, label: 'IPA Extensions' },
  { start: 0x0300, end: 0x036f, label: 'Combining Diacritical Marks' },
  { start: 0x0370, end: 0x03ff, label: 'Greek and Coptic' },
  { start: 0x0400, end: 0x04ff, label: 'Cyrillic' },
  { start: 0x0500, end: 0x052f, label: 'Cyrillic Supplement' },
  { start: 0x2000, end: 0x206f, label: 'General Punctuation' },
  { start: 0x2070, end: 0x209f, label: 'Superscripts and Subscripts' },
  { start: 0x20a0, end: 0x20cf, label: 'Currency Symbols' },
  { start: 0x2100, end: 0x214f, label: 'Letterlike Symbols' },
  { start: 0x2150, end: 0x218f, label: 'Number Forms' },
  { start: 0x2190, end: 0x21ff, label: 'Arrows' },
  { start: 0x2200, end: 0x22ff, label: 'Mathematical Operators' },
  { start: 0x2300, end: 0x23ff, label: 'Miscellaneous Technical' },
  { start: 0x2460, end: 0x24ff, label: 'Enclosed Alphanumerics' },
  { start: 0x2500, end: 0x257f, label: 'Box Drawing' },
  { start: 0x2580, end: 0x259f, label: 'Block Elements' },
  { start: 0x25a0, end: 0x25ff, label: 'Geometric Shapes' },
  { start: 0x2600, end: 0x26ff, label: 'Miscellaneous Symbols' },
  { start: 0x2700, end: 0x27bf, label: 'Dingbats' },
  { start: 0x3000, end: 0x303f, label: 'CJK Symbols and Punctuation' },
  { start: 0x3040, end: 0x309f, label: 'Hiragana' },
  { start: 0x30a0, end: 0x30ff, label: 'Katakana' },
  { start: 0x4e00, end: 0x9fff, label: 'CJK Unified Ideographs' },
  { start: 0xac00, end: 0xd7af, label: 'Hangul Syllables' },
  { start: 0x1f300, end: 0x1f5ff, label: 'Misc Symbols and Pictographs' },
  { start: 0x1f600, end: 0x1f64f, label: 'Emoticons' },
  { start: 0x1f680, end: 0x1f6ff, label: 'Transport and Map Symbols' },
  { start: 0x1f700, end: 0x1f77f, label: 'Alchemical Symbols' },
  { start: 0x1f780, end: 0x1f7ff, label: 'Geometric Shapes Extended' },
  { start: 0x1f800, end: 0x1f8ff, label: 'Supplemental Arrows-C' },
  { start: 0x1f900, end: 0x1f9ff, label: 'Supplemental Symbols and Pictographs' },
  { start: 0x1fa00, end: 0x1fa6f, label: 'Chess Symbols' },
  { start: 0x1fa70, end: 0x1faff, label: 'Symbols and Pictographs Extended-A' },
  { start: 0x1fb00, end: 0x1fbff, label: 'Legacy Computing' },
]

const NAMED_CHARS: Record<string, string> = {
  '\n': 'Line feed (newline)',
  '\r': 'Carriage return',
  '\t': 'Horizontal tab',
  ' ': 'Space',
  '\u00a0': 'No-break space',
  '\u200b': 'Zero width space',
  '\u200c': 'Zero width non-joiner',
  '\u200d': 'Zero width joiner',
  '\ufeff': 'Byte order mark (BOM)',
  '©': 'Copyright sign',
  '®': 'Registered sign',
  '™': 'Trade mark sign',
  '§': 'Section sign',
  '¶': 'Pilcrow (paragraph)',
  '…': 'Horizontal ellipsis',
  '–': 'En dash',
  '—': 'Em dash',
  '«': 'Left-pointing double angle quotation',
  '»': 'Right-pointing double angle quotation',
  '€': 'Euro sign',
  '£': 'Pound sign',
  '¥': 'Yen sign',
  '°': 'Degree sign',
  '×': 'Multiplication sign',
  '÷': 'Division sign',
  'π': 'Greek small letter pi',
  '∞': 'Infinity',
  '★': 'Black star',
  '☆': 'White star',
  '☑': 'Ballot box with check',
  '✓': 'Check mark',
  '✗': 'Ballot X',
  '←': 'Leftwards arrow',
  '→': 'Rightwards arrow',
}

function blockForCodePoint(cp: number): string {
  for (const b of UNICODE_BLOCKS) {
    if (cp >= b.start && cp <= b.end) return b.label
  }
  return `Unicode plane / block (U+${cp.toString(16).toUpperCase()})`
}

function utf8Bytes(s: string): number[] {
  return [...new TextEncoder().encode(s)]
}

function utf16Units(cp: number): string {
  if (cp <= 0xffff) {
    return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
  }
  const n = cp - 0x10000
  const lead = 0xd800 + (n >> 10)
  const trail = 0xdc00 + (n & 0x3ff)
  return `U+${lead.toString(16).toUpperCase()} U+${trail.toString(16).toUpperCase()} (surrogate pair)`
}

function parseQuery(raw: string): { codePoints: number[]; error?: string } {
  const t = raw.trim()
  if (!t) return { codePoints: [] }

  const uPlus = t.match(/^(?:U\+|u\+|\\u\+|0x)([0-9a-fA-F]{1,6})(?:\s|$)/)
  if (uPlus) {
    const cp = parseInt(uPlus[1]!, 16)
    if (cp > 0x10ffff) return { codePoints: [], error: 'Code point out of Unicode range' }
    return { codePoints: [cp] }
  }

  const codePoints: number[] = []
  for (const ch of t) {
    codePoints.push(ch.codePointAt(0)!)
    if (ch.codePointAt(0)! >= 0x10000) {
      /* surrogate pair consumes next - for...of handles */
    }
  }

  const dedup: number[] = []
  const seen = new Set<number>()
  for (const cp of codePoints) {
    if (!seen.has(cp)) {
      seen.add(cp)
      dedup.push(cp)
    }
  }
  return { codePoints: dedup.slice(0, 32) }
}

function formatBytes(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}

const QUICK_RANGES = [
  { label: 'Basic Latin', from: 0x20, to: 0x7e },
  { label: 'Latin Extended', from: 0x100, to: 0x17f },
  { label: 'Cyrillic', from: 0x410, to: 0x44f },
  { label: 'Greek', from: 0x391, to: 0x3ce },
  { label: 'Emoji sample', from: 0x1f600, to: 0x1f64f },
]

export function UnicodeLookup() {
  const [query, setQuery] = useState('A')

  const parsed = useMemo(() => parseQuery(query), [query])

  const rows = useMemo(() => {
    if (parsed.error || parsed.codePoints.length === 0) return []
    return parsed.codePoints.map((cp) => {
      let char: string
      try {
        char = String.fromCodePoint(cp)
      } catch {
        char = '�'
      }
      const bytes = utf8Bytes(char)
      const hex = `U+${cp.toString(16).toUpperCase().padStart(cp > 0xffff ? 6 : 4, '0')}`
      const named = NAMED_CHARS[char] ?? `Unicode ${blockForCodePoint(cp)}`
      return {
        cp,
        char,
        hex,
        utf8: formatBytes(bytes),
        utf16: utf16Units(cp),
        description: named,
        block: blockForCodePoint(cp),
      }
    })
  }, [parsed])

  const handleCopy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(msg)
  }

  return (
    <ToolShell toolId="unicode-lookup">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <Label htmlFor="unicode-search">Character or code point</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                id="unicode-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paste a character, or type U+A78D, 0x1F600…"
                className="pl-9 font-mono"
                aria-describedby="unicode-hint"
              />
            </div>
          </div>
          <p id="unicode-hint" className="text-xs text-muted-foreground">
            Paste any character or enter a code point. Multiple characters are deduplicated (max 32).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_RANGES.map((r) => (
            <Button
              key={r.label}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setQuery(String.fromCodePoint(r.from))}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {parsed.error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {parsed.error}
          </div>
        )}

        {rows.length > 0 && (
          <ScrollArea className="h-[min(480px,50vh)] rounded-lg border border-border">
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div key={row.cp} className="p-4 grid gap-3 sm:grid-cols-[auto_1fr]">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-3xl leading-none border border-border"
                    title={row.char}
                  >
                    {row.char}
                  </div>
                  <div className="space-y-2 text-sm min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{row.hex}</code>
                      <span className="text-xs text-muted-foreground">{row.block}</span>
                    </div>
                    <p className="text-muted-foreground">{row.description}</p>
                    <div className="grid gap-1 font-mono text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">UTF-8: </span>
                        {row.utf8}
                      </div>
                      <div>
                        <span className="text-muted-foreground">UTF-16: </span>
                        {row.utf16}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleCopy(row.char, 'Character copied')}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy character
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleCopy(row.hex, 'Code point copied')}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy code point
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </ToolShell>
  )
}
