'use client'

import { ReactNode } from 'react'
import { History, Share2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'
import { getToolById, type ToolMetadata } from '@/config/tool-registry'

interface ToolShellProps {
  tool?: ToolMetadata
  toolId?: string
  children: ReactNode
  actions?: ReactNode
  showHistory?: boolean
  onHistorySelect?: (input: string) => void
}

export function ToolShell({
  tool,
  toolId,
  children,
  actions,
  showHistory = true,
  onHistorySelect,
}: ToolShellProps) {
  const resolvedTool = tool ?? (toolId ? getToolById(toolId) : undefined)
  const safeTool: ToolMetadata = resolvedTool ?? {
    id: toolId ?? "unknown-tool",
    title: toolId ?? "Tool",
    category: "devutils",
    description: "Tool metadata is not configured in registry.",
    keywords: [],
    inputType: "text",
    outputType: "text",
    supportsLiveTransform: false,
    supportsFileUpload: false,
    supportsHistory: false,
    supportsShare: false,
    implemented: false,
  }

  const { getToolHistory } = useAppStore()
  const history = showHistory ? getToolHistory(safeTool.id) : []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">{safeTool.title}</h1>
          <p className="text-sm text-muted-foreground">{safeTool.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showHistory && history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-surface border-border">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Recent inputs
                </div>
                {history.slice(0, 5).map((entry, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => onHistorySelect?.(entry.input)}
                    className="cursor-pointer"
                  >
                    <span className="truncate text-sm">
                      {entry.input.slice(0, 50)}
                      {entry.input.length > 50 ? '...' : ''}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {safeTool.supportsShare && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  )
}
