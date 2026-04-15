'use client'

import { MediaDownloaderBase } from './media-downloader-base'

export function InstagramDownloader() {
  return (
    <MediaDownloaderBase
      toolId="instagram-downloader"
      mediaType="instagram-video"
      placeholder="https://www.instagram.com/reel/..."
      helperText="Paste an Instagram Reel or video URL to generate a direct download link."
    />
  )
}
