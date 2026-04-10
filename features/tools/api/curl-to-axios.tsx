"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { curlToAxios } from "@/utils/api";

const SAMPLE = `curl -X GET 'https://api.example.com/users?active=true' \
  -H 'Authorization: Bearer token'`;

export function CurlToAxios() {
  const [input, setInput] = useState(SAMPLE);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return curlToAxios(input);
    } catch (error) {
      return `// Unable to parse cURL\n// ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }, [input]);

  return (
    <ToolShell toolId="curl-to-axios">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel value={input} onChange={setInput} language="bash" title="cURL Input" />
        <OutputPanel value={output} language="javascript" title="Axios Output" />
      </div>
    </ToolShell>
  );
}
