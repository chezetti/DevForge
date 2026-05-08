'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const COMMON = new Set(
  [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'shadow',
    'superman',
    'password1',
    'princess',
    'welcome',
    'admin',
  ].map((s) => s.toLowerCase()),
)

function charsetPoolSize(pwd: string): number {
  let n = 0
  if (/[A-Z]/.test(pwd)) n += 26
  if (/[a-z]/.test(pwd)) n += 26
  if (/[0-9]/.test(pwd)) n += 10
  if (/[^A-Za-z0-9]/.test(pwd)) n += 33
  return n || 1
}

function entropyBits(pwd: string): number {
  const len = pwd.length
  const pool = charsetPoolSize(pwd)
  return len * Math.log2(pool)
}

function sequentialRun(pwd: string): boolean {
  const s = pwd.toLowerCase()
  for (let i = 0; i < s.length - 2; i++) {
    const a = s.charCodeAt(i)
    const b = s.charCodeAt(i + 1)
    const c = s.charCodeAt(i + 2)
    if (b === a + 1 && c === b + 1) return true
  }
  return false
}

function repeatingPattern(pwd: string): boolean {
  const half = Math.floor(pwd.length / 2)
  for (let len = 1; len <= half; len++) {
    if (pwd.length % len !== 0) continue
    const unit = pwd.slice(0, len)
    let built = ''
    for (let k = 0; k < pwd.length / len; k++) built += unit
    if (built === pwd && pwd.length / len >= 2) return true
  }
  return false
}

function crackSeconds(entropyBits: number): number {
  /** Offline attack @ ~10B guessed keys / s (order-of-magnitude). */
  return Math.pow(2, Math.min(entropyBits, 128)) / 1e10
}

function formatCrack(timeSec: number): string {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return 'Instant'
  if (timeSec < 1) return 'Less than a second'
  if (timeSec < 60) return `${Math.round(timeSec)} seconds`
  const min = timeSec / 60
  if (min < 60) return `${min < 10 ? min.toFixed(1) : Math.round(min)} minutes`
  const hr = min / 60
  if (hr < 48) return `${hr < 10 ? hr.toFixed(1) : Math.round(hr)} hours`
  const day = hr / 24
  if (day < 365) return `${day < 10 ? day.toFixed(1) : Math.round(day)} days`
  const yr = day / 365
  if (yr < 1e6) return `${yr < 10 ? yr.toFixed(1) : Math.round(yr)} years`
  if (yr < 1e9) return `${(yr / 1e6).toFixed(1)} million years`
  return `${(yr / 1e9).toFixed(1)} billion years`
}

function analyze(pwd: string) {
  const suggestions: string[] = []
  let penalty = 0

  const lower = pwd.toLowerCase()
  if (pwd.length < 8) {
    suggestions.push('Use at least 8 characters (12+ is better).')
    penalty += 1
  }
  if (pwd.length < 12 && pwd.length >= 8) {
    suggestions.push('Consider increasing length to 12 or more.')
  }
  if (!/[A-Z]/.test(pwd)) suggestions.push('Add uppercase letters.')
  if (!/[a-z]/.test(pwd)) suggestions.push('Add lowercase letters.')
  if (!/[0-9]/.test(pwd)) suggestions.push('Add digits.')
  if (!/[^A-Za-z0-9]/.test(pwd)) suggestions.push('Add symbols for a larger character pool.')

  if (COMMON.has(lower)) {
    suggestions.unshift('This password matches a very common password.')
    penalty += 2
  }
  if (/(.)\1{3,}/.test(pwd)) {
    suggestions.push('Avoid long runs of the same character.')
    penalty += 1
  }
  if (sequentialRun(pwd)) {
    suggestions.push('Avoid sequential characters (e.g. abc, 123).')
    penalty += 1
  }
  if (repeatingPattern(pwd)) {
    suggestions.push('Avoid short patterns repeated across the password.')
    penalty += 1
  }

  const bits = entropyBits(pwd)
  const diversity = new Set(pwd.split('')).size / Math.max(pwd.length, 1)

  if (diversity < 0.4 && pwd.length > 6) {
    suggestions.push('Use more unique characters to improve diversity.')
    penalty += 1
  }

  let score = 0
  if (bits < 20) score = 0
  else if (bits < 32) score = 1
  else if (bits < 48) score = 2
  else if (bits < 68) score = 3
  else score = 4

  score = Math.max(0, Math.min(4, score - penalty))

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']

  return {
    bits,
    score,
    label: labels[score]!,
    crack: formatCrack(crackSeconds(bits)),
    suggestions: Array.from(new Set(suggestions)),
    diversityPct: Math.round(diversity * 100),
  }
}

const EXAMPLE = 'MyP@ssw0rd!2024'

export function PasswordStrength() {
  const [input, setInput] = useState(EXAMPLE)
  const result = useMemo(() => analyze(input), [input])

  const barWidth = (result.score + 1) * 20
  const barColor =
    result.score <= 1
      ? 'bg-destructive'
      : result.score === 2
        ? 'bg-amber-500'
        : result.score === 3
          ? 'bg-emerald-500'
          : 'bg-green-600'

  return (
    <ToolShell toolId="password-strength" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title="Password"
          placeholder="Type or paste a password to analyze…"
          minHeight="320px"
        />
        <div className="flex flex-col gap-4 min-h-0">
          <div className="rounded-lg border border-border bg-background-secondary p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Strength score
                </Label>
                <span className="text-sm font-semibold tabular-nums">{result.score} / 4</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300 rounded-full', barColor)}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className="text-lg font-semibold">{result.label}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-background p-3 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Entropy</p>
                <p className="font-mono tabular-nums">{result.bits.toFixed(1)} bits</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Diversity</p>
                <p className="font-mono tabular-nums">{result.diversityPct}% unique</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3 space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Estimated crack time (offline, ~10¹⁰ guesses/s)
                </p>
                <p className="font-medium leading-snug">{result.crack}</p>
              </div>
            </div>

            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggestions
                </Label>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {result.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
