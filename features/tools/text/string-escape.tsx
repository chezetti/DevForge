"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { escapeString, unescapeString } from "@/utils/strings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "escape" | "unescape";

export function StringEscapeTool() {
  const [mode, setMode] = useState<Mode>("escape");
  const [input, setInput] = useState("Line 1\nLine 2\tTabbed");

  const output = useMemo(() => {
    return mode === "escape" ? escapeString(input) : unescapeString(input);
  }, [input, mode]);

  return (
    <ToolShell
      toolId="string-escape"
      actions={
        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger className="w-36 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="escape">Escape</SelectItem>
            <SelectItem value="unescape">Unescape</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel value={input} onChange={setInput} language="text" title="Input" />
        <OutputPanel value={output} language="text" title="Output" />
      </div>
    </ToolShell>
  );
}
