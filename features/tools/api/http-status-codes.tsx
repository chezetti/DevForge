'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type Entry = { code: number; name: string; description: string }

const HTTP_STATUS_LIST: Entry[] = [
  { code: 100, name: 'Continue', description: 'Client should continue with request body.' },
  { code: 101, name: 'Switching Protocols', description: 'Server agrees to protocol upgrade (e.g. WebSocket).' },
  { code: 102, name: 'Processing', description: 'Request received; processing continues (WebDAV).' },
  { code: 103, name: 'Early Hints', description: 'Preload hints while preparing final response.' },
  { code: 200, name: 'OK', description: 'Request succeeded.' },
  { code: 201, name: 'Created', description: 'Resource created; often returns Location header.' },
  { code: 202, name: 'Accepted', description: 'Accepted for processing; not yet completed.' },
  { code: 204, name: 'No Content', description: 'Success with empty body.' },
  { code: 206, name: 'Partial Content', description: 'Range request fulfilled.' },
  { code: 301, name: 'Moved Permanently', description: 'Resource permanently moved to new URL.' },
  { code: 302, name: 'Found', description: 'Temporary redirect (historically "Moved Temporarily").' },
  { code: 303, name: 'See Other', description: 'Use GET on another URI.' },
  { code: 304, name: 'Not Modified', description: 'Cached version still valid.' },
  { code: 307, name: 'Temporary Redirect', description: 'Repeat request with same method to new URL.' },
  { code: 308, name: 'Permanent Redirect', description: 'Permanent redirect; repeat with same method.' },
  { code: 400, name: 'Bad Request', description: 'Malformed syntax or invalid framing.' },
  { code: 401, name: 'Unauthorized', description: 'Authentication required or failed.' },
  { code: 402, name: 'Payment Required', description: 'Reserved for future payment schemes.' },
  { code: 403, name: 'Forbidden', description: 'Authenticated but not allowed to access resource.' },
  { code: 404, name: 'Not Found', description: 'Resource does not exist at this URI.' },
  { code: 405, name: 'Method Not Allowed', description: 'HTTP method not supported for resource.' },
  { code: 406, name: 'Not Acceptable', description: 'Cannot satisfy Accept headers.' },
  { code: 408, name: 'Request Timeout', description: 'Server closed idle connection.' },
  { code: 409, name: 'Conflict', description: 'Conflict with current resource state.' },
  { code: 410, name: 'Gone', description: 'Resource existed but is permanently removed.' },
  { code: 413, name: 'Payload Too Large', description: 'Request body exceeds server limit.' },
  { code: 415, name: 'Unsupported Media Type', description: 'Content-Type not supported.' },
  { code: 418, name: "I'm a teapot", description: 'RFC 2324 humor; not a coffee server.' },
  { code: 422, name: 'Unprocessable Entity', description: 'Semantic validation errors (often JSON API).' },
  { code: 425, name: 'Too Early', description: 'Replay risk with early data (TLS 0-RTT).' },
  { code: 426, name: 'Upgrade Required', description: 'Switch to different protocol (e.g. TLS).' },
  { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded.' },
  { code: 500, name: 'Internal Server Error', description: 'Unexpected server-side failure.' },
  { code: 501, name: 'Not Implemented', description: 'Server does not recognize method.' },
  { code: 502, name: 'Bad Gateway', description: 'Invalid response from upstream gateway.' },
  { code: 503, name: 'Service Unavailable', description: 'Temporarily overloaded or down for maintenance.' },
  { code: 504, name: 'Gateway Timeout', description: 'Upstream server did not respond in time.' },
]

const CATEGORIES = [
  { key: '1xx', label: '1xx — Informational', pred: (c: number) => c >= 100 && c < 200 },
  { key: '2xx', label: '2xx — Success', pred: (c: number) => c >= 200 && c < 300 },
  { key: '3xx', label: '3xx — Redirection', pred: (c: number) => c >= 300 && c < 400 },
  { key: '4xx', label: '4xx — Client Error', pred: (c: number) => c >= 400 && c < 500 },
  { key: '5xx', label: '5xx — Server Error', pred: (c: number) => c >= 500 && c < 600 },
] as const

export function HttpStatusCodes() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.key, true]))
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HTTP_STATUS_LIST
    return HTTP_STATUS_LIST.filter(
      (e) =>
        String(e.code).includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <ToolShell toolId="http-status-codes" showHistory={false}>
      <div className="space-y-5 max-w-4xl">
        <div className="space-y-2">
          <Label htmlFor="http-search">Search codes or phrases</Label>
          <Input
            id="http-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="404, Not Found, redirect…"
          />
        </div>

        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const items = filtered.filter((e) => cat.pred(e.code))
            if (!items.length) return null
            const isOpen = open[cat.key] ?? true
            return (
              <Collapsible
                key={cat.key}
                open={isOpen}
                onOpenChange={(v) => setOpen((s) => ({ ...s, [cat.key]: v }))}
                className="rounded-lg border border-border bg-background-secondary overflow-hidden"
              >
                <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-medium text-sm">{cat.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {items.length} codes
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="border-t border-border divide-y divide-border/80 list-none p-0 m-0">
                    {items.map((e) => (
                      <li key={e.code}>
                        <Collapsible defaultOpen={false}>
                          <CollapsibleTrigger className="group flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 transition-transform group-data-[state=open]:rotate-90" />
                            <div className="font-mono text-sm font-semibold tabular-nums text-primary min-w-13">
                              {e.code}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{e.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                                Tap for details
                              </p>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-3 pl-13 sm:pl-24 pr-4 text-xs text-muted-foreground leading-relaxed border-t border-border/60 bg-muted/5">
                              {e.description}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No status codes match your search.
          </p>
        )}
      </div>
    </ToolShell>
  )
}
