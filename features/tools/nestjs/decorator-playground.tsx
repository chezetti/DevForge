"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OutputPanel } from "@/components/tools/output-panel";

export function DecoratorPlayground() {
  const [className, setClassName] = useState("UsersController");
  const [route, setRoute] = useState("users");
  const [useAuth, setUseAuth] = useState(true);
  const [useValidation, setUseValidation] = useState(true);

  const output = useMemo(() => {
    const lines: string[] = [];
    lines.push('import { Controller, Get, Param } from "@nestjs/common";');
    if (useAuth) lines.push('import { UseGuards } from "@nestjs/common";');
    if (useAuth) lines.push('import { AuthGuard } from "../auth/auth.guard";');
    if (useValidation) lines.push('import { ParseIntPipe } from "@nestjs/common";');
    lines.push("");
    if (useAuth) lines.push("@UseGuards(AuthGuard)");
    lines.push(`@Controller("${route}")`);
    lines.push(`export class ${className} {`);
    lines.push("  @Get(':id')");
    lines.push(
      `  getOne(@Param('id'${useValidation ? ", ParseIntPipe" : ""}) id: ${useValidation ? "number" : "string"}) {`
    );
    lines.push("    return { id };");
    lines.push("  }");
    lines.push("}");
    return lines.join("\n");
  }, [className, route, useAuth, useValidation]);

  return (
    <ToolShell toolId="decorator-playground">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Class Name</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Route</Label>
            <Input value={route} onChange={(e) => setRoute(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={useAuth} onCheckedChange={(v) => setUseAuth(Boolean(v))} />
            <Label>Use auth guard</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={useValidation} onCheckedChange={(v) => setUseValidation(Boolean(v))} />
            <Label>Use ParseIntPipe</Label>
          </div>
        </div>
        <OutputPanel value={output} language="typescript" title="Generated Code" />
      </div>
    </ToolShell>
  );
}
