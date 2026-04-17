"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";

export function AggregationBuilder() {
  const [collection, setCollection] = useState("users");
  const [stages, setStages] = useState('{ "$match": { "active": true } }\n{ "$limit": 10 }');

  const { output, error } = useMemo(() => {
    try {
      const lines = stages
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return { output: "", error: null };
      const parsed = lines.map((line) => JSON.parse(line));
      return { output: `db.${collection}.aggregate(${JSON.stringify(parsed, null, 2)})`, error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [collection, stages]);

  return (
    <ToolShell toolId="aggregation-builder">
      <div className="space-y-4 h-full">
        <div className="space-y-2">
          <Label htmlFor="collection-name">Collection</Label>
          <Input id="collection-name" value={collection} onChange={(e) => setCollection(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-84px)]">
          <EditorPanel
            value={stages}
            onChange={setStages}
            language="json"
            title="Pipeline Stages (one JSON object per line)"
          />
          <OutputPanel
            value={output}
            language="javascript"
            title="Mongo Query"
            status={error ? "error" : output ? "success" : "idle"}
            errorMessage={error || undefined}
          />
        </div>
      </div>
    </ToolShell>
  );
}
