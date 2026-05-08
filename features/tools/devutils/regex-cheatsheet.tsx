'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Search } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

type Entry = {
  pattern: string
  description: string
  category: string
  /** Paste-ready regex fragment */
  copyText: string
  /** Sample haystack */
  sample: string
  /** Regex source (with flags below) for highlighting */
  matchSource: string
  matchFlags?: string
}

const ENTRIES: Entry[] = [
  { category: 'Character classes', pattern: '.', description: 'Any character except newline (default)', copyText: '.', sample: 'a.c matches abc', matchSource: 'a.c', matchFlags: '' },
  { category: 'Character classes', pattern: '\\d', description: 'Digit', copyText: '\\d', sample: 'id-42-end', matchSource: '\\d\\d', matchFlags: '' },
  { category: 'Character classes', pattern: '\\w', description: 'Word character', copyText: '\\w+', sample: 'user_name@host', matchSource: '\\w+', matchFlags: '' },
  { category: 'Character classes', pattern: '\\s', description: 'Whitespace', copyText: '\\s', sample: 'a b', matchSource: '\\s', matchFlags: '' },
  { category: 'Character classes', pattern: '[abc]', description: 'Character set', copyText: '[aeiou]', sample: 'hello', matchSource: '[aeiou]', matchFlags: 'gi' },
  { category: 'Character classes', pattern: '[^abc]', description: 'Negated set', copyText: '[^0-9]', sample: 'abc123', matchSource: '[^0-9]+', matchFlags: '' },
  { category: 'Character classes', pattern: '[a-z]', description: 'Range', copyText: '[A-Za-z]', sample: 'Hi5', matchSource: '[A-Za-z]+', matchFlags: '' },
  { category: 'Anchors', pattern: '^', description: 'Start', copyText: '^https', sample: 'https://x', matchSource: '^https', matchFlags: '' },
  { category: 'Anchors', pattern: '$', description: 'End', copyText: '\\.png$', sample: 'file.png', matchSource: '\\.png$', matchFlags: '' },
  { category: 'Anchors', pattern: '\\b', description: 'Word boundary', copyText: '\\bcat\\b', sample: 'the cat sat', matchSource: '\\bcat\\b', matchFlags: '' },
  { category: 'Quantifiers', pattern: '*', description: '0 or more', copyText: 'a*', sample: 'bbaaa', matchSource: 'a*', matchFlags: '' },
  { category: 'Quantifiers', pattern: '+', description: '1 or more', copyText: '\\d+', sample: 'order 90210', matchSource: '\\d+', matchFlags: '' },
  { category: 'Quantifiers', pattern: '?', description: '0 or 1', copyText: 'https?', sample: 'http://x', matchSource: 'https?', matchFlags: '' },
  { category: 'Quantifiers', pattern: '{n}', description: 'Exactly n', copyText: '\\d{4}', sample: 'year 1999', matchSource: '\\d{4}', matchFlags: '' },
  { category: 'Quantifiers', pattern: '{n,}', description: 'At least n', copyText: '\\w{3,}', sample: 'a ab abc abcd', matchSource: '\\w{3,}', matchFlags: '' },
  { category: 'Quantifiers', pattern: '{n,m}', description: 'Between n and m', copyText: '\\d{1,3}', sample: '12 9 1024', matchSource: '\\d{1,3}', matchFlags: '' },
  { category: 'Quantifiers', pattern: '*?', description: 'Lazy star', copyText: '<.*?>', sample: '<a><b></b></a>', matchSource: '<.*?>', matchFlags: '' },
  { category: 'Groups', pattern: '( )', description: 'Capturing group', copyText: '(\\w+)@(\\w+)', sample: 'a@b', matchSource: '(\\w+)@(\\w+)', matchFlags: '' },
  { category: 'Groups', pattern: '(?: )', description: 'Non-capturing group', copyText: '(?:https|http)', sample: 'https://ok', matchSource: '(?:https|http)', matchFlags: '' },
  { category: 'Groups', pattern: '|', description: 'Alternation', copyText: 'cat|dog', sample: 'dogma', matchSource: 'cat|dog', matchFlags: '' },
  { category: 'Lookahead / lookbehind', pattern: '(?=)', description: 'Positive lookahead', copyText: 'foo(?=bar)', sample: 'foobar', matchSource: 'foo(?=bar)', matchFlags: '' },
  { category: 'Lookahead / lookbehind', pattern: '(?! )', description: 'Negative lookahead', copyText: '\\d(?!\\d)', sample: '5a', matchSource: '\\d(?!\\d)', matchFlags: '' },
  { category: 'Lookahead / lookbehind', pattern: '(?<=)', description: 'Positive lookbehind', copyText: '(?<=@)\\w+', sample: 'x@dev', matchSource: '(?<=@)\\w+', matchFlags: '' },
  { category: 'Flags', pattern: 'i', description: 'Case-insensitive flag', copyText: '(?i)^start', sample: 'START', matchSource: '^start', matchFlags: 'i' },
  { category: 'Flags', pattern: 'g', description: 'Global flag — all matches', copyText: '/\\d+/g', sample: '1 and 22', matchSource: '\\d+', matchFlags: 'g' },
  { category: 'Flags', pattern: 'm', description: 'Multiline ^ $', copyText: '(?m)^#.+', sample: '# a\n# b', matchSource: '^#.+', matchFlags: 'm' },
  { category: 'Common patterns', pattern: 'Email (simple)', description: 'Practical loose validation', copyText: '[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}', sample: 'hi@mail.co', matchSource: '[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}', matchFlags: 'i' },
  { category: 'Common patterns', pattern: 'URL', description: 'http(s) prefix', copyText: 'https?://[^\\s]+', sample: 'See https://a.io/x ok', matchSource: 'https?://[^\\s]+', matchFlags: 'i' },
  { category: 'Common patterns', pattern: 'IPv4', description: 'Dotted quad', copyText: '(?:\\d{1,3}\\.){3}\\d{1,3}', sample: '10.0.0.1', matchSource: '(?:\\d{1,3}\\.){3}\\d{1,3}', matchFlags: '' },
  { category: 'Common patterns', pattern: 'Hex color', description: '#RGB or #RRGGBB', copyText: '#(?:[0-9a-fA-F]{3}){1,2}\\b', sample: '#abc #aabbcc', matchSource: '#(?:[0-9a-fA-F]{3}){1,2}\\b', matchFlags: '' },
  { category: 'Common patterns', pattern: 'UUID v4', description: 'Standard UUID shape', copyText: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', sample: 'bfcfe5f4-2c6d-4d6a-9c9a-4b9d0b3c1a6f', matchSource: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', matchFlags: 'i' },
]

