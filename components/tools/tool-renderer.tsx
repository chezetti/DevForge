"use client";

import { useEffect } from "react";
import { getToolComponent } from "@/config/tool-components";
import { useAppStore } from "@/store/app-store";

interface ToolRendererProps {
  toolId: string;
}

export function ToolRenderer({ toolId }: ToolRendererProps) {
  const { addRecentTool } = useAppStore();
  useEffect(() => {
    addRecentTool(toolId);
  }, [toolId, addRecentTool]);

  const ToolComponent = getToolComponent(toolId);
  if (!ToolComponent) return null;
  return <ToolComponent />;
}
