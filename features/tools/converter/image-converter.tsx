'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileImage, ImagePlus, Upload } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type OutputFormat = 'png' | 'jpeg' | 'webp' | 'svg'

const outputFormats: Array<{ value: OutputFormat; label: string; mime: string }> = [
  { value: 'png', label: 'PNG', mime: 'image/png' },
  { value: 'jpeg', label: 'JPG', mime: 'image/jpeg' },
  { value: 'webp', label: 'WebP', mime: 'image/webp' },
  { value: 'svg', label: 'SVG wrapper', mime: 'image/svg+xml' },
]

function formatBytes(n: number): string {
  if ( n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function extensionFromName(name: string): string {
  return name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : ''
}

function outputName(name: string, format: OutputFormat): string {
  const base = name.replace(/\.[^.]+$/, '') || 'converted-image'
  return `${base}.${format === 'jpeg' ? 'jpg' : format}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to decode this image'))
    image.src = src
  })
}

export function ImageConverter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(92)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [sourceWidth, setSourceWidth] = useState(0)
  const [sourceHeight, setSourceHeight] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [converting, setConverting] = useState(false)

  const sourceInfo = useMemo(() => {
    if (!file) return null
    return {
      type: file.type || `.${extensionFromName(file.name)}`,
      size: formatBytes(file.size),
      dimensions: sourceWidth && sourceHeight ? `${sourceWidth} x ${sourceHeight}` : 'Reading...',
    }
  }, [file, sourceHeight, sourceWidth])

  const loadFile = useCallback(async (nextFile: File) => {
    if (!nextFile.type.startsWith('image/') && extensionFromName(nextFile.name) !== 'svg') {
      toast.error('Choose an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFile(nextFile)
      setSourceUrl(result)
      setOutputUrl('')
      setOutputSize(0)
      try {
        const image = await loadImage(result)
        setSourceWidth(image.naturalWidth)
        setSourceHeight(image.naturalHeight)
        setWidth(String(image.naturalWidth))
        setHeight(String(image.naturalHeight))
        toast.success('Image loaded')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to read image')
      }
    }
    reader.readAsDataURL(nextFile)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (nextFile) void loadFile(nextFile)
    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const nextFile = event.dataTransfer.files?.[0]
    if (nextFile) void loadFile(nextFile)
  }

  const convert = async () => {
    if (!file || !sourceUrl) return
    setConverting(true)
    try {
      const image = await loadImage(sourceUrl)
      const targetWidth = Math.max(1, Number.parseInt(width, 10) || image.naturalWidth)
      const targetHeight = Math.max(1, Number.parseInt(height, 10) || image.naturalHeight)

      if (format === 'svg') {
        const escapedName = file.name.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}" role="img" aria-label="${escapedName}"><image href="${sourceUrl}" width="${targetWidth}" height="${targetHeight}" preserveAspectRatio="xMidYMid meet"/></svg>`
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        setOutputUrl(URL.createObjectURL(blob))
        setOutputSize(blob.size)
        toast.success('Converted to SVG')
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is not available')

      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

      const selected = outputFormats.find((item) => item.value === format)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, selected?.mime ?? 'image/png', quality / 100)
      })
      if (!blob) throw new Error('Conversion failed')
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      toast.success(`Converted to ${selected?.label ?? format}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  const download = () => {
    if (!file || !outputUrl) return
    const anchor = document.createElement('a')
    anchor.href = outputUrl
    anchor.download = outputName(file.name, format)
    anchor.click()
  }

  const lockAspectWidth = (nextWidth: string) => {
    setWidth(nextWidth)
    const n = Number.parseInt(nextWidth, 10)
    if (sourceWidth && sourceHeight && n > 0) setHeight(String(Math.round((n * sourceHeight) / sourceWidth)))
  }

  const lockAspectHeight = (nextHeight: string) => {
    setHeight(nextHeight)
    const n = Number.parseInt(nextHeight, 10)
    if (sourceWidth && sourceHeight && n > 0) setWidth(String(Math.round((n * sourceWidth) / sourceHeight)))
  }

  return (
    <ToolShell toolId="image-converter" showHistory={false}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <input ref={inputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50',
          )}
          aria-label="Upload image"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full border border-border bg-background p-3">
              <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium">Drop an image here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP, GIF and SVG input</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              Browser-side conversion
            </span>
          </div>
        </button>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Source</Label>
              <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-border bg-muted/20 p-3">
                {sourceUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sourceUrl} alt={file?.name ?? 'Source image'} className="max-h-[340px] max-w-full rounded-md object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileImage className="h-8 w-8" aria-hidden />
                    <span className="text-sm">No image selected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Result</Label>
              <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-border bg-muted/20 p-3">
                {outputUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={outputUrl} alt="Converted result" className="max-h-[340px] max-w-full rounded-md object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileImage className="h-8 w-8" aria-hidden />
                    <span className="text-sm">Convert to preview output</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="space-y-2">
              <Label>Output format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="image-width">Width</Label>
                <Input id="image-width" inputMode="numeric" value={width} onChange={(event) => lockAspectWidth(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-height">Height</Label>
                <Input id="image-height" inputMode="numeric" value={height} onChange={(event) => lockAspectHeight(event.target.value)} />
              </div>
            </div>

            {(format === 'jpeg' || format === 'webp') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Quality</Label>
                  <span className="font-mono text-xs text-muted-foreground">{quality}%</span>
                </div>
                <Slider value={[quality]} min={1} max={100} step={1} onValueChange={([value]) => setQuality(value ?? 92)} />
              </div>
            )}

            {sourceInfo && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Input</p>
                  <p className="truncate font-mono text-xs">{sourceInfo.type}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Size</p>
                  <p className="font-mono text-xs">{sourceInfo.size}</p>
                </div>
                <div className="col-span-2 rounded-md bg-muted/40 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Dimensions</p>
                  <p className="font-mono text-xs">{sourceInfo.dimensions}</p>
                </div>
                {outputSize > 0 && (
                  <div className="col-span-2 rounded-md bg-muted/40 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Output size</p>
                    <p className="font-mono text-xs">{formatBytes(outputSize)}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={convert} disabled={!file || converting}>
                {converting ? 'Converting...' : 'Convert'}
              </Button>
              <Button variant="outline" onClick={download} disabled={!outputUrl}>
                <Download className="mr-2 h-4 w-4" aria-hidden />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
