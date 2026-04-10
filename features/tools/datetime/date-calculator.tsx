"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateDateDiff, addToDate, DateUnit } from "@/utils/datetime";

export function DateCalculator() {
  const [activeTab, setActiveTab] = useState("difference");

  // Difference calculator
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Add/Subtract calculator
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(7);
  const [unit, setUnit] = useState<DateUnit>("days");
  const [operation, setOperation] = useState<"add" | "subtract">("add");

  const difference = useMemo(() => {
    if (!startDate || !endDate) return null;
    return calculateDateDiff(new Date(startDate), new Date(endDate));
  }, [startDate, endDate]);

  const calculatedDate = useMemo(() => {
    if (!baseDate) return null;
    const actualAmount = operation === "subtract" ? -amount : amount;
    return addToDate(new Date(baseDate), actualAmount, unit);
  }, [baseDate, amount, unit, operation]);

  return (
    <ToolShell toolId="date-calculator">
      <div className="flex flex-col h-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
            <TabsTrigger value="difference">Date Difference</TabsTrigger>
            <TabsTrigger value="add">Add/Subtract</TabsTrigger>
          </TabsList>

          <TabsContent value="difference" className="flex-1 m-0 p-4 overflow-auto">
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {difference && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Results</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-md bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{difference.totalDays}</p>
                      <p className="text-xs text-muted-foreground">Total Days</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{difference.totalWeeks}</p>
                      <p className="text-xs text-muted-foreground">Total Weeks</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{difference.totalMonths}</p>
                      <p className="text-xs text-muted-foreground">Total Months</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{difference.totalYears.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total Years</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-muted/50">
                    <p className="text-sm">
                      <strong>Exact difference:</strong> {difference.years} year
                      {difference.years !== 1 ? "s" : ""}, {difference.months} month
                      {difference.months !== 1 ? "s" : ""}, {difference.days} day
                      {difference.days !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm mt-2 text-muted-foreground">
                      {difference.totalHours.toLocaleString()} hours /{" "}
                      {difference.totalMinutes.toLocaleString()} minutes /{" "}
                      {difference.totalSeconds.toLocaleString()} seconds
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Weekdays</p>
                      <p className="text-lg font-medium">{difference.weekdays}</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Weekend Days</p>
                      <p className="text-lg font-medium">{difference.weekendDays}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="flex-1 m-0 p-4 overflow-auto">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-2">
                <Label>Base Date</Label>
                <Input
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <Select value={operation} onValueChange={(v) => setOperation(v as typeof operation)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="subtract">Subtract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as DateUnit)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {calculatedDate && (
                <div className="p-4 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Result</p>
                  <p className="text-2xl font-bold">
                    {calculatedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ISO: {calculatedDate.toISOString().split("T")[0]}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
