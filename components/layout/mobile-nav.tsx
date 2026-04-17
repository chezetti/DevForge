'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { tools, categoryLabels, getCategories, getToolUrl } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

export function MobileNav() {
  const pathname = usePathname()
  const { setCommandPaletteOpen } = useAppStore()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = searchQuery
    ? tools.filter(
        (tool) =>
          tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.keywords.some((kw) =>
            kw.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : tools

  const categories = getCategories()

  return (
    <header className="md:hidden h-12 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
            <div className="flex items-center p-4 pr-12 border-b border-border">
              <span className="font-semibold">DevForge</span>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-4 max-h-[calc(100vh-120px)]">
              {searchQuery ? (
                <div className="space-y-0.5">
                  {filteredTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={getToolUrl(tool.category, tool.id)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center px-2 py-2 text-sm rounded transition-colors',
                        pathname === getToolUrl(tool.category, tool.id)
                          ? 'bg-sidebar-accent text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {tool.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryTools = filteredTools.filter(
                      (t) => t.category === category
                    )
                    return (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {categoryLabels[category]}
                        </div>
                        <div className="space-y-0.5">
                          {categoryTools.map((tool) => (
                            <Link
                              key={tool.id}
                              href={getToolUrl(tool.category, tool.id)}
                              onClick={() => setOpen(false)}
                              className={cn(
                                'flex items-center px-2 py-2 text-sm rounded transition-colors',
                                pathname === getToolUrl(tool.category, tool.id)
                                  ? 'bg-sidebar-accent text-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {tool.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-semibold leading-none h-8 flex items-center">
          DevForge
        </Link>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCommandPaletteOpen(true)}
        className="h-8 w-8 text-muted-foreground"
        aria-label="Search tools (Ctrl+K)"
      >
        <Command className="h-4 w-4" />
      </Button>
    </header>
  )
}
