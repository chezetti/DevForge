'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { OutputPanel } from '@/components/tools/output-panel'

type MediaType = 'youtube-video' | 'instagram-video' | 'youtube-mp3'

interface MediaDownloaderBaseProps {
  toolId: string
  mediaType: MediaType
  placeholder: string
  helperText: string
}

export function MediaDownloaderBase({
  toolId,
  mediaType,
  placeholder,
  helperText,
}: MediaDownloaderBaseProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const resolve = useCallback(async () => {
    if (!url.trim()) {
      setError('Please paste a valid URL.')
      return
    }

    setLoading(true)
    setError('')
    setDownloadUrl('')
    setTitle('')

    try {
      const res = await fetch('/api/media/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: mediaType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to resolve URL.')
        return
      }

      setDownloadUrl(data.downloadUrl || '')
      setTitle(data.title || '')
    } catch {
      setError('Request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [mediaType, url])

  const output = useMemo(() => {
    if (error) return `Error: ${error}`
    if (!downloadUrl) return 'No download link yet.'
    return `Title: ${title || 'Unknown'}\n\nDownload URL:\n${downloadUrl}`
  }, [downloadUrl, error, title])

  return (
    <ToolShell toolId={toolId} showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="space-y-2">
            <Label htmlFor={`${toolId}-url`}>Video URL</Label>
            <Input
              id={`${toolId}-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={resolve} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {loading ? 'Resolving...' : 'Get Download Link'}
            </Button>
            {downloadUrl && (
              <Button asChild variant="outline">
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </a>
              </Button>
            )}
          </div>

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm underline text-primary"
            >
              Click here to download
            </a>
          )}
        </div>

        <OutputPanel
          value={output}
          language="text"
          title="Result"
          status={error ? 'error' : downloadUrl ? 'success' : 'idle'}
          errorMessage={error}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
