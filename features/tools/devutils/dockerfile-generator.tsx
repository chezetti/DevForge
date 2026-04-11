'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function buildDockerfile(runtime: string, packageManager: string, port: string): string {
  if (runtime === 'node') {
    const installCmd = packageManager === 'yarn' ? 'yarn install --frozen-lockfile --production' : 'npm ci --omit=dev'
    const lock = packageManager === 'yarn' ? 'yarn.lock' : 'package-lock.json'
    return `FROM node:20-alpine
WORKDIR /app

COPY package.json ${lock} ./
RUN ${installCmd}

COPY . .
EXPOSE ${port}
CMD ["node", "dist/main.js"]`
  }
  if (runtime === 'python') {
    return `FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE ${port}
CMD ["python", "main.py"]`
  }
  return `FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o app .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/app .
EXPOSE ${port}
CMD ["./app"]`
}

export function DockerfileGenerator() {
  const [runtime, setRuntime] = useState('node')
  const [packageManager, setPackageManager] = useState('npm')
  const [port, setPort] = useState('3000')

  const output = useMemo(() => buildDockerfile(runtime, packageManager, port), [runtime, packageManager, port])

  return (
    <ToolShell toolId="dockerfile-generator" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="space-y-2">
            <Label>Runtime</Label>
            <Select value={runtime} onValueChange={setRuntime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {runtime === 'node' && (
            <div className="space-y-2">
              <Label>Package manager</Label>
              <Select value={packageManager} onValueChange={setPackageManager}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="npm">npm</SelectItem>
                  <SelectItem value="yarn">yarn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Exposed port</Label>
            <input
              className="h-9 w-full rounded border border-border bg-background px-3 text-sm no-spin"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value || '3000')}
            />
          </div>
        </div>
        <OutputPanel value={output} language="dockerfile" title="Dockerfile" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
