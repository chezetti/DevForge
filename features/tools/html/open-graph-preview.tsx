'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, ExternalLink } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DEFAULT = {
  title: 'DevForge — Developer utilities in one place',
  description: 'Format JSON, decode JWTs, test regex, convert SQL, and dozens of other tools.',
  image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
  url: 'https://devforge.example.com/tools',
  siteName: 'DevForge',
  type: 'website',
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export function OpenGraphPreview() {
  const [title, setTitle] = useState(DEFAULT.title)
  const [description, setDescription] = useState(DEFAULT.description)
  const [image, setImage] = useState(DEFAULT.image)
  const [url, setUrl] = useState(DEFAULT.url)
  const [siteName, setSiteName] = useState(DEFAULT.siteName)
  const [type, setType] = useState(DEFAULT.type)

  const metaHtml = useMemo(() => {
    const lines = [
      `<meta property="og:title" content="${escapeAttr(title)}" />`,
      `<meta property="og:description" content="${escapeAttr(description)}" />`,
      `<meta property="og:image" content="${escapeAttr(image)}" />`,
      `<meta property="og:url" content="${escapeAttr(url)}" />`,
      `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
      `<meta property="og:type" content="${escapeAttr(type)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    ]
    return lines.join('\n')
  }, [title, description, image, url, siteName, type])

  const copyTags = () => {
    void navigator.clipboard.writeText(metaHtml)
    toast.success('Meta tags copied')
  }

  return (
    <ToolShell toolId="open-graph-preview">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        <div className="xl:col-span-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="og-title">og:title</Label>
            <Input id="og-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-desc">og:description</Label>
            <Input id="og-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-image">og:image (URL)</Label>
            <Input id="og-image" className="font-mono text-xs" value={image} onChange={(e) => setImage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-url">og:url</Label>
            <Input id="og-url" className="font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-site">og:site_name</Label>
            <Input id="og-site" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-type">og:type</Label>
            <Input id="og-type" value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <Button type="button" onClick={copyTags} className="w-full sm:w-auto">
            <Copy className="h-4 w-4 mr-2" />
            Copy meta tags
          </Button>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Live previews</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewCard
              label="Facebook / generic"
              className="border-[#2663ec]/40 bg-gradient-to-b from-[#1a1f2e] to-background"
              accent="#2663ec"
            >
              <div className="h-28 rounded-md overflow-hidden bg-muted relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] text-[#8d9dc4] uppercase tracking-wide truncate">{url.replace(/^https?:\/\//, '')}</p>
              <p className="text-sm font-semibold text-[#e4e8f0] line-clamp-2 leading-snug">{title}</p>
              <p className="text-xs text-[#9aa5bf] line-clamp-3">{description}</p>
            </PreviewCard>

            <PreviewCard
              label="Twitter / X"
              className="border-border bg-[#15202b]"
              accent="#1d9bf0"
            >
              <div className="h-28 rounded-xl overflow-hidden border border-[#38444d]">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-[13px] font-medium text-[#f7f9f9] line-clamp-2 mt-2">{title}</p>
              <p className="text-[13px] text-[#8b98a5] line-clamp-2">{description}</p>
              <p className="text-[11px] text-[#536471] truncate flex items-center gap-1 mt-1">
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                {url}
              </p>
            </PreviewCard>

            <PreviewCard label="LinkedIn" className="border-[#0077b5]/30 bg-[#111827]">
              <div className="flex gap-3">
                <div className="w-24 h-24 shrink-0 rounded-sm overflow-hidden bg-muted border border-border">
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-[#f3f4f6] line-clamp-2">{title}</p>
                  <p className="text-[11px] text-[#9ca3af] line-clamp-3">{description}</p>
                  <p className="text-[10px] text-[#0077b5] font-medium truncate">{siteName}</p>
                </div>
              </div>
            </PreviewCard>

            <PreviewCard label="Slack unfurl" className="border-purple-500/25 bg-[#1e1325]">
              <div className="rounded-md overflow-hidden border border-purple-500/20">
                <img src={image} alt="" className="w-full h-24 object-cover" />
                <div className="p-2 bg-[#2a1f32] space-y-0.5">
                  <p className="text-xs font-semibold text-[#e8e0ef] line-clamp-1">{title}</p>
                  <p className="text-[11px] text-[#b9a7c9] line-clamp-2">{description}</p>
                  <p className="text-[10px] text-purple-300/80 truncate">{url}</p>
                </div>
              </div>
            </PreviewCard>
          </div>

          <div className="rounded-lg border border-border bg-background-secondary">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">HTML</span>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={copyTags} aria-label="Copy HTML">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre className="p-3 text-[11px] font-mono overflow-auto max-h-48 whitespace-pre-wrap text-muted-foreground">
              {metaHtml}
            </pre>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}

function PreviewCard({
  label,
  children,
  className,
  accent,
}: {
  label: string
  children: ReactNode
  className?: string
  accent?: string
}) {
  return (
    <div
      className={cn('rounded-xl border p-3 shadow-sm', className)}
      style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : undefined}
    >
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  )
}
