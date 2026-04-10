"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Plus, X, Shuffle } from "lucide-react";

interface ColorStop {
  color: string;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

const PRESET_GRADIENTS = [
  { colors: ["#667eea", "#764ba2"], name: "Purple Dream" },
  { colors: ["#f093fb", "#f5576c"], name: "Pink Sunset" },
  { colors: ["#4facfe", "#00f2fe"], name: "Ocean Blue" },
  { colors: ["#43e97b", "#38f9d7"], name: "Fresh Mint" },
  { colors: ["#fa709a", "#fee140"], name: "Mango" },
  { colors: ["#a8edea", "#fed6e3"], name: "Soft Sky" },
  { colors: ["#ff0844", "#ffb199"], name: "Coral" },
  { colors: ["#0f0c29", "#302b63", "#24243e"], name: "Midnight" },
];

export function GradientGenerator() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#3b82f6", position: 0 },
    { color: "#8b5cf6", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const gradientCSS = useCallback(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

    switch (type) {
      case "linear":
        return `linear-gradient(${angle}deg, ${stopsString})`;
      case "radial":
        return `radial-gradient(circle, ${stopsString})`;
      case "conic":
        return `conic-gradient(from ${angle}deg, ${stopsString})`;
      default:
        return "";
    }
  }, [type, angle, stops]);

  const addStop = () => {
    const newPosition = stops.length > 0 ? Math.round(stops[stops.length - 1].position / 2 + 50) : 50;
    setStops([...stops, { color: "#6366f1", position: Math.min(newPosition, 100) }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof ColorStop, value: string | number) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const applyPreset = (preset: typeof PRESET_GRADIENTS[0]) => {
    const newStops = preset.colors.map((color, i) => ({
      color,
      position: Math.round((i / (preset.colors.length - 1)) * 100),
    }));
    setStops(newStops);
  };

  const randomGradient = () => {
    const randomColor = () =>
      "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setStops([
      { color: randomColor(), position: 0 },
      { color: randomColor(), position: 100 },
    ]);
    setAngle(Math.floor(Math.random() * 360));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(gradientCSS());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolShell toolId="gradient-generator">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          {/* Preview */}
          <div
            className="h-32 rounded-lg border border-border"
            style={{ background: gradientCSS() }}
          />

          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as GradientType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(type === "linear" || type === "conic") && (
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label>Angle: {angle}°</Label>
                <Slider
                  value={[angle]}
                  onValueChange={([v]) => setAngle(v)}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>
            )}

            <div className="flex gap-2 items-end">
              <Button variant="outline" size="sm" onClick={randomGradient}>
                <Shuffle className="h-4 w-4 mr-2" />
                Random
              </Button>
              <Button variant="outline" size="sm" onClick={addStop}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stop
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESET_GRADIENTS.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(preset)}
                className="w-12 h-8 rounded border border-border hover:scale-105 transition-transform"
                style={{
                  background: `linear-gradient(90deg, ${preset.colors.join(", ")})`,
                }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Color Stops */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Color Stops</h3>
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(index, "color", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={stop.color}
                  onChange={(e) => updateStop(index, "color", e.target.value)}
                  className="w-28 font-mono text-sm"
                />
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    value={[stop.position]}
                    onValueChange={([v]) => updateStop(index, "position", v)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10">{stop.position}%</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStop(index)}
                  disabled={stops.length <= 2}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* CSS Output */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">CSS</h3>
            <div className="flex gap-2">
              <code className="flex-1 p-3 rounded-md bg-muted/50 font-mono text-sm break-all">
                background: {gradientCSS()};
              </code>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
