"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { toSlug } from "@/utils/strings";

export function SlugGenerator() {
  const [input, setInput] = useState("Hello World: DevForge Tool");

  const output = useMemo(() => {
    return toSlug(input);
  }, [input]);

  return (
    <ToolShell toolId="slug-generator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel value={input} onChange={setInput} language="text" title="Input Text" />
        <OutputPanel value={output} language="text" title="Slug" />
      </div>
    </ToolShell>
  );
}
