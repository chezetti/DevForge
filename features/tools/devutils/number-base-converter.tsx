'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function parseNumberInput(raw: string): { dec: bigint; valid: true } | { valid: false; message: string } {
  const s = raw.trim()
  if (!s) return { valid: false, message: 'Enter a value' }

  if (/^0b[01_]+$/i.test(s)) {
    const bits = s.slice(2).replace(/_/g, '')
    if (!bits) return { valid: false, message: 'Invalid binary literal' }
    return { valid: true, dec: BigInt('0b' + bits) }
  }
  if (/^0o[0-7_]+$/i.test(s)) {
    const oct = s.slice(2).replace(/_/g, '')
    if (!oct) return { valid: false, message: 'Invalid octal literal' }
    return { valid: true, dec: BigInt('0o' + oct) }
  }
  if (/^0x[0-9a-f_]+$/i.test(s)) {
    const hex = s.slice(2).replace(/_/g, '')
    if (!hex) return { valid: false, message: 'Invalid hex literal' }
    return { valid: true, dec: BigInt('0x' + hex) }
  }

  if (!/^-?\d+$/.test(s)) {
    return { valid: false, message: 'Use decimal digits, or prefix 0b, 0o, 0x' }
  }

  return { valid: true, dec: BigInt(s) }
}

function bigToUnsigned(n: bigint): { bin: string; oct: string; dec: string; hex: string } {
  if (n < BigInt(0)) {
    const mask = (BigInt(1) << BigInt(64)) - BigInt(1)
    n = n & mask
  }
  const dec = n.toString(10)
  const hex = n.toString(16).toUpperCase()
  const oct = n.toString(8)
  const bin = n.toString(2)
  return { bin, oct, dec, hex }
}

export function NumberBaseConverter() {
  const [input, setInput] = useState('255')
  const [copied, setCopied] = useState<string | null>(null)

  const parsed = useMemo(() => parseNumberInput(input), [input])
  const bases = useMemo(() => {
    if (!parsed.valid) return null
    try {
      return bigToUnsigned(parsed.dec)
    } catch {
      return null
    }
  }, [parsed])

  const copy = useCallback(async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied(null), 1200)
  }, [])

  return (
    <ToolShell toolId="number-base-converter" showHistory={false}>
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="num-input">Number (decimal, or 0b / 0o / 0x prefix)</Label>
          <Input
            id="num-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-base"
            placeholder="255, 0b11111111, 0o377, 0xFF"
            spellCheck={false}
          />
        </div>

        {!parsed.valid ? (
          <p className="text-sm text-destructive-foreground">{parsed.message}</p>
        ) : !bases ? (
          <p className="text-sm text-destructive-foreground">Value too large or invalid for display.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['Binary', bases.bin],
                ['Octal', bases.oct],
                ['Decimal', bases.dec],
                ['Hexadecimal', bases.hex],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-background-secondary p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => copy(label, value)}
                  >
                    {copied === label ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="font-mono text-sm break-all text-foreground select-all">{value}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Arbitrary-size integers via <code className="font-mono">BigInt</code>. Negative decimals are
          shown as 64-bit two&apos;s complement bit patterns for binary/octal/hex.
        </p>
      </div>
    </ToolShell>
  )
}
