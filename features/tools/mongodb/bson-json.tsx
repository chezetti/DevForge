"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "bson-to-json" | "json-to-bson";

export function BsonJsonConverter() {
  const [mode, setMode] = useState<Mode>("bson-to-json");
  const [input, setInput] = useState('{ "_id": ObjectId("507f1f77bcf86cd799439011"), "name": "John" }');

  const output = useMemo(() => {
    if (mode === "bson-to-json") {
      return input.replace(/ObjectId\("([^"]+)"\)/g, '{"$oid":"$1"}');
    }
    return input.replace(/\{\s*"\$oid"\s*:\s*"([^"]+)"\s*\}/g, 'ObjectId("$1")');
  }, [input, mode]);

  return (
    <ToolShell toolId="bson-json">
      <div className="space-y-4 h-full">
        <div className="w-56">
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bson-to-json">BSON to JSON</SelectItem>
              <SelectItem value="json-to-bson">JSON to BSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-56px)]">
          <EditorPanel value={input} onChange={setInput} language="javascript" title="Input" />
          <OutputPanel value={output} language="javascript" title="Output" />
        </div>
      </div>
    </ToolShell>
  );
}
