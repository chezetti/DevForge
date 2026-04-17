"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { parseCurl, generateCodeFromCurl } from "@/utils/api";

type OutputLanguage = "javascript" | "python" | "go" | "php" | "ruby";

const LANGUAGES: { value: OutputLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript (fetch)" },
  { value: "python", label: "Python (requests)" },
  { value: "go", label: "Go (net/http)" },
  { value: "php", label: "PHP (cURL)" },
  { value: "ruby", label: "Ruby (Net::HTTP)" },
];

const SAMPLE_CURL = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"name": "John", "email": "john@example.com"}'`;

export function CurlConverter() {
  const [input, setInput] = useState(SAMPLE_CURL);
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<OutputLanguage>("javascript");
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      const parsed = parseCurl(input);
      const code = generateCodeFromCurl(parsed, language);
      setOutput(code);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid cURL command");
      setOutput("");
    }
  }, [input, language]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  useEffect(() => {
    convert();
  }, [convert]);

  return (
    <ToolShell toolId="curl-converter">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Label>Output Language:</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as OutputLanguage)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
            <EditorPanel
              value={input}
              onChange={handleInputChange}
              language="bash"
              placeholder="Paste your cURL command here..."
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <OutputPanel
              value={error ? "" : output}
              language={language === "go" ? "go" : language}
              status={error ? "error" : output ? "success" : "idle"}
              errorMessage={error || undefined}
            />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
