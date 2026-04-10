"use client";

import { useState, useMemo, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import {
  parseColor,
  toHex,
  toRgb,
  toHsl,
  toHsv,
  toCmyk,
  ColorValues,
} from "@/utils/colors";

interface ColorFormat {
  name: string;
  value: string;
  css: string;
}

export function ColorConverter() {
  const [input, setInput] = useState("#3b82f6");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const colorValues = useMemo((): ColorValues | null => {
    return parseColor(input);
  }, [input]);

  const formats: ColorFormat[] = useMemo(() => {
    if (!colorValues) return [];

    const hex = toHex(colorValues);
    const rgb = toRgb(colorValues);
    const hsl = toHsl(colorValues);
    const hsv = toHsv(colorValues);
    const cmyk = toCmyk(colorValues);

    return [
      { name: "HEX", value: hex, css: hex },
      { name: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, css: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { name: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`, css: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
      { name: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, css: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
      { name: "HSLA", value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`, css: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)` },
      { name: "HSV/HSB", value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`, css: hex },
      { name: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, css: hex },
    ];
  }, [colorValues]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  return (
    <ToolShell toolId="color-converter">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Color Input</Label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="#3b82f6 or rgb(59, 130, 246) or hsl(217, 91%, 60%)"
                className="font-mono"
              />
            </div>
            <div
              className="w-12 h-10 rounded-md border border-border"
              style={{ backgroundColor: colorValues ? formats[0]?.css : "transparent" }}
            />
            <input
              type="color"
              value={colorValues ? formats[0]?.value : "#000000"}
              onChange={(e) => setInput(e.target.value)}
              className="w-12 h-10 rounded-md cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!colorValues && input.trim() ? (
            <p className="text-destructive text-sm">Invalid color format</p>
          ) : formats.length > 0 ? (
            <div className="space-y-6">
              {/* Color Preview */}
              <div className="flex gap-4">
                <div
                  className="w-32 h-32 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: formats[0]?.css }}
                />
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((opacity) => (
                    <div
                      key={opacity}
                      className="aspect-square rounded border border-border"
                      style={{ backgroundColor: formats[0]?.css, opacity }}
                      title={`${Math.round(opacity * 100)}% opacity`}
                    />
                  ))}
                </div>
              </div>

              {/* Format List */}
              <div className="grid gap-3">
                {formats.map((format, index) => (
                  <div
                    key={format.name}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {format.name}
                      </span>
                      <p className="font-mono text-sm mt-1">{format.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(format.value, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Color Info */}
              {colorValues && (
                <div className="p-4 rounded-md bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Color Information</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Red:</span> {colorValues.r}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Green:</span> {colorValues.g}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blue:</span> {colorValues.b}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a color in any format (HEX, RGB, HSL, etc.)
            </p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
