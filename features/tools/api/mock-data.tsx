"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutputPanel } from "@/components/tools/output-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type EntityType =
  | "users"
  | "orders"
  | "products"
  | "invoices"
  | "tickets"
  | "events"
  | "companies"
  | "posts"
  | "comments"
  | "payments";

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "orders", label: "Orders" },
  { value: "products", label: "Products" },
  { value: "invoices", label: "Invoices" },
  { value: "tickets", label: "Tickets" },
  { value: "events", label: "Events" },
  { value: "companies", label: "Companies" },
  { value: "posts", label: "Posts" },
  { value: "comments", label: "Comments" },
  { value: "payments", label: "Payments" },
];

export function MockDataGenerator() {
  const [count, setCount] = useState(5);
  const [resource, setResource] = useState<EntityType>("users");
  const [idStart, setIdStart] = useState(1);
  const [includeMeta, setIncludeMeta] = useState(true);
  const [format, setFormat] = useState<"array" | "object">("array");
  const [statusMode, setStatusMode] = useState<"random" | "active" | "inactive">("random");

  const output = useMemo(() => {
    const names = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Olivia"];
    const domains = ["mail.com", "devforge.app", "example.com"];
    const statuses = ["pending", "paid", "cancelled", "processing"];
    const priorities = ["low", "medium", "high", "urgent"];

    const makeRecord = (id: number) => {
      const active =
        statusMode === "active" ? true : statusMode === "inactive" ? false : Math.random() > 0.35;
      const base = {
        id,
        active,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      };

      if (resource === "users") {
        return {
          ...base,
          name: randomItem(names),
          email: `user${id}@${randomItem(domains)}`,
          role: randomItem(["admin", "manager", "user"]),
        };
      }
      if (resource === "orders") {
        return {
          ...base,
          orderNo: `ORD-${10000 + id}`,
          amount: +(Math.random() * 1000).toFixed(2),
          currency: randomItem(["USD", "EUR", "RUB"]),
          status: randomItem(statuses),
        };
      }
      if (resource === "products") {
        return {
          ...base,
          sku: `SKU-${id}`,
          title: `Product ${id}`,
          price: +(Math.random() * 250).toFixed(2),
          stock: Math.floor(Math.random() * 500),
          category: randomItem(["electronics", "fashion", "books", "home"]),
        };
      }
      if (resource === "invoices") {
        return {
          ...base,
          invoiceNo: `INV-${20000 + id}`,
          customer: randomItem(names),
          total: +(Math.random() * 5000).toFixed(2),
          dueDate: new Date(Date.now() + Math.random() * 1e9).toISOString(),
          status: randomItem(["draft", "sent", "paid", "overdue"]),
        };
      }
      if (resource === "tickets") {
        return {
          ...base,
          subject: `Support issue #${id}`,
          priority: randomItem(priorities),
          assignee: randomItem(names),
          status: randomItem(["open", "in_progress", "resolved", "closed"]),
        };
      }
      if (resource === "events") {
        return {
          ...base,
          title: `Event ${id}`,
          startsAt: new Date(Date.now() + Math.random() * 2e9).toISOString(),
          location: randomItem(["London", "Berlin", "Tokyo", "New York"]),
          attendees: Math.floor(Math.random() * 300),
        };
      }
      if (resource === "companies") {
        return {
          ...base,
          legalName: `Company ${id} LLC`,
          domain: `company${id}.com`,
          employees: Math.floor(Math.random() * 2000),
          industry: randomItem(["fintech", "health", "education", "retail"]),
        };
      }
      if (resource === "posts") {
        return {
          ...base,
          title: `Post title ${id}`,
          author: randomItem(names),
          views: Math.floor(Math.random() * 10000),
          tags: [randomItem(["dev", "ai", "node", "react"]), randomItem(["tips", "guide", "news"])],
        };
      }
      if (resource === "comments") {
        return {
          ...base,
          postId: Math.max(1, id - 1),
          author: randomItem(names),
          body: `Comment text ${id}`,
          likes: Math.floor(Math.random() * 200),
        };
      }
      return {
        ...base,
        paymentId: `PAY-${30000 + id}`,
        method: randomItem(["card", "bank_transfer", "paypal", "crypto"]),
        amount: +(Math.random() * 2000).toFixed(2),
        status: randomItem(statuses),
      };
    };

    const data = Array.from({ length: count }, (_, i) => makeRecord(idStart + i)).map((item) => ({
      ...item,
      ...(includeMeta
        ? {
            meta: {
              source: "mock-data-generator",
              version: 1,
              entity: resource,
              seed: idStart,
            },
          }
        : {}),
    }));
    const payload =
      format === "array"
        ? data
        : {
            items: data,
            total: data.length,
            resource: resource,
          };
    return JSON.stringify(payload, null, 2);
  }, [count, resource, idStart, includeMeta, format, statusMode]);

  return (
    <ToolShell toolId="mock-data">
      <div className="space-y-4 h-full">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="resource">Entity</Label>
            <Select value={resource} onValueChange={(v) => setResource(v as EntityType)}>
              <SelectTrigger id="resource">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">Count</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-28 no-spin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id-start">Start ID</Label>
            <Input
              id="id-start"
              type="number"
              value={idStart}
              onChange={(e) => setIdStart(Math.max(1, Number(e.target.value) || 1))}
              className="no-spin"
            />
          </div>
          <div className="space-y-2">
            <Label>Response format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "array" | "object")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="array">Array</SelectItem>
                <SelectItem value="object">Object + meta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status mode</Label>
            <Select value={statusMode} onValueChange={(v) => setStatusMode(v as "random" | "active" | "inactive")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="active">Always active</SelectItem>
                <SelectItem value="inactive">Always inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 h-10 mt-7">
            <Switch checked={includeMeta} onCheckedChange={setIncludeMeta} id="include-meta" />
            <Label htmlFor="include-meta">Meta</Label>
          </div>
        </div>
        <OutputPanel value={output} language="json" title="Mock Response" />
      </div>
    </ToolShell>
  );
}
