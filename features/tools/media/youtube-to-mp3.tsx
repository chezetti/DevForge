'use client'

import { MediaDownloaderBase } from './media-downloader-base'

export function YouTubeToMp3() {
  return (
    <MediaDownloaderBase
      toolId="youtube-to-mp3"
      mediaType="youtube-mp3"
      placeholder="https://www.youtube.com/watch?v=..."
      helperText="Paste a YouTube video URL to generate an MP3 download link."
    />
  )
}
