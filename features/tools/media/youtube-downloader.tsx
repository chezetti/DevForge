'use client'

import { MediaDownloaderBase } from './media-downloader-base'

export function YouTubeDownloader() {
  return (
    <MediaDownloaderBase
      toolId="youtube-downloader"
      mediaType="youtube-video"
      placeholder="https://www.youtube.com/watch?v=..."
      helperText="Paste a YouTube video URL to generate a direct download link (MP4)."
    />
  )
}
