'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

const EXAMPLE = `The quick brown fox jumps over the lazy dog.

Design is not just what it looks like — design is how it works. Good tools remove friction.`

const WPM_READ = 200
const WPM_SPEAK = 130

function analyze(text: string) {
  const trimmedEnd = text.replace(/\s+$/, '')
  const wordsArr = trimmedEnd.trim() ? trimmedEnd.trim().split(/\s+/).filter(Boolean) : []
  const words = wordsArr.length
  const characters = text.length
  const noSpace = text.replace(/\s/g, '').length
  const sentenceMatches = text.match(/[.!?]+(\s|$)/g)
  const sentences = trimmedEnd.trim()
    ? sentenceMatches?.length ?? (words > 0 ? 1 : 0)
    : 0
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
  const lines = text.length ? text.split('\n').length : 0
  const unique = new Set(wordsArr.map((w) => w.toLowerCase().replace(/[^a-z0-9']/gi, ''))).size
  const letterWords = wordsArr.filter((w) => /[a-zA-Z]/.test(w))
  const avgWordLen =
    letterWords.length > 0
      ? letterWords.reduce((acc, w) => acc + w.replace(/[^a-zA-Z]/g, '').length, 0) /
        letterWords.length
      : 0
  const readMin = words / WPM_READ
  const speakMin = words / WPM_SPEAK

  const wordFreq = new Map<string, number>()
  for (const w of wordsArr) {
    const k = w.toLowerCase().replace(/[^a-z0-9']+/gi, '')
    if (!k) continue
    wordFreq.set(k, (wordFreq.get(k) ?? 0) + 1)
  }
  const topWords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const charFreq = new Map<string, number>()
  const compact = text.replace(/\s/g, '')
  for (const ch of compact) {
    charFreq.set(ch, (charFreq.get(ch) ?? 0) + 1)
  }
  const topChars = [...charFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  const charFreqAll = new Map<string, number>()
  for (const ch of text) {
    const label = ch === ' ' ? 'space' : ch === '\n' ? '↵' : ch === '\t' ? '→' : ch
    charFreqAll.set(label, (charFreqAll.get(label) ?? 0) + 1)
  }
  const topCharsAll = [...charFreqAll.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return {
    words,
    characters,
    noSpace,
    sentences,
    paragraphs,
    lines,
    unique,
    avgWordLen,
    readMin,
    speakMin,
    topWords,
    topChars,
    topCharsAll,
    maxWordCount: topWords[0]?.[1] ?? 1,
    maxCharCount: topChars[0]?.[1] ?? 1,
    maxCharAllCount: topCharsAll[0]?.[1] ?? 1,
  }
}

function formatMinutes(m: number): string {
  if (!m) return '0 min'
  if (m < 1) return `${Math.round(m * 60)} sec`
  return `${Math.round(m * 10) / 10} min`
}

function FreqBar({
  label,
  count,
  max,
  wide,
}: {
  label: string
  count: number
  max: number
  wide?: boolean
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className={wide ? 'space-y-0.5' : ''}>
      <div className="flex justify-between text-[11px] font-mono gap-2">
        <span className="truncate text-muted-foreground" title={label}>
          {label}
        </span>
        <span>{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/80 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function TextAnalyzer() {
  const [input, setInput] = useState(EXAMPLE)
  const a = useMemo(() => analyze(input), [input])

  const statRows: { label: string; value: string }[] = [
    { label: 'Characters', value: String(a.characters) },
    { label: 'Characters (no spaces)', value: String(a.noSpace) },
    { label: 'Words', value: String(a.words) },
    { label: 'Unique words', value: String(a.unique) },
    { label: 'Sentences', value: String(a.sentences) },
    { label: 'Paragraphs', value: String(a.paragraphs) },
    { label: 'Lines', value: String(a.lines) },
    {
      label: 'Avg word length (letters)',
      value: a.avgWordLen ? a.avgWordLen.toFixed(1) : '—',
    },
    {
      label: 'Reading time',
      value: `${formatMinutes(a.readMin)} @ ${WPM_READ} wpm`,
    },
    {
      label: 'Speaking time',
      value: `${formatMinutes(a.speakMin)} @ ${WPM_SPEAK} wpm`,
    },
  ]

  return (
    <ToolShell toolId="text-analyzer">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title="Text"
          minHeight="420px"
        />
        <ScrollArea className="min-h-[420px] rounded-lg border border-border">
          <div className="p-4 space-y-6">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Overview
              </Label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {statRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-md border border-border bg-muted/20 px-3 py-2"
                  >
                    <p className="text-[10px] text-muted-foreground leading-tight">{row.label}</p>
                    <p className="text-sm font-semibold tabular-nums">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top 10 words
              </Label>
              <div className="mt-3 space-y-2">
                {a.topWords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No words to count</p>
                ) : (
                  a.topWords.map(([w, c]) => (
                    <FreqBar key={w} label={w} count={c} max={a.maxWordCount} wide />
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Character frequency (excluding spaces)
              </Label>
              <div className="mt-3 space-y-2">
                {a.topChars.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No letters yet</p>
                ) : (
                  a.topChars.map(([ch, c]: [string, number]) => (
                    <FreqBar
                      key={ch}
                      label={ch === ' ' ? 'space' : ch === '\n' ? '\\n' : ch}
                      count={c}
                      max={a.maxCharCount}
                      wide
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Character frequency (all characters, top 20)
              </Label>
              <div className="mt-3 space-y-2">
                {a.topCharsAll.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Empty input</p>
                ) : (
                  a.topCharsAll.map(([ch, c], i) => (
                    <FreqBar key={`all-${i}-${ch}`} label={ch} count={c} max={a.maxCharAllCount} wide />
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </ToolShell>
  )
}
