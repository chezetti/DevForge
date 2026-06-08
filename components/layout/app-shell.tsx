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
      {/* Skip to content — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-1000 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Skip to tool
      </a>

      {/* Desktop top bar — above the home page's fixed neon field (z-index scale) */}
      <div className="relative z-30 hidden md:block">
        <TopBar />
      </div>

      {/* Mobile nav */}
      <div className="relative z-30">
        <MobileNav />
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="relative z-30 hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-auto outline-none">
          {children}
        </main>
      </div>

      {/* Command palette */}
      <CommandPalette />
    </div>
  )
}
