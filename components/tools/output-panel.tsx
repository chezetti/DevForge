'use client'

import { useState, useCallback } from 'react'
import { Copy, Download, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
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
}

export function OutputPanel({
  value,
  language = 'json',
  title = 'Output',
  status = 'idle',
  errorMessage,
  className = '',
  minHeight = '300px',
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
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
    monaco.editor.defineTheme('devforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280' },
        { token: 'keyword', foreground: 'FFFFFF' },
        { token: 'string', foreground: 'A1A1AA' },
        { token: 'number', foreground: 'FFFFFF' },
      ],
      colors: {
        'editor.background': '#0D0D0D',
        'editor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#1A1A1A',
        'editor.selectionBackground': '#2A2A2A',
        'editorLineNumber.foreground': '#3F3F46',
        'editorLineNumber.activeForeground': '#A1A1AA',
        'editorCursor.foreground': '#FFFFFF',
        'editor.inactiveSelectionBackground': '#1F1F1F',
      },
    })
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
            disabled={!value}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div style={{ minHeight }} className="relative flex-1 min-h-[220px]">
        {status === 'error' && errorMessage ? (
          <div className="p-4 text-sm text-destructive-foreground font-mono">
            {errorMessage}
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
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <span className="text-sm text-muted-foreground">No output yet</span>
          </div>
        )}
      </div>
    </div>
  )
}
