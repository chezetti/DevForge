"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { curlToFetch } from "@/utils/api";

const SAMPLE = `curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -d '{"name":"John"}'`;

export function CurlToFetch() {
  const [input, setInput] = useState(SAMPLE);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return curlToFetch(input);
    } catch (error) {
      return `// Unable to parse cURL\n// ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }, [input]);

  return (
    <ToolShell toolId="curl-to-fetch">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel value={input} onChange={setInput} language="bash" title="cURL Input" />
        <OutputPanel value={output} language="javascript" title="Fetch Output" />
      </div>
    </ToolShell>
  );
}
