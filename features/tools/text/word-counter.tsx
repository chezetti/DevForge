'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { Label } from '@/components/ui/label'

const EXAMPLE =
  'The quick brown fox jumps over the lazy dog.\nPack my box with five dozen liquor jugs.'

const WPM_READ = 200
const WPM_SPEAK = 130

function countStats(text: string) {
  const trimmedEnd = text.replace(/\s+$/, '')
  const words = trimmedEnd.trim() ? trimmedEnd.trim().split(/\s+/).filter(Boolean).length : 0
  const characters = text.length
  const noSpace = text.replace(/\s/g, '').length
  const sentenceMatches = text.match(/[.!?]+(\s|$)/g)
  const sentences = trimmedEnd.trim()
    ? sentenceMatches?.length ?? (words > 0 ? 1 : 0)
    : 0
  const paras = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
  const lines = text.length ? text.split('\n').length : 0
  const readMin = words / WPM_READ
  const speakMin = words / WPM_SPEAK
  return {
    words,
    characters,
    noSpace,
    sentences,
    paragraphs: paras || 0,
    lines,
    readMin,
    speakMin,
  }
}

function formatMinutes(m: number): string {
  if (!m) return '0 min'
  if (m < 1) return `${Math.round(m * 60)} sec`
  const rounded = Math.round(m * 10) / 10
  return `${rounded} min`
}

export function WordCounter() {
  const [input, setInput] = useState(EXAMPLE)
  const s = useMemo(() => countStats(input), [input])

  const rows: { label: string; value: string | number }[] = [
    { label: 'Words', value: s.words },
    { label: 'Characters', value: s.characters },
    { label: 'Characters (no spaces)', value: s.noSpace },
    { label: 'Sentences', value: s.sentences },
    { label: 'Paragraphs', value: s.paragraphs },
    { label: 'Lines', value: s.lines },
    { label: 'Reading time', value: `${formatMinutes(s.readMin)} (~${WPM_READ} wpm)` },
    { label: 'Speaking time', value: `${formatMinutes(s.speakMin)} (~${WPM_SPEAK} wpm)` },
  ]

  return (
    <ToolShell toolId="word-counter" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title="Text"
          minHeight="360px"
        />
        <div className="rounded-lg border border-border bg-background-secondary flex flex-col min-h-[360px]">
          <div className="px-3 py-2 border-b border-border">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Statistics
            </Label>
          </div>
          <div className="p-4 grid gap-3 sm:grid-cols-2 flex-1 content-start">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-md border border-border bg-background p-3 space-y-1"
              >
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-lg font-semibold tabular-nums leading-snug break-words">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
