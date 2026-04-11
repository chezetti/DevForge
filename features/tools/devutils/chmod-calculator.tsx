'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type Scope = 'owner' | 'group' | 'public'
type Perm = 'read' | 'write' | 'execute'

const permValue: Record<Perm, number> = {
  read: 4,
  write: 2,
  execute: 1,
}

const scopeLabel: Record<Scope, string> = {
  owner: 'Owner (u)',
  group: 'Group (g)',
  public: 'Public (o)',
}

export function ChmodCalculator() {
  const [path, setPath] = useState('path')
  const [state, setState] = useState<Record<Scope, Record<Perm, boolean>>>({
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    public: { read: true, write: false, execute: true },
  })

  const toggle = (scope: Scope, perm: Perm, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [perm]: checked,
      },
    }))
  }

  const computed = useMemo(() => {
    const calcDigit = (scope: Scope) =>
      (state[scope].read ? 4 : 0) +
      (state[scope].write ? 2 : 0) +
      (state[scope].execute ? 1 : 0)

    const toSymbol = (scope: Scope) =>
      `${state[scope].read ? 'r' : '-'}${state[scope].write ? 'w' : '-'}${state[scope].execute ? 'x' : '-'}`

    const owner = calcDigit('owner')
    const group = calcDigit('group')
    const publicValue = calcDigit('public')
    const numeric = `${owner}${group}${publicValue}`
    const symbolic = `${toSymbol('owner')}${toSymbol('group')}${toSymbol('public')}`

    return {
      numeric,
      symbolic,
      command: `chmod ${numeric} ${path || 'path'}`,
    }
  }, [state, path])

  return (
    <ToolShell toolId="chmod-calculator" showHistory={false}>
      <div className="max-w-4xl space-y-4">
        <p className="text-sm text-muted-foreground">
          Compute chmod permissions and generate command.
        </p>

        <div className="rounded border border-border bg-background-secondary p-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div />
            {(['owner', 'group', 'public'] as Scope[]).map((scope) => (
              <div key={scope} className="font-medium text-center">
                {scopeLabel[scope]}
              </div>
            ))}

            {(['read', 'write', 'execute'] as Perm[]).map((perm) => (
              <div key={perm} className="contents">
                <div key={`${perm}-label`} className="font-medium">
                  {perm === 'read' ? 'Read (4)' : perm === 'write' ? 'Write (2)' : 'Execute (1)'}
                </div>
                {(['owner', 'group', 'public'] as Scope[]).map((scope) => (
                  <div key={`${scope}-${perm}`} className="flex justify-center">
                    <Checkbox
                      checked={state[scope][perm]}
                      onCheckedChange={(checked) => toggle(scope, perm, Boolean(checked))}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-border bg-background-secondary p-6 text-center space-y-4">
          <div className="text-6xl font-mono font-semibold text-green-500">{computed.numeric}</div>
          <div className="text-3xl font-mono text-green-500 tracking-widest">{computed.symbolic}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chmod-path">Path / file name</Label>
          <Input
            id="chmod-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="path"
          />
        </div>

        <div className="rounded border border-border bg-background-secondary px-3 py-2 font-mono text-sm">
          {computed.command}
        </div>
      </div>
    </ToolShell>
  )
}
