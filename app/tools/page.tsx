"use client";

import Link from "next/link";
import { TOOL_REGISTRY, getToolUrl } from "@/config/tool-registry";
import { Badge } from "@/components/ui/badge";

export default function ToolsCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">All Tools</h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
        Browse all {TOOL_REGISTRY.reduce((n, c) => n + c.tools.length, 0)} tools by category.
      </p>

      <div className="space-y-6 sm:space-y-8">
        {TOOL_REGISTRY.map((category) => (
          <section id={category.slug} key={category.slug} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">{category.name}</h2>
              <Badge variant="secondary">{category.tools.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {category.tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={getToolUrl(category.slug, tool.id)}
                  className="p-3 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <p className="font-medium">{tool.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
