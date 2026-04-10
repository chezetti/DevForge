"use client";

import Link from "next/link";
import { TOOL_REGISTRY, getToolUrl } from "@/config/tool-registry";
import { Badge } from "@/components/ui/badge";

export default function ToolsCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">All Tools</h1>
      <p className="text-muted-foreground mb-8">
        Browse all tools by category and jump directly to what you need.
      </p>

      <div className="space-y-8">
        {TOOL_REGISTRY.map((category) => (
          <section id={category.slug} key={category.slug} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <Badge variant="secondary">{category.tools.length} tools</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
