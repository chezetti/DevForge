"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { OutputPanel } from "@/components/tools/output-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle } from "lucide-react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos",
  "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
  "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores",
  "quas", "molestias", "excepturi", "occaecati", "cupiditate", "provident",
  "similique", "sunt", "culpa", "qui", "officia", "deserunt", "mollitia", "animi",
];

type GenerationType = "words" | "sentences" | "paragraphs";

function generateWords(count: number): string {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  return words.join(" ");
}

function generateSentence(): string {
  const wordCount = Math.floor(Math.random() * 10) + 5;
  const words = generateWords(wordCount).split(" ");
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function generateSentences(count: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(" ");
}

function generateParagraph(): string {
  const sentenceCount = Math.floor(Math.random() * 4) + 3;
  return generateSentences(sentenceCount);
}

function generateParagraphs(count: number): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateParagraph());
  }
  return paragraphs.join("\n\n");
}

export function LoremGenerator() {
  const [type, setType] = useState<GenerationType>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");
  const [startWithLorem, setStartWithLorem] = useState(true);

  const generate = useCallback(() => {
    let result: string;

    switch (type) {
      case "words":
        result = generateWords(count);
        break;
      case "sentences":
        result = generateSentences(count);
        break;
      case "paragraphs":
        result = generateParagraphs(count);
        break;
      default:
        result = "";
    }

    if (startWithLorem && result) {
      const loremStart = "Lorem ipsum dolor sit amet";
      if (type === "words") {
        const words = result.split(" ");
        words.splice(0, Math.min(5, words.length), ...loremStart.toLowerCase().split(" "));
        result = words.join(" ");
      } else {
        const firstSentence = result.split(/(?<=\.)\s/)[0];
        result = result.replace(firstSentence, loremStart + ",");
      }
    }

    setOutput(result);
  }, [type, count, startWithLorem]);

  return (
    <ToolShell toolId="lorem-generator">
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Label>Generate</Label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
              min={1}
              max={100}
            />
          </div>

          <Select value={type} onValueChange={(v) => setType(v as GenerationType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="words">Words</SelectItem>
              <SelectItem value="sentences">Sentences</SelectItem>
              <SelectItem value="paragraphs">Paragraphs</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="h-4 w-4"
            />
            Start with &quot;Lorem ipsum&quot;
          </label>

          <Button onClick={generate}>
            <Shuffle className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <OutputPanel value={output} language="text" />
        </div>
      </div>
    </ToolShell>
  );
}
