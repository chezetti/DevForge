'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const PRESETS: Record<string, string[]> = {
  node: ['node_modules/', '.next/', 'dist/', 'build/', '.env', '.env.local', 'coverage/', 'npm-debug.log*'],
  python: ['__pycache__/', '*.py[cod]', '.venv/', 'venv/', '.env', '.pytest_cache/', 'dist/', 'build/'],
  go: ['bin/', 'pkg/', '*.test', '*.out', '.env', '.idea/', '.vscode/'],
  rust: ['target/', 'Cargo.lock', '.env', '.idea/', '.vscode/'],
}

export function GitignoreGenerator() {
  const [stack, setStack] = useState('node')
  const [includeEditor, setIncludeEditor] = useState(true)
  const [includeOs, setIncludeOs] = useState(true)
  const [includeLogs, setIncludeLogs] = useState(true)

  const output = useMemo(() => {
    const lines = [...(PRESETS[stack] || PRESETS.node)]
    if (includeEditor) lines.push('.idea/', '.vscode/')
    if (includeOs) lines.push('.DS_Store', 'Thumbs.db')
    if (includeLogs) lines.push('*.log', 'logs/')
    return Array.from(new Set(lines)).join('\n')
  }, [stack, includeEditor, includeOs, includeLogs])

  return (
    <ToolShell toolId="gitignore-generator" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="space-y-2">
            <Label>Project stack</Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeEditor} onCheckedChange={(v) => setIncludeEditor(Boolean(v))} />
              Include editor folders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeOs} onCheckedChange={(v) => setIncludeOs(Boolean(v))} />
              Include OS artifacts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeLogs} onCheckedChange={(v) => setIncludeLogs(Boolean(v))} />
              Include log files
            </label>
          </div>
        </div>
        <OutputPanel value={output} language="text" title=".gitignore" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
