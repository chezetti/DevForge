'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function buildCharset(upper: boolean, lower: boolean, numbers: boolean, symbols: boolean): string {
  let s = ''
  if (upper) s += UPPER
  if (lower) s += LOWER
  if (numbers) s += DIGITS
  if (symbols) s += SYMBOLS
  return s
}

function pickChar(charset: string): string {
  const n = charset.length
  const max = Math.floor(256 / n) * n
  const buf = new Uint8Array(1)
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]!
  } while (x >= max)
  return charset[x % n]!
}

function generatePassword(length: number, charset: string): string {
  if (!charset.length) throw new Error('Select at least one character set')
  return Array.from({ length }, () => pickChar(charset)).join('')
}

function entropyBits(length: number, poolSize: number): number {
  if (poolSize <= 1 || length === 0) return 0
  return length * Math.log2(poolSize)
}

type StrengthLabel = 'Weak' | 'Fair' | 'Strong' | 'Very strong'

function strengthFromBits(bits: number): { label: StrengthLabel; pct: number } {
  if (bits < 28) return { label: 'Weak', pct: Math.min(100, (bits / 28) * 25) }
  if (bits < 44) return { label: 'Fair', pct: 25 + ((bits - 28) / 16) * 25 }
  if (bits < 64) return { label: 'Strong', pct: 50 + ((bits - 44) / 20) * 25 }
  return { label: 'Very strong', pct: Math.min(100, 75 + ((bits - 64) / 32) * 25) }
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')

  const charset = useMemo(
    () => buildCharset(useUpper, useLower, useNumbers, useSymbols),
    [useUpper, useLower, useNumbers, useSymbols],
  )

  const poolSize = charset.length
  const bits = useMemo(() => entropyBits(length, poolSize), [length, poolSize])
  const { label, pct } = useMemo(() => strengthFromBits(bits), [bits])

  const regen = useCallback(() => {
    const c = buildCharset(useUpper, useLower, useNumbers, useSymbols)
    if (!c.length) {
      toast.error('Select at least one character set')
      return
    }
    try {
      setPassword(generatePassword(length, c))
    } catch {
      toast.error('Could not generate password')
    }
  }, [length, useUpper, useLower, useNumbers, useSymbols])

  useEffect(() => {
    if (!charset.length) {
      setPassword('')
      return
    }
    try {
      setPassword(generatePassword(length, charset))
    } catch {
      setPassword('')
    }
  }, [length, charset, useUpper, useLower, useNumbers, useSymbols])

  const barColor =
    label === 'Weak'
      ? 'bg-destructive'
      : label === 'Fair'
        ? 'bg-amber-500'
        : label === 'Strong'
          ? 'bg-emerald-500'
          : 'bg-green-600'

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    toast.success('Password copied')
  }

  return (
    <ToolShell toolId="password-generator" showHistory={false}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg border border-border bg-background-secondary p-4 sm:p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Length: {length}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">8–128</span>
            </div>
            <Slider
              min={8}
              max={128}
              step={1}
              value={[length]}
              onValueChange={(v) => setLength(v[0] ?? 16)}
              aria-label="Password length"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'pg-upper', label: 'Uppercase (A–Z)', checked: useUpper, onChange: setUseUpper },
              { id: 'pg-lower', label: 'Lowercase (a–z)', checked: useLower, onChange: setUseLower },
              { id: 'pg-num', label: 'Numbers (0–9)', checked: useNumbers, onChange: setUseNumbers },
              { id: 'pg-sym', label: 'Symbols', checked: useSymbols, onChange: setUseSymbols },
            ].map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                <Checkbox
                  id={row.id}
                  checked={row.checked}
                  onCheckedChange={(c) => row.onChange(c === true)}
                  aria-label={row.label}
                />
                <Label htmlFor={row.id} className="text-sm font-normal cursor-pointer">
                  {row.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={regen} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!password}
              aria-label="Copy password"
              title="Copy password"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-background p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Generated password
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">~{bits.toFixed(1)} bits entropy</span>
                <span className="hidden sm:inline">·</span>
                <span
                  className={cn(
                    'font-medium',
                    label === 'Weak' && 'text-destructive',
                    label === 'Fair' && 'text-amber-600 dark:text-amber-500',
                    label === 'Strong' && 'text-emerald-600 dark:text-emerald-500',
                    label === 'Very strong' && 'text-green-700 dark:text-green-400',
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
            <p className="font-mono text-sm break-all select-all leading-relaxed">{password || '—'}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Strength</span>
                <span>{label}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full transition-all rounded-full', barColor)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
