'use client'

import { useMemo, useState, useCallback } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const EXAMPLE_ENV = `#PORT=4000
PORT=3000
NODE_ENV=production
FEATURE_FLAG=true
MSG="hello, world"
QUOTED='single line'
EMPTY=

`

function stripEnvComments(line: string): string {
  const idxHash = line.indexOf('#')
  const idxSlash = line.indexOf('//')
  let cut = -1
  if (idxHash >= 0) cut = cut < 0 ? idxHash : Math.min(cut, idxHash)
  if (idxSlash >= 0) cut = cut < 0 ? idxSlash : Math.min(cut, idxSlash)
  return cut >= 0 ? line.slice(0, cut) : line
}

function parseEnvToObject(input: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = input.split(/\n/)
  for (let raw of lines) {
    raw = stripEnvComments(raw).trim()
    if (!raw) continue
    const eq = raw.indexOf('=')
    if (eq <= 0) continue
    const key = raw.slice(0, eq).trim()
    let val = raw.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'")
    }
    out[key] = val
  }
  return out
}

function objectToEnv(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b))
  const lines: string[] = []
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      lines.push(`${k}=${JSON.stringify(v)}`)
    } else if (Array.isArray(v)) {
      lines.push(`${k}=${JSON.stringify(v)}`)
    } else if (v === null || v === undefined) {
      lines.push(`${k}=`)
    } else if (typeof v === 'boolean' || typeof v === 'number') {
      lines.push(`${k}=${v}`)
    } else {
      const s = String(v)
      if (/[\s#"'\\]/.test(s)) {
        lines.push(`${k}="${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
      } else {
        lines.push(`${k}=${s}`)
      }
    }
  }
  return lines.join('\n') + '\n'
}

export function EnvJson() {
  const [envToJson, setEnvToJson] = useState(true)
  const [envText, setEnvText] = useState(EXAMPLE_ENV)
  const [jsonText, setJsonText] = useState(
    () => JSON.stringify(parseEnvToObject(EXAMPLE_ENV), null, 2)
  )

  const { output, error } = useMemo(() => {
    try {
      if (envToJson) {
        const obj = parseEnvToObject(envText)
        return { output: JSON.stringify(obj, null, 2), error: null as string | null }
      }
      const parsed = JSON.parse(jsonText) as Record<string, unknown>
      return { output: objectToEnv(parsed), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [envToJson, envText, jsonText])

  const handleEditorChange = useCallback(
    (v: string) => {
      if (envToJson) setEnvText(v)
      else setJsonText(v)
    },
    [envToJson]
  )

  const inputValue = envToJson ? envText : jsonText
  const inputLang = envToJson ? 'plaintext' : 'json'
  const inputTitle = envToJson ? '.env' : 'JSON'
  const outputLang = envToJson ? 'json' : 'plaintext'
  const outputTitle = envToJson ? 'JSON' : '.env'

  return (
    <ToolShell toolId="env-json">
      <div className="flex flex-col gap-3 h-full min-h-0">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background-secondary px-3 py-2">
          <div className="flex items-center gap-2">
            <Switch id="env-mode" checked={!envToJson} onCheckedChange={(v) => setEnvToJson(!v)} />
            <Label htmlFor="env-mode" className="text-sm cursor-pointer">
              {!envToJson ? 'JSON → .env' : '.env → JSON'}
            </Label>
          </div>
          <span className="text-xs text-muted-foreground">
            Comments (<code className="font-mono">#</code>, <code className="font-mono">//</code>) are
            stripped from .env lines. Quoted values support basic escapes.
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <EditorPanel
            value={inputValue}
            onChange={handleEditorChange}
            language={inputLang}
            title={inputTitle}
          />
          <OutputPanel
            value={output}
            language={outputLang}
            title={outputTitle}
            status={error ? 'error' : output ? 'success' : 'idle'}
            errorMessage={error || undefined}
          />
        </div>
      </div>
    </ToolShell>
  )
}
