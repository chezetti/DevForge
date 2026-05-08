'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, ImagePlus, Upload } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function ImageToBase64() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dataUri, setDataUri] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const rawBase64 = dataUri.includes(',') ? dataUri.split(',')[1] ?? '' : ''
  const mime = dataUri.match(/^data:([^;]+);/)?.[1] ?? ''

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setDataUri(result)
      toast.success('Image loaded')
    }
    reader.readAsDataURL(f)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  const copy = async (text: string, key: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copied')
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const cssBg =
    dataUri && mime ? `background-image: url("${dataUri}"); background-size: cover; background-position: center;` : ''
  const htmlImg =
    dataUri && mime ? `<img src="${dataUri}" alt="${file?.name ?? 'image'}" />` : ''

  return (
    <ToolShell toolId="image-to-base64">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload image or drop a file here"
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'rounded-xl border-2 border-dashed p-10 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-background p-3 border border-border">
              <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium">Drop an image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, GIF, SVG…</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              Supports drag and drop
            </span>
          </div>
        </button>

        {file && dataUri && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Preview
                </Label>
                <div
                  className="rounded-lg border border-border p-3 flex items-center justify-center min-h-[160px]"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUri}
                    alt={`Preview of ${file.name}`}
                    className="max-h-48 max-w-full object-contain rounded-md shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">File</p>
                  <p className="font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Size</p>
                    <p className="font-mono">{formatBytes(file.size)}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">MIME</p>
                    <p className="font-mono text-xs truncate" title={mime}>
                      {mime || '—'}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Raw base64 length</p>
                    <p className="font-mono">{rawBase64.length.toLocaleString()} chars</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'uri', label: 'Data URI', value: dataUri },
                { key: 'b64', label: 'Raw base64', value: rawBase64 },
                { key: 'css', label: 'CSS background-image', value: cssBg },
                { key: 'html', label: 'HTML img tag', value: htmlImg },
              ].map(({ key, label, value }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => copy(value, key)}
                      disabled={!value}
                      aria-label={`Copy ${label}`}
                    >
                      {copiedKey === key ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs font-mono rounded-lg border border-border bg-background-secondary p-3 max-h-32 overflow-auto whitespace-pre-wrap break-all">
                    {value || '—'}
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolShell>
  )
}
