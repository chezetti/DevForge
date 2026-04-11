'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OutputPanel } from '@/components/tools/output-panel'

const UNIT_OPTIONS = {
  length: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
  weight: ['mg', 'g', 'kg', 'lb', 'oz'],
  temperature: ['C', 'F', 'K'],
} as const

const FACTORS: Record<string, number> = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
  mg: 0.000001, g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523125,
}

function convertTemperature(value: number, from: string, to: string): number {
  const toC = from === 'C' ? value : from === 'F' ? ((value - 32) * 5) / 9 : value - 273.15
  if (to === 'C') return toC
  if (to === 'F') return (toC * 9) / 5 + 32
  return toC + 273.15
}

export function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof UNIT_OPTIONS>('length')
  const [inputValue, setInputValue] = useState(100)
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')

  const output = useMemo(() => {
    if (category === 'temperature') {
      const result = convertTemperature(inputValue, fromUnit, toUnit)
      return `${inputValue} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`
    }

    const from = FACTORS[fromUnit]
    const to = FACTORS[toUnit]
    if (!from || !to) return 'Please select valid units'
    const result = (inputValue * from) / to
    return `${inputValue} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`
  }, [inputValue, category, fromUnit, toUnit])

  const units = UNIT_OPTIONS[category]

  return (
    <ToolShell toolId="unit-converter" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                const next = v as keyof typeof UNIT_OPTIONS
                setCategory(next)
                setFromUnit(UNIT_OPTIONS[next][0])
                setToUnit(UNIT_OPTIONS[next][1])
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input type="number" className="no-spin" value={inputValue} onChange={(e) => setInputValue(Number(e.target.value) || 0)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <OutputPanel value={output} language="text" title="Converted Result" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
