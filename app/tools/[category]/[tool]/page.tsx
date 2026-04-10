import { notFound } from "next/navigation";
import { Metadata } from "next";
import { TOOL_REGISTRY, getToolBySlug } from "@/config/tool-registry";
import { ToolRenderer } from "@/components/tools/tool-renderer";

interface PageProps {
  params: Promise<{
    category: string;
    tool: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, tool } = await params;
  const toolData = getToolBySlug(category, tool);

  if (!toolData) {
    return {
      title: "Tool Not Found",
    };
  }

  return {
    title: `${toolData.title} | DevTools`,
    description: toolData.description,
  };
}

export function generateStaticParams() {
  const params: { category: string; tool: string }[] = [];

  for (const category of TOOL_REGISTRY) {
    for (const tool of category.tools) {
      params.push({
        category: category.slug,
        tool: tool.id,
      });
    }
  }

  return params;
}

export default async function ToolPage({ params }: PageProps) {
  const { category, tool } = await params;
  const toolData = getToolBySlug(category, tool);

  if (!toolData) {
    notFound();
  }

  return <ToolRenderer toolId={toolData.id} />;
}
