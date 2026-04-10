'use client'

import Link from 'next/link'
import { Search, Command, PanelLeft, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export function TopBar() {
  const { setCommandPaletteOpen, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-foreground">
            DevForge
          </span>
        </Link>
      </div>

      <Button
        variant="outline"
        onClick={() => setCommandPaletteOpen(true)}
        className="h-8 px-3 gap-2 text-sm text-muted-foreground border-border bg-background hover:bg-hover hover:text-foreground"
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
