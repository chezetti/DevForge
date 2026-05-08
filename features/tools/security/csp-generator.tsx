'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DirectiveField {
  id: string
  label: string
  hasSources: boolean
  placeholder?: string
}

const DIRECTIVES: DirectiveField[] = [
  { id: 'default-src', label: 'default-src', hasSources: true, placeholder: "'self'" },
  { id: 'script-src', label: 'script-src', hasSources: true, placeholder: "'self' https://cdn.example.com" },
  { id: 'style-src', label: 'style-src', hasSources: true, placeholder: "'self' 'unsafe-inline'" },
  { id: 'img-src', label: 'img-src', hasSources: true, placeholder: "'self' data: https:" },
  { id: 'font-src', label: 'font-src', hasSources: true, placeholder: "'self' https://fonts.gstatic.com" },
  { id: 'connect-src', label: 'connect-src', hasSources: true, placeholder: "'self' https://api.example.com" },
  { id: 'frame-src', label: 'frame-src', hasSources: true, placeholder: "'self'" },
  { id: 'media-src', label: 'media-src', hasSources: true, placeholder: "'self'" },
  { id: 'object-src', label: 'object-src', hasSources: true, placeholder: "'none'" },
  { id: 'base-uri', label: 'base-uri', hasSources: true, placeholder: "'self'" },
  { id: 'form-action', label: 'form-action', hasSources: true, placeholder: "'self'" },
  { id: 'frame-ancestors', label: 'frame-ancestors', hasSources: true, placeholder: "'none'" },
]

const BOOL_DIRECTIVES = [
  { id: 'upgrade-insecure-requests', label: 'upgrade-insecure-requests' },
  { id: 'block-all-mixed-content', label: 'block-all-mixed-content' },
] as const

const SOURCE_QUICK = [`'self'`, `'none'`, `'unsafe-inline'`, `'unsafe-eval'`, `'strict-dynamic'`, `'wasm-unsafe-eval'`, 'https:', 'data:', 'blob:']

function buildCsp(
  enabled: Record<string, boolean>,
  sources: Record<string, string>,
  boolOn: Record<string, boolean>,
): string {
  const parts: string[] = []
  for (const d of DIRECTIVES) {
    if (!enabled[d.id]) continue
    if (!d.hasSources) continue
    const src = sources[d.id]?.trim()
    if (src) parts.push(`${d.id} ${src}`)
  }
  for (const d of BOOL_DIRECTIVES) {
    if (boolOn[d.id]) parts.push(d.id)
  }
  return parts.join('; ')
}

export function CspGenerator() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    for (const d of DIRECTIVES) o[d.id] = d.id === 'default-src' || d.id === 'script-src'
    return o
  })
  const [sources, setSources] = useState<Record<string, string>>(() => ({
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'font-src': "'self' https:",
    'connect-src': "'self'",
    'frame-src': "'self'",
    'media-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
  }))
  const [boolOn, setBoolOn] = useState<Record<string, boolean>>({
    'upgrade-insecure-requests': false,
    'block-all-mixed-content': false,
  })

  const headerValue = useMemo(() => buildCsp(enabled, sources, boolOn), [enabled, sources, boolOn])
  const metaTag = useMemo(
    () => `<meta http-equiv="Content-Security-Policy" content="${headerValue.replace(/"/g, '&quot;')}">`,
    [headerValue],
  )

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(msg)
  }

  return (
    <ToolShell toolId="csp-generator">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <ScrollArea className="h-[min(70vh,640px)] pr-4">
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">Directive sources</h2>
              <p className="text-xs text-muted-foreground">
                Toggle directives and list space-separated sources. Use &apos;self&apos;, URLs,{' '}
                <code className="text-[10px]">'nonce-…'</code>, <code className="text-[10px]">'sha256-…'</code>, etc.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_QUICK.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-mono"
                    onClick={() =>
                      void copy(s, 'Source token copied — paste into a directive field')
                    }
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </section>

            <div className="space-y-4">
              {DIRECTIVES.map((d) => (
                <div key={d.id} className="rounded-lg border border-border p-3 space-y-2 bg-background-secondary/40">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`csp-${d.id}`}
                      checked={enabled[d.id] ?? false}
                      onCheckedChange={(v) =>
                        setEnabled((prev) => ({ ...prev, [d.id]: v === true }))
                      }
                      aria-label={`Enable ${d.label}`}
                    />
                    <Label htmlFor={`csp-${d.id}`} className="font-mono text-sm cursor-pointer">
                      {d.label}
                    </Label>
                  </div>
                  <Input
                    className="font-mono text-xs"
                    disabled={!enabled[d.id]}
                    placeholder={d.placeholder}
                    value={sources[d.id] ?? ''}
                    onChange={(e) =>
                      setSources((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    aria-label={`${d.label} sources`}
                  />
                </div>
              ))}
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-medium">Boolean directives</h2>
              {BOOL_DIRECTIVES.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`csp-bool-${d.id}`}
                    checked={boolOn[d.id] ?? false}
                    onCheckedChange={(v) =>
                      setBoolOn((prev) => ({ ...prev, [d.id]: v === true }))
                    }
                    aria-label={`Enable ${d.label}`}
                  />
                  <Label htmlFor={`csp-bool-${d.id}`} className="font-mono text-sm cursor-pointer">
                    {d.label}
                  </Label>
                </div>
              ))}
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-4 min-h-0">
          <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Header value</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!headerValue}
                onClick={() => void copy(headerValue, 'CSP header value copied')}
                aria-label="Copy CSP header value"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground bg-muted/30 rounded-md p-3 border border-border">
              Content-Security-Policy: {headerValue || '(empty)'}
            </pre>
          </div>

          <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta tag</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void copy(metaTag, 'Meta tag copied')}
                aria-label="Copy CSP meta tag"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy tag
              </Button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground bg-muted/30 rounded-md p-3 border border-border">
              {metaTag}
            </pre>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
