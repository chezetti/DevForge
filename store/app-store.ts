'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ToolHistory {
  toolId: string
  input: string
  output: string
  timestamp: number
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  
  // Recent tools
  recentTools: string[]
  addRecentTool: (toolId: string) => void
  
  // Favorites
  favorites: string[]
  toggleFavorite: (toolId: string) => void
  isFavorite: (toolId: string) => boolean
  
  // Tool history
  toolHistory: ToolHistory[]
  addToolHistory: (entry: Omit<ToolHistory, 'timestamp'>) => void
  getToolHistory: (toolId: string) => ToolHistory[]
  clearToolHistory: (toolId: string) => void
  
  // Tool drafts (input persistence)
  toolDrafts: Record<string, string>
  setToolDraft: (toolId: string, draft: string) => void
  getToolDraft: (toolId: string) => string
  clearToolDraft: (toolId: string) => void
  
  // Secondary input drafts (for dual-input tools)
  toolDraftsSecondary: Record<string, string>
  setToolDraftSecondary: (toolId: string, draft: string) => void
  getToolDraftSecondary: (toolId: string) => string
  
  // User preferences
  autoRun: boolean
  setAutoRun: (autoRun: boolean) => void
  
  // Panel orientation
  panelOrientation: 'horizontal' | 'vertical'
  setPanelOrientation: (orientation: 'horizontal' | 'vertical') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      // Recent tools
      recentTools: [],
      addRecentTool: (toolId) => {
        const current = get().recentTools.filter((id) => id !== toolId)
        set({ recentTools: [toolId, ...current].slice(0, 10) })
      },
      
      // Favorites
      favorites: [],
      toggleFavorite: (toolId) => {
        const current = get().favorites
        if (current.includes(toolId)) {
          set({ favorites: current.filter((id) => id !== toolId) })
        } else {
          set({ favorites: [...current, toolId] })
        }
      },
      isFavorite: (toolId) => get().favorites.includes(toolId),
      
      // Tool history
      toolHistory: [],
      addToolHistory: (entry) => {
        const history = get().toolHistory
        const newEntry = { ...entry, timestamp: Date.now() }
        // Keep last 50 entries per tool, max 200 total
        const filtered = history.filter((h) => h.toolId !== entry.toolId).slice(0, 150)
        const toolEntries = history.filter((h) => h.toolId === entry.toolId).slice(0, 49)
        set({ toolHistory: [newEntry, ...toolEntries, ...filtered] })
      },
      getToolHistory: (toolId) => {
        return get().toolHistory.filter((h) => h.toolId === toolId)
      },
      clearToolHistory: (toolId) => {
        set({ toolHistory: get().toolHistory.filter((h) => h.toolId !== toolId) })
      },
      
      // Tool drafts
      toolDrafts: {},
      setToolDraft: (toolId, draft) => {
        set({ toolDrafts: { ...get().toolDrafts, [toolId]: draft } })
      },
      getToolDraft: (toolId) => get().toolDrafts[toolId] || '',
      clearToolDraft: (toolId) => {
        const drafts = { ...get().toolDrafts }
        delete drafts[toolId]
        set({ toolDrafts: drafts })
      },
      
      // Secondary drafts
      toolDraftsSecondary: {},
      setToolDraftSecondary: (toolId, draft) => {
        set({ toolDraftsSecondary: { ...get().toolDraftsSecondary, [toolId]: draft } })
      },
      getToolDraftSecondary: (toolId) => get().toolDraftsSecondary[toolId] || '',
      
      // User preferences
      autoRun: true,
      setAutoRun: (autoRun) => set({ autoRun }),
      
      // Panel orientation
      panelOrientation: 'horizontal',
      setPanelOrientation: (orientation) => set({ panelOrientation: orientation }),
    }),
    {
      name: 'devforge-storage',
      partialize: (state) => ({
        recentTools: state.recentTools,
        favorites: state.favorites,
        toolHistory: state.toolHistory,
        toolDrafts: state.toolDrafts,
        toolDraftsSecondary: state.toolDraftsSecondary,
        autoRun: state.autoRun,
        panelOrientation: state.panelOrientation,
      }),
    }
  )
)
