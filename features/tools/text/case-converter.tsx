"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toTitleCase,
  toSentenceCase,
  toDotCase,
  toPathCase,
} from "@/utils/strings";

interface ConversionResult {
  name: string;
  value: string;
  description: string;
}

export function CaseConverter() {
  const [input, setInput] = useState("hello world example");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const conversions: ConversionResult[] = [
    { name: "camelCase", value: toCamelCase(input), description: "First word lowercase, rest capitalized" },
    { name: "PascalCase", value: toPascalCase(input), description: "All words capitalized" },
    { name: "snake_case", value: toSnakeCase(input), description: "Lowercase with underscores" },
    { name: "kebab-case", value: toKebabCase(input), description: "Lowercase with hyphens" },
    { name: "CONSTANT_CASE", value: toConstantCase(input), description: "Uppercase with underscores" },
    { name: "Title Case", value: toTitleCase(input), description: "First letter of each word capitalized" },
    { name: "Sentence case", value: toSentenceCase(input), description: "First letter capitalized" },
    { name: "dot.case", value: toDotCase(input), description: "Lowercase with dots" },
    { name: "path/case", value: toPathCase(input), description: "Lowercase with slashes" },
  ];

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  return (
    <ToolShell toolId="case-converter">
      <div className="flex flex-col h-full">
        <div className="border-b border-border">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="text"
            placeholder="Enter text to convert..."
            className="h-32"
          />
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3">
            {conversions.map((conversion, index) => (
              <div
                key={conversion.name}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {conversion.name}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {conversion.description}
                    </span>
                  </div>
                  <p className="font-mono text-sm mt-1 truncate">{conversion.value || "-"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(conversion.value, index)}
                  disabled={!conversion.value}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
