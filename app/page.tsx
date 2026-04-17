"use client";

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TOOL_REGISTRY, FEATURED_TOOLS, getToolUrl, type Tool, type ToolCategory } from "@/config/tool-registry";
import { useAppStore } from "@/store/app-store";
import {
  Search,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Braces,
  Database,
  Shield,
  Globe,
  Type,
  Calendar,
  Wrench,
  FileCode2,
  Table as TableIcon,
  Palette,
  Code,
  ArrowLeftRight,
  Film,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof Braces> = {
  json: Braces,
  typescript: FileCode2,
  mongodb: Database,
  postgresql: TableIcon,
  security: Shield,
  api: Globe,
  string: Type,
  datetime: Calendar,
  devutils: Wrench,
  css: Palette,
  html: Code,
  converter: ArrowLeftRight,
  media: Film,
};

type ExtendedTool = Tool & { categorySlug: ToolCategory; categoryName: string };

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const store = useAppStore();
  const recentTools = store.recentTools || [];
  const favorites = store.favorites || [];
  const addRecentTool = store.addRecentTool;
  const toggleFavorite = store.toggleFavorite;

  const allTools = useMemo(() => {
    const toolsList: ExtendedTool[] = [];
    for (const category of TOOL_REGISTRY) {
      for (const tool of category.tools) {
        toolsList.push({
          ...tool,
          categorySlug: category.slug,
          categoryName: category.name,
        });
      }
    }
    return toolsList;
  }, []);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(query))
    );
  }, [searchQuery, allTools]);

  const featuredToolsData = useMemo(() => {
    return FEATURED_TOOLS.map((id) => {
      const tool = allTools.find((t) => t.id === id);
      return tool;
    }).filter(Boolean) as ExtendedTool[];
  }, [allTools]);

  const recentToolsData = useMemo(() => {
    return recentTools
      .slice(0, 6)
      .map((id) => allTools.find((t) => t.id === id))
      .filter(Boolean) as ExtendedTool[];
  }, [recentTools, allTools]);

  const favoriteToolsData = useMemo(() => {
    return favorites
      .map((id) => allTools.find((t) => t.id === id))
      .filter(Boolean) as ExtendedTool[];
  }, [favorites, allTools]);

  const handleToolClick = useCallback(
    (tool: ExtendedTool) => {
      addRecentTool(tool.id);
      router.push(getToolUrl(tool.categorySlug, tool.id));
    },
    [addRecentTool, router]
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSearchDropdown = searchFocused && searchQuery.trim().length > 0;

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-balance">
              Developer Tools
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              A comprehensive collection of tools for developers. Format, validate,
              convert, and generate code with ease.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto mt-6 sm:mt-8" ref={searchRef}>
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search tools... (Ctrl+K)"
                className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base"
              />

              {/* Search Results Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          handleToolClick(tool);
                          setSearchFocused(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        <span className="font-medium">{tool.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {tool.categoryName}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      No tools found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-8 sm:mb-12">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-2xl sm:text-3xl font-bold">{allTools.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Tools</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-2xl sm:text-3xl font-bold">{TOOL_REGISTRY.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Categories</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-2xl sm:text-3xl font-bold">{favorites.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-2xl sm:text-3xl font-bold">{recentTools.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Recently Used</p>
            </div>
          </div>

          {/* Favorites Section */}
          {favoriteToolsData.length > 0 && (
            <section className="mb-8 sm:mb-12">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg sm:text-xl font-semibold">Favorites</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {favoriteToolsData.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => handleToolClick(tool)}
                    onToggleFavorite={() => toggleFavorite(tool.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recent Tools Section */}
          {recentToolsData.length > 0 && (
            <section className="mb-8 sm:mb-12">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg sm:text-xl font-semibold">Recently Used</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {recentToolsData.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => handleToolClick(tool)}
                    onToggleFavorite={() => toggleFavorite(tool.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Featured Tools Section */}
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Featured Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {featuredToolsData.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => handleToolClick(tool)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                />
              ))}
            </div>
          </section>

          {/* All Categories */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {TOOL_REGISTRY.map((category) => {
                const Icon = CATEGORY_ICONS[category.slug] || Braces;
                return (
                  <div
                    key={category.slug}
                    className="block p-4 sm:p-6 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <Link
                      href={`/tools#${category.slug}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <div className="p-2 rounded-md bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.tools.length} tools
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      {category.tools.slice(0, 4).map((tool) => (
                        <Link
                          key={tool.id}
                          href={getToolUrl(category.slug, tool.id)}
                          onClick={() => addRecentTool(tool.id)}
                          className="text-sm px-3 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {tool.title}
                        </Link>
                      ))}
                      {category.tools.length > 4 && (
                        <span className="text-sm px-3 py-1 text-muted-foreground">
                          +{category.tools.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
            <p>Built with Next.js, Tailwind CSS, and shadcn/ui</p>
            <p className="mt-1">All processing happens locally in your browser</p>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}

interface ToolCardProps {
  tool: ExtendedTool;
  onClick: () => void;
  onToggleFavorite: () => void;
}

function ToolCard({ tool, onClick, onToggleFavorite }: ToolCardProps) {
  const store = useAppStore();
  const favorites = store.favorites || [];
  const isFavorite = favorites.includes(tool.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group text-left p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-all hover:border-primary/50 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium group-hover:text-primary transition-colors">
          {tool.title}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {tool.description}
      </p>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {tool.categoryName}
        </Badge>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
            aria-label="Toggle favorite"
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
          </button>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}
