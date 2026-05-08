'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const EXAMPLE = 'banana\napple\ncherry\ndate\nelderberry\nfig\ngrape'

export function LineSorter() {
  const [input, setInput] = useState(EXAMPLE)
  const [descending, setDescending] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [unique, setUnique] = useState(false)
  const [reverseLines, setReverseLines] = useState(false)
  const [trimLines, setTrimLines] = useState(false)

  const output = useMemo(() => {
    let lines = input.split('\n')
    if (trimLines) lines = lines.map((l) => l.trim())
    const cmp = (a: string, b: string) =>
      caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase())
    let sorted = [...lines].sort((a, b) => (descending ? -cmp(a, b) : cmp(a, b)))
    if (unique) {
      const seen = new Set<string>()
      sorted = sorted.filter((line) => {
        const key = caseSensitive ? line : line.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    if (reverseLines) sorted.reverse()
    return sorted.join('\n')
  }, [input, descending, caseSensitive, unique, reverseLines, trimLines])

  return (
    <ToolShell toolId="line-sorter">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="ls-desc" className="text-sm font-medium">
                Sort descending
              </Label>
              <p className="text-xs text-muted-foreground">Z → A</p>
            </div>
            <Switch
              id="ls-desc"
              checked={descending}
              onCheckedChange={setDescending}
              aria-label="Sort in descending order"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="ls-case" className="text-sm font-medium">
                Case sensitive
              </Label>
              <p className="text-xs text-muted-foreground">Distinguish A vs a</p>
            </div>
            <Switch
              id="ls-case"
              checked={caseSensitive}
              onCheckedChange={setCaseSensitive}
              aria-label="Case-sensitive sort"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="ls-uniq" className="text-sm font-medium">
                Remove duplicates
              </Label>
              <p className="text-xs text-muted-foreground">Keep first occurrence</p>
            </div>
            <Switch
              id="ls-uniq"
              checked={unique}
              onCheckedChange={setUnique}
              aria-label="Remove duplicate lines"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="ls-rev" className="text-sm font-medium">
                Reverse lines
              </Label>
              <p className="text-xs text-muted-foreground">Flip final order</p>
            </div>
            <Switch
              id="ls-rev"
              checked={reverseLines}
              onCheckedChange={setReverseLines}
              aria-label="Reverse line order after sorting"
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1">
            <div>
              <Label htmlFor="ls-trim" className="text-sm font-medium">
                Trim lines
              </Label>
              <p className="text-xs text-muted-foreground">Strip whitespace per line</p>
            </div>
            <Switch
              id="ls-trim"
              checked={trimLines}
              onCheckedChange={setTrimLines}
              aria-label="Trim each line before sorting"
            />
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
