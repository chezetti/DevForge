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
  const [source, setSource] = useState('')
  const [error, setError] = useState('')

  const extractYoutubeId = useCallback((value: string) => {
    const trimmed = value.trim()
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch?.[1]) return watchMatch[1]
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (shortMatch?.[1]) return shortMatch[1]
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch?.[1]) return embedMatch[1]
    return ''
  }, [])

  const resolve = useCallback(async () => {
    if (!url.trim()) {
      setError('Please paste a valid URL.')
      return
    }

    setLoading(true)
    setError('')
    setDownloadUrl('')
    setTitle('')
    setSource('')

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
      setSource(data.source || '')
    } catch {
      setError('Request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [mediaType, url])

  const isDirectMediaUrl = useMemo(() => {
    if (!downloadUrl) return false
    if (/\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a|aac)(\?|$)/i.test(downloadUrl)) return true
    if (source === 'instagram-embed') return true
    return false
  }, [downloadUrl, source])

  const youtubePreviewUrl = useMemo(() => {
    const id = extractYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : ''
  }, [extractYoutubeId, url])

  const canRenderAudio = useMemo(() => {
    if (!isDirectMediaUrl) return false
    if (mediaType !== 'youtube-mp3') return false
    return true
  }, [isDirectMediaUrl, mediaType])

  const canRenderVideo = useMemo(() => {
    if (!isDirectMediaUrl) return false
    return mediaType === 'youtube-video' || mediaType === 'instagram-video'
  }, [isDirectMediaUrl, mediaType])

  const output = useMemo(() => {
    if (error) return `Error: ${error}`
    if (!downloadUrl) return 'No download link yet.'
    return `Title: ${title || 'Unknown'}\nSource: ${source || 'unknown'}\n\nDownload URL:\n${downloadUrl}`
  }, [downloadUrl, error, source, title])

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
              <Button asChild>
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
            {downloadUrl && (
              <Button asChild variant="outline">
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </a>
              </Button>
            )}
          </div>

          {downloadUrl && canRenderVideo && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Video preview</p>
              <video src={downloadUrl} controls className="w-full rounded-md border border-border bg-black max-h-[280px]" />
            </div>
          )}

          {downloadUrl && canRenderAudio && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audio preview</p>
              <audio src={downloadUrl} controls className="w-full" />
            </div>
          )}

          {downloadUrl && !isDirectMediaUrl && youtubePreviewUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source preview</p>
              <iframe
                src={youtubePreviewUrl}
                title="YouTube preview"
                className="w-full rounded-md border border-border min-h-[220px]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <p className="text-xs text-muted-foreground">
                Direct media stream is unavailable from source provider, so preview shows the original YouTube video.
              </p>
            </div>
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
