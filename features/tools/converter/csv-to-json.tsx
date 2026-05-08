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

const EXAMPLE = `name,age,city,notes
Alice,30,"New York, NY","Says ""hello"""
Bob,25,Los Angeles,
Eve,35,Chicago,"Line one
line two"`

type DelimId = 'comma' | 'tab' | 'semicolon' | 'pipe'

const DELIMS: Record<DelimId, string> = {
  comma: ',',
  tab: '\t',
  semicolon: ';',
  pipe: '|',
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

function parseCsv(text: string, delimiter: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0]!, delimiter).map((h) => h.trim())
  if (headers.length === 0 || !headers[0]) {
    throw new Error('CSV must have a header row')
  }

  const rows: Record<string, string>[] = []
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]!, delimiter)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return rows
}

export function CsvToJson() {
  const [input, setInput] = useState(EXAMPLE)
  const [delimiter, setDelimiter] = useState<DelimId>('comma')

  const delimChar = DELIMS[delimiter]

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      const rows = parseCsv(input, delimChar)
      return { output: JSON.stringify(rows, null, 2), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, delimChar])

  return (
    <ToolShell
      toolId="csv-to-json"
      actions={
        <div className="flex items-center gap-2">
          <Label htmlFor="csv-delim" className="text-xs text-muted-foreground whitespace-nowrap">
            Delimiter
          </Label>
          <Select value={delimiter} onValueChange={(v) => setDelimiter(v as DelimId)}>
            <SelectTrigger id="csv-delim" size="sm" className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comma">Comma</SelectItem>
              <SelectItem value="tab">Tab</SelectItem>
              <SelectItem value="semicolon">Semicolon</SelectItem>
              <SelectItem value="pipe">Pipe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title="CSV"
          minHeight="360px"
        />
        <OutputPanel
          value={output}
          language="json"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
