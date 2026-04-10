'use client'

import { useMemo } from 'react'
import { diffLines, Change } from 'diff'

interface DiffViewerProps {
  left: string
  right: string
  leftTitle?: string
  rightTitle?: string
  className?: string
}

export function DiffViewer({
  left,
  right,
  leftTitle = 'Original',
  rightTitle = 'Modified',
  className = '',
}: DiffViewerProps) {
  const diff = useMemo(() => {
    return diffLines(left, right)
  }, [left, right])

  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    diff.forEach((part) => {
      if (part.added) added += part.count || 0
      if (part.removed) removed += part.count || 0
    })
    return { added, removed }
  }, [diff])

  if (!left && !right) {
    return (
      <div className={`border border-border rounded bg-background-secondary ${className}`}>
        <div className="flex items-center justify-center h-64">
          <span className="text-sm text-muted-foreground">
            Enter content in both panels to see diff
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-border rounded bg-background-secondary ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Diff
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-success-foreground">+{stats.added} added</span>
          <span className="text-destructive-foreground">-{stats.removed} removed</span>
        </div>
      </div>
      <div className="p-4 font-mono text-sm overflow-auto max-h-[500px]">
        {diff.map((part: Change, index: number) => {
          const lines = part.value.split('\n').filter((line, i, arr) => 
            !(i === arr.length - 1 && line === '')
          )
          
          return lines.map((line, lineIndex) => (
            <div
              key={`${index}-${lineIndex}`}
              className={`px-2 py-0.5 ${
                part.added
                  ? 'bg-success/10 text-success-foreground'
                  : part.removed
                  ? 'bg-destructive/10 text-destructive-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="inline-block w-4 mr-2 text-muted-foreground/50">
                {part.added ? '+' : part.removed ? '-' : ' '}
              </span>
              {line || ' '}
            </div>
          ))
        })}
      </div>
    </div>
  )
}
