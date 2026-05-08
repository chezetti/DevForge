'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EXAMPLE_TEXT = 'Hello World'

const EXAMPLE_BINARY =
  '01001000 01100101 01101100 01101100 01101111 00100000 01010111 01101111 01110010 01101100 01100100'

type Mode = 'text-to-binary' | 'binary-to-text'

function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return [...bytes].map((b) => b.toString(2).padStart(8, '0')).join(' ')
}

function binaryToText(binary: string): string {
  const tokens = binary
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return ''
  const bytes: number[] = []
  for (const t of tokens) {
    if (!/^[01]{1,32}$/.test(t)) {
      throw new Error(`Invalid binary chunk: "${t}" (use 0/1 only)`)
    }
    if (t.length % 8 !== 0) {
      throw new Error(`Chunk "${t}" must use groups of 8 bits (got ${t.length})`)
    }
    for (let i = 0; i < t.length; i += 8) {
      bytes.push(parseInt(t.slice(i, i + 8), 2))
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8')
  }
}

export function BinaryText() {
  const [mode, setMode] = useState<Mode>('text-to-binary')
  const [input, setInput] = useState(EXAMPLE_TEXT)

  const handleModeChange = (v: string) => {
    const next = v as Mode
    setMode(next)
    setInput(next === 'text-to-binary' ? EXAMPLE_TEXT : EXAMPLE_BINARY)
  }

  const { output, error } = useMemo(() => {
    if (!input && mode === 'text-to-binary') return { output: '', error: null as string | null }
    if (!input.trim() && mode === 'binary-to-text') return { output: '', error: null as string | null }
    try {
      if (mode === 'text-to-binary') {
        return { output: textToBinary(input), error: null }
      }
      return { output: binaryToText(input), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, mode])

  return (
    <ToolShell
      toolId="binary-text"
      actions={
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="h-8 bg-background">
            <TabsTrigger value="text-to-binary" className="text-xs h-6 px-2.5">
              Text → Binary
            </TabsTrigger>
            <TabsTrigger value="binary-to-text" className="text-xs h-6 px-2.5">
              Binary → Text
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title={mode === 'text-to-binary' ? 'Text' : 'Binary'}
          placeholder={
            mode === 'text-to-binary' ? 'Type or paste text…' : 'Space-separated bytes, e.g. 01001000 01100101…'
          }
          minHeight="360px"
        />
        <OutputPanel
          value={output}
          language="plaintext"
          title={mode === 'text-to-binary' ? 'Binary (8-bit, spaced)' : 'Text (UTF-8)'}
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
