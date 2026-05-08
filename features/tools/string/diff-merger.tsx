'use client'

import { useCallback, useMemo, useState } from 'react'
import { diffLines } from 'diff'
import { Check, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const DEFAULT_ORIGINAL = `Project Phoenix
===============
Owner: Taylor Morgan
Status: planning

Milestones:
- Kickoff — Week 12
- Beta — Week 20
- Launch — Week 26

Notes:
Use the legacy billing adapter until gateway v2 ships.`

const DEFAULT_MODIFIED = `Project Phoenix
===============
Owner: Taylor Morgan
Status: active

Milestones:
- Kickoff — Week 11
- Beta — Week 21
- Launch — Week 26

Notes:
Switch to gateway v2 as soon as certificates are pinned in staging.`

type Decision = 'accept' | 'reject'

function assignHunkIds(diff: ReturnType<typeof diffLines>) {
  const ids: number[] = []
  let next = 0
  for (const p of diff) {
    if (p.added || p.removed) {
      ids.push(next)
      next++
    } else {
      ids.push(-1)
    }
  }
  return ids
}

function buildMerged(
  diff: ReturnType<typeof diffLines>,
  ids: number[],
  decisions: Record<number, Decision>,
): string {
  let out = ''
  for (let i = 0; i < diff.length; i++) {
    const p = diff[i]!
    const id = ids[i]!
    if (!p.added && !p.removed) {
      out += p.value
      continue
    }
    const d: Decision = decisions[id] ?? 'accept'
    if (p.removed) {
      if (d === 'reject') out += p.value
    } else if (p.added) {
      if (d === 'accept') out += p.value
    }
  }
  return out
}

export function DiffMerger() {
  const [original, setOriginal] = useState(DEFAULT_ORIGINAL)
  const [modified, setModified] = useState(DEFAULT_MODIFIED)
  const [decisions, setDecisions] = useState<Record<number, Decision>>({})

  const { diff, ids, hunkSummaries } = useMemo(() => {
    const d = diffLines(original, modified)
    const hunkIds = assignHunkIds(d)
    const summaries: { id: number; removed?: string; added?: string }[] = []
    for (let i = 0; i < d.length; i++) {
      const p = d[i]!
      const id = hunkIds[i]!
      if (id < 0) continue
      summaries.push({
        id,
        ...(p.removed ? { removed: p.value } : {}),
        ...(p.added ? { added: p.value } : {}),
      })
    }
    return { diff: d, ids: hunkIds, hunkSummaries: summaries }
  }, [original, modified])

  const result = useMemo(
    () => buildMerged(diff, ids, decisions),
    [diff, ids, decisions],
  )

  const setDecision = useCallback((id: number, value: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: value }))
  }, [])

  const resetDecisions = useCallback(() => setDecisions({}), [])

  const acceptAll = useCallback(() => {
    const next: Record<number, Decision> = {}
    for (const id of ids) {
      if (id >= 0) next[id] = 'accept'
    }
    setDecisions(next)
    toast.success('All changes accepted')
  }, [ids])

  const rejectAll = useCallback(() => {
    const next: Record<number, Decision> = {}
    for (const id of ids) {
      if (id >= 0) next[id] = 'reject'
    }
    setDecisions(next)
    toast.success('All changes rejected (keeps original)')
  }, [ids])

  return (
    <ToolShell toolId="diff-merger">
      <div className="flex flex-col gap-4 xl:gap-6 h-full min-h-0">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[280px] flex-1">
          <EditorPanel
            title="Original"
            value={original}
            onChange={setOriginal}
            language="plaintext"
            placeholder="Original text…"
            minHeight="260px"
          />
          <EditorPanel
            title="Modified"
            value={modified}
            onChange={setModified}
            language="plaintext"
            placeholder="Modified text…"
            minHeight="260px"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 flex-1">
          <div className="flex flex-col gap-2 border border-border rounded-lg bg-background-secondary min-h-[240px] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Line diff</span>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={acceptAll}>
                  <Check className="h-3 w-3 mr-1" />
                  Accept all
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={rejectAll}>
                  <X className="h-3 w-3 mr-1" />
                  Reject all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={resetDecisions}
                  aria-label="Reset merge decisions to defaults"
                  title="Reset decisions"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 max-h-[320px]">
              <div className="p-3 font-mono text-xs space-y-0">
                {diff.map((part, index) => {
                  const lines = part.value.split('\n').filter((line, i, arr) => !(i === arr.length - 1 && line === ''))
                  return lines.map((line, lineIndex) => (
                    <div
                      key={`${index}-${lineIndex}`}
                      className={cn(
                        'flex gap-2 px-1 py-0.5 rounded-sm',
                        part.added && 'bg-success/15 text-success-foreground',
                        part.removed && 'bg-destructive/15 text-destructive-foreground',
                        !part.added && !part.removed && 'text-muted-foreground',
                      )}
                    >
                      <span className="w-4 shrink-0 text-muted-foreground/60 select-none">
                        {part.added ? '+' : part.removed ? '-' : ' '}
                      </span>
                      <span className="min-w-0 break-all">{line || ' '}</span>
                    </div>
                  ))
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2 min-h-[240px]">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
              Changes ({hunkSummaries.length})
            </span>
            <ScrollArea className="flex-1 rounded-lg border border-border max-h-[320px]">
              <div className="p-3 space-y-3">
                {hunkSummaries.length === 0 && (
                  <p className="text-sm text-muted-foreground">No differences — texts are identical.</p>
                )}
                {hunkSummaries.map((h) => {
                  const state: Decision = decisions[h.id] ?? 'accept'
                  return (
                    <div
                      key={h.id}
                      className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Change #{h.id + 1}</span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={state === 'accept' ? 'secondary' : 'ghost'}
                            className="h-7 text-xs"
                            onClick={() => setDecision(h.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={state === 'reject' ? 'secondary' : 'ghost'}
                            className="h-7 text-xs"
                            onClick={() => setDecision(h.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                      {h.removed && (
                        <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-destructive/10 p-2 text-destructive-foreground/90 max-h-24 overflow-auto">
                          {h.removed.trimEnd()}
                        </pre>
                      )}
                      {h.added && (
                        <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-success/10 p-2 text-success-foreground max-h-24 overflow-auto">
                          {h.added.trimEnd()}
                        </pre>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <OutputPanel title="Merged result" value={result} language="plaintext" minHeight="220px" />
      </div>
    </ToolShell>
  )
}
