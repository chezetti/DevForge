import { NextRequest, NextResponse } from 'next/server'

type MediaType = 'youtube-video' | 'instagram-video' | 'youtube-mp3'

function normalizeUrl(value: string): string {
  return value.trim()
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

    const payload = buildPayload(url, type)
    const response = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to resolve media URL. Try another link.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const downloadUrl = extractDownloadUrl(data)
    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'No downloadable stream found for this link.' },
        { status: 422 }
      )
    }

    const title =
      (typeof data.filename === 'string' && data.filename) ||
      (typeof data.title === 'string' && data.title) ||
      'media-file'

    return NextResponse.json({
      downloadUrl,
      title,
      source: data?.source ?? null,
      type,
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to process this URL right now.' },
      { status: 500 }
    )
  }
}
