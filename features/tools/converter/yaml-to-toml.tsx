'use client'

import { useMemo, useState } from 'react'
import { parse as parseYaml } from 'yaml'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { jsObjectToToml } from '@/utils/converters/toml'

const EXAMPLE = `# Service config
server:
  host: localhost
  port: 3000
  tls: true

database:
  name: mydb
  pool_size: 10

features:
  - cache
  - metrics
  - tracing

limits:
  max_connections: 100
  timeout_ms: 5000`

export function YamlToToml() {
  const [input, setInput] = useState(EXAMPLE)
  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      const data = parseYaml(input)
      if (data === undefined) {
        return { output: '', error: null }
      }
      const toml = jsObjectToToml(data)
      return { output: toml, error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="yaml-to-toml">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="yaml"
          title="YAML"
          minHeight="360px"
        />
        <OutputPanel
          value={output}
          language="ini"
          title="TOML"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
