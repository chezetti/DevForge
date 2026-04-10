'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { decodeJwt } from '@/utils/security'

export function JwtDecoder() {
  const tool = getToolById('jwt-decoder')!
  const { getToolDraft, setToolDraft, autoRun } = useAppStore()

  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    if (draft) setInput(draft)
  }, [getToolDraft, tool.id])

  const decoded = useMemo(() => {
    if (!input.trim()) {
      setError('')
      return null
    }

    try {
      const result = decodeJwt(input.trim())
      setError('')
      return result
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }, [input])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
    },
    [setToolDraft, tool.id]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
    },
    [setToolDraft, tool.id]
  )

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts * 1000)
    return date.toLocaleString()
  }

  const isExpired = decoded?.payload?.exp
    ? (decoded.payload.exp as number) * 1000 < Date.now()
    : false

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="plaintext"
          title="JWT Token"
          placeholder="Paste your JWT token here..."
          minHeight="200px"
        />

        <div className="space-y-4">
          {error ? (
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded">
              <p className="text-sm text-destructive-foreground">{error}</p>
            </div>
          ) : decoded ? (
            <>
              <div className="p-3 border border-border rounded bg-background-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Header
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {decoded.header.alg as string}
                  </span>
                </div>
                <pre className="text-xs font-mono text-foreground overflow-auto max-h-32">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              <div className="p-3 border border-border rounded bg-background-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Payload
                  </span>
                  {isExpired && (
                    <span className="flex items-center gap-1 text-xs text-destructive-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      Expired
                    </span>
                  )}
                </div>
                <pre className="text-xs font-mono text-foreground overflow-auto max-h-48">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>

                {(decoded.payload.iat || decoded.payload.exp || decoded.payload.nbf) && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    {decoded.payload.iat && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Issued:</span>{' '}
                        {formatTimestamp(decoded.payload.iat as number)}
                      </p>
                    )}
                    {decoded.payload.exp && (
                      <p className={`text-xs ${isExpired ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>
                        <span className="font-medium">Expires:</span>{' '}
                        {formatTimestamp(decoded.payload.exp as number)}
                      </p>
                    )}
                    {decoded.payload.nbf && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Not Before:</span>{' '}
                        {formatTimestamp(decoded.payload.nbf as number)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 border border-border rounded bg-background-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Signature
                  </span>
                  <span className="text-xs text-yellow-500">Not verified</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {decoded.signature}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 border border-border rounded bg-background-secondary">
              <p className="text-sm text-muted-foreground">
                Enter a JWT token to decode
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  )
}
