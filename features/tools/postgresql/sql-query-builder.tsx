"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputPanel } from "@/components/tools/output-panel";

export function SqlQueryBuilder() {
  const [table, setTable] = useState("users");
  const [columns, setColumns] = useState("id, email, created_at");
  const [where, setWhere] = useState("active = true");
  const [orderBy, setOrderBy] = useState("created_at DESC");
  const [limit, setLimit] = useState("100");

  const output = useMemo(() => {
    const safeColumns = columns.trim() || "*";
    const clauses = [`SELECT ${safeColumns}`, `FROM ${table.trim() || "table_name"}`];
    if (where.trim()) clauses.push(`WHERE ${where.trim()}`);
    if (orderBy.trim()) clauses.push(`ORDER BY ${orderBy.trim()}`);
    if (limit.trim()) clauses.push(`LIMIT ${limit.trim()}`);
    return `${clauses.join("\n")};`;
  }, [table, columns, where, orderBy, limit]);

  return (
    <ToolShell toolId="sql-query-builder">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Table</Label>
            <Input value={table} onChange={(e) => setTable(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            <Input value={columns} onChange={(e) => setColumns(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Where</Label>
            <Input value={where} onChange={(e) => setWhere(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Order By</Label>
            <Input value={orderBy} onChange={(e) => setOrderBy(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        </div>
        <OutputPanel value={output} language="sql" title="SQL Query" />
      </div>
    </ToolShell>
  );
}
