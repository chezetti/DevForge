import { NextRequest, NextResponse } from 'next/server'

function sanitizeFileName(value: string): string {
  const clean = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean || 'media-file'
}

function extensionFromContentType(contentType: string, type: string): string {
  const normalized = contentType.toLowerCase()
  if (type === 'youtube-mp3') return 'mp3'
  if (normalized.includes('video/mp4')) return 'mp4'
  if (normalized.includes('video/webm')) return 'webm'
  if (normalized.includes('audio/mpeg')) return 'mp3'
  if (normalized.includes('audio/mp4')) return 'm4a'
  if (normalized.includes('audio/webm')) return 'webm'
  if (normalized.includes('audio/wav')) return 'wav'
  return 'bin'
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const target = String(params.get('url') || '')
  const title = String(params.get('title') || 'media-file')
  const type = String(params.get('type') || 'media')

  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ error: 'Invalid media URL.' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Unsupported URL protocol.' }, { status: 400 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: 'Unable to download media from source.' },
        { status: 502 }
      )
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const ext = extensionFromContentType(contentType, type)
    const filename = `${sanitizeFileName(title)}.${ext}`

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Download request failed.' },
      { status: 500 }
    )
  }
}
