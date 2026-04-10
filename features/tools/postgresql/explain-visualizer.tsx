"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";

interface ExplainNode {
  label: string;
  children: ExplainNode[];
}

function parseExplain(plan: string): ExplainNode[] {
  const lines = plan
    .split("\n")
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim().length > 0);

  const root: ExplainNode[] = [];
  const stack: { indent: number; node: ExplainNode }[] = [];

  for (const line of lines) {
    const indent = line.search(/\S|$/);
    const node: ExplainNode = { label: line.trim(), children: [] };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (!stack.length) root.push(node);
    else stack[stack.length - 1].node.children.push(node);
    stack.push({ indent, node });
  }

  return root;
}

export function ExplainVisualizer() {
  const [input, setInput] = useState(
    "Seq Scan on users  (cost=0.00..18.10 rows=810 width=40)\n  Filter: (active = true)"
  );

  const output = useMemo(() => JSON.stringify(parseExplain(input), null, 2), [input]);

  return (
    <ToolShell toolId="explain-visualizer">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="text"
          title="EXPLAIN Output"
          placeholder="Paste EXPLAIN output here..."
        />
        <OutputPanel value={output} language="json" title="Tree View (JSON)" />
      </div>
    </ToolShell>
  );
}
