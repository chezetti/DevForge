'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Download, Check, AlertCircle, CheckCircle2, FileOutput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'

interface OutputPanelProps {
  value: string
  language?: string
  title?: string
  status?: 'idle' | 'success' | 'error'
  errorMessage?: string
  className?: string
  minHeight?: string
  emptyHint?: string
  onClear?: () => void
}

export function OutputPanel({
  value,
  language = 'json',
  title = 'Output',
  status = 'idle',
  errorMessage,
  className = '',
  minHeight = '300px',
  emptyHint = 'Paste input on the left to see results',
  onClear,
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }, [value])

  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `output.${language === 'json' ? 'json' : language === 'typescript' ? 'ts' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }, [value, language])

  const beforeMount = useCallback((monaco: Monaco) => {
    const { registerDevforgeTheme } = require('@/lib/monaco-theme')
    registerDevforgeTheme(monaco)
  }, [])

  return (
    <div className={`flex flex-col h-full min-h-0 border border-border rounded bg-background-secondary ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          {status === 'success' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-3.5 w-3.5 text-destructive-foreground" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Copy"
            aria-label="Copy output"
            disabled={!value}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success-foreground" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Download"
            aria-label="Download output"
            disabled={!value}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {onClear && value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Clear output"
              aria-label="Clear output"
            >
              <span className="text-xs">✕</span>
            </Button>
          )}
        </div>
      </div>
      <div style={{ minHeight }} className="relative flex-1 min-h-[220px]">
        {status === 'error' && errorMessage ? (
          <div className="flex flex-col gap-3 p-4" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive-foreground">Error</p>
                <p className="text-sm text-destructive-foreground/80 font-mono whitespace-pre-wrap">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        ) : value ? (
          <Editor
            height="100%"
            language={language}
            value={value}
            beforeMount={beforeMount}
            theme="devforge-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              readOnly: true,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'none',
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              folding: true,
              lineDecorationsWidth: 8,
              lineNumbersMinChars: 3,
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
            <FileOutput className="h-8 w-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No output yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{emptyHint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
