"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputPanel } from "@/components/tools/output-panel";

export function IsoFormatter() {
  const [input, setInput] = useState("2026-04-10T08:30:00.000Z");

  const output = useMemo(() => {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      return JSON.stringify({ error: "Invalid ISO date string" }, null, 2);
    }
    return JSON.stringify(
      {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMs: date.getTime(),
      },
      null,
      2
    );
  }, [input]);

  return (
    <ToolShell toolId="iso-formatter">
      <div className="space-y-4 h-full">
        <div className="space-y-2">
          <Label htmlFor="iso-input">ISO Input</Label>
          <Input
            id="iso-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono"
            placeholder="2026-04-10T08:30:00.000Z"
          />
        </div>
        <OutputPanel value={output} language="json" title="Formatted Values" />
      </div>
    </ToolShell>
  );
}
