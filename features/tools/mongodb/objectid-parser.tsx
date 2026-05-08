'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EXAMPLE_ID = '507f1f77bcf86cd799439011'

function parseFullObjectId(id: string): {
  timestampMs: number
  machineId: string
  processId: string
  counter: string
} | null {
  const hex = id.trim()
  if (!/^[0-9a-fA-F]{24}$/.test(hex)) return null
  const ts = parseInt(hex.slice(0, 8), 16) * 1000
  return {
    timestampMs: ts,
    machineId: hex.slice(8, 14),
    processId: hex.slice(14, 18),
    counter: hex.slice(18, 24),
  }
}

export function ObjectIdParser() {
  const [value, setValue] = useState(EXAMPLE_ID)

  const parsed = useMemo(() => parseFullObjectId(value), [value])

  return (
    <ToolShell toolId="objectid-parser" showHistory={false}>
      <div className="max-w-3xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="oid-input">ObjectId (24 hex characters)</Label>
          <Input
            id="oid-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono"
            placeholder="507f1f77bcf86cd799439011"
            spellCheck={false}
          />
        </div>

        {!parsed ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
            role="alert"
          >
            Invalid ObjectId — must be exactly 24 hexadecimal characters.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Creation time (UTC)
              </p>
              <p className="font-mono text-sm">{new Date(parsed.timestampMs).toISOString()}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(parsed.timestampMs).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'medium',
                })}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Unix seconds
              </p>
              <p className="font-mono text-sm">{(parsed.timestampMs / 1000).toFixed(0)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Machine identifier
              </p>
              <p className="font-mono text-sm">0x{parsed.machineId}</p>
              <p className="text-xs text-muted-foreground">3-byte random / machine hash (legacy spec)</p>
            </div>
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Process ID
              </p>
              <p className="font-mono text-sm">0x{parsed.processId} ({parseInt(parsed.processId, 16)})</p>
            </div>
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Counter</p>
              <p className="font-mono text-sm">0x{parsed.counter} ({parseInt(parsed.counter, 16)})</p>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  )
}
