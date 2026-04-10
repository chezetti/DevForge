'use client'

import { useState, useCallback } from 'react'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { getToolById } from '@/config/tool-registry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateUUID, validateUUID } from '@/utils/security'

export function UuidGenerator() {
  const tool = getToolById('uuid-generator')!

  const [uuids, setUuids] = useState<string[]>([generateUUID()])
  const [count, setCount] = useState(1)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [validateInput, setValidateInput] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const generateNew = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }, [count])

  const handleCopy = useCallback(async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }, [])

  const handleCopyAll = useCallback(async () => {
    await navigator.clipboard.writeText(uuids.join('\n'))
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 1500)
  }, [uuids])

  const handleValidate = useCallback((value: string) => {
    setValidateInput(value)
    if (value.trim()) {
      setIsValid(validateUUID(value.trim()))
    } else {
      setIsValid(null)
    }
  }, [])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="count" className="text-xs text-muted-foreground">
                  Count
                </Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-24 bg-background border-border"
                />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Button onClick={generateNew} className="h-9">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
                {uuids.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleCopyAll}
                    className="h-9 border-border"
                  >
                    {copiedIndex === -1 ? (
                      <Check className="h-4 w-4 mr-2 text-success-foreground" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy All
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded border border-border bg-background-secondary"
                >
                  <code className="flex-1 text-sm font-mono text-foreground">
                    {uuid}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(uuid, index)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-success-foreground" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="validate" className="text-xs text-muted-foreground">
              Validate UUID
            </Label>
            <Input
              id="validate"
              value={validateInput}
              onChange={(e) => handleValidate(e.target.value)}
              placeholder="Enter UUID to validate..."
              className="bg-background border-border font-mono"
            />
          </div>
          {isValid !== null && (
            <div
              className={`p-4 rounded border ${
                isValid
                  ? 'border-success/20 bg-success/5'
                  : 'border-destructive/20 bg-destructive/5'
              }`}
            >
              <p
                className={`text-sm ${
                  isValid ? 'text-success-foreground' : 'text-destructive-foreground'
                }`}
              >
                {isValid ? 'Valid UUID format' : 'Invalid UUID format'}
              </p>
            </div>
          )}

          <div className="p-4 rounded border border-border bg-background-secondary">
            <h3 className="text-sm font-medium mb-2">UUID Format</h3>
            <p className="text-xs text-muted-foreground">
              UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Where x is any hexadecimal digit and y is one of 8, 9, A, or B.
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
