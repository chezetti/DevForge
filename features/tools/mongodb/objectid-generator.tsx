"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { ToolShell } from "@/components/tools/tool-shell";
import { getToolById } from "@/config/tool-registry";
import { generateObjectId, parseObjectId } from "@/utils/security";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ObjectIdGenerator() {
  const tool = getToolById("objectid-generator")!;
  const [count, setCount] = useState(3);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [seed, setSeed] = useState(0);

  const objectIds = useMemo(() => {
    return Array.from({ length: count }, () => generateObjectId());
  }, [count, seed]);

  const parsed = useMemo(() => {
    return objectIds.map((id) => {
      const details = parseObjectId(id);
      return {
        id,
        timestamp: details.timestamp.toISOString(),
        unix: details.timestampSeconds,
      };
    });
  }, [objectIds]);

  const regenerate = useCallback(() => {
    setSeed((prev) => prev + 1);
  }, []);

  const handleCopy = useCallback(async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1200);
  }, []);

  const handleCopyAll = useCallback(async () => {
    await navigator.clipboard.writeText(objectIds.join("\n"));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 1200);
  }, [objectIds]);

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="objectid-count" className="text-xs text-muted-foreground">
                Count
              </Label>
              <Input
                id="objectid-count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className="w-24 no-spin"
              />
            </div>
            <Button onClick={regenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
            <Button variant="outline" onClick={handleCopyAll}>
              {copiedIndex === -1 ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy All
            </Button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-auto">
            {objectIds.map((id, index) => (
              <div key={id + index} className="flex items-center gap-2 p-2 rounded border border-border bg-background-secondary">
                <code className="text-xs flex-1 break-all">{id}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(id, index)}>
                  {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-auto">
          {parsed.map((item) => (
            <div key={item.id} className="p-3 rounded border border-border bg-background-secondary">
              <p className="text-xs font-medium mb-2">ObjectId details</p>
              <p className="text-xs text-muted-foreground break-all">
                <span className="text-foreground">id:</span> {item.id}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-foreground">created_at:</span> {item.timestamp}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-foreground">unix:</span> {item.unix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
