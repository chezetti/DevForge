'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { base64Encode, base64Decode } from '@/utils/security'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Mode = 'encode' | 'decode'

export function Base64Tool() {
  const tool = getToolById('base64')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const EXAMPLE = 'DevForge API key: demo_12345'

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const convert = useCallback(
    (value: string, currentMode: Mode = mode, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }

      try {
        let result: string
        if (currentMode === 'encode') {
          result = base64Encode(value)
        } else {
          result = base64Decode(value)
        }
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
      }
    },
    [mode, addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    if (autoRun) {
      convert(initial, mode, 'example')
    }
  }, [getToolDraft, tool.id, autoRun, convert, mode])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        convert(value)
      }
    },
    [setToolDraft, tool.id, autoRun, convert]
  )

  const handleModeChange = useCallback(
    (newMode: string) => {
      setMode(newMode as Mode)
      if (autoRun && input) {
        convert(input, newMode as Mode)
      }
    },
    [autoRun, input, convert]
  )

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output)
      setToolDraft(tool.id, output)
      setMode(mode === 'encode' ? 'decode' : 'encode')
      setOutput('')
      setStatus('idle')
    }
  }, [output, mode, setToolDraft, tool.id])

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      convert(historicalInput)
    },
    [setToolDraft, tool.id, convert]
  )

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <div className="flex items-center gap-2">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="h-8 bg-background">
              <TabsTrigger value="encode" className="text-xs h-6 px-2">
                Encode
              </TabsTrigger>
              <TabsTrigger value="decode" className="text-xs h-6 px-2">
                Decode
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            disabled={!output}
            className="h-8 w-8"
            title="Swap input/output"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="plaintext"
          title={mode === 'encode' ? 'Text Input' : 'Base64 Input'}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="plaintext"
          title={mode === 'encode' ? 'Base64 Output' : 'Text Output'}
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
