'use client'

import { ReactNode } from 'react'
import { TopBar } from './top-bar'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { CommandPalette } from './command-palette'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen min-h-0 flex flex-col bg-background">
      {/* Desktop top bar */}
      <div className="hidden md:block">
        <TopBar />
      </div>

      {/* Mobile nav */}
      <MobileNav />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>

      {/* Command palette */}
      <CommandPalette />
    </div>
  )
}
