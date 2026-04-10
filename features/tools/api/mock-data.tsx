"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputPanel } from "@/components/tools/output-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function MockDataGenerator() {
  const [count, setCount] = useState(5);
  const [resource, setResource] = useState("users");
  const [idStart, setIdStart] = useState(1);
  const [includeMeta, setIncludeMeta] = useState(true);
  const [format, setFormat] = useState<"array" | "object">("array");
  const [statusMode, setStatusMode] = useState<"random" | "active" | "inactive">("random");

  const output = useMemo(() => {
    const names = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Olivia"];
    const domains = ["mail.com", "devforge.app", "example.com"];
    const data = Array.from({ length: count }, (_, i) => ({
      id: idStart + i,
      resource,
      name: randomItem(names),
      email: `user${idStart + i}@${randomItem(domains)}`,
      active: statusMode === "active" ? true : statusMode === "inactive" ? false : Math.random() > 0.35,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      ...(includeMeta
        ? {
            meta: {
              source: "mock-data-generator",
              version: 1,
              tags: [resource, "demo"],
            },
          }
        : {}),
    }));
    const payload =
      format === "array"
        ? data
        : {
            items: data,
            total: data.length,
            resource,
          };
    return JSON.stringify(payload, null, 2);
  }, [count, resource, idStart, includeMeta, format, statusMode]);

  return (
    <ToolShell toolId="mock-data">
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="resource">Resource</Label>
            <Input id="resource" value={resource} onChange={(e) => setResource(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">Count</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-28 no-spin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id-start">Start ID</Label>
            <Input
              id="id-start"
              type="number"
              value={idStart}
              onChange={(e) => setIdStart(Math.max(1, Number(e.target.value) || 1))}
              className="no-spin"
            />
          </div>
          <div className="space-y-2">
            <Label>Response format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "array" | "object")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="array">Array</SelectItem>
                <SelectItem value="object">Object + meta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status mode</Label>
            <Select value={statusMode} onValueChange={(v) => setStatusMode(v as "random" | "active" | "inactive")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="active">Always active</SelectItem>
                <SelectItem value="inactive">Always inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 h-10 mt-7">
            <Switch checked={includeMeta} onCheckedChange={setIncludeMeta} id="include-meta" />
            <Label htmlFor="include-meta">Meta</Label>
          </div>
        </div>
        <OutputPanel value={output} language="json" title="Mock Response" />
      </div>
    </ToolShell>
  );
}
