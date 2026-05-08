'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

const EXAMPLE = '192.168.1.0/24'

function ipToInt(octets: number[]): number | null {
  if (octets.length !== 4) return null
  for (const o of octets) {
    if (o < 0 || o > 255 || !Number.isInteger(o)) return null
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
}

function intToBinaryIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('.')
}

function cidrToMask(prefix: number): number {
  if (prefix <= 0) return 0
  if (prefix >= 32) return 0xffffffff >>> 0
  return (-1 << (32 - prefix)) >>> 0
}

function parseInput(raw: string):
  | {
      ipInt: number
      prefix: number
    }
  | { error: string } {
  const m = raw.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/)
  if (!m) return { error: 'Use IPv4 with CIDR, e.g. 192.168.1.0/24' }
  const octets = [1, 2, 3, 4].map((i) => parseInt(m[i], 10))
  const prefix = parseInt(m[5], 10)
  const ipInt = ipToInt(octets)
  if (ipInt === null) return { error: 'Invalid octet values (0–255)' }
  if (prefix < 0 || prefix > 32) return { error: 'Prefix must be 0–32' }
  return { ipInt, prefix }
}

function compute(ipInt: number, prefix: number) {
  const mask = cidrToMask(prefix)
  const wildcard = (~mask >>> 0) >>> 0
  const network = ipInt & mask
  const broadcast = (network | wildcard) >>> 0
  const totalAddresses = prefix >= 32 ? 1 : 2 ** (32 - prefix)

  let firstHost: number
  let lastHost: number
  let usable: number
  if (prefix === 32) {
    firstHost = network
    lastHost = network
    usable = 1
  } else if (prefix === 31) {
    firstHost = network
    lastHost = broadcast
    usable = 2
  } else {
    firstHost = (network + 1) >>> 0
    lastHost = (broadcast - 1) >>> 0
    usable = Math.max(0, totalAddresses - 2)
  }

  return {
    network,
    broadcast,
    subnetMask: mask,
    wildcard,
    firstHost,
    lastHost,
    totalAddresses,
    usable,
  }
}

export function IpCalculator() {
  const [value, setValue] = useState(EXAMPLE)

  const result = useMemo(() => {
    const p = parseInput(value)
    if ('error' in p) return { error: p.error as string }
    const c = compute(p.ipInt, p.prefix)
    return { ...p, ...c }
  }, [value])

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  }

  return (
    <ToolShell toolId="ip-calculator">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ip-cidr">IPv4 address / CIDR</Label>
          <Input
            id="ip-cidr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono"
            placeholder="192.168.1.0/24"
          />
        </div>

        {'error' in result && result.error ? (
          <p className="text-sm text-destructive">{result.error}</p>
        ) : 'network' in result ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableBody>
                  {(
                    [
                      ['Network address', intToIp(result.network)],
                      ['Broadcast address', intToIp(result.broadcast)],
                      ['First usable host', intToIp(result.firstHost)],
                      ['Last usable host', intToIp(result.lastHost)],
                      ['Subnet size (total addresses)', String(result.totalAddresses)],
                      ['Usable host addresses', String(result.usable)],
                      ['Subnet mask', intToIp(result.subnetMask)],
                      ['Wildcard mask', intToIp(result.wildcard)],
                    ] as const
                  ).map(([label, val]) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium text-muted-foreground w-[40%]">{label}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center justify-between gap-2">
                          {val}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            aria-label={`Copy ${label}`}
                            onClick={() => copy(val)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-2 bg-background-secondary/50">
              <h3 className="text-sm font-medium">Binary (network · mask · host)</h3>
              <div className="text-xs font-mono space-y-1 break-all">
                <p>
                  <span className="text-muted-foreground">CIDR</span>{' '}
                  {intToIp(result.ipInt)}/{result.prefix}
                </p>
                <p>
                  <span className="text-muted-foreground">IP</span>{' '}
                  {intToBinaryIp(result.ipInt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Mask</span>{' '}
                  {intToBinaryIp(result.subnetMask)}
                </p>
                <p>
                  <span className="text-muted-foreground">Network</span>{' '}
                  {intToBinaryIp(result.network)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ToolShell>
  )
}
