'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Braces,
  FileCode2,
  Database,
  Table,
  Shield,
  Globe,
  Clock,
  Type,
  Wrench,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  tools,
  categoryLabels,
  getCategories,
  getToolUrl,
  type ToolCategory,
} from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { Input } from '@/components/ui/input'

const categoryIcons: Record<ToolCategory, React.ReactNode> = {
  json: <Braces className="h-4 w-4" />,
  typescript: <FileCode2 className="h-4 w-4" />,
  mongodb: <Database className="h-4 w-4" />,
  postgresql: <Table className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  api: <Globe className="h-4 w-4" />,
  datetime: <Clock className="h-4 w-4" />,
  string: <Type className="h-4 w-4" />,
  devutils: <Wrench className="h-4 w-4" />,
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useAppStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(
    new Set(getCategories())
  )
  const [searchQuery, setSearchQuery] = useState('')

  const toggleCategory = (category: ToolCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

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

  if (!sidebarOpen) return null

  return (
    <aside className="w-[240px] h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm bg-background border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {searchQuery ? (
          <div className="space-y-0.5">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={getToolUrl(tool.category, tool.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors duration-100',
                  pathname === getToolUrl(tool.category, tool.id)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-hover'
                )}
              >
                {categoryIcons[tool.category]}
                <span className="truncate">{tool.title}</span>
              </Link>
            ))}
            {filteredTools.length === 0 && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No tools found
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map((category) => {
              const categoryTools = filteredTools.filter(
                (t) => t.category === category
              )
              const isExpanded = expandedCategories.has(category)

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-100"
                  >
                    <ChevronRight
                      className={cn(
                        'h-3 w-3 transition-transform duration-100',
                        isExpanded && 'rotate-90'
                      )}
                    />
                    {categoryIcons[category]}
                    <span className="uppercase tracking-wide">
                      {categoryLabels[category]}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="ml-5 space-y-0.5 mt-0.5">
                      {categoryTools.map((tool) => {
                        const isActive = pathname === getToolUrl(tool.category, tool.id)
                        return (
                          <Link
                            key={tool.id}
                            href={getToolUrl(tool.category, tool.id)}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors duration-100 relative',
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-hover'
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground rounded-r" />
                            )}
                            <span className="truncate">{tool.title}</span>
                            {!tool.implemented && (
                              <span className="ml-auto text-[10px] text-muted-foreground/50">
                                Soon
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
