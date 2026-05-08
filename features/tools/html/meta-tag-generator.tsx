'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OutputPanel } from '@/components/tools/output-panel'

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

type FormState = {
  title: string
  description: string
  keywords: string
  author: string
  viewport: string
  charset: string
  robots: string
  canonical: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogUrl: string
  ogType: string
  twitterCard: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
}

const DEFAULTS: FormState = {
  title: 'My App — Dashboard',
  description: 'Ship faster with polished UI and solid tooling.',
  keywords: 'devtools, productivity, web',
  author: 'DevForge',
  viewport: 'width=device-width, initial-scale=1',
  charset: 'UTF-8',
  robots: 'index, follow',
  canonical: 'https://example.com/dashboard',
  ogTitle: 'My App — Dashboard',
  ogDescription: 'Ship faster with polished UI.',
  ogImage: 'https://example.com/og-card.png',
  ogUrl: 'https://example.com/dashboard',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'My App — Dashboard',
  twitterDescription: 'Ship faster with polished UI.',
  twitterImage: 'https://example.com/og-card.png',
}

function buildMetaHtml(f: FormState): string {
  const lines: string[] = []
  if (f.charset.trim()) {
    lines.push(`<meta charset="${escAttr(f.charset.trim())}" />`)
  }
  if (f.viewport.trim()) {
    lines.push(`<meta name="viewport" content="${escAttr(f.viewport.trim())}" />`)
  }
  if (f.title.trim()) {
    lines.push(`<title>${escText(f.title.trim())}</title>`)
  }
  if (f.description.trim()) {
    lines.push(`<meta name="description" content="${escAttr(f.description.trim())}" />`)
  }
  if (f.keywords.trim()) {
    lines.push(`<meta name="keywords" content="${escAttr(f.keywords.trim())}" />`)
  }
  if (f.author.trim()) {
    lines.push(`<meta name="author" content="${escAttr(f.author.trim())}" />`)
  }
  if (f.robots.trim()) {
    lines.push(`<meta name="robots" content="${escAttr(f.robots.trim())}" />`)
  }
  if (f.canonical.trim()) {
    lines.push(`<link rel="canonical" href="${escAttr(f.canonical.trim())}" />`)
  }
  if (f.ogTitle.trim()) {
    lines.push(`<meta property="og:title" content="${escAttr(f.ogTitle.trim())}" />`)
  }
  if (f.ogDescription.trim()) {
    lines.push(`<meta property="og:description" content="${escAttr(f.ogDescription.trim())}" />`)
  }
  if (f.ogImage.trim()) {
    lines.push(`<meta property="og:image" content="${escAttr(f.ogImage.trim())}" />`)
  }
  if (f.ogUrl.trim()) {
    lines.push(`<meta property="og:url" content="${escAttr(f.ogUrl.trim())}" />`)
  }
  if (f.ogType.trim()) {
    lines.push(`<meta property="og:type" content="${escAttr(f.ogType.trim())}" />`)
  }
  if (f.twitterCard.trim()) {
    lines.push(`<meta name="twitter:card" content="${escAttr(f.twitterCard.trim())}" />`)
  }
  if (f.twitterTitle.trim()) {
    lines.push(`<meta name="twitter:title" content="${escAttr(f.twitterTitle.trim())}" />`)
  }
  if (f.twitterDescription.trim()) {
    lines.push(`<meta name="twitter:description" content="${escAttr(f.twitterDescription.trim())}" />`)
  }
  if (f.twitterImage.trim()) {
    lines.push(`<meta name="twitter:image" content="${escAttr(f.twitterImage.trim())}" />`)
  }
  return lines.join('\n').trim()
}

export function MetaTagGenerator() {
  const [form, setForm] = useState(DEFAULTS)

  const output = useMemo(() => buildMetaHtml(form), [form])

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const copyAll = async () => {
    await navigator.clipboard.writeText(output)
    toast.success('Meta tags copied')
  }

  return (
    <ToolShell
      toolId="meta-tag-generator"
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={copyAll}
          aria-label="Copy all generated meta tags"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy all
        </Button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-border p-4 bg-background-secondary/40">
            <h3 className="text-sm font-semibold">Primary</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="meta-title">Title</Label>
                <Input id="meta-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="meta-desc">Description</Label>
                <Textarea
                  id="meta-desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="meta-keywords">Keywords</Label>
                <Input id="meta-keywords" value={form.keywords} onChange={(e) => set('keywords', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-author">Author</Label>
                <Input id="meta-author" value={form.author} onChange={(e) => set('author', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-charset">Charset</Label>
                <Input id="meta-charset" value={form.charset} onChange={(e) => set('charset', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="meta-viewport">Viewport</Label>
                <Input id="meta-viewport" value={form.viewport} onChange={(e) => set('viewport', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-robots">Robots</Label>
                <Input id="meta-robots" value={form.robots} onChange={(e) => set('robots', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-canonical">Canonical URL</Label>
                <Input
                  id="meta-canonical"
                  value={form.canonical}
                  onChange={(e) => set('canonical', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border p-4 bg-background-secondary/40">
            <h3 className="text-sm font-semibold">Open Graph</h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="og-title">og:title</Label>
                <Input id="og-title" value={form.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-desc">og:description</Label>
                <Textarea
                  id="og-desc"
                  value={form.ogDescription}
                  onChange={(e) => set('ogDescription', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-image">og:image</Label>
                <Input
                  id="og-image"
                  value={form.ogImage}
                  onChange={(e) => set('ogImage', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-url">og:url</Label>
                <Input
                  id="og-url"
                  value={form.ogUrl}
                  onChange={(e) => set('ogUrl', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-type">og:type</Label>
                <Input id="og-type" value={form.ogType} onChange={(e) => set('ogType', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border p-4 bg-background-secondary/40">
            <h3 className="text-sm font-semibold">Twitter</h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tw-card">twitter:card</Label>
                <Input
                  id="tw-card"
                  value={form.twitterCard}
                  onChange={(e) => set('twitterCard', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tw-title">twitter:title</Label>
                <Input
                  id="tw-title"
                  value={form.twitterTitle}
                  onChange={(e) => set('twitterTitle', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tw-desc">twitter:description</Label>
                <Textarea
                  id="tw-desc"
                  value={form.twitterDescription}
                  onChange={(e) => set('twitterDescription', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tw-image">twitter:image</Label>
                <Input
                  id="tw-image"
                  value={form.twitterImage}
                  onChange={(e) => set('twitterImage', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </section>
        </div>

        <OutputPanel value={output} language="html" title="Generated tags" minHeight="520px" />
      </div>
    </ToolShell>
  )
}
