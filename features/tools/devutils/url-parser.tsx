'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link2, Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const EXAMPLE = 'https://api.example.com:8080/v1/users?page=1&limit=10&sort=name#section'

type ParsedParts = {
  protocol: string
  hostname: string
  port: string
  pathname: string
  hash: string
  params: { key: string; value: string }[]
}

const EMPTY_PARTS: ParsedParts = {
  protocol: 'https',
  hostname: '',
  port: '',
  pathname: '/',
  hash: '',
  params: [],
}

function parseUrlString(raw: string): ParsedParts | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    const params: { key: string; value: string }[] = []
    u.searchParams.forEach((value, key) => {
      params.push({ key, value })
    })
    return {
      protocol: u.protocol.replace(/:$/, ''),
      hostname: u.hostname,
      port: u.port || '',
      pathname: u.pathname || '/',
      hash: u.hash.replace(/^#/, ''),
      params,
    }
  } catch {
    return null
  }
}

function rebuildUrl(parts: ParsedParts): string {
  const proto = parts.protocol.replace(/:$/, '')
  const host =
    parts.port && !['80', '443'].includes(parts.port)
      ? `${parts.hostname}:${parts.port}`
      : parts.hostname
  const search =
    parts.params.length > 0
      ? `?${parts.params
          .filter((p) => p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')}`
      : ''
  const path = parts.pathname.startsWith('/') ? parts.pathname : `/${parts.pathname}`
  const hashPart = parts.hash ? `#${parts.hash.replace(/^#/, '')}` : ''
  return `${proto}://${host}${path}${search}${hashPart}`
}

export function UrlParser() {
  const [rawUrl, setRawUrl] = useState(EXAMPLE)
  const [parts, setParts] = useState<ParsedParts>(() => parseUrlString(EXAMPLE)!)
  const [parseError, setParseError] = useState('')

  const applyRaw = useCallback((next: string) => {
    setRawUrl(next)
    if (!next.trim()) {
      setParts(EMPTY_PARTS)
      setParseError('')
      return
    }
    const p = parseUrlString(next)
    if (p) {
      setParts(p)
      setParseError('')
    } else {
      setParseError('Invalid URL')
    }
  }, [])

  const updatePart = useCallback(
    <K extends keyof ParsedParts>(key: K, value: ParsedParts[K]) => {
      setParts((prev) => {
        const next = { ...prev, [key]: value }
        queueMicrotask(() => {
          setRawUrl(rebuildUrl(next))
          setParseError('')
        })
        return next
      })
    },
    [],
  )

  const origin = useMemo(() => {
    const p = parts.protocol
    const defaultPort = p === 'https' ? '443' : p === 'http' ? '80' : ''
    const port = parts.port && parts.port !== defaultPort ? `:${parts.port}` : ''
    return `${p}://${parts.hostname}${port}`
  }, [parts])

  const setParam = (index: number, field: 'key' | 'value', val: string) => {
    setParts((prev) => {
      const nextParams = prev.params.map((row, i) =>
        i === index ? { ...row, [field]: val } : row,
      )
      const next = { ...prev, params: nextParams }
      queueMicrotask(() => setRawUrl(rebuildUrl(next)))
      return next
    })
  }

  const addParam = () => {
    setParts((prev) => {
      const next = { ...prev, params: [...prev.params, { key: '', value: '' }] }
      queueMicrotask(() => setRawUrl(rebuildUrl(next)))
      return next
    })
  }

  const removeParam = (index: number) => {
    setParts((prev) => {
      const next = { ...prev, params: prev.params.filter((_, i) => i !== index) }
      queueMicrotask(() => setRawUrl(rebuildUrl(next)))
      return next
    })
  }

  const copyUrl = async () => {
    await navigator.clipboard.writeText(rawUrl)
    toast.success('URL copied')
  }

  return (
    <ToolShell toolId="url-parser">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="space-y-2">
          <Label htmlFor="url-input">URL</Label>
          <div className="flex gap-2">
            <Input
              id="url-input"
              value={rawUrl}
              onChange={(e) => applyRaw(e.target.value)}
              className="font-mono text-sm"
              placeholder="https://…"
            />
            <Button type="button" variant="outline" size="icon" onClick={copyUrl} aria-label="Copy URL">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {parseError ? <p className="text-xs text-destructive">{parseError}</p> : null}
        </div>

        {!parseError && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fld-protocol">Protocol</Label>
                <Input
                  id="fld-protocol"
                  value={parts.protocol}
                  onChange={(e) => updatePart('protocol', e.target.value.replace(/:$/, ''))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fld-origin">Origin (read-only)</Label>
                <Input id="fld-origin" readOnly value={origin} className="font-mono bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fld-host">Hostname</Label>
                <Input
                  id="fld-host"
                  value={parts.hostname}
                  onChange={(e) => updatePart('hostname', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fld-port">Port</Label>
                <Input
                  id="fld-port"
                  value={parts.port}
                  onChange={(e) => updatePart('port', e.target.value.replace(/\D/g, ''))}
                  className="font-mono"
                  placeholder="8080"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fld-path">Pathname</Label>
                <Input
                  id="fld-path"
                  value={parts.pathname}
                  onChange={(e) => updatePart('pathname', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fld-hash">Hash (without #)</Label>
                <Input
                  id="fld-hash"
                  value={parts.hash}
                  onChange={(e) => updatePart('hash', e.target.value.replace(/^#/, ''))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Query parameters</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addParam}>
                  Add parameter
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Key</TableHead>
                      <TableHead className="w-[40%]">Value</TableHead>
                      <TableHead className="w-[80px] text-right"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.params.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">
                          No query parameters
                        </TableCell>
                      </TableRow>
                    ) : (
                      parts.params.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="p-2">
                            <Input
                              value={row.key}
                              onChange={(e) => setParam(i, 'key', e.target.value)}
                              className="font-mono h-8"
                              aria-label={`Query key ${i + 1}`}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={row.value}
                              onChange={(e) => setParam(i, 'value', e.target.value)}
                              className="font-mono h-8"
                              aria-label={`Query value ${i + 1}`}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive"
                              onClick={() => removeParam(i)}
                              aria-label={`Remove parameter ${i + 1}`}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm flex gap-2 items-start">
              <Link2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
              <p className="text-muted-foreground">
                Edits to the fields above rebuild the URL string. Changing the top URL re-parses all parts.
              </p>
            </div>
          </>
        )}
      </div>
    </ToolShell>
  )
}
