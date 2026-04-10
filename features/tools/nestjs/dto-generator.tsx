"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function mapType(value: unknown) {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "unknown[]";
  if (value && typeof value === "object") return "Record<string, unknown>";
  return "string";
}

export function DtoGenerator() {
  const [className, setClassName] = useState("CreateOrderDto");
  const [input, setInput] = useState('{\n  "id": 1,\n  "name": "Ticket",\n  "paid": true\n}');

  const output = useMemo(() => {
    try {
      const parsed = JSON.parse(input) as Record<string, unknown>;
      const fields = Object.entries(parsed).map(([key, value]) => {
        const type = mapType(value);
        const decorators =
          type === "string"
            ? "@IsString()"
            : type === "number"
              ? "@IsNumber()"
              : type === "boolean"
                ? "@IsBoolean()"
                : "@IsOptional()";
        return `  ${decorators}\n  ${key}: ${type};`;
      });

      return [
        'import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";',
        "",
        `export class ${className} {`,
        ...fields,
        "}",
      ].join("\n");
    } catch (error) {
      return `// Invalid JSON\n// ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }, [input, className]);

  return (
    <ToolShell toolId="dto-generator">
      <div className="space-y-4 h-full">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="dto-name">DTO Class Name</Label>
          <Input id="dto-name" value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-88px)]">
          <EditorPanel value={input} onChange={setInput} language="json" title="JSON Input" />
          <OutputPanel value={output} language="typescript" title="Generated DTO" />
        </div>
      </div>
    </ToolShell>
  );
}
