"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OutputPanel } from "@/components/tools/output-panel";

type RandomMode = "number" | "string";

function randomString(length: number) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function RandomGenerator() {
  const [mode, setMode] = useState<RandomMode>("string");
  const [count, setCount] = useState(5);
  const [length, setLength] = useState(12);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(1000);
  const [refresh, setRefresh] = useState(0);

  const output = useMemo(() => {
    const list = Array.from({ length: count }, () => {
      if (mode === "number") {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      return randomString(length);
    });
    return list.join("\n");
  }, [mode, count, length, min, max, refresh]);

  return (
    <ToolShell
      toolId="random-generator"
      actions={
        <Button size="sm" onClick={() => setRefresh((v) => v + 1)}>
          Generate
        </Button>
      }
    >
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as RandomMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Count</Label>
            <Input type="number" className="no-spin" value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          {mode === "string" ? (
            <div className="space-y-2">
              <Label>Length</Label>
              <Input type="number" className="no-spin" value={length} onChange={(e) => setLength(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Min</Label>
                <Input type="number" className="no-spin" value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input type="number" className="no-spin" value={max} onChange={(e) => setMax(Number(e.target.value) || 1)} />
              </div>
            </>
          )}
        </div>
        <OutputPanel value={output} language="text" title="Generated Values" />
      </div>
    </ToolShell>
  );
}
