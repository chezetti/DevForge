'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Brain,
  Calculator,
  Check,
  Eye,
  RefreshCw,
  Search,
  Unlock,
  Wrench,
} from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const API_URL = 'https://models.dev/api.json'

interface ApiModel {
  id: string
  name: string
  family?: string
  reasoning?: boolean
  tool_call?: boolean
  attachment?: boolean
  open_weights?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: { input?: string[]; output?: string[] }
  limit?: { context?: number; output?: number }
  cost?: { input?: number; output?: number; cache_read?: number; cache_write?: number }
}

interface ApiProvider {
  id: string
  name: string
  models: Record<string, ApiModel>
}

interface Model extends ApiModel {
  providerId: string
  providerName: string
}

const SAMPLE: Model[] = [
  {
    providerId: 'anthropic',
    providerName: 'Anthropic',
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    reasoning: true,
    tool_call: true,
    attachment: true,
    open_weights: false,
    knowledge: '2025-03',
    release_date: '2025-05',
    modalities: { input: ['text', 'image'], output: ['text'] },
    limit: { context: 200000, output: 32000 },
    cost: { input: 15, output: 75 },
  },
  {
    providerId: 'openai',
    providerName: 'OpenAI',
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    reasoning: false,
    tool_call: true,
    attachment: true,
    open_weights: false,
    knowledge: '2023-10',
    release_date: '2024-07',
    modalities: { input: ['text', 'image'], output: ['text'] },
    limit: { context: 128000, output: 16384 },
    cost: { input: 0.15, output: 0.6 },
  },
  {
    providerId: 'meta',
    providerName: 'Meta',
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    reasoning: false,
    tool_call: true,
    attachment: false,
    open_weights: true,
    knowledge: '2023-12',
    release_date: '2024-12',
    modalities: { input: ['text'], output: ['text'] },
    limit: { context: 128000, output: 8192 },
    cost: { input: 0.2, output: 0.2 },
  },
]

type CapabilityKey = 'reasoning' | 'tool_call' | 'attachment' | 'open_weights'

const CAPABILITIES: { key: CapabilityKey; label: string; icon: typeof Brain }[] = [
  { key: 'reasoning', label: 'Reasoning', icon: Brain },
  { key: 'tool_call', label: 'Tools', icon: Wrench },
  { key: 'attachment', label: 'Vision', icon: Eye },
  { key: 'open_weights', label: 'Open weights', icon: Unlock },
]

type SortKey = 'release' | 'context' | 'input' | 'output' | 'name'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'release', label: 'Newest' },
  { key: 'context', label: 'Largest context' },
  { key: 'input', label: 'Cheapest input' },
  { key: 'output', label: 'Cheapest output' },
  { key: 'name', label: 'Name (A–Z)' },
]

interface Metric {
  key: string
  label: string
  read: (m: Model, est: CostEstimate) => string
}

interface CostEstimate {
  inputTokens: number
  outputTokens: number
}

