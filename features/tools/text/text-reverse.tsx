'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const EXAMPLE = 'Hello, World! This is a test.'

type Mode = 'chars' | 'words' | 'lines'

function reverseText(text: string, mode: Mode): string {
  if (mode === 'chars') return [...text].reverse().join('')
  if (mode === 'words')
    return text
      .split('\n')
      .map((line) =>
        line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .reverse()
          .join(' '),
      )
      .join('\n')
  return text.split('\n').reverse().join('\n')
}

export function TextReverse() {
  const [input, setInput] = useState(EXAMPLE)
  const [mode, setMode] = useState<Mode>('chars')

  const output = useMemo(() => reverseText(input, mode), [input, mode])

  return (
    <ToolShell toolId="text-reverse">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-lg border border-border bg-background-secondary p-4">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="rev-mode">Reverse mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger id="rev-mode" aria-label="Reverse mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chars">Characters</SelectItem>
                <SelectItem value="words">Words</SelectItem>
                <SelectItem value="lines">Lines</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="plaintext"
            title="Input"
            minHeight="320px"
          />
          <OutputPanel
            value={output}
            language="plaintext"
            title="Output"
            status={output ? 'success' : 'idle'}
            minHeight="320px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
