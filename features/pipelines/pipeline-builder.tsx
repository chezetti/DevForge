'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Play, ArrowDown, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { tools, type ToolMetadata } from '@/config/tool-registry'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface PipelineStep {
  id: string
  toolId: string
  output: string
}

const textProcessableTools = tools.filter(
  (t) =>
    t.inputType === 'text' ||
    t.inputType === 'json' ||
    t.inputType === 'code'
)

function processStep(toolId: string, input: string): string {
  const t = input.trim()
  const processors: Record<string, (input: string, trimmed: string) => string> = {
    'json-beautifier': (input) => {
      try { return JSON.stringify(JSON.parse(input), null, 2) } catch { return input }
    },
    'json-minifier': (input) => {
      try { return JSON.stringify(JSON.parse(input)) } catch { return input }
    },
    'json-validator': (input) => {
      try { JSON.parse(input); return 'Valid JSON' } catch (e) { return `Invalid: ${(e as Error).message}` }
    },
    'base64': (_input, t) => {
      try { return btoa(unescape(encodeURIComponent(t))) } catch { return t }
    },
    'url-encode': (_input, t) => encodeURIComponent(t),
    'case-converter': (_input, t) => t.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, (_, c) => c.toLowerCase()),
    'slug-generator': (_input, t) => t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
    'text-reverse': (_input, t) => t.split('').reverse().join(''),
    'line-sorter': (_input, t) => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
    'css-minifier': (input) => input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim(),
    'html-minifier': (_input, t) => t.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim(),
    'html-to-jsx': (_input, t) => t.replace(/\bclass=/g, 'className=').replace(/\bfor=/g, 'htmlFor=').replace(/\btabindex=/g, 'tabIndex=').replace(/\bonclick=/g, 'onClick='),
    'string-escape': (input) => input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t'),
    'json-to-typescript': (input) => {
      try {
        const obj = JSON.parse(input)
        const fields = Object.entries(obj).map(([k, v]) => `  ${k}: ${Array.isArray(v) ? 'unknown[]' : typeof v};`).join('\n')
        return `interface Root {\n${fields}\n}`
      } catch { return input }
    },
    'json-to-csv': (input) => {
      try {
        const arr = JSON.parse(input)
        if (!Array.isArray(arr) || arr.length === 0) return input
        const keys = Object.keys(arr[0])
        return [keys.join(','), ...arr.map((row: Record<string, unknown>) => keys.map(k => String(row[k] ?? '')).join(','))].join('\n')
      } catch { return input }
    },
    'binary-text': (_input, t) => {
      if (/^[01\s]+$/.test(t)) return t.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('')
      return t.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
    },
    'morse-code': (_input, t) => {
      const morseMap: Record<string, string> = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..' }
      const reverseMorse: Record<string, string> = {}
      for (const [k, v] of Object.entries(morseMap)) reverseMorse[v] = k
      if (/^[.\-\s/]+$/.test(t)) return t.split(' / ').map(w => w.split(' ').map(c => reverseMorse[c] || '?').join('')).join(' ')
      return t.toUpperCase().split('').map(c => c === ' ' ? '/' : morseMap[c] || '').join(' ')
    },
    'word-counter': (_input, t) => {
      const words = t.split(/\s+/).filter(Boolean).length
      const chars = t.length
      return `Words: ${words} | Characters: ${chars} | Lines: ${t.split('\n').length}`
    },
  }

  const processor = processors[toolId]
  return processor ? processor(input, t) : input
}

export function PipelineBuilder() {
  const [input, setInput] = useState('')
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: crypto.randomUUID(), toolId: '', output: '' },
  ])

  const addStep = () => {
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), toolId: '', output: '' }])
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  const updateToolId = (id: string, toolId: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, toolId } : s)))
  }

  const runPipeline = useCallback(() => {
    let current = input
    const newSteps = steps.map((step) => {
      if (!step.toolId) return { ...step, output: current }
      const result = processStep(step.toolId, current)
      current = result
      return { ...step, output: result }
    })
    setSteps(newSteps)
    toast.success('Pipeline executed')
  }, [input, steps])

  const finalOutput = useMemo(() => {
    const lastWithOutput = [...steps].reverse().find((s) => s.output)
    return lastWithOutput?.output ?? ''
  }, [steps])

  const handleCopyOutput = useCallback(() => {
    if (finalOutput) {
      navigator.clipboard.writeText(finalOutput)
      toast.success('Output copied to clipboard')
    }
  }, [finalOutput])

  useKeyboardShortcuts({ onRun: runPipeline, onCopyOutput: handleCopyOutput })

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-foreground">Pipelines</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chain tools together — output of each step feeds into the next.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1.5" />Add Step
          </Button>
          <Button size="sm" onClick={runPipeline}>
            <Play className="h-4 w-4 mr-1.5" />Run
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your initial data here..."
              className="min-h-[120px] font-mono text-sm bg-muted/30 border-border"
            />
          </div>

          {steps.map((step, index) => {
            const selectedTool = textProcessableTools.find((t) => t.id === step.toolId)
            return (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="border border-border rounded-lg bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground w-6 shrink-0">
                      #{index + 1}
                    </span>
                    <Select value={step.toolId} onValueChange={(v) => updateToolId(step.id, v)}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Select a tool..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {textProcessableTools.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground"
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedTool && (
                    <p className="text-xs text-muted-foreground px-10">
                      {selectedTool.description}
                    </p>
                  )}

                  {step.output && (
                    <div className="mt-2 px-10">
                      <pre className="text-xs bg-muted/30 rounded p-3 overflow-x-auto max-h-40 whitespace-pre-wrap text-foreground">
                        {step.output}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {finalOutput && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Final Output</label>
                <Button size="sm" variant="outline" onClick={handleCopyOutput}>
                  Copy
                </Button>
              </div>
              <pre className="text-sm bg-muted/30 border border-border rounded-lg p-4 overflow-x-auto max-h-60 whitespace-pre-wrap font-mono text-foreground">
                {finalOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
