"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Match {
  value: string;
  index: number;
  groups: string[];
}

export function RegexTester() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [testString, setTestString] = useState(
    "Contact us at hello@example.com or support@test.org for assistance."
  );
  const [flags, setFlags] = useState({
    global: true,
    caseInsensitive: false,
    multiline: false,
    dotAll: false,
  });

  const { matches, error, highlightedText } = useMemo(() => {
    if (!pattern) {
      return { matches: [], error: null, highlightedText: testString };
    }

    try {
      const flagString =
        (flags.global ? "g" : "") +
        (flags.caseInsensitive ? "i" : "") +
        (flags.multiline ? "m" : "") +
        (flags.dotAll ? "s" : "");

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];
      let match: RegExpExecArray | null;

      if (flags.global) {
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      // Create highlighted text
      let highlighted = testString;
      let offset = 0;
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;

      for (const m of foundMatches) {
        if (m.index > lastIndex) {
          parts.push({ text: testString.slice(lastIndex, m.index), isMatch: false });
        }
        parts.push({ text: m.value, isMatch: true });
        lastIndex = m.index + m.value.length;
      }

      if (lastIndex < testString.length) {
        parts.push({ text: testString.slice(lastIndex), isMatch: false });
      }

      return { matches: foundMatches, error: null, highlightedText: parts };
    } catch (e) {
      return {
        matches: [],
        error: e instanceof Error ? e.message : "Invalid regex",
        highlightedText: [{ text: testString, isMatch: false }],
      };
    }
  }, [pattern, testString, flags]);

  return (
    <ToolShell toolId="regex-tester">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <div className="space-y-2">
            <Label>Regular Expression</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono">/</span>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="font-mono flex-1"
              />
              <span className="text-muted-foreground font-mono">/</span>
              <span className="text-muted-foreground font-mono text-sm">
                {flags.global ? "g" : ""}
                {flags.caseInsensitive ? "i" : ""}
                {flags.multiline ? "m" : ""}
                {flags.dotAll ? "s" : ""}
              </span>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={flags.global}
                onCheckedChange={(checked) =>
                  setFlags((f) => ({ ...f, global: checked as boolean }))
                }
              />
              Global (g)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={flags.caseInsensitive}
                onCheckedChange={(checked) =>
                  setFlags((f) => ({ ...f, caseInsensitive: checked as boolean }))
                }
              />
              Case Insensitive (i)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={flags.multiline}
                onCheckedChange={(checked) =>
                  setFlags((f) => ({ ...f, multiline: checked as boolean }))
                }
              />
              Multiline (m)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={flags.dotAll}
                onCheckedChange={(checked) =>
                  setFlags((f) => ({ ...f, dotAll: checked as boolean }))
                }
              />
              Dot All (s)
            </label>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-hidden">
            <div className="p-2 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Test String</span>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="w-full h-full min-h-[200px] bg-transparent font-mono text-sm resize-none focus:outline-none"
                placeholder="Enter test string..."
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Results</span>
              <span className="text-xs text-muted-foreground">
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Highlighted preview */}
                <div className="p-3 rounded-md bg-muted/50 font-mono text-sm whitespace-pre-wrap break-all">
                  {Array.isArray(highlightedText) ? (
                    highlightedText.map((part, i) =>
                      part.isMatch ? (
                        <mark key={i} className="bg-primary/30 text-primary-foreground px-0.5 rounded">
                          {part.text}
                        </mark>
                      ) : (
                        <span key={i}>{part.text}</span>
                      )
                    )
                  ) : (
                    highlightedText
                  )}
                </div>

                {/* Match list */}
                {matches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Matches</h4>
                    {matches.map((match, index) => (
                      <div key={index} className="p-2 rounded-md bg-muted/30 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <span className="font-mono">{match.value}</span>
                          <span className="text-xs text-muted-foreground">
                            at index {match.index}
                          </span>
                        </div>
                        {match.groups.length > 0 && (
                          <div className="mt-1 pl-4 text-xs text-muted-foreground">
                            Groups: {match.groups.map((g, i) => `$${i + 1}="${g}"`).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
