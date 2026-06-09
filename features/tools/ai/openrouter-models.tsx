'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface OpenRouterModel {
  id: string
  name: string
  created?: number
  description?: string
  context_length?: number
  architecture?: {
    tokenizer?: string
    modality?: string
    input_modalities?: string[]
    output_modalities?: string[]
    instruct_type?: string | null
  }
  pricing?: {
    prompt?: string
    completion?: string
    request?: string
    image?: string
    web_search?: string
    internal_reasoning?: string
    input_cache_read?: string
    input_cache_write?: string
  }
  top_provider?: {
    context_length?: number
    max_completion_tokens?: number
    is_moderated?: boolean
  }
  supported_parameters?: string[]
}

const sampleModels: OpenRouterModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast general-purpose model for everyday text and multimodal tasks.',
    context_length: 128000,
    architecture: { tokenizer: 'GPT', modality: 'text+image->text', input_modalities: ['text', 'image'], output_modalities: ['text'] },
    pricing: { prompt: '0.00000015', completion: '0.0000006', request: '0' },
    top_provider: { max_completion_tokens: 16384, is_moderated: true },
    supported_parameters: ['tools', 'temperature', 'top_p', 'response_format', 'structured_outputs'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced reasoning, coding and writing model.',
    context_length: 200000,
    architecture: { tokenizer: 'Claude', modality: 'text+image->text', input_modalities: ['text', 'image'], output_modalities: ['text'] },
    pricing: { prompt: '0.000003', completion: '0.000015', request: '0' },
    top_provider: { max_completion_tokens: 8192, is_moderated: false },
    supported_parameters: ['tools', 'temperature', 'top_p', 'max_tokens'],
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    description: 'Low-latency model with long context.',
    context_length: 1000000,
    architecture: { tokenizer: 'Gemini', modality: 'text+image->text', input_modalities: ['text', 'image'], output_modalities: ['text'] },
    pricing: { prompt: '0.000000075', completion: '0.0000003', request: '0' },
    top_provider: { max_completion_tokens: 8192, is_moderated: false },
    supported_parameters: ['tools', 'temperature', 'top_p', 'response_format'],
  },
]

