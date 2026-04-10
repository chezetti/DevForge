"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputPanel } from "@/components/tools/output-panel";
import { buildQueryString } from "@/utils/api";

export function QueryParamsBuilder() {
  const [baseUrl, setBaseUrl] = useState("https://api.example.com/users");
  const [paramsInput, setParamsInput] = useState("page=1\nlimit=20\nsearch=john doe");

  const output = useMemo(() => {
    const params = paramsInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return { key: key ?? "", value: valueParts.join("="), enabled: true };
      });
    const query = buildQueryString(params);
    return `${baseUrl}${query}`;
  }, [baseUrl, paramsInput]);

  return (
    <ToolShell toolId="query-params-builder">
      <div className="space-y-4 h-full">
        <div className="space-y-2">
          <Label htmlFor="base-url">Base URL</Label>
          <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-80px)]">
          <div className="flex flex-col border border-border rounded bg-background-secondary p-3">
            <Label className="mb-2">Params (key=value per line)</Label>
            <textarea
              value={paramsInput}
              onChange={(e) => setParamsInput(e.target.value)}
              className="flex-1 min-h-[260px] bg-background border border-border rounded p-2 text-sm font-mono"
            />
          </div>
          <OutputPanel value={output} language="text" title="Result URL" />
        </div>
      </div>
    </ToolShell>
  );
}
