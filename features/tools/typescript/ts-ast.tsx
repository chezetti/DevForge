"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";

export function TsAstViewer() {
  const [input, setInput] = useState("interface User {\n  id: string\n  email: string\n}");

  const output = useMemo(() => {
    const lines = input.split("\n");
    const imports = lines.filter((line) => line.trim().startsWith("import "));
    const interfaces = [...input.matchAll(/\binterface\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    const types = [...input.matchAll(/\btype\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    const functions = [...input.matchAll(/\bfunction\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    const classes = [...input.matchAll(/\bclass\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);

    return JSON.stringify(
      {
        kind: "Program",
        metrics: {
          lineCount: lines.length,
          charCount: input.length,
        },
        nodes: {
          imports,
          interfaces,
          types,
          functions,
          classes,
        },
      },
      null,
      2
    );
  }, [input]);

  return (
    <ToolShell toolId="ts-ast">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="typescript"
          title="TypeScript Input"
          placeholder="Paste TypeScript code..."
        />
        <OutputPanel value={output} language="json" title="AST (simplified)" />
      </div>
    </ToolShell>
  );
}
