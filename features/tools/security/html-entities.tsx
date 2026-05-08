'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const EXAMPLE =
  '<h1>Hello & "World"</h1>\n<p>5 > 3 & 2 < 4</p>\n<p>It\'s a test</p>'

function encodeEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (full, h) => {
      const cp = parseInt(h, 16)
      if (!Number.isFinite(cp) || cp < 0) return full
      try {
        return String.fromCodePoint(cp)
      } catch {
        return full
      }
    })
    .replace(/&#(\d+);/g, (full, n) => {
      const cp = parseInt(n, 10)
      if (!Number.isFinite(cp) || cp < 0) return full
      try {
        return String.fromCodePoint(cp)
      } catch {
        return full
      }
    })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

export function HtmlEntitiesEncoder() {
  const [input, setInput] = useState(EXAMPLE)
  const [encodeMode, setEncodeMode] = useState(true)

  const { output, error } = useMemo(() => {
    try {
      return {
        output: encodeMode ? encodeEntities(input) : decodeEntities(input),
        error: null as string | null,
      }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, encodeMode])

  return (
    <ToolShell toolId="html-entities-encode">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-background-secondary px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="entity-mode" className="text-sm font-medium">
              Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              {encodeMode ? 'Encoding special characters to HTML entities' : 'Decoding entities back to text'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${encodeMode ? 'font-medium' : 'text-muted-foreground'}`}>Encode</span>
            <Switch
              id="entity-mode"
              checked={!encodeMode}
              onCheckedChange={(c) => setEncodeMode(!c)}
              aria-label={encodeMode ? 'Switch to decode mode' : 'Switch to encode mode'}
            />
            <span className={`text-sm ${!encodeMode ? 'font-medium' : 'text-muted-foreground'}`}>Decode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="html"
            title={encodeMode ? 'Plain text / markup' : 'Encoded HTML'}
            minHeight="320px"
          />
          <OutputPanel
            value={output}
            language={encodeMode ? 'html' : 'plaintext'}
            title={encodeMode ? 'Encoded' : 'Decoded'}
            status={error ? 'error' : output ? 'success' : 'idle'}
            errorMessage={error || undefined}
            minHeight="320px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
