'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  Palette,
  Code,
  ArrowLeftRight,
  Film,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useAppStore } from '@/store/app-store'
import {
  tools,
  categoryLabels,
  getCategories,
  getToolUrl,
  type ToolCategory,
} from '@/config/tool-registry'

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
  css: <Palette className="h-4 w-4" />,
  html: <Code className="h-4 w-4" />,
  converter: <ArrowLeftRight className="h-4 w-4" />,
  media: <Film className="h-4 w-4" />,
}

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen, recentTools, addRecentTool } =
    useAppStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyK' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [setCommandPaletteOpen])

  const handleSelect = useCallback(
    (toolId: string) => {
      addRecentTool(toolId)
      const selected = tools.find((t) => t.id === toolId)
      if (!selected) return
      router.push(getToolUrl(selected.category, selected.id))
      setCommandPaletteOpen(false)
      setSearch('')
    },
    [router, setCommandPaletteOpen, addRecentTool]
  )

  const recentToolsData = useMemo(() => {
    return recentTools
      .map((id) => tools.find((t) => t.id === id))
      .filter(Boolean)
      .slice(0, 5)
  }, [recentTools])

  const categories = getCategories()

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      showCloseButton={false}
      className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-2xl"
    >
      <CommandInput
        placeholder="Search tools..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>

        {!search && recentToolsData.length > 0 && (
          <CommandGroup heading="Recent">
            {recentToolsData.map((tool) => (
              <CommandItem
                key={tool!.id}
                value={tool!.id}
                onSelect={() => handleSelect(tool!.id)}
                className="cursor-pointer"
              >
                {categoryIcons[tool!.category]}
                <span className="ml-2">{tool!.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {categoryLabels[tool!.category]}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {categories.map((category) => {
          const categoryTools = tools.filter((t) => t.category === category)
          if (categoryTools.length === 0) return null

          return (
            <CommandGroup key={category} heading={categoryLabels[category]}>
              {categoryTools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  value={`${tool.id} ${tool.title} ${tool.keywords.join(' ')}`}
                  onSelect={() => handleSelect(tool.id)}
                  className="cursor-pointer"
                >
                  {categoryIcons[tool.category]}
                  <span className="ml-2">{tool.title}</span>
                  {!tool.implemented && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
