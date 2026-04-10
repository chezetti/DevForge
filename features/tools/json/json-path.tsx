"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function extractByPath(data: unknown, path: string): unknown {
  const cleaned = path.trim();
  if (!cleaned || cleaned === "$") return data;

  const normalized = cleaned.replace(/^\$\./, "").replace(/^\$/, "");
  const tokens = normalized
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  let current: unknown = data;
  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[token];
      continue;
    }
    return undefined;
  }
  return current;
}

export function JsonPathExtractor() {
  const [input, setInput] = useState('{\n  "user": { "profile": { "name": "Alice" }, "tags": ["dev", "js"] }\n}');
  const [path, setPath] = useState("$.user.profile.name");

  const output = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      const value = extractByPath(parsed, path);
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return JSON.stringify({ error: error instanceof Error ? error.message : "Invalid input" }, null, 2);
    }
  }, [input, path]);

  return (
    <ToolShell toolId="json-path">
      <div className="space-y-4 h-full">
        <div className="space-y-2">
          <Label htmlFor="json-path-input">JSONPath</Label>
          <Input
            id="json-path-input"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="$.user.profile.name"
            className="font-mono"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-80px)]">
          <EditorPanel value={input} onChange={setInput} language="json" title="JSON Input" />
          <OutputPanel value={output} language="json" title="Extraction Result" />
        </div>
      </div>
    </ToolShell>
  );
}
