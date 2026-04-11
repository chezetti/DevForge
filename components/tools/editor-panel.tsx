'use client'

import { useRef, useCallback } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { Copy, Trash2, Upload, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface EditorPanelProps {
  value: string
  onChange: (value: string) => void
  language?: string
  placeholder?: string
  readOnly?: boolean
  title?: string
  showToolbar?: boolean
  onFormat?: () => void
  onClear?: () => void
  className?: string
  minHeight?: string
}

export function EditorPanel({
  value,
  onChange,
  language = 'json',
  placeholder = 'Paste your input here...',
  readOnly = false,
  title,
  showToolbar = true,
  onFormat,
  onClear,
  className = '',
  minHeight = '300px',
}: EditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const [copied, setCopied] = useState(false)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange(value || '')
    },
    [onChange]
  )

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [value])

  const handleClear = useCallback(() => {
    onChange('')
    onClear?.()
  }, [onChange, onClear])

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt,.yaml,.yml,.ts,.js,.sql,.env'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          onChange(event.target?.result as string)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [onChange])

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
      {(title || showToolbar) && (
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border">
          {title && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
          )}
          {showToolbar && (
            <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
              {onFormat && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFormat}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Format
                </Button>
              )}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFileUpload}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Upload file"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success-foreground" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
              {!readOnly && value && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Clear"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ minHeight }} className="relative flex-1 min-h-[220px]">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          beforeMount={beforeMount}
          theme="devforge-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            readOnly,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
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
        {!value && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  )
}
