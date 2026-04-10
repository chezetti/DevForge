"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { DualEditorPanel } from "@/components/tools/dual-editor-panel";
import { DiffViewer } from "@/components/tools/diff-viewer";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";

export function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const handleCompare = useCallback(() => {
    setShowDiff(true);
  }, []);

  return (
    <ToolShell toolId="text-diff">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium">Compare two text blocks</h3>
          <Button onClick={handleCompare} disabled={!left || !right}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
        </div>

        {showDiff ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-border">
              <Button variant="ghost" size="sm" onClick={() => setShowDiff(false)}>
                Back to Editor
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DiffViewer left={left} right={right} />
            </div>
          </div>
        ) : (
          <DualEditorPanel
            leftValue={left}
            rightValue={right}
            onLeftChange={setLeft}
            onRightChange={setRight}
            leftLabel="Original"
            rightLabel="Modified"
            language="text"
          />
        )}
      </div>
    </ToolShell>
  );
}
