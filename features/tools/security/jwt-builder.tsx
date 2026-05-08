'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const JWT_ALG = 'HS256' as const

function utf8ToBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signJwtHs256(payloadObj: Record<string, unknown>, secret: string) {
  const header = { alg: JWT_ALG, typ: 'JWT' }
  const headerPart = utf8ToBase64Url(JSON.stringify(header))
  const payloadPart = utf8ToBase64Url(JSON.stringify(payloadObj))
  const data = `${headerPart}.${payloadPart}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  const sigPart = bufferToBase64Url(sig)
  return {
    token: `${data}.${sigPart}`,
    headerPreview: JSON.stringify(header, null, 2),
    payloadPreview: JSON.stringify(payloadObj, null, 2),
  }
}

type ClaimType = 'string' | 'number' | 'boolean' | 'array'

interface ClaimRow {
  id: string
  key: string
  value: string
  type: ClaimType
}

let rowId = 0
function newRow(partial?: Partial<ClaimRow>): ClaimRow {
  return {
    id: `r-${++rowId}`,
    key: partial?.key ?? '',
    value: partial?.value ?? '',
    type: partial?.type ?? 'string',
  }
}

function parseValue(type: ClaimType, raw: string): unknown {
  const t = raw.trim()
  switch (type) {
    case 'string':
      return raw
    case 'number': {
      const n = Number(t)
      if (Number.isNaN(n)) throw new Error(`"${raw}" is not a number`)
      return n
    }
    case 'boolean':
      if (/^true$/i.test(t)) return true
      if (/^false$/i.test(t)) return false
      throw new Error('Boolean must be true or false')
    case 'array': {
      if (!t) return []
      try {
        const v = JSON.parse(t)
        if (!Array.isArray(v)) throw new Error('Not an array')
        return v
      } catch {
        throw new Error('Array must be valid JSON (e.g. [1,2,3])')
      }
    }
    default:
      return raw
  }
}

function rowsToPayload(rows: ClaimRow[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const r of rows) {
    const k = r.key.trim()
    if (!k) continue
    out[k] = parseValue(r.type, r.value)
  }
  return out
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function randomJti() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `jti-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const STATIC_PRESETS: Record<string, Record<string, { value: string; type: ClaimType }>> = {
  iss: { iss: { value: 'https://issuer.example.com', type: 'string' } },
  sub: { sub: { value: 'user_123', type: 'string' } },
  aud: { aud: { value: 'https://api.example.com', type: 'string' } },
}

type PresetKey = keyof typeof STATIC_PRESETS | 'exp' | 'iat' | 'nbf' | 'jti'

function buildPresetPatch(preset: PresetKey): Record<string, { value: string; type: ClaimType }> {
  if (preset === 'exp') {
    return { exp: { value: String(Math.floor(Date.now() / 1000) + 3600), type: 'number' } }
  }
  if (preset === 'iat') {
    return { iat: { value: String(Math.floor(Date.now() / 1000)), type: 'number' } }
  }
  if (preset === 'nbf') {
    return { nbf: { value: String(Math.floor(Date.now() / 1000)), type: 'number' } }
  }
  if (preset === 'jti') {
    return { jti: { value: randomJti(), type: 'string' } }
  }
  return STATIC_PRESETS[preset]!
}

export function JwtBuilder() {
  const [secret, setSecret] = useState('devforge-hmac-secret-change-me')
  const [rows, setRows] = useState<ClaimRow[]>(() => [
    newRow({ key: 'iss', value: 'https://auth.devforge.local', type: 'string' }),
    newRow({ key: 'sub', value: 'user_01HZD8YQX', type: 'string' }),
    newRow({ key: 'aud', value: 'api', type: 'string' }),
    newRow({
      key: 'exp',
      value: String(Math.floor(Date.now() / 1000) + 3600),
      type: 'number',
    }),
    newRow({ key: 'iat', value: String(Math.floor(Date.now() / 1000)), type: 'number' }),
  ])
  const [token, setToken] = useState('')
  const [headerPreview, setHeaderPreview] = useState('')
  const [payloadPreview, setPayloadPreview] = useState('')
  const [error, setError] = useState<string | null>(null)

  const regenerate = useCallback(async () => {
    if (!secret.trim()) {
      setError('Secret is required')
      setToken('')
      setHeaderPreview('')
      setPayloadPreview('')
      return
    }
    try {
      const payloadObj = rowsToPayload(rows)
      const r = await signJwtHs256(payloadObj, secret)
      setToken(r.token)
      setHeaderPreview(r.headerPreview)
      setPayloadPreview(r.payloadPreview)
      setError(null)
    } catch (e) {
      setToken('')
      setHeaderPreview('')
      setPayloadPreview('')
      setError((e as Error).message)
    }
  }, [rows, secret])

  useEffect(() => {
    void regenerate()
  }, [regenerate])

  const addPreset = (preset: PresetKey) => {
    const patch = buildPresetPatch(preset)
    setRows((prev) => {
      const next = [...prev]
      for (const [key, def] of Object.entries(patch)) {
        const idx = next.findIndex((r) => r.key === key)
        const row = newRow({
          key,
          value: def.value,
          type: def.type,
        })
        if (idx >= 0) next[idx] = { ...next[idx]!, value: def.value, type: def.type }
        else next.push(row)
      }
      return next
    })
    toast.success('Preset applied')
  }

  const setExpFromPicker = (local: string) => {
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return
    const unix = Math.floor(d.getTime() / 1000)
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key === 'exp')
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx]!, value: String(unix), type: 'number' }
        return copy
      }
      return [...prev, newRow({ key: 'exp', value: String(unix), type: 'number' })]
    })
  }

  const expPickerValue = useMemo(() => {
    const expRow = rows.find((r) => r.key === 'exp')
    if (!expRow) return toDatetimeLocal(new Date(Date.now() + 3600_000))
    try {
      const sec = parseValue('number', expRow.value) as number
      return toDatetimeLocal(new Date(sec * 1000))
    } catch {
      return toDatetimeLocal(new Date(Date.now() + 3600_000))
    }
  }, [rows])

  return (
    <ToolShell toolId="jwt-builder">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jwtb-alg">Algorithm</Label>
              <Select value={JWT_ALG} disabled>
                <SelectTrigger id="jwtb-alg" aria-label="JWT algorithm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HS256">HS256</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jwtb-secret">Secret</Label>
              <Input
                id="jwtb-secret"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="HMAC secret"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Common claim presets</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('iss')}>
                iss
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('sub')}>
                sub
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('aud')}>
                aud
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('exp')}>
                exp (+1h)
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('iat')}>
                iat (now)
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('nbf')}>
                nbf
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addPreset('jti')}>
                jti
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="jwtb-exp-date" className="text-xs text-muted-foreground">
                  exp (date picker)
                </Label>
                <Input
                  id="jwtb-exp-date"
                  type="datetime-local"
                  value={expPickerValue}
                  onChange={(e) => setExpFromPicker(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <Label>Claims</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setRows((r) => [...r, newRow()])}
                aria-label="Add claim row"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add claim
              </Button>
            </div>
            <div className="rounded-lg border border-border divide-y divide-border max-h-[420px] overflow-y-auto">
              {rows.map((row, index) => (
                <div key={row.id} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                  <Input
                    className="sm:col-span-4 font-mono text-sm"
                    placeholder="claim key"
                    value={row.key}
                    onChange={(e) =>
                      setRows((prev) => {
                        const c = [...prev]
                        c[index] = { ...c[index]!, key: e.target.value }
                        return c
                      })
                    }
                    aria-label={`Claim key row ${index + 1}`}
                  />
                  <Input
                    className="sm:col-span-5 font-mono text-sm"
                    placeholder="value"
                    value={row.value}
                    onChange={(e) =>
                      setRows((prev) => {
                        const c = [...prev]
                        c[index] = { ...c[index]!, value: e.target.value }
                        return c
                      })
                    }
                    aria-label={`Claim value row ${index + 1}`}
                  />
                  <Select
                    value={row.type}
                    onValueChange={(v) =>
                      setRows((prev) => {
                        const c = [...prev]
                        c[index] = { ...c[index]!, type: v as ClaimType }
                        return c
                      })
                    }
                  >
                    <SelectTrigger className="sm:col-span-2" aria-label={`Claim type row ${index + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="array">array</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:col-span-1 shrink-0"
                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Remove claim row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-border bg-background-secondary overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Header (decode preview)
            </div>
            <pre className="p-3 text-xs font-mono overflow-auto max-h-40 text-muted-foreground whitespace-pre-wrap">
              {headerPreview || '—'}
            </pre>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payload (decode preview)
            </div>
            <pre className="p-3 text-xs font-mono overflow-auto flex-1 min-h-[120px] max-h-64 text-foreground whitespace-pre-wrap">
              {payloadPreview || '—'}
            </pre>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">JWT</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={!token}
                onClick={() => {
                  void navigator.clipboard.writeText(token)
                  toast.success('JWT copied')
                }}
                aria-label="Copy JWT"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="p-3 text-xs font-mono break-all leading-relaxed select-all">{token || '—'}</p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
