"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseCronExpression, getNextCronRuns, CronPreset } from "@/utils/datetime";

const PRESETS: CronPreset[] = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every day at midnight", expression: "0 0 * * *" },
  { label: "Every day at noon", expression: "0 12 * * *" },
  { label: "Every Monday at 9am", expression: "0 9 * * 1" },
  { label: "First day of month", expression: "0 0 1 * *" },
  { label: "Every weekday at 9am", expression: "0 9 * * 1-5" },
];

export function CronParser() {
  const [expression, setExpression] = useState("0 9 * * 1-5");

  const parsed = useMemo(() => {
    return parseCronExpression(expression);
  }, [expression]);

  const nextRuns = useMemo(() => {
    if (!parsed.isValid) return [];
    return getNextCronRuns(expression, 10);
  }, [expression, parsed.isValid]);

  return (
    <ToolShell toolId="cron-parser">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="* * * * *"
              className="font-mono text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.expression}
                variant="outline"
                size="sm"
                onClick={() => setExpression(preset.expression)}
                className={expression === preset.expression ? "border-primary" : ""}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!parsed.isValid ? (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-destructive text-sm">{parsed.error || "Invalid cron expression"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Human readable */}
              <div className="p-4 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Human Readable</p>
                <p className="text-lg font-medium">{parsed.humanReadable}</p>
              </div>

              {/* Field breakdown */}
              <div>
                <h3 className="text-sm font-medium mb-3">Field Breakdown</h3>
                <div className="grid grid-cols-5 gap-2">
                  {["Minute", "Hour", "Day (Month)", "Month", "Day (Week)"].map(
                    (field, index) => (
                      <div key={field} className="p-3 rounded-md bg-muted/50 text-center">
                        <p className="font-mono text-lg font-bold">
                          {expression.split(" ")[index] || "*"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{field}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Next runs */}
              <div>
                <h3 className="text-sm font-medium mb-3">Next 10 Executions</h3>
                <div className="space-y-2">
                  {nextRuns.map((run, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                    >
                      <span className="text-muted-foreground">#{index + 1}</span>
                      <span className="font-mono">
                        {run.toLocaleString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-2">Quick Reference:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                  <span>* = any value</span>
                  <span>, = value list separator</span>
                  <span>- = range of values</span>
                  <span>/ = step values</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
