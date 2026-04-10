"use client";

import { useState, useEffect, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, RefreshCw } from "lucide-react";
import { formatTimestamp, parseTimestamp, COMMON_TIMEZONES } from "@/utils/datetime";

interface ConversionResult {
  label: string;
  value: string;
}

export function TimestampConverter() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"unix" | "iso" | "auto">("auto");
  const [timezone, setTimezone] = useState("UTC");
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setTimestamp(null);
      return;
    }

    const parsed = parseTimestamp(input, inputType);
    setTimestamp(parsed);
  }, [input, inputType]);

  const conversions: ConversionResult[] = timestamp
    ? [
        { label: "Unix Timestamp (seconds)", value: Math.floor(timestamp / 1000).toString() },
        { label: "Unix Timestamp (milliseconds)", value: timestamp.toString() },
        { label: "ISO 8601", value: new Date(timestamp).toISOString() },
        { label: "RFC 2822", value: new Date(timestamp).toUTCString() },
        { label: "Local Time", value: formatTimestamp(timestamp, timezone, "full") },
        { label: "Date Only", value: formatTimestamp(timestamp, timezone, "date") },
        { label: "Time Only", value: formatTimestamp(timestamp, timezone, "time") },
        { label: "Relative", value: formatTimestamp(timestamp, timezone, "relative") },
      ]
    : [];

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const setNow = useCallback(() => {
    setInput(Date.now().toString());
  }, []);

  return (
    <ToolShell toolId="timestamp-converter">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Current Unix Timestamp:</span>
            <code className="font-mono bg-muted px-2 py-1 rounded">
              {Math.floor(currentTime / 1000)}
            </code>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Input Value</Label>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter timestamp or date string..."
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={setNow}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="w-40 space-y-2">
              <Label>Input Type</Label>
              <Select value={inputType} onValueChange={(v) => setInputType(v as typeof inputType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="unix">Unix Timestamp</SelectItem>
                  <SelectItem value="iso">ISO 8601 / Date String</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48 space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {timestamp === null && input.trim() ? (
            <p className="text-destructive text-sm">Invalid date/timestamp</p>
          ) : conversions.length > 0 ? (
            <div className="grid gap-3">
              {conversions.map((conversion, index) => (
                <div
                  key={conversion.label}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {conversion.label}
                    </span>
                    <p className="font-mono text-sm mt-1 truncate">{conversion.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(conversion.value, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a Unix timestamp or date string to convert
            </p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
