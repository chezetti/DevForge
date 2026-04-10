'use client'

import { useState, useCallback, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { jsonToYaml, yamlToJson, detectFormat } from '@/utils/parsers/yaml'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Mode = 'json-to-yaml' | 'yaml-to-json'

export function JsonYaml() {
  const tool = getToolById('json-yaml')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const EXAMPLE = `{
  "service": "billing",
  "enabled": true,
  "retries": 3,
  "tags": ["api", "payments"]
}`

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('json-to-yaml')
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
        if (currentMode === 'json-to-yaml') {
          result = jsonToYaml(value)
        } else {
          result = yamlToJson(value)
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

      // Auto-detect format
      const detected = detectFormat(value)
      if (detected === 'json' && mode !== 'json-to-yaml') {
        setMode('json-to-yaml')
      } else if (detected === 'yaml' && mode !== 'yaml-to-json') {
        setMode('yaml-to-json')
      }

      if (autoRun) {
        convert(value, detected === 'json' ? 'json-to-yaml' : detected === 'yaml' ? 'yaml-to-json' : mode)
      }
    },
    [setToolDraft, tool.id, autoRun, convert, mode]
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
      setMode(mode === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml')
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
              <TabsTrigger value="json-to-yaml" className="text-xs h-6 px-2">
                JSON to YAML
              </TabsTrigger>
              <TabsTrigger value="yaml-to-json" className="text-xs h-6 px-2">
                YAML to JSON
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
          language={mode === 'json-to-yaml' ? 'json' : 'yaml'}
          title={mode === 'json-to-yaml' ? 'JSON Input' : 'YAML Input'}
          placeholder={`Paste your ${mode === 'json-to-yaml' ? 'JSON' : 'YAML'} here...`}
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language={mode === 'json-to-yaml' ? 'yaml' : 'json'}
          title={mode === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'}
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
