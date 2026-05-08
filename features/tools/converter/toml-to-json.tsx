'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { parseTomlToJson } from '@/utils/converters/toml'

const EXAMPLE = `# App configuration
[server]
host = "localhost"
port = 3000
tls = true

[database]
name = "mydb"
pool_size = 10

features = ["cache", "metrics", "tracing"]

[limits]
max_connections = 100
timeout_ms = 5000

[meta]
point = { x = 10, y = 20 }`

export function TomlToJson() {
  const [input, setInput] = useState(EXAMPLE)
  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      const obj = parseTomlToJson(input)
      return { output: JSON.stringify(obj, null, 2), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="toml-to-json">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="ini"
          title="TOML"
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
