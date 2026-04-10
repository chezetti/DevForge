"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutputPanel } from "@/components/tools/output-panel";
import { COMMON_TIMEZONES } from "@/utils/datetime";

export function TimezoneConverter() {
  const [input, setInput] = useState("2026-04-10T08:30:00.000Z");
  const [fromTimezone, setFromTimezone] = useState("UTC");
  const [toTimezone, setToTimezone] = useState("Europe/London");

  const output = useMemo(() => {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      return JSON.stringify({ error: "Invalid date input" }, null, 2);
    }

    const fromText = new Intl.DateTimeFormat("en-GB", {
      timeZone: fromTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    const toText = new Intl.DateTimeFormat("en-GB", {
      timeZone: toTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(date);

    return JSON.stringify(
      {
        input,
        fromTimezone,
        from: fromText,
        toTimezone,
        to: toText,
      },
      null,
      2
    );
  }, [input, fromTimezone, toTimezone]);

  return (
    <ToolShell toolId="timezone-converter">
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="datetime-input">Date/Time Input</Label>
            <Input
              id="datetime-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromTimezone} onValueChange={setFromTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={`from-${tz.value}`} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toTimezone} onValueChange={setToTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={`to-${tz.value}`} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <OutputPanel value={output} language="json" title="Converted Time" />
      </div>
    </ToolShell>
  );
}
