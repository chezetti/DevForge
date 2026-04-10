"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OutputPanel } from "@/components/tools/output-panel";
import { validateUUID } from "@/utils/security";

function makeUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function UuidTool() {
  const [input, setInput] = useState(makeUuid());
  const [generated, setGenerated] = useState(makeUuid());

  const output = useMemo(() => {
    const valid = validateUUID(input.trim());
    return JSON.stringify(
      {
        input: input.trim(),
        valid,
        version: valid ? input.split("-")[2]?.[0] : null,
      },
      null,
      2
    );
  }, [input]);

  return (
    <ToolShell
      toolId="uuid-tool"
      actions={
        <Button size="sm" onClick={() => setGenerated(makeUuid())}>
          Generate
        </Button>
      }
    >
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Generated UUID</Label>
            <Input value={generated} readOnly className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Validate UUID</Label>
            <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" />
          </div>
        </div>
        <OutputPanel value={output} language="json" title="Validation Result" />
      </div>
    </ToolShell>
  );
}
