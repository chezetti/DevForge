'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

function normalizeHex(s: string): string {
  return s.trim().replace(/^0x/i, '').replace(/\s+/g, '')
}

function detectHash(len: number): string {
  if (len === 32) return 'MD5 (likely)'
  if (len === 40) return 'SHA-1 (likely)'
  if (len === 64) return 'SHA-256 (likely)'
  if (len === 96) return 'SHA-384 (likely)'
  if (len === 128) return 'SHA-512 (likely)'
  if (len === 0) return '—'
  return 'Unknown / non-standard length'
}

export function HashComparator() {
  const [a, setA] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  const [b, setB] = useState('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855')

  const na = normalizeHex(a)
  const nb = normalizeHex(b)

  const valid = /^[0-9a-fA-F]*$/.test(na) && /^[0-9a-fA-F]*$/.test(nb)

  const match =
    valid && na.length > 0 && nb.length > 0 && na.toLowerCase() === nb.toLowerCase()

  const info = useMemo(() => {
    if (!valid)
      return {
        a: 'Invalid characters (hex only)',
        b: 'Invalid characters (hex only)',
      }
    return {
      a: detectHash(na.length),
      b: detectHash(nb.length),
    }
  }, [na.length, nb.length, valid])

  const copyBoth = async () => {
    await navigator.clipboard.writeText(`Hash 1: ${a}\nHash 2: ${b}`)
    toast.success('Copied both hashes')
  }

  return (
    <ToolShell toolId="hash-comparator">
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className={cn(
            'rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
            match ? 'border-success/40 bg-success/10' : 'border-border bg-muted/20',
          )}
          role="status"
        >
          <div>
            <p className="text-sm font-medium">
              {na.length === 0 || nb.length === 0
                ? 'Paste two hexadecimal digests to compare.'
                : !valid
                  ? 'Use hexadecimal characters only (0-9, a-f).'
                  : match
                    ? 'Hashes match (case-insensitive).'
                    : 'Hashes do not match.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{info.a} · {info.b}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void copyBoth()}>
            <Copy className="h-4 w-4 mr-2" />
            Copy both
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hash-1">Hash 1</Label>
            <Textarea
              id="hash-1"
              className={cn(
                'font-mono text-xs min-h-[100px]',
                valid && na.length && match === false && nb.length ? 'border-destructive/50' : '',
                valid && match && na.length ? 'border-success/50' : '',
              )}
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Paste MD5 / SHA hex…"
            />
            <p className="text-xs text-muted-foreground">
              {valid ? `${na.length} hex chars — ${info.a}` : '—'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hash-2">Hash 2</Label>
            <Textarea
              id="hash-2"
              className={cn(
                'font-mono text-xs min-h-[100px]',
                valid && nb.length && match === false && na.length ? 'border-destructive/50' : '',
                valid && match && nb.length ? 'border-success/50' : '',
              )}
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="Paste second digest…"
            />
            <p className="text-xs text-muted-foreground">
              {valid ? `${nb.length} hex chars — ${info.b}` : '—'}
            </p>
          </div>
        </div>

        {valid && na.length > 0 && nb.length > 0 && (
          <div className="rounded-lg border border-border bg-background-secondary p-3 overflow-x-auto">
            <p className="text-xs font-mono whitespace-pre-wrap break-all">
              {Array.from({ length: Math.max(na.length, nb.length) }, (_, i) => {
                const ha = na[i]
                const hb = nb[i]
                const same =
                  ha !== undefined &&
                  hb !== undefined &&
                  ha.toLowerCase() === hb.toLowerCase()
                const ch = (ha ?? hb ?? '·') as string
                return (
                  <span
                    key={i}
                    className={cn(
                      ha === undefined || hb === undefined
                        ? 'text-muted-foreground bg-muted/30'
                        : same
                          ? 'text-success-foreground bg-success/15'
                          : 'text-destructive-foreground bg-destructive/15',
                    )}
                  >
                    {ch}
                  </span>
                )
              })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Character-by-character visualization (both strings aligned left; padding shown as spaces).
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  )
}
