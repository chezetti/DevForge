'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const EXAMPLE = 'invoice:INV-2026-0042|total:199.99|currency:USD'

type HashName = 'SHA-256' | 'SHA-384' | 'SHA-512'

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) hex += bytes[i]!.toString(16).padStart(2, '0')
  return hex
}

async function hmacHex(message: string, secret: string, hash: HashName): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return bufferToHex(sig)
}

export function HmacGenerator() {
  const [message, setMessage] = useState(EXAMPLE)
  const [secret, setSecret] = useState('my-hmac-secret')
  const [algorithm, setAlgorithm] = useState<HashName>('SHA-256')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!secret) {
      setOutput('')
      setError('Enter a secret key')
      return
    }
    if (!message) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const hex = await hmacHex(message, secret, algorithm)
      setOutput(hex)
      setError(null)
    } catch (e) {
      setOutput('')
      setError((e as Error).message)
    }
  }, [message, secret, algorithm])

  useEffect(() => {
    void run()
  }, [run])

  const handleHistory = useCallback((v: string) => {
    setMessage(v)
  }, [])

  return (
    <ToolShell toolId="hmac-generator" onHistorySelect={handleHistory}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hmac-secret">Secret key</Label>
              <Input
                id="hmac-secret"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Shared secret"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hmac-alg">Algorithm</Label>
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as HashName)}>
                <SelectTrigger id="hmac-alg" className="w-full max-w-xs" aria-label="HMAC hash algorithm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHA-256">SHA-256</SelectItem>
                  <SelectItem value="SHA-384">SHA-384</SelectItem>
                  <SelectItem value="SHA-512">SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 min-h-[280px]">
            <EditorPanel
              value={message}
              onChange={setMessage}
              language="plaintext"
              title="Message"
              minHeight="280px"
            />
          </div>
        </div>
        <OutputPanel
          value={output}
          language="plaintext"
          title="HMAC (hex)"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
