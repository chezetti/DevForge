"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { parseHeaders } from "@/utils/api";

export function HeadersParser() {
  const [input, setInput] = useState("Content-Type: application/json\nAuthorization: Bearer token123");

  const output = useMemo(() => {
    const parsed = parseHeaders(input);
    return JSON.stringify(parsed, null, 2);
  }, [input]);

  return (
    <ToolShell toolId="headers-parser">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel value={input} onChange={setInput} language="text" title="Raw Headers" />
        <OutputPanel value={output} language="json" title="Parsed JSON" />
      </div>
    </ToolShell>
  );
}
