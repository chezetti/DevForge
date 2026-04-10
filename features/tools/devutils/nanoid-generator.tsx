"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OutputPanel } from "@/components/tools/output-panel";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";

function makeNanoId(size: number) {
  return Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function NanoIdGenerator() {
  const [size, setSize] = useState(21);
  const [count, setCount] = useState(5);
  const [refresh, setRefresh] = useState(0);

  const output = useMemo(() => {
    return Array.from({ length: count }, () => makeNanoId(size)).join("\n");
  }, [size, count, refresh]);

  return (
    <ToolShell
      toolId="nanoid-generator"
      actions={
        <Button size="sm" onClick={() => setRefresh((v) => v + 1)}>
          Generate
        </Button>
      }
    >
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-2">
            <Label>Length</Label>
            <Input type="number" className="no-spin" value={size} onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div className="space-y-2">
            <Label>Count</Label>
            <Input type="number" className="no-spin" value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>
        </div>
        <OutputPanel value={output} language="text" title="Generated NanoIDs" />
      </div>
    </ToolShell>
  );
}
