'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
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

const EXAMPLE_PAYLOAD = `{\n  "sub": "123",\n  "role": "admin",\n  "iat": ${Math.floor(Date.now() / 1000)}\n}`

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

const JWT_ALG = 'HS256' as const

async function signJwtHs256(payloadJson: string, secret: string) {
  const header = { alg: JWT_ALG, typ: 'JWT' }
  const payloadObj = JSON.parse(payloadJson)
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

export function JwtGenerator() {
  const [payload, setPayload] = useState(EXAMPLE_PAYLOAD)
  const [secret, setSecret] = useState('devforge-hmac-secret-change-me')
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
      const r = await signJwtHs256(payload, secret)
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
  }, [payload, secret])

  useEffect(() => {
    void regenerate()
  }, [regenerate])

  const handleCopyToken = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    toast.success('JWT copied')
  }

  const handleHistory = useCallback((v: string) => {
    setPayload(v)
  }, [])

  return (
    <ToolShell toolId="jwt-generator" onHistorySelect={handleHistory}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jwt-alg">Algorithm</Label>
              <Select value={JWT_ALG} disabled>
                <SelectTrigger id="jwt-alg" className="w-full" aria-label="JWT signing algorithm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HS256">HS256</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">HMAC-SHA256 signing (HS256).</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="jwt-secret">Secret</Label>
              <Input
                id="jwt-secret"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Shared HMAC secret"
              />
            </div>
          </div>
          <div className="flex-1 min-h-[280px]">
            <EditorPanel
              value={payload}
              onChange={setPayload}
              language="json"
              title="Payload (JSON)"
              minHeight="280px"
            />
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
              Header
            </div>
            <pre className="p-3 text-xs font-mono overflow-auto max-h-40 text-muted-foreground">
              {headerPreview || '—'}
            </pre>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payload preview
            </div>
            <pre className="p-3 text-xs font-mono overflow-auto flex-1 min-h-[120px] max-h-56 text-foreground">
              {payloadPreview || '—'}
            </pre>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Token
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopyToken}
                disabled={!token}
                aria-label="Copy JWT"
                title="Copy JWT"
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
