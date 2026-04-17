'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Search, Command, PanelLeft, PanelLeftClose, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { categoryLabels, getToolById, type ToolCategory } from '@/config/tool-registry'

export function TopBar() {
  const { setCommandPaletteOpen, sidebarOpen, setSidebarOpen } = useAppStore()
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const match = pathname.match(/^\/tools\/([^/]+)\/([^/]+)/)
    if (!match) return null

    const category = match[1] as ToolCategory
    const toolId = match[2]
    const tool = getToolById(toolId)
    const categoryName = categoryLabels[category]

    return { category, categoryName, toolTitle: tool?.title || toolId }
  }, [pathname])

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/devforge-logo.svg" alt="" width={20} height={20} className="h-5 w-5" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            DevForge
          </span>
        </Link>

        {breadcrumbs && (
          <nav className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0" aria-label="Breadcrumb">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link
              href={`/tools#${breadcrumbs.category}`}
              className="hover:text-foreground transition-colors truncate"
            >
              {breadcrumbs.categoryName}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground truncate">{breadcrumbs.toolTitle}</span>
          </nav>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => setCommandPaletteOpen(true)}
        className="h-8 px-3 gap-2 text-sm text-muted-foreground border-border bg-background hover:bg-hover hover:text-foreground shrink-0"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search tools...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>
    </header>
  )
}
