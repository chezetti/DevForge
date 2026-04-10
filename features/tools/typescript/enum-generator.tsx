'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
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

type EnumType = 'string' | 'numeric' | 'const-object'

interface EnumValue {
  key: string
  value: string
}

export function EnumGenerator() {
  const tool = getToolById('enum-generator')!

  const [enumName, setEnumName] = useState('Status')
  const [enumType, setEnumType] = useState<EnumType>('string')
  const [values, setValues] = useState<EnumValue[]>([
    { key: 'ACTIVE', value: 'active' },
    { key: 'INACTIVE', value: 'inactive' },
  ])

  const addValue = useCallback(() => {
    setValues([...values, { key: '', value: '' }])
  }, [values])

  const removeValue = useCallback(
    (index: number) => {
      setValues(values.filter((_, i) => i !== index))
    },
    [values]
  )

  const updateValue = useCallback(
    (index: number, field: 'key' | 'value', newValue: string) => {
      const updated = [...values]
      updated[index][field] = newValue
      setValues(updated)
    },
    [values]
  )

  const output = useMemo(() => {
    const validValues = values.filter((v) => v.key.trim())

    if (validValues.length === 0) {
      return '// Add enum values to generate code'
    }

    if (enumType === 'const-object') {
      const entries = validValues
        .map((v) => `  ${v.key}: '${v.value || v.key.toLowerCase()}',`)
        .join('\n')
      return `const ${enumName} = {\n${entries}\n} as const;\n\ntype ${enumName} = typeof ${enumName}[keyof typeof ${enumName}];`
    }

    if (enumType === 'numeric') {
      const entries = validValues.map((v, i) => `  ${v.key} = ${i},`).join('\n')
      return `enum ${enumName} {\n${entries}\n}`
    }

    // String enum
    const entries = validValues
      .map((v) => `  ${v.key} = '${v.value || v.key.toLowerCase()}',`)
      .join('\n')
    return `enum ${enumName} {\n${entries}\n}`
  }, [enumName, enumType, values])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enumName" className="text-xs text-muted-foreground">
                Enum Name
              </Label>
              <Input
                id="enumName"
                value={enumName}
                onChange={(e) => setEnumName(e.target.value)}
                placeholder="Status"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enumType" className="text-xs text-muted-foreground">
                Type
              </Label>
              <Select value={enumType} onValueChange={(v) => setEnumType(v as EnumType)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String Enum</SelectItem>
                  <SelectItem value="numeric">Numeric Enum</SelectItem>
                  <SelectItem value="const-object">Const Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Values</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addValue}
                className="h-7 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {values.map((v, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={v.key}
                    onChange={(e) => updateValue(index, 'key', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    placeholder="KEY"
                    className="flex-1 bg-background border-border font-mono text-sm"
                  />
                  {enumType !== 'numeric' && (
                    <Input
                      value={v.value}
                      onChange={(e) => updateValue(index, 'value', e.target.value)}
                      placeholder="value"
                      className="flex-1 bg-background border-border font-mono text-sm"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeValue(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground"
                    disabled={values.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <OutputPanel
          value={output}
          language="typescript"
          title="Generated Code"
          status="success"
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
