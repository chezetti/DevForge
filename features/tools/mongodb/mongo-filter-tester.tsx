"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { DualEditorPanel } from "@/components/tools/dual-editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";

function matchesFilter(doc: Record<string, unknown>, filter: Record<string, unknown>) {
  return Object.entries(filter).every(([key, value]) => {
    if (typeof value === "object" && value && "$eq" in (value as Record<string, unknown>)) {
      return doc[key] === (value as Record<string, unknown>).$eq;
    }
    return doc[key] === value;
  });
}

export function MongoFilterTester() {
  const [filterInput, setFilterInput] = useState('{ "active": true }');
  const [dataInput, setDataInput] = useState('[{ "name": "John", "active": true }, { "name": "Mary", "active": false }]');

  const output = useMemo(() => {
    try {
      const filter = JSON.parse(filterInput) as Record<string, unknown>;
      const docs = JSON.parse(dataInput) as Record<string, unknown>[];
      return JSON.stringify(docs.filter((doc) => matchesFilter(doc, filter)), null, 2);
    } catch (error) {
      return `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }, [filterInput, dataInput]);

  return (
    <ToolShell toolId="mongo-filter-tester">
      <div className="grid grid-cols-1 gap-4 h-full">
        <DualEditorPanel
          leftValue={filterInput}
          rightValue={dataInput}
          onLeftChange={setFilterInput}
          onRightChange={setDataInput}
          leftTitle="Mongo Filter"
          rightTitle="Sample Documents"
          leftLanguage="json"
          rightLanguage="json"
        />
        <OutputPanel value={output} language="json" title="Matched Documents" />
      </div>
    </ToolShell>
  );
}
