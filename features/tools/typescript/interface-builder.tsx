'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InterfaceField {
  name: string
  type: string
  optional: boolean
  array: boolean
}

const typeOptions = [
  'string',
  'number',
  'boolean',
  'Date',
  'unknown',
  'any',
  'null',
  'undefined',
  'object',
  'Record<string, unknown>',
]

export function InterfaceBuilder() {
  const tool = getToolById('interface-builder')!

  const [interfaceName, setInterfaceName] = useState('User')
  const [exportInterface, setExportInterface] = useState(true)
  const [fields, setFields] = useState<InterfaceField[]>([
    { name: 'id', type: 'string', optional: false, array: false },
    { name: 'name', type: 'string', optional: false, array: false },
    { name: 'email', type: 'string', optional: true, array: false },
  ])

  const addField = useCallback(() => {
    setFields([...fields, { name: '', type: 'string', optional: false, array: false }])
  }, [fields])

  const removeField = useCallback(
    (index: number) => {
      setFields(fields.filter((_, i) => i !== index))
    },
    [fields]
  )

  const updateField = useCallback(
    (index: number, updates: Partial<InterfaceField>) => {
      const updated = [...fields]
      updated[index] = { ...updated[index], ...updates }
      setFields(updated)
    },
    [fields]
  )

  const output = useMemo(() => {
    const validFields = fields.filter((f) => f.name.trim())

    if (validFields.length === 0) {
      return '// Add fields to generate interface'
    }

    const fieldLines = validFields.map((f) => {
      const optional = f.optional ? '?' : ''
      const type = f.array ? `${f.type}[]` : f.type
      return `  ${f.name}${optional}: ${type};`
    })

    const prefix = exportInterface ? 'export ' : ''
    return `${prefix}interface ${interfaceName} {\n${fieldLines.join('\n')}\n}`
  }, [interfaceName, exportInterface, fields])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interfaceName" className="text-xs text-muted-foreground">
                Interface Name
              </Label>
              <Input
                id="interfaceName"
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                placeholder="User"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Options</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  id="export"
                  checked={exportInterface}
                  onCheckedChange={setExportInterface}
                />
                <Label htmlFor="export" className="text-sm">
                  Export
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Fields</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addField}
                className="h-7 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {fields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="fieldName"
                    className="flex-1 bg-background border-border font-mono text-sm"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(index, { type: v })}
                  >
                    <SelectTrigger className="w-40 bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={field.optional}
                      onCheckedChange={(v) => updateField(index, { optional: v })}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground w-4">?</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={field.array}
                      onCheckedChange={(v) => updateField(index, { array: v })}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground w-4">[]</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive-foreground"
                    disabled={fields.length <= 1}
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
          title="Generated Interface"
          status="success"
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
