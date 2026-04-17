'use client'

import { ReactNode } from 'react'
import { toast } from 'sonner'
import { History, Share2, Settings2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'
import { getToolById, type ToolMetadata } from '@/config/tool-registry'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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

  const {
    getToolHistory,
    toggleFavorite,
    isFavorite,
    autoRun,
    setAutoRun,
    panelOrientation,
    setPanelOrientation,
  } = useAppStore()
  const history = showHistory
    ? getToolHistory(safeTool.id).filter(
        (entry, index, arr) =>
          arr.findIndex((candidate) => candidate.input === entry.input) === index
      )
    : []
  const favorite = isFavorite(safeTool.id)

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: safeTool.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Tool link copied to clipboard')
    } catch {
      toast.error('Unable to share this tool right now')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{safeTool.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{safeTool.description}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {actions}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => toggleFavorite(safeTool.id)}
          >
            <Star className={`h-4 w-4 ${favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          </Button>
          {showHistory && history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="View history"
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
              aria-label="Share tool"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Settings"
                aria-label="Tool settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">Tool settings</p>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <Label htmlFor="auto-run-toggle" className="text-sm">
                  Auto run
                </Label>
                <Switch
                  id="auto-run-toggle"
                  checked={autoRun}
                  onCheckedChange={(checked) => setAutoRun(checked)}
                />
              </div>
              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-sm">Panel layout</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant={panelOrientation === 'horizontal' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPanelOrientation('horizontal')}
                    className="h-7 px-2 text-xs"
                  >
                    Horizontal
                  </Button>
                  <Button
                    variant={panelOrientation === 'vertical' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPanelOrientation('vertical')}
                    className="h-7 px-2 text-xs"
                  >
                    Vertical
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-6 tool-content" data-panel-layout={panelOrientation}>
        {children}
      </div>
    </div>
  )
}