function num(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

function cost(value?: number): string {
  if (value === undefined || value === null) return 'Free'
  if (value === 0) return 'Free'
  return `$${value < 1 ? value.toFixed(3) : value.toFixed(2)}`
}

function modality(m: Model): string {
  const inp = m.modalities?.input?.join('+') || 'text'
  const out = m.modalities?.output?.join('+') || 'text'
  return `${inp} → ${out}`
}

function estimateCost(m: Model, est: CostEstimate): string {
  const ci = m.cost?.input
  const co = m.cost?.output
  if (ci === undefined && co === undefined) return 'Free'
  const total = ((ci ?? 0) * est.inputTokens + (co ?? 0) * est.outputTokens) / 1_000_000
  if (total === 0) return 'Free'
  return `$${total < 0.01 ? total.toFixed(5) : total.toFixed(4)}`
}

const METRICS: Metric[] = [
  { key: 'provider', label: 'Provider', read: (m) => m.providerName },
  { key: 'id', label: 'Model ID', read: (m) => `${m.providerId}/${m.id}` },
  { key: 'context', label: 'Context', read: (m) => `${num(m.limit?.context)} tokens` },
  { key: 'output', label: 'Max output', read: (m) => `${num(m.limit?.output)} tokens` },
  { key: 'input_cost', label: 'Input / 1M', read: (m) => cost(m.cost?.input) },
  { key: 'output_cost', label: 'Output / 1M', read: (m) => cost(m.cost?.output) },
  { key: 'cache', label: 'Cache read / 1M', read: (m) => cost(m.cost?.cache_read) },
  { key: 'estimate', label: 'Est. cost / call', read: (m, est) => estimateCost(m, est) },
  { key: 'modality', label: 'Modality', read: (m) => modality(m) },
  {
    key: 'capabilities',
    label: 'Capabilities',
    read: (m) =>
      CAPABILITIES.filter((c) => m[c.key]).map((c) => c.label).join(', ') || '—',
  },
  { key: 'knowledge', label: 'Knowledge cutoff', read: (m) => m.knowledge ?? '—' },
  { key: 'release', label: 'Released', read: (m) => m.release_date ?? '—' },
]

const DEFAULT_METRICS = new Set([
  'provider',
  'context',
  'input_cost',
  'output_cost',
  'estimate',
  'modality',
  'capabilities',
])

export function AiModelCompare() {
  const [models, setModels] = useState<Model[]>(SAMPLE)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('Sample data')
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState('all')
  const [sort, setSort] = useState<SortKey>('release')
  const [activeCaps, setActiveCaps] = useState<Set<CapabilityKey>>(new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [enabledMetrics, setEnabledMetrics] = useState<Set<string>>(new Set(DEFAULT_METRICS))
  const [inputK, setInputK] = useState('10')
  const [outputK, setOutputK] = useState('2')

  const estimate: CostEstimate = useMemo(
    () => ({
      inputTokens: Math.max(0, Number(inputK) || 0) * 1000,
      outputTokens: Math.max(0, Number(outputK) || 0) * 1000,
    }),
    [inputK, outputK],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`models.dev returned ${res.status}`)
      const data = (await res.json()) as Record<string, ApiProvider>
      const list: Model[] = []
      for (const [pid, p] of Object.entries(data)) {
        if (!p?.models) continue
        for (const m of Object.values(p.models)) {
          list.push({ ...m, providerId: pid, providerName: p.name || pid })
        }
      }
      if (!list.length) throw new Error('No models returned')
      setModels(list)
      setLastUpdated(new Date().toLocaleString())
      toast.success(`Loaded ${list.length} models from models.dev`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load models')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const providers = useMemo(() => {
    const map = new Map<string, string>()
    models.forEach((m) => map.set(m.providerId, m.providerName))
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [models])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = models.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.providerName.toLowerCase().includes(q)
      const matchesProvider = provider === 'all' || m.providerId === provider
      const matchesCaps = Array.from(activeCaps).every((c) => m[c])
      return matchesQuery && matchesProvider && matchesCaps
    })
    result.sort((a, b) => {
      switch (sort) {
        case 'context':
          return (b.limit?.context ?? 0) - (a.limit?.context ?? 0)
        case 'input':
          return (a.cost?.input ?? Infinity) - (b.cost?.input ?? Infinity)
        case 'output':
          return (a.cost?.output ?? Infinity) - (b.cost?.output ?? Infinity)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'release':
        default:
          return (b.release_date ?? '').localeCompare(a.release_date ?? '')
      }
    })
    return result
  }, [models, query, provider, activeCaps, sort])

  const selectedModels = useMemo(
    () =>
      selectedIds
        .map((id) => models.find((m) => `${m.providerId}/${m.id}` === id))
        .filter(Boolean) as Model[],
    [models, selectedIds],
  )

  const toggleCap = (key: CapabilityKey) => {
    setActiveCaps((curr) => {
      const next = new Set(curr)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleMetric = (key: string) => {
    setEnabledMetrics((curr) => {
      const next = new Set(curr)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleModel = (key: string) => {
    setSelectedIds((curr) =>
      curr.includes(key) ? curr.filter((id) => id !== key) : [...curr, key].slice(-4),
    )
  }

  const visibleMetrics = METRICS.filter((m) => enabledMetrics.has(m.key))

  return (
    <ToolShell
      toolId="ai-model-compare"
      showHistory={false}
      actions={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden />
          Refresh
        </Button>
      }
    >
      <div className="flex h-full min-h-[640px] flex-col gap-4">
        {/* Filters */}
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model or provider"
              className="pl-9"
              aria-label="Search models"
            />
          </div>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger aria-label="Provider">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sort by">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Capability filters + cost estimator inputs */}
        <div className="flex flex-wrap items-center gap-2">
          {CAPABILITIES.map((c) => {
            const active = activeCaps.has(c.key)
            const Icon = c.icon
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCap(c.key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary/50 bg-primary/15 text-foreground'
                    : 'border-input text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {c.label}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" aria-hidden />
            <Label htmlFor="est-in" className="text-xs">
              In
            </Label>
            <Input
              id="est-in"
              value={inputK}
              onChange={(e) => setInputK(e.target.value.replace(/[^\d.]/g, ''))}
              inputMode="decimal"
              className="h-7 w-16 px-2 text-xs no-spin"
              aria-label="Input tokens (thousands)"
            />
            <Label htmlFor="est-out" className="text-xs">
              Out
            </Label>
            <Input
              id="est-out"
              value={outputK}
              onChange={(e) => setOutputK(e.target.value.replace(/[^\d.]/g, ''))}
              inputMode="decimal"
              className="h-7 w-16 px-2 text-xs no-spin"
              aria-label="Output tokens (thousands)"
            />
            <span className="tabular-nums">K tokens/call</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-muted-foreground tabular-nums">
            {filtered.length} of {models.length} models · {lastUpdated}
          </span>
          <span className="text-muted-foreground">Pick up to 4 models to compare</span>
        </div>

        {/* Comparison */}
        {selectedModels.length > 0 && (
          <div className="rounded-lg glass-panel">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
              <span className="text-sm font-medium">Comparison</span>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {METRICS.map((m) => {
                  const on = enabledMetrics.has(m.key)
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleMetric(m.key)}
                      aria-pressed={on}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[11px] transition-colors',
                        on
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-input text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {selectedModels.map((m) => (
                      <TableHead key={`${m.providerId}/${m.id}`}>{m.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMetrics.map((metric) => (
                    <TableRow key={metric.key}>
                      <TableCell className="font-medium whitespace-nowrap">{metric.label}</TableCell>
                      {selectedModels.map((m) => (
                        <TableCell
                          key={`${m.providerId}/${m.id}`}
                          className="max-w-[280px] whitespace-normal font-mono text-xs tabular-nums"
                        >
                          {metric.read(m, estimate)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Model list */}
        <div className="min-h-0 flex-1 rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Pick</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead className="text-right">In / 1M</TableHead>
                <TableHead className="text-right">Out / 1M</TableHead>
                <TableHead className="text-right">Est / call</TableHead>
                <TableHead>Capabilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const key = `${m.providerId}/${m.id}`
                const selected = selectedIds.includes(key)
                return (
                  <TableRow key={key} data-state={selected ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleModel(key)}
                        aria-label={`Compare ${m.name}`}
                      />
                    </TableCell>
                    <TableCell className="min-w-[240px] whitespace-normal">
                      <button
                        type="button"
                        onClick={() => toggleModel(key)}
                        className="text-left font-medium hover:underline"
                      >
                        {m.name}
                      </button>
                      <div className="font-mono text-xs text-muted-foreground">{key}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {num(m.limit?.context)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{cost(m.cost?.input)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{cost(m.cost?.output)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {estimateCost(m, estimate)}
                    </TableCell>
                    <TableCell className="min-w-[180px] whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {CAPABILITIES.filter((c) => m[c.key]).map((c) => (
                          <Badge key={c.key} variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" aria-hidden />
                            {c.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </ToolShell>
  )
}
