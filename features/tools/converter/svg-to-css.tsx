'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Demo">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="16" fill="#0f172a"/>
  <circle cx="60" cy="60" r="36" fill="url(#g)"/>
  <circle cx="60" cy="60" r="22" fill="#0f172a" opacity="0.35"/>
</svg>`

function buildDataUri(svg: string): string {
  const compact = svg.replace(/\s+/g, ' ').trim()
  const encoded = encodeURIComponent(compact)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
  return `data:image/svg+xml,${encoded}`
}

export function SvgToCss() {
  const [input, setInput] = useState(EXAMPLE)

  const { dataUri, cssBlock, imgHtml, error } = useMemo(() => {
    const t = input.trim()
    if (!t) {
      return { dataUri: '', cssBlock: '', imgHtml: '', error: null as string | null }
    }
    try {
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml')
      const err = doc.querySelector('parsererror')
      if (err) throw new Error(err.textContent?.trim() || 'Invalid SVG')
      const uri = buildDataUri(t)
      const css = [
        '/* CSS background */',
        `.icon {`,
        `  background-image: url("${uri}");`,
        `  background-repeat: no-repeat;`,
        `  background-position: center;`,
        `  background-size: contain;`,
        `  width: 120px;`,
        `  height: 120px;`,
        `}`,
        '',
        '/* Inline style (one-liner) */',
        `background-image: url("${uri}");`,
      ].join('\n')
      const img = `<img src="${uri}" alt="" width="120" height="120" />`
      return { dataUri: uri, cssBlock: css, imgHtml: img, error: null }
    } catch (e) {
      return { dataUri: '', cssBlock: '', imgHtml: '', error: (e as Error).message }
    }
  }, [input])

  const output = useMemo(() => {
    if (!dataUri && !error) return ''
    if (error) return ''
    return [`Data URI (raw):`, dataUri, ``, cssBlock, ``, `HTML <img>:`, imgHtml].join('\n')
  }, [dataUri, cssBlock, imgHtml, error])

  return (
    <ToolShell toolId="svg-to-css">
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 flex-1">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="xml"
            title="SVG"
            minHeight="320px"
          />
          <OutputPanel
            value={output}
            language="css"
            title="Data URI & snippets"
            status={error ? 'error' : output ? 'success' : 'idle'}
            errorMessage={error || undefined}
            minHeight="320px"
          />
        </div>
        {dataUri && !error ? (
          <div className="rounded-lg border border-border bg-background-secondary p-4 flex flex-col sm:flex-row gap-4 items-start">
            <div className="shrink-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Preview
              </p>
              <div className="rounded-md border border-border bg-size-[16px_16px] bg-position-[0_0,0_8px,8px_-8px,-8px_0px] bg-[linear-gradient(45deg,#222_25%,transparent_25%),linear-gradient(-45deg,#222_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#222_75%),linear-gradient(-45deg,transparent_75%,#222_75%)] p-6 flex items-center justify-center">
                <div
                  className="rounded-sm border border-border/60"
                  style={{
                    width: 120,
                    height: 120,
                    backgroundImage: `url("${dataUri}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                  }}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              <p>
                The SVG is URL-encoded for use in CSS <code className="text-foreground">url()</code> and{' '}
                <code className="text-foreground">&lt;img src&gt;</code>. Checkerboard shows transparency.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </ToolShell>
  )
}