function Highlighted({ text, source, flags }: { text: string; source: string; flags: string }) {
  try {
    const re = new RegExp(source, flags)
    const m = re.exec(text)
    if (!m || m.index === undefined) return <span className="text-muted-foreground">{text}</span>
    return (
      <span className="text-muted-foreground">
        {text.slice(0, m.index)}
        <mark className="bg-primary/35 text-foreground rounded px-0.5">{text.slice(m.index, m.index + m[0].length)}</mark>
        {text.slice(m.index + m[0].length)}
      </span>
    )
  } catch {
    return <span className="text-muted-foreground">{text}</span>
  }
}

export function RegexCheatsheet() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return ENTRIES
    return ENTRIES.filter(
      (e) =>
        e.pattern.toLowerCase().includes(s) ||
        e.description.toLowerCase().includes(s) ||
        e.category.toLowerCase().includes(s) ||
        e.copyText.toLowerCase().includes(s),
    )
  }, [q])

  const byCat = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of filtered) {
      const list = m.get(e.category) ?? []
      list.push(e)
      m.set(e.category, list)
    }
    return [...m.entries()]
  }, [filtered])

  return (
    <ToolShell toolId="regex-cheatsheet">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="regex-sheet-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              id="regex-sheet-search"
              className="pl-9"
              placeholder="digit, lookahead, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[min(70vh,720px)]">
          <div className="space-y-8 pr-4">
            {byCat.map(([cat, rows]) => (
              <section key={cat}>
                <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                  {cat}
                </h2>
                <div className="grid gap-3">
                  {rows.map((e) => (
                    <div
                      key={`${cat}-${e.pattern}-${e.copyText}`}
                      className="rounded-xl border border-border bg-background-secondary/60 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="flex-1 space-y-1 min-w-0">
                        <code className="text-sm font-mono text-primary block break-all">{e.pattern}</code>
                        <p className="text-sm text-muted-foreground">{e.description}</p>
                        <p className="text-xs font-mono break-all text-muted-foreground/90">
                          <span className="text-muted-foreground/70 mr-1">Sample:</span>
                          <Highlighted text={e.sample} source={e.matchSource} flags={e.matchFlags ?? ''} />
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 break-all">
                          copy: {e.copyText}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="shrink-0 font-mono text-xs"
                        onClick={() => {
                          void navigator.clipboard.writeText(e.copyText)
                          toast.success('Pattern copied')
                        }}
                        aria-label={`Copy regex ${e.pattern}`}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </div>
    </ToolShell>
  )
}
