"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutputPanel } from "@/components/tools/output-panel";
import { Play, Plus, X, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestHistory {
  method: string;
  url: string;
  status: number;
  time: number;
  timestamp: Date;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function ApiTester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [responseHeaders, setResponseHeaders] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState("body");

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const sendRequest = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    const startTime = performance.now();

    try {
      const requestHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key) {
          requestHeaders[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      const time = Math.round(endTime - startTime);

      setStatus(res.status);
      setResponseTime(time);

      // Get response headers
      const resHeaders: string[] = [];
      res.headers.forEach((value, key) => {
        resHeaders.push(`${key}: ${value}`);
      });
      setResponseHeaders(resHeaders.join("\n"));

      // Get response body
      const contentType = res.headers.get("content-type") || "";
      let responseBody: string;

      if (contentType.includes("application/json")) {
        const json = await res.json();
        responseBody = JSON.stringify(json, null, 2);
      } else {
        responseBody = await res.text();
      }

      setResponse(responseBody);

      // Add to history
      setHistory((prev) => [
        { method, url, status: res.status, time, timestamp: new Date() },
        ...prev.slice(0, 19),
      ]);
    } catch (error) {
      setStatus(0);
      setResponse(error instanceof Error ? error.message : "Request failed");
      setResponseHeaders("");
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body]);

  const getStatusColor = (s: number) => {
    if (s >= 200 && s < 300) return "text-green-500";
    if (s >= 300 && s < 400) return "text-yellow-500";
    if (s >= 400) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <ToolShell toolId="api-tester">
      <div className="flex flex-col h-full">
        {/* Request Bar */}
        <div className="flex gap-2 p-4 border-b border-border">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && sendRequest()}
          />
          <Button onClick={sendRequest} disabled={loading || !url}>
            <Play className="h-4 w-4 mr-2" />
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Request Config */}
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="body" className="flex-1 p-4 m-0">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full h-full min-h-[200px] bg-muted/50 rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={!["POST", "PUT", "PATCH"].includes(method)}
                />
              </TabsContent>

              <TabsContent value="headers" className="flex-1 p-4 m-0 overflow-auto">
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeader(index, "enabled", e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={header.key}
                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                        placeholder="Header name"
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        value={header.value}
                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addHeader}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Header
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-4 m-0 overflow-auto">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMethod(item.method);
                          setUrl(item.url);
                        }}
                        className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium">{item.method}</span>
                          <span className={`text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.time}ms
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">{item.url}</p>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Response */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {status !== null && (
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  {status >= 200 && status < 300 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-mono text-sm font-medium ${getStatusColor(status)}`}>
                    {status || "Error"}
                  </span>
                </div>
                {responseTime !== null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {responseTime}ms
                  </span>
                )}
              </div>
            )}
            <Tabs defaultValue="response" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="res-headers">Headers</TabsTrigger>
              </TabsList>
              <TabsContent value="response" className="flex-1 m-0 overflow-hidden">
                <OutputPanel value={response} language="json" />
              </TabsContent>
              <TabsContent value="res-headers" className="flex-1 m-0 overflow-hidden">
                <OutputPanel value={responseHeaders} language="text" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
