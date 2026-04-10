"use client";

import { getToolComponent } from "@/config/tool-components";

interface ToolRendererProps {
  toolId: string;
}

export function ToolRenderer({ toolId }: ToolRendererProps) {
  const ToolComponent = getToolComponent(toolId);
  if (!ToolComponent) return null;
  return <ToolComponent />;
}
