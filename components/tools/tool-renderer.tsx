"use client";

import { useEffect, useRef } from "react";
import { getToolComponent } from "@/config/tool-components";
import { useAppStore } from "@/store/app-store";

interface ToolRendererProps {
  toolId: string;
}

export function ToolRenderer({ toolId }: ToolRendererProps) {
  const addRecentTool = useAppStore((state) => state.addRecentTool);
  const lastTrackedToolId = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedToolId.current === toolId) {
      return;
    }
    lastTrackedToolId.current = toolId;
    addRecentTool(toolId);
  }, [toolId, addRecentTool]);

  const ToolComponent = getToolComponent(toolId);
  if (!ToolComponent) return null;
  return <ToolComponent />;
}
