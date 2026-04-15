import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

type MediaType = 'youtube-video' | 'instagram-video' | 'youtube-mp3'

function normalizeUrl(value: string): string {
  return value.trim()
}

function isInstagramUrl(url: string): boolean {
  return /instagram\.com\/(reel|p)\//i.test(url)
}

function toEmbedUrl(url: string): string {
  return `${url.replace(/\/+$/, '')}/embed/captioned/`
}

function decodeEscapedUrl(value: string): string {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value.replace(/\\\//g, '/')
  }
}

function extractField(html: string, field: string): string | null {
  const plain = new RegExp(`"${field}":"(.*?)"`)
  const escaped = new RegExp(`\\\\\\"${field}\\\\\\":\\\\\\"(.*?)\\\\\\"`)
  return plain.exec(html)?.[1] ?? escaped.exec(html)?.[1] ?? null
}

function isYoutubeUrl(url: string): boolean {
  return /(youtube\.com|youtu\.be)/i.test(url)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function trySaveNowYoutube(url: string, type: MediaType) {
  if (!isYoutubeUrl(url)) {
    return {
      ok: false as const,
      error: 'Invalid YouTube URL.',
    }
  }

  const format = type === 'youtube-mp3' ? 'mp3' : '720'
  const initUrl = `https://p.savenow.to/ajax/download.php?button=1&start=1&end=1&format=${encodeURIComponent(
    format
  )}&url=${encodeURIComponent(url)}`

  try {
    const initRes = await fetch(initUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    if (!initRes.ok) {
      return {
        ok: false as const,
        error: 'YouTube provider initialization failed.',
      }
    }

    const initData = await initRes.json()
    const id = typeof initData?.id === 'string' ? initData.id : ''
    if (!id) {
      return {
        ok: false as const,
        error: 'YouTube provider did not return job id.',
      }
    }

    for (let i = 0; i < 45; i++) {
      await sleep(1000)
      const progressRes = await fetch(`https://p.savenow.to/api/progress?id=${encodeURIComponent(id)}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      })

      if (!progressRes.ok) continue
      const progressData = await progressRes.json()
      if (typeof progressData?.download_url === 'string' && progressData.download_url) {
        return {
          ok: true as const,
          downloadUrl: progressData.download_url,
          title: type === 'youtube-mp3' ? 'youtube-audio' : 'youtube-video',
          source: 'savenow-direct',
        }
      }
    }

    return {
      ok: false as const,
      error: 'YouTube direct stream was not ready in time.',
    }
  } catch {
    return {
      ok: false as const,
      error: 'YouTube provider request failed.',
    }
  }
}

async function tryYoutubeDirect(url: string, type: MediaType) {
  if (!isYoutubeUrl(url) || !ytdl.validateURL(url)) {
    return {
      ok: false as const,
      error: 'Invalid YouTube URL.',
    }
  }

  try {
    const info = await ytdl.getInfo(url)
    const formats = info.formats

    if (type === 'youtube-video') {
      const candidates = formats
        .filter((f) => f.hasVideo && f.hasAudio && f.url)
        .sort((a, b) => {
          const heightDiff = (b.height || 0) - (a.height || 0)
          if (heightDiff !== 0) return heightDiff
          return (b.bitrate || 0) - (a.bitrate || 0)
        })

      const preferred =
        candidates.find((f) => f.container === 'mp4') ??
        candidates[0]

      if (!preferred?.url) {
        return {
          ok: false as const,
          error: 'No downloadable YouTube video stream found.',
        }
      }

      return {
        ok: true as const,
        downloadUrl: preferred.url,
        title: info.videoDetails?.title || 'youtube-video',
        source: 'youtube-direct',
      }
    }

    const audioCandidates = formats
      .filter((f) => f.hasAudio && !f.hasVideo && f.url)
      .sort((a, b) => {
        const score = (f: typeof a) => {
          const mime = f.mimeType || ''
          const codecScore = mime.includes('audio/mpeg')
            ? 3
            : mime.includes('audio/mp4')
              ? 2
              : mime.includes('audio/webm')
                ? 1
                : 0
          return codecScore * 1000 + (f.audioBitrate || 0)
        }
        return score(b) - score(a)
      })

    const preferred = audioCandidates[0]
    if (!preferred?.url) {
      return {
        ok: false as const,
        error: 'No downloadable YouTube audio stream found.',
      }
    }

    return {
      ok: true as const,
      downloadUrl: preferred.url,
      title: info.videoDetails?.title || 'youtube-audio',
      source: 'youtube-audio-direct',
    }
  } catch {
    return {
      ok: false as const,
      error: 'YouTube extraction failed for this video.',
    }
  }
}

function buildPayload(url: string, type: MediaType) {
  if (type === 'youtube-mp3') {
    return {
      url,
      isAudioOnly: true,
      audioFormat: 'mp3',
      filenameStyle: 'classic',
      downloadMode: 'auto',
      disableMetadata: false,
    }
  }

  if (type === 'instagram-video') {
    return {
      url,
      isAudioOnly: false,
      filenameStyle: 'classic',
      downloadMode: 'auto',
      isNoTTWatermark: true,
      disableMetadata: false,
    }
  }

  return {
    url,
    isAudioOnly: false,
    vCodec: 'h264',
    vQuality: '720',
    filenameStyle: 'classic',
    downloadMode: 'auto',
    disableMetadata: false,
  }
}

function extractDownloadUrl(data: any): string | null {
  if (!data) return null
  if (typeof data.url === 'string') return data.url
  if (data.downloadUrl && typeof data.downloadUrl === 'string') return data.downloadUrl
  if (Array.isArray(data.picker) && data.picker.length > 0) {
    const first = data.picker.find((item: any) => typeof item?.url === 'string') ?? data.picker[0]
    if (typeof first?.url === 'string') return first.url
  }
  return null
}

async function tryCobalt(url: string, type: MediaType) {
  const payload = buildPayload(url, type)
  const endpoints = [
    process.env.MEDIA_API_URL?.trim(),
    'https://downloadapi.stuff.solutions/api/json',
    'https://co.wuk.sh/api/json',
  ].filter(Boolean) as string[]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      if (!response.ok) {
        continue
      }

      const data = await response.json()
      const downloadUrl = extractDownloadUrl(data)
      if (!downloadUrl) continue

      const title =
        (typeof data.filename === 'string' && data.filename) ||
        (typeof data.title === 'string' && data.title) ||
        'media-file'

      return {
        ok: true as const,
        downloadUrl,
        title,
        source: data?.source ?? endpoint,
      }
    } catch {
      continue
    }
  }

  return {
    ok: false as const,
    error: 'Failed to resolve media stream from configured providers.',
  }
}

async function tryInstagramEmbed(url: string) {
  if (!isInstagramUrl(url)) {
    return {
      ok: false as const,
      error: 'Not an Instagram reel/post URL.',
    }
  }

  try {
    const response = await fetch(toEmbedUrl(url), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        ok: false as const,
        error: `Instagram embed request failed (${response.status}).`,
      }
    }

    const html = await response.text()
    const videoValue = extractField(html, 'video_url')
    if (!videoValue) {
      return {
        ok: false as const,
        error: 'Instagram video URL not found in embed page.',
      }
    }

    const title = decodeEscapedUrl(extractField(html, 'title') || 'instagram-video')
    const downloadUrl = decodeEscapedUrl(videoValue)

    return {
      ok: true as const,
      downloadUrl,
      title,
      source: 'instagram-embed',
    }
  } catch {
    return {
      ok: false as const,
      error: 'Instagram embed fallback failed.',
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = normalizeUrl(String(body?.url || ''))
    const type = body?.type as MediaType

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    if (!['youtube-video', 'instagram-video', 'youtube-mp3'].includes(type)) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 })
    }

    if (type === 'youtube-video' || type === 'youtube-mp3') {
      const youtubeFromProvider = await trySaveNowYoutube(url, type)
      if (youtubeFromProvider.ok) {
        return NextResponse.json({
          downloadUrl: youtubeFromProvider.downloadUrl,
          title: youtubeFromProvider.title,
          source: youtubeFromProvider.source,
          type,
          isDirect: true,
        })
      }

      const youtubeDirect = await tryYoutubeDirect(url, type)
      if (youtubeDirect.ok) {
        return NextResponse.json({
          downloadUrl: youtubeDirect.downloadUrl,
          title: youtubeDirect.title,
          source: youtubeDirect.source,
          type,
          isDirect: true,
        })
      }
    }

    const primary = await tryCobalt(url, type)
    if (primary.ok) {
      return NextResponse.json({
        downloadUrl: primary.downloadUrl,
        title: primary.title,
        source: primary.source,
        type,
        isDirect: true,
      })
    }

    if (type === 'instagram-video') {
      const instagramFallback = await tryInstagramEmbed(url)
      if (instagramFallback.ok) {
        return NextResponse.json({
          downloadUrl: instagramFallback.downloadUrl,
          title: instagramFallback.title,
          source: instagramFallback.source,
          type,
          isDirect: true,
        })
      }

      return NextResponse.json(
        { error: instagramFallback.error || primary.error },
        { status: 422 }
      )
    }

    return NextResponse.json({ error: primary.error }, { status: 502 })
  } catch {
    return NextResponse.json(
      { error: 'Unable to process this URL right now.' },
      { status: 500 }
    )
  }
}
