'use client'

import { useState, useCallback, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { generateHash } from '@/utils/security'
import { Button } from '@/components/ui/button'

type Algorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

export function HashGenerator() {
  const tool = getToolById('hash-generator')!
  const { getToolDraft, setToolDraft, autoRun } = useAppStore()
  const EXAMPLE = 'invoice:INV-2026-0042|total:199.99|currency:USD'

  const [input, setInput] = useState(EXAMPLE)
  const [hashes, setHashes] = useState<Record<Algorithm, string>>({
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  })
  const [copiedAlgo, setCopiedAlgo] = useState<Algorithm | null>(null)
  const [computing, setComputing] = useState(false)

  const computeHashes = useCallback(async (value: string) => {
    if (!value) {
      setHashes({
        'SHA-256': '',
        'SHA-384': '',
        'SHA-512': '',
      })
      return
    }

    setComputing(true)
    try {
      const algorithms: Algorithm[] = ['SHA-256', 'SHA-384', 'SHA-512']
      const results = await Promise.all(
        algorithms.map(async (algo) => {
          const hash = await generateHash(value, algo)
          return [algo, hash] as [Algorithm, string]
        })
      )
      setHashes(Object.fromEntries(results) as Record<Algorithm, string>)
    } finally {
      setComputing(false)
    }
  }, [])

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    if (autoRun) {
      computeHashes(initial)
    }
  }, [getToolDraft, tool.id, autoRun, computeHashes])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        computeHashes(value)
      }
    },
    [setToolDraft, tool.id, autoRun, computeHashes]
  )

  const handleCopy = useCallback(async (algo: Algorithm) => {
    await navigator.clipboard.writeText(hashes[algo])
    setCopiedAlgo(algo)
    setTimeout(() => setCopiedAlgo(null), 1500)
  }, [hashes])

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      computeHashes(historicalInput)
    },
    [setToolDraft, tool.id, computeHashes]
  )

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="plaintext"
          title="Input"
          placeholder="Enter text to hash..."
          minHeight="300px"
        />

        <div className="space-y-3">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hash Output
            </span>
            {computing && (
              <span className="text-xs text-muted-foreground animate-pulse">Computing...</span>
            )}
          </div>

          {(['SHA-256', 'SHA-384', 'SHA-512'] as Algorithm[]).map((algo) => (
            <div
              key={algo}
              className="p-3 border border-border rounded bg-background-secondary"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {algo}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(algo)}
                  disabled={!hashes[algo]}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title={`Copy ${algo} hash`}
                  aria-label={`Copy ${algo} hash`}
                >
                  {copiedAlgo === algo ? (
                    <Check className="h-3 w-3 text-success-foreground" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs font-mono text-foreground break-all min-h-[20px]">
                {hashes[algo] || (
                  <span className="text-muted-foreground">Enter text to generate hash</span>
                )}
              </p>
            </div>
          ))}

          <div className="p-3 border border-border rounded bg-background-secondary">
            <p className="text-xs text-muted-foreground">
              SHA hashes are one-way cryptographic functions. The same input will
              always produce the same output, but the original input cannot be
              recovered from the hash.
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