function formatNumber(value?: number): string {
  if (!value) return '-'
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPerMillion(value?: string): string {
  const price = Number(value ?? 0)
  if (!Number.isFinite(price) || price === 0) return 'Free'
  // OpenRouter uses negative sentinels (e.g. -1) for router/variable pricing.
  if (price < 0) return 'Variable'
  return `$${(price * 1_000_000).toFixed(price * 1_000_000 < 1 ? 3 : 2)}`
}

function formatRequest(value?: string): string {
  const price = Number(value ?? 0)
  if (!Number.isFinite(price) || price === 0) return 'Free'
  if (price < 0) return 'Variable'
  return `$${price.toFixed(6)}`
}

function getProvider(id: string): string {
  return id.includes('/') ? id.split('/')[0] : 'unknown'
}

export function OpenRouterModels() {
  const [models, setModels] = useState<OpenRouterModel[]>(sampleModels)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState('all')
  const [capability, setCapability] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('Sample data')

  const loadModels = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models?output_modalities=all')
      if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`)
      const payload = (await response.json()) as { data?: OpenRouterModel[] }
      const nextModels = payload.data ?? []
      if (!nextModels.length) throw new Error('No models returned')
      setModels(nextModels)
      setLastUpdated(new Date().toLocaleString())
      toast.success(`Loaded ${nextModels.length} models`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load OpenRouter models')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadModels()
  }, [loadModels])

  const providers = useMemo(() => {
    return Array.from(new Set(models.map((model) => getProvider(model.id)))).sort((a, b) => a.localeCompare(b))
  }, [models])

  const capabilities = useMemo(() => {
    return Array.from(new Set(models.flatMap((model) => model.supported_parameters ?? []))).sort((a, b) => a.localeCompare(b))
  }, [models])

  const filteredModels = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return models
      .filter((model) => {
        const matchesQuery =
          !normalized ||
          model.name.toLowerCase().includes(normalized) ||
          model.id.toLowerCase().includes(normalized) ||
          (model.description ?? '').toLowerCase().includes(normalized)
        const matchesProvider = provider === 'all' || getProvider(model.id) === provider
        const matchesCapability = capability === 'all' || (model.supported_parameters ?? []).includes(capability)
        return matchesQuery && matchesProvider && matchesCapability
      })
      .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
  }, [capability, models, provider, query])

  const selectedModels = useMemo(() => {
    return selectedIds.map((id) => models.find((model) => model.id === id)).filter(Boolean) as OpenRouterModel[]
  }, [models, selectedIds])

  const toggleModel = (modelId: string) => {
    setSelectedIds((current) =>
      current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId].slice(-4),
    )
  }

  return (
    <ToolShell
      toolId="openrouter-models"
      showHistory={false}
      actions={
        <Button variant="outline" size="sm" onClick={loadModels} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </Button>
      }
    >
      <div className="flex h-full min-h-[640px] flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model, provider or description" className="pl-9" />
          </div>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={capability} onValueChange={setCapability}>
            <SelectTrigger>
              <SelectValue placeholder="Capability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All capabilities</SelectItem>
              {capabilities.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {filteredModels.length} of {models.length} models. Updated: {lastUpdated}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Select up to 4 models to compare
          </span>
        </div>

        {selectedModels.length > 0 && (
          <div className="rounded-lg border border-border">
            <div className="border-b border-border px-3 py-2 text-sm font-medium">Comparison</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {selectedModels.map((model) => (
                    <TableHead key={model.id}>{model.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ['Model ID', (model: OpenRouterModel) => model.id],
                  ['Context', (model: OpenRouterModel) => `${formatNumber(model.context_length)} tokens`],
                  ['Max output', (model: OpenRouterModel) => `${formatNumber(model.top_provider?.max_completion_tokens)} tokens`],
                  ['Input / 1M', (model: OpenRouterModel) => formatPerMillion(model.pricing?.prompt)],
                  ['Output / 1M', (model: OpenRouterModel) => formatPerMillion(model.pricing?.completion)],
                  ['Request', (model: OpenRouterModel) => formatRequest(model.pricing?.request)],
                  ['Tokenizer', (model: OpenRouterModel) => model.architecture?.tokenizer ?? '-'],
                  ['Modality', (model: OpenRouterModel) => model.architecture?.modality ?? '-'],
                  ['Parameters', (model: OpenRouterModel) => (model.supported_parameters ?? []).slice(0, 6).join(', ') || '-'],
                ].map(([label, read]) => (
                  <TableRow key={label as string}>
                    <TableCell className="font-medium">{label as string}</TableCell>
                    {selectedModels.map((model) => (
                      <TableCell key={model.id} className="max-w-[280px] whitespace-normal">
                        {(read as (model: OpenRouterModel) => string)(model)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="min-h-0 flex-1 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Pick</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Max output</TableHead>
                <TableHead>Input / 1M</TableHead>
                <TableHead>Output / 1M</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Capabilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const selected = selectedIds.includes(model.id)
                return (
                  <TableRow key={model.id} data-state={selected ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox checked={selected} onCheckedChange={() => toggleModel(model.id)} aria-label={`Compare ${model.name}`} />
                    </TableCell>
                    <TableCell className="min-w-[280px] whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => toggleModel(model.id)} className="text-left font-medium hover:underline">
                          {model.name}
                        </button>
                        <span className="font-mono text-xs text-muted-foreground">{model.id}</span>
                        {model.description && <span className="line-clamp-2 text-xs text-muted-foreground">{model.description}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{formatNumber(model.context_length)}</TableCell>
                    <TableCell className="font-mono">{formatNumber(model.top_provider?.max_completion_tokens)}</TableCell>
                    <TableCell className="font-mono">{formatPerMillion(model.pricing?.prompt)}</TableCell>
                    <TableCell className="font-mono">{formatPerMillion(model.pricing?.completion)}</TableCell>
                    <TableCell className="font-mono">{formatRequest(model.pricing?.request)}</TableCell>
                    <TableCell className="min-w-[260px] whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {(model.supported_parameters ?? []).slice(0, 5).map((item) => (
                          <Badge key={item} variant="secondary" className="gap-1">
                            {selected && item === 'tools' ? <Check className="h-3 w-3" aria-hidden /> : null}
                            {item}
                          </Badge>
                        ))}
                        {(model.supported_parameters ?? []).length > 5 && (
                          <Badge variant="outline">+{(model.supported_parameters ?? []).length - 5}</Badge>
                        )}
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
