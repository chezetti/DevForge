'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'

const EXAMPLE = `<div style="font-family:sans-serif;padding:20px">
  <h1 style="color:#333">Hello World</h1>
  <p>This is a <strong>live</strong> preview.</p>
</div>`

export function HtmlPreview() {
  const [input, setInput] = useState(EXAMPLE)
  const srcDoc = useMemo(() => input, [input])

  return (
    <ToolShell toolId="html-preview" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="html"
          title="Input HTML"
          minHeight="360px"
        />
        <div className="border border-border rounded bg-background-secondary min-h-[360px] overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            Live Preview
          </div>
          <iframe title="HTML preview" srcDoc={srcDoc} className="w-full h-[calc(100%-37px)] bg-white" />
        </div>
      </div>
    </ToolShell>
  )
}
