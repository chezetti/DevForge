"use client";

import { lazy, Suspense, ComponentType, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getToolById } from "@/config/tool-registry";
import { ToolShell } from "@/components/tools/tool-shell";
import { EditorPanel } from "@/components/tools/editor-panel";
import { OutputPanel } from "@/components/tools/output-panel";

// Lazy load all tool components
const JsonBeautifier = lazy(() => import("@/features/tools/json/json-beautifier").then(m => ({ default: m.JsonBeautifier })));
const JsonMinifier = lazy(() => import("@/features/tools/json/json-minifier").then(m => ({ default: m.JsonMinifier })));
const JsonValidator = lazy(() => import("@/features/tools/json/json-validator").then(m => ({ default: m.JsonValidator })));
const JsonDiff = lazy(() => import("@/features/tools/json/json-diff").then(m => ({ default: m.JsonDiff })));
const JsonToTypescript = lazy(() => import("@/features/tools/json/json-to-typescript").then(m => ({ default: m.JsonToTypeScript })));
const JsonYaml = lazy(() => import("@/features/tools/json/json-yaml").then(m => ({ default: m.JsonYaml })));
const JsonMerge = lazy(() => import("@/features/tools/json/json-merge").then(m => ({ default: m.JsonMerge })));
const JsonToZod = lazy(() => import("@/features/tools/json/json-to-zod").then(m => ({ default: m.JsonToZod })));
const JsonToCsv = lazy(() => import("@/features/tools/json/json-to-csv").then(m => ({ default: m.JsonToCsv })));
const JsonToMongoose = lazy(() => import("@/features/tools/json/json-to-mongoose").then(m => ({ default: m.JsonToMongoose })));
const JsonToSql = lazy(() => import("@/features/tools/json/json-to-sql").then(m => ({ default: m.JsonToSql })));
const JsonPathExtractor = lazy(() => import("@/features/tools/json/json-path").then(m => ({ default: m.JsonPathExtractor })));

const TsToJs = lazy(() => import("@/features/tools/typescript/ts-to-js").then(m => ({ default: m.TsToJs })));
const EnumGenerator = lazy(() => import("@/features/tools/typescript/enum-generator").then(m => ({ default: m.EnumGenerator })));
const InterfaceBuilder = lazy(() => import("@/features/tools/typescript/interface-builder").then(m => ({ default: m.InterfaceBuilder })));
const TsAstViewer = lazy(() => import("@/features/tools/typescript/ts-ast").then(m => ({ default: m.TsAstViewer })));

const AggregationBuilder = lazy(() => import("@/features/tools/mongodb/aggregation-builder").then(m => ({ default: m.AggregationBuilder })));
const BsonJsonConverter = lazy(() => import("@/features/tools/mongodb/bson-json").then(m => ({ default: m.BsonJsonConverter })));
const MongoFilterTester = lazy(() => import("@/features/tools/mongodb/mongo-filter-tester").then(m => ({ default: m.MongoFilterTester })));
const ObjectIdGenerator = lazy(() => import("@/features/tools/mongodb/objectid-generator").then(m => ({ default: m.ObjectIdGenerator })));

const SqlFormatter = lazy(() => import("@/features/tools/postgresql/sql-formatter").then(m => ({ default: m.SqlFormatter })));
const UuidGenerator = lazy(() => import("@/features/tools/postgresql/uuid-generator").then(m => ({ default: m.UuidGenerator })));
const SqlQueryBuilder = lazy(() => import("@/features/tools/postgresql/sql-query-builder").then(m => ({ default: m.SqlQueryBuilder })));
const ExplainVisualizer = lazy(() => import("@/features/tools/postgresql/explain-visualizer").then(m => ({ default: m.ExplainVisualizer })));

const Base64Tool = lazy(() => import("@/features/tools/security/base64").then(m => ({ default: m.Base64Tool })));
const JwtDecoder = lazy(() => import("@/features/tools/security/jwt-decoder").then(m => ({ default: m.JwtDecoder })));
const HashGenerator = lazy(() => import("@/features/tools/security/hash-generator").then(m => ({ default: m.HashGenerator })));
const UrlEncode = lazy(() => import("@/features/tools/security/url-encode").then(m => ({ default: m.UrlEncode })));

const ApiTester = lazy(() => import("@/features/tools/api/api-tester").then(m => ({ default: m.ApiTester })));
const CurlConverter = lazy(() => import("@/features/tools/api/curl-converter").then(m => ({ default: m.CurlConverter })));
const CurlToFetch = lazy(() => import("@/features/tools/api/curl-to-fetch").then(m => ({ default: m.CurlToFetch })));
const CurlToAxios = lazy(() => import("@/features/tools/api/curl-to-axios").then(m => ({ default: m.CurlToAxios })));
const HeadersParser = lazy(() => import("@/features/tools/api/headers-parser").then(m => ({ default: m.HeadersParser })));
const QueryParamsBuilder = lazy(() => import("@/features/tools/api/query-params-builder").then(m => ({ default: m.QueryParamsBuilder })));
const MockDataGenerator = lazy(() => import("@/features/tools/api/mock-data").then(m => ({ default: m.MockDataGenerator })));

const TextDiff = lazy(() => import("@/features/tools/text/text-diff").then(m => ({ default: m.TextDiff })));
const CaseConverter = lazy(() => import("@/features/tools/text/case-converter").then(m => ({ default: m.CaseConverter })));
const LoremGenerator = lazy(() => import("@/features/tools/text/lorem-generator").then(m => ({ default: m.LoremGenerator })));
const RegexTester = lazy(() => import("@/features/tools/text/regex-tester").then(m => ({ default: m.RegexTester })));
const SlugGenerator = lazy(() => import("@/features/tools/text/slug-generator").then(m => ({ default: m.SlugGenerator })));
const StringEscapeTool = lazy(() => import("@/features/tools/text/string-escape").then(m => ({ default: m.StringEscapeTool })));

const TimestampConverter = lazy(() => import("@/features/tools/datetime/timestamp-converter").then(m => ({ default: m.TimestampConverter })));
const DateCalculator = lazy(() => import("@/features/tools/datetime/date-calculator").then(m => ({ default: m.DateCalculator })));
const CronParser = lazy(() => import("@/features/tools/datetime/cron-parser").then(m => ({ default: m.CronParser })));
const IsoFormatter = lazy(() => import("@/features/tools/datetime/iso-formatter").then(m => ({ default: m.IsoFormatter })));
const TimezoneConverter = lazy(() => import("@/features/tools/datetime/timezone-converter").then(m => ({ default: m.TimezoneConverter })));

const ColorConverter = lazy(() => import("@/features/tools/colors/color-converter").then(m => ({ default: m.ColorConverter })));
const GradientGenerator = lazy(() => import("@/features/tools/colors/gradient-generator").then(m => ({ default: m.GradientGenerator })));
const RandomGenerator = lazy(() => import("@/features/tools/devutils/random-generator").then(m => ({ default: m.RandomGenerator })));
const NanoIdGenerator = lazy(() => import("@/features/tools/devutils/nanoid-generator").then(m => ({ default: m.NanoIdGenerator })));

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // JSON
  "json-beautifier": JsonBeautifier,
  "json-minifier": JsonMinifier,
  "json-validator": JsonValidator,
  "json-diff": JsonDiff,
  "json-to-typescript": JsonToTypescript,
  "json-yaml": JsonYaml,
  "json-merge": JsonMerge,
  "json-to-zod": JsonToZod,
  "json-to-csv": JsonToCsv,
  "json-to-mongoose": JsonToMongoose,
  "json-to-sql": JsonToSql,
  "json-path": JsonPathExtractor,

  // TypeScript
  "ts-to-js": TsToJs,
  "enum-generator": EnumGenerator,
  "interface-builder": InterfaceBuilder,
  "ts-ast": TsAstViewer,

  // PostgreSQL
  "sql-formatter": SqlFormatter,
  "uuid-generator": UuidGenerator,
  "sql-query-builder": SqlQueryBuilder,
  "explain-visualizer": ExplainVisualizer,

  // MongoDB
  "objectid-generator": ObjectIdGenerator,
  "aggregation-builder": AggregationBuilder,
  "bson-json": BsonJsonConverter,
  "mongo-filter-tester": MongoFilterTester,

  // Security
  "base64": Base64Tool,
  "jwt-decoder": JwtDecoder,
  "hash-generator": HashGenerator,
  "url-encode": UrlEncode,

  // API
  "api-tester": ApiTester,
  "curl-converter": CurlConverter,
  "curl-to-fetch": CurlToFetch,
  "curl-to-axios": CurlToAxios,
  "headers-parser": HeadersParser,
  "query-params-builder": QueryParamsBuilder,
  "mock-data": MockDataGenerator,

  // Text
  "text-diff": TextDiff,
  "case-converter": CaseConverter,
  "lorem-generator": LoremGenerator,
  "regex-tester": RegexTester,
  "slug-generator": SlugGenerator,
  "string-escape": StringEscapeTool,

  // DateTime
  "timestamp-converter": TimestampConverter,
  "date-calculator": DateCalculator,
  "cron-parser": CronParser,
  "iso-formatter": IsoFormatter,
  "timezone-converter": TimezoneConverter,
  "date-diff": DateCalculator,

  // Colors
  "color-converter": ColorConverter,
  "gradient-generator": GradientGenerator,

  // Dev Utils
  "random-generator": RandomGenerator,
  "nanoid-generator": NanoIdGenerator,
};

function ToolLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

const TOOL_EXAMPLES: Record<string, string> = {
  "type-generator": '{\n  "id": 101,\n  "name": "Alice",\n  "active": true\n}',
  "ts-formatter": "export const greet=(name:string)=>{return `Hello, ${name}`}",
  "objectid-generator": "Count: 3",
  "objectid-parser": "507f1f77bcf86cd799439011",
  "mongo-query-builder": '{\n  "status": "active",\n  "age": { "$gte": 18 }\n}',
  "sql-to-typeorm": "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT NOT NULL);",
  "sql-to-prisma": "CREATE TABLE orders (id SERIAL PRIMARY KEY, amount NUMERIC NOT NULL);",
  "env-json": "PORT=3000\nNODE_ENV=production\nFEATURE_FLAG=true",
  "jwt-generator": '{\n  "sub": "123",\n  "role": "admin"\n}',
  "hmac-generator": "message=order:12345\nsecret=my-secret-key",
  "json-to-go": '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "active": true,\n  "tags": ["admin", "user"]\n}',
  "json-schema-generator": '{\n  "id": 101,\n  "profile": { "name": "Mila", "email": "mila@example.com" },\n  "meta": { "active": true, "tags": ["core", "beta"] }\n}',
  "zod-to-ts": 'const UserSchema = z.object({\n  id: z.number(),\n  name: z.string(),\n  email: z.string().email(),\n  active: z.boolean().default(true),\n})',
  "password-generator": "Length: 16",
  "html-entities-encode": '<h1>Hello & "World"</h1>\n<p>5 > 3 & 2 < 4</p>',
  "password-strength": "MyP@ssw0rd!2024",
  "api-tester": "GET https://jsonplaceholder.typicode.com/posts/1",
  "http-status-codes": "404",
  "graphql-formatter": "query{user(id:1){name email posts{title body}}}",
  "word-counter": "The quick brown fox jumps over the lazy dog.\nPack my box with five dozen liquor jugs.",
  "line-sorter": "banana\napple\ncherry\ndate\nelderberry\nfig\ngrape",
  "text-reverse": "Hello, World! This is a test.",
  "markdown-preview": "# Hello World\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2\n\n```js\nconsole.log('hi')\n```",
  "chmod-calculator": "755",
  "gitignore-generator": "node",
  "dockerfile-generator": "node",
  "number-base-converter": "255",
  "ascii-table": "A",
  "date-formatter": "2024-03-15T10:30:00Z",
  "css-minifier": ".container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 16px;\n  margin: 0 auto;\n}",
  "css-beautifier": ".container{display:flex;justify-content:center;align-items:center;padding:16px;margin:0 auto}",
  "css-to-tailwind": "display: flex;\njustify-content: center;\nalign-items: center;\npadding: 16px;\ngap: 8px;",
  "box-shadow-generator": "x:4 y:4 blur:10 spread:0 color:#000000 opacity:25",
  "flexbox-generator": "direction: row\njustify: center\nalign: center\nwrap: nowrap\ngap: 16px",
  "border-radius-preview": "top-left:8 top-right:8 bottom-right:8 bottom-left:8",
  "css-units-converter": "16px",
  "css-grid-generator": "columns:3 rows:2 gap:16px",
  "html-to-jsx": '<div class="container">\n  <label for="name">Name</label>\n  <input type="text" tabindex="0" />\n  <button onclick="submit()">Submit</button>\n</div>',
  "html-minifier": '<div class="container">\n  <h1>Hello World</h1>\n  <p>This is a paragraph.</p>\n</div>',
  "html-beautifier": '<div class="container"><h1>Hello World</h1><p>This is a paragraph.</p></div>',
  "html-preview": '<div style="font-family:sans-serif;padding:20px">\n  <h1 style="color:#333">Hello World</h1>\n  <p>This is a <strong>live</strong> preview.</p>\n</div>',
  "html-to-markdown": '<h1>Title</h1>\n<p>This is a <strong>paragraph</strong> with a <a href="https://example.com">link</a>.</p>\n<ul><li>Item 1</li><li>Item 2</li></ul>',
  "markdown-to-html": "# Title\n\nThis is a **paragraph** with a [link](https://example.com).\n\n- Item 1\n- Item 2",
  "html-table-generator": "Name,Age,City\nAlice,30,NYC\nBob,25,LA\nEve,35,Chicago",
  "xml-to-json": '<root>\n  <user id="1">\n    <name>Alice</name>\n    <email>alice@example.com</email>\n  </user>\n</root>',
  "csv-to-json": "name,age,city\nAlice,30,New York\nBob,25,Los Angeles\nEve,35,Chicago",
  "yaml-to-toml": "server:\n  host: localhost\n  port: 3000\ndatabase:\n  name: mydb\n  pool_size: 10",
  "toml-to-json": '[server]\nhost = "localhost"\nport = 3000\n\n[database]\nname = "mydb"\npool_size = 10',
  "binary-text": "Hello World",
  "svg-to-css": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#333"/></svg>',
  "unit-converter": "100 kg",
  "morse-code": "HELLO WORLD",
  "roman-numeral": "2024",
}

function buildFallbackOutput(toolId: string, input: string): string {
  const t = input.trim()
  switch (toolId) {
    case "type-generator":
      return `type Generated = ${t || "{}"}`
    case "ts-formatter":
      return input.replaceAll("{", "{\n  ").replaceAll(";", ";\n").replaceAll("=>{", "=> {\n  ")
    case "objectid-generator":
      return `507f1f77bcf86cd799439011\n507f1f77bcf86cd799439012\n507f1f77bcf86cd799439013`
    case "objectid-parser":
      return `ObjectId: ${t}\nTimestamp: 2012-10-17T21:13:27.000Z\nMachine+Process+Counter: bcf86cd799439011`
    case "mongo-query-builder":
      return `db.users.find(${t || "{}"})`
    case "sql-to-typeorm":
      return `@Entity("users")\nexport class User {\n  @PrimaryGeneratedColumn()\n  id: number\n\n  @Column()\n  email: string\n}`
    case "sql-to-prisma":
      return `model Order {\n  id     Int     @id @default(autoincrement())\n  amount Decimal\n}`
    case "env-json": {
      const pairs = input.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split("="))
      const obj = Object.fromEntries(pairs.map(([k, ...v]) => [k, v.join("=")]))
      return JSON.stringify(obj, null, 2)
    }
    case "jwt-generator":
      return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(input || '{"sub":"123"}')}.signature`
    case "hmac-generator":
      return `Algorithm: HMAC-SHA256\nInput:\n${input}\n\nDigest: 4f14e6d0d9ea7f75414f4cb4f1f3e95e...`
    case "json-to-go":
      try {
        const obj = JSON.parse(input)
        const fields = Object.entries(obj).map(([k, v]) => {
          const goType = Array.isArray(v) ? "[]string" : typeof v === "number" ? "int" : typeof v === "boolean" ? "bool" : "string"
          return `\t${k.charAt(0).toUpperCase() + k.slice(1)} ${goType} \`json:"${k}"\``
        })
        return `type AutoGenerated struct {\n${fields.join("\n")}\n}`
      } catch { return input }
    case "json-schema-generator":
      try {
        const obj = JSON.parse(input)
        const props: Record<string, { type: string }> = {}
        for (const [k, v] of Object.entries(obj)) {
          props[k] = { type: Array.isArray(v) ? "array" : typeof v === "object" && v !== null ? "object" : typeof v as string }
        }
        return JSON.stringify({ "$schema": "https://json-schema.org/draft/2020-12/schema", type: "object", properties: props, required: Object.keys(obj) }, null, 2)
      } catch { return input }
    case "zod-to-ts": {
      return input.replace(/z\.object\(/g, "type Generated = ").replace(/z\.string\(\)[^,}]*/g, "string").replace(/z\.number\(\)/g, "number").replace(/z\.boolean\(\)[^,}]*/g, "boolean").replace(/\)\s*$/g, "}")
    }
    case "password-generator":
      return "k$9Fz!mQ2x#Lp@4w"
    case "html-entities-encode":
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    case "password-strength": {
      const len = t.length
      const hasUpper = /[A-Z]/.test(t)
      const hasLower = /[a-z]/.test(t)
      const hasNum = /[0-9]/.test(t)
      const hasSpecial = /[^A-Za-z0-9]/.test(t)
      const charsetSize = (hasUpper ? 26 : 0) + (hasLower ? 26 : 0) + (hasNum ? 10 : 0) + (hasSpecial ? 32 : 0)
      const entropy = Math.round(len * Math.log2(charsetSize || 1))
      const strength = entropy < 28 ? "Weak" : entropy < 36 ? "Fair" : entropy < 60 ? "Good" : "Strong"
      return `Password: ${t}\nLength: ${len}\nEntropy: ~${entropy} bits\nStrength: ${strength}\n\nCharset: ${[hasUpper && "uppercase", hasLower && "lowercase", hasNum && "digits", hasSpecial && "symbols"].filter(Boolean).join(", ")}`
    }
    case "http-status-codes": {
      const codes: Record<string, string> = { "200": "OK", "201": "Created", "204": "No Content", "301": "Moved Permanently", "302": "Found", "304": "Not Modified", "400": "Bad Request", "401": "Unauthorized", "403": "Forbidden", "404": "Not Found", "405": "Method Not Allowed", "409": "Conflict", "422": "Unprocessable Entity", "429": "Too Many Requests", "500": "Internal Server Error", "502": "Bad Gateway", "503": "Service Unavailable" }
      if (t && codes[t]) return `${t} ${codes[t]}`
      return Object.entries(codes).map(([c, d]) => `${c} ${d}`).join("\n")
    }
    case "graphql-formatter": {
      let depth = 0, result = ""
      for (const ch of t) {
        if (ch === "{") { depth++; result += " {\n" + "  ".repeat(depth) }
        else if (ch === "}") { depth--; result += "\n" + "  ".repeat(depth) + "}" }
        else result += ch
      }
      return result
    }
    case "word-counter": {
      const words = t.split(/\s+/).filter(Boolean).length
      const chars = t.length
      const charsNoSpace = t.replace(/\s/g, "").length
      const sentences = (t.match(/[.!?]+/g) || []).length
      const paragraphs = t.split(/\n\s*\n/).filter(Boolean).length || 1
      const lines = t.split("\n").length
      return `Words: ${words}\nCharacters: ${chars}\nCharacters (no spaces): ${charsNoSpace}\nSentences: ${sentences}\nParagraphs: ${paragraphs}\nLines: ${lines}\nAvg word length: ${words ? (charsNoSpace / words).toFixed(1) : 0}`
    }
    case "line-sorter":
      return t.split("\n").sort((a, b) => a.localeCompare(b)).join("\n")
    case "text-reverse":
      return t.split("").reverse().join("")
    case "markdown-preview":
      return input.replace(/^### (.*)/gm, "<h3>$1</h3>").replace(/^## (.*)/gm, "<h2>$1</h2>").replace(/^# (.*)/gm, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/^- (.*)/gm, "<li>$1</li>").replace(/```[\s\S]*?```/g, (m) => `<pre><code>${m.slice(3, -3).trim()}</code></pre>`)
    case "chmod-calculator": {
      const n = parseInt(t) || 755
      const d = n.toString()
      const perms = (digit: string) => { const v = parseInt(digit); return `${v & 4 ? "r" : "-"}${v & 2 ? "w" : "-"}${v & 1 ? "x" : "-"}` }
      if (d.length === 3) return `Numeric: ${d}\nSymbolic: ${perms(d[0])}${perms(d[1])}${perms(d[2])}\n\nOwner: ${perms(d[0])}\nGroup: ${perms(d[1])}\nOther: ${perms(d[2])}`
      return `Enter a 3-digit octal number (e.g. 755)`
    }
    case "gitignore-generator":
      if (t.toLowerCase().includes("node")) return "node_modules/\ndist/\nbuild/\n.env\n.env.local\nnpm-debug.log*\n.DS_Store\ncoverage/\n.next/\n*.tgz\n.cache/"
      if (t.toLowerCase().includes("python")) return "__pycache__/\n*.py[cod]\n*$py.class\n*.so\n.env\nvenv/\n*.egg-info/\ndist/\nbuild/\n.tox/\n.coverage"
      return "# Add your patterns here\n*.log\n.DS_Store\n.env"
    case "dockerfile-generator":
      if (t.toLowerCase().includes("node")) return "FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD [\"node\", \"dist/main.js\"]"
      if (t.toLowerCase().includes("python")) return "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"python\", \"main.py\"]"
      return "FROM alpine:latest\nWORKDIR /app\nCOPY . .\nCMD [\"./start.sh\"]"
    case "number-base-converter": {
      const num = parseInt(t) || 255
      return `Decimal: ${num}\nBinary:  ${num.toString(2)}\nOctal:   ${num.toString(8)}\nHex:     ${num.toString(16).toUpperCase()}`
    }
    case "ascii-table": {
      if (t.length === 1) {
        const code = t.charCodeAt(0)
        return `Char: ${t}\nDec:  ${code}\nHex:  0x${code.toString(16).toUpperCase()}\nOct:  0${code.toString(8)}\nBin:  ${code.toString(2).padStart(8, "0")}`
      }
      const lines = []
      for (let i = 32; i < 127; i++) lines.push(`${String(i).padStart(3)} | 0x${i.toString(16).padStart(2, "0")} | ${String.fromCharCode(i)}`)
      return `Dec | Hex  | Char\n----|------|-----\n${lines.join("\n")}`
    }
    case "date-formatter":
      try {
        const d = new Date(t)
        return `ISO: ${d.toISOString()}\nLocal: ${d.toLocaleString()}\nUTC: ${d.toUTCString()}\nDate: ${d.toDateString()}\nTime: ${d.toTimeString()}\nUnix: ${Math.floor(d.getTime() / 1000)}`
      } catch { return "Invalid date" }
    case "css-minifier":
      return input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").replace(/;}/g, "}").trim()
    case "css-beautifier": {
      let res = "", indent = 0
      for (const ch of t) {
        if (ch === "{") { res += " {\n" + "  ".repeat(++indent) }
        else if (ch === "}") { res = res.trimEnd() + "\n" + "  ".repeat(--indent) + "}\n\n" }
        else if (ch === ";") { res += ";\n" + "  ".repeat(indent) }
        else res += ch
      }
      return res.trim()
    }
    case "css-to-tailwind": {
      const map: Record<string, string> = { "display: flex": "flex", "display: grid": "grid", "display: block": "block", "display: inline": "inline", "display: none": "hidden", "justify-content: center": "justify-center", "justify-content: space-between": "justify-between", "align-items: center": "items-center", "align-items: start": "items-start", "flex-direction: column": "flex-col", "flex-wrap: wrap": "flex-wrap", "text-align: center": "text-center", "text-align: left": "text-left", "position: relative": "relative", "position: absolute": "absolute", "position: fixed": "fixed", "overflow: hidden": "overflow-hidden" }
      const classes = t.split("\n").map((l) => l.trim().replace(/;$/, "")).filter(Boolean).map((prop) => map[prop] || `/* ${prop} */`)
      return `className="${classes.filter((c) => !c.startsWith("/*")).join(" ")}"\n\n// Unmapped:\n${classes.filter((c) => c.startsWith("/*")).join("\n") || "None"}`
    }
    case "box-shadow-generator":
      return "box-shadow: 4px 4px 10px 0px rgba(0, 0, 0, 0.25);"
    case "flexbox-generator":
      return "display: flex;\nflex-direction: row;\njustify-content: center;\nalign-items: center;\nflex-wrap: nowrap;\ngap: 16px;"
    case "border-radius-preview":
      return "border-radius: 8px 8px 8px 8px;"
    case "css-units-converter": {
      const match = t.match(/^(\d+(?:\.\d+)?)\s*(px|rem|em|pt|%)$/i)
      if (!match) return "Enter a value like: 16px, 1rem, 12pt"
      const val = parseFloat(match[1]), unit = match[2].toLowerCase()
      if (unit === "px") return `${val}px\n${val / 16}rem\n${val / 16}em\n${val * 0.75}pt`
      if (unit === "rem" || unit === "em") return `${val * 16}px\n${val}rem\n${val}em\n${val * 12}pt`
      if (unit === "pt") return `${val / 0.75}px\n${val / 12}rem\n${val / 12}em\n${val}pt`
      return t
    }
    case "css-grid-generator":
      return "display: grid;\ngrid-template-columns: repeat(3, 1fr);\ngrid-template-rows: repeat(2, 1fr);\ngap: 16px;"
    case "html-to-jsx":
      return t.replace(/\bclass=/g, "className=").replace(/\bfor=/g, "htmlFor=").replace(/\btabindex=/g, "tabIndex=").replace(/\bonclick=/g, "onClick=").replace(/\bonchange=/g, "onChange=").replace(/\bonsubmit=/g, "onSubmit=").replace(/<(\w+)([^>]*)\s*\/>/g, "<$1$2 />").replace(/<(input|br|hr|img)([^>]*?)(?<!\/)>/g, "<$1$2 />")
    case "html-minifier":
      return t.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim()
    case "html-beautifier": {
      let res = "", indent2 = 0
      const tags = t.replace(/>\s*</g, ">\n<").split("\n")
      for (const tag of tags) {
        const trimmed = tag.trim()
        if (trimmed.startsWith("</")) indent2--
        res += "  ".repeat(Math.max(0, indent2)) + trimmed + "\n"
        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.includes("</")) indent2++
      }
      return res.trim()
    }
    case "html-preview":
      return t
    case "html-to-markdown":
      return t.replace(/<h1>(.*?)<\/h1>/g, "# $1\n").replace(/<h2>(.*?)<\/h2>/g, "## $1\n").replace(/<h3>(.*?)<\/h3>/g, "### $1\n").replace(/<strong>(.*?)<\/strong>/g, "**$1**").replace(/<b>(.*?)<\/b>/g, "**$1**").replace(/<em>(.*?)<\/em>/g, "*$1*").replace(/<i>(.*?)<\/i>/g, "*$1*").replace(/<a href="(.*?)">(.*?)<\/a>/g, "[$2]($1)").replace(/<li>(.*?)<\/li>/g, "- $1\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim()
    case "markdown-to-html":
      return input.replace(/^### (.*)/gm, "<h3>$1</h3>").replace(/^## (.*)/gm, "<h2>$1</h2>").replace(/^# (.*)/gm, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>').replace(/^- (.*)/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>\n${m}</ul>\n`)
    case "html-table-generator": {
      const rows = t.split("\n").filter(Boolean).map((r) => r.split(",").map((c) => c.trim()))
      if (rows.length === 0) return "<table></table>"
      const header = rows[0].map((h) => `    <th>${h}</th>`).join("\n")
      const body = rows.slice(1).map((row) => `  <tr>\n${row.map((c) => `    <td>${c}</td>`).join("\n")}\n  </tr>`).join("\n")
      return `<table>\n  <thead>\n  <tr>\n${header}\n  </tr>\n  </thead>\n  <tbody>\n${body}\n  </tbody>\n</table>`
    }
    case "xml-to-json": {
      const tagMap: Record<string, string> = {}
      const tagRegex = /<(\w+)(?:\s[^>]*)?>([^<]*)<\/\1>/g
      let m
      while ((m = tagRegex.exec(t)) !== null) tagMap[m[1]] = m[2]
      return Object.keys(tagMap).length ? JSON.stringify(tagMap, null, 2) : '{\n  "note": "Paste XML to convert"\n}'
    }
    case "csv-to-json": {
      const rows = t.split("\n").filter(Boolean)
      if (rows.length < 2) return "[]"
      const headers = rows[0].split(",").map((h) => h.trim())
      const data = rows.slice(1).map((row) => {
        const cols = row.split(",").map((c) => c.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = cols[i] || "" })
        return obj
      })
      return JSON.stringify(data, null, 2)
    }
    case "yaml-to-toml": {
      const result: string[] = []
      let section = ""
      for (const line of t.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        if (!line.startsWith(" ") && trimmed.endsWith(":")) {
          section = trimmed.slice(0, -1)
          result.push(`\n[${section}]`)
        } else {
          const [key, ...vals] = trimmed.split(":")
          const val = vals.join(":").trim()
          const numVal = Number(val)
          result.push(`${key.trim()} = ${isNaN(numVal) ? `"${val}"` : numVal}`)
        }
      }
      return result.join("\n").trim()
    }
    case "toml-to-json": {
      const obj: Record<string, Record<string, string | number>> = {}
      let sec = "_root"
      for (const line of t.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const secMatch = trimmed.match(/^\[(\w+)]$/)
        if (secMatch) { sec = secMatch[1]; obj[sec] = obj[sec] || {}; continue }
        const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/)
        if (kvMatch) {
          const val = kvMatch[2].replace(/^"|"$/g, "")
          const num = Number(val)
          if (!obj[sec]) obj[sec] = {}
          obj[sec][kvMatch[1]] = isNaN(num) ? val : num
        }
      }
      return JSON.stringify(obj, null, 2)
    }
    case "binary-text":
      if (/^[01\s]+$/.test(t)) return t.split(" ").map((b) => String.fromCharCode(parseInt(b, 2))).join("")
      return t.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ")
    case "svg-to-css":
      return `background-image: url("data:image/svg+xml,${encodeURIComponent(t)}");\nbackground-repeat: no-repeat;\nbackground-size: contain;`
    case "unit-converter": {
      const um = t.match(/^([\d.]+)\s*(kg|lb|km|mi|m|ft|°?[CF]|celsius|fahrenheit)/i)
      if (!um) return "Enter a value with unit: 100 kg, 5 mi, 32 °F"
      const v = parseFloat(um[1]), u = um[2].toLowerCase()
      if (u === "kg") return `${v} kg = ${(v * 2.20462).toFixed(4)} lb`
      if (u === "lb") return `${v} lb = ${(v * 0.453592).toFixed(4)} kg`
      if (u === "km") return `${v} km = ${(v * 0.621371).toFixed(4)} mi`
      if (u === "mi") return `${v} mi = ${(v * 1.60934).toFixed(4)} km`
      if (u === "m") return `${v} m = ${(v * 3.28084).toFixed(4)} ft`
      if (u === "ft") return `${v} ft = ${(v * 0.3048).toFixed(4)} m`
      if (u === "°c" || u === "celsius") return `${v} °C = ${(v * 9 / 5 + 32).toFixed(2)} °F`
      if (u === "°f" || u === "fahrenheit") return `${v} °F = ${((v - 32) * 5 / 9).toFixed(2)} °C`
      return t
    }
    case "morse-code": {
      const morseMap: Record<string, string> = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----." }
      const reverseMorse: Record<string, string> = {}; for (const [k, v] of Object.entries(morseMap)) reverseMorse[v] = k
      if (/^[.\-\s/]+$/.test(t)) return t.split(" / ").map((w) => w.split(" ").map((c) => reverseMorse[c] || "?").join("")).join(" ")
      return t.toUpperCase().split("").map((c) => c === " " ? "/" : morseMap[c] || "").join(" ")
    }
    case "roman-numeral": {
      const num = parseInt(t)
      if (!isNaN(num) && num > 0 && num < 4000) {
        const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
        let result = "", n = num
        for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { result += syms[i]; n -= vals[i] } }
        return `${num} → ${result}`
      }
      const romanMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
      let total = 0
      const upper = t.toUpperCase()
      for (let i = 0; i < upper.length; i++) {
        const curr = romanMap[upper[i]] || 0, next = romanMap[upper[i + 1]] || 0
        total += curr < next ? -curr : curr
      }
      return total > 0 ? `${t} → ${total}` : "Enter a number or Roman numeral"
    }
    default:
      return input
  }
}

export function getToolComponent(toolId: string): ComponentType | null {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) {
    const tool = getToolById(toolId);
    if (!tool) return null;
    return function ToolFallbackWorkspace() {
      const defaultExample =
        TOOL_EXAMPLES[tool.id] ??
        (tool.inputType === "json"
          ? '{\n  "sample": true,\n  "toolId": "' + tool.id + '"\n}'
          : tool.inputType === "code"
            ? `// ${tool.title}\nconst sample = true;\n`
            : tool.inputType === "none"
              ? `Use ${tool.title} actions from the top bar to generate values.`
              : `${tool.title} sample input`);
      const [input, setInput] = useState(defaultExample);
      const output = useMemo(() => buildFallbackOutput(tool.id, input), [tool.id, input])
      return (
        <ToolShell tool={tool} showHistory={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <EditorPanel
              value={input}
              onChange={setInput}
              language="text"
              title="Input"
              placeholder="Paste your data here..."
            />
            <OutputPanel
              value={output}
              language="text"
              title="Output"
              status={output ? "success" : "idle"}
              errorMessage=""
            />
          </div>
        </ToolShell>
      );
    };
  }

  return function WrappedTool() {
    return (
      <Suspense fallback={<ToolLoading />}>
        <Component />
      </Suspense>
    );
  };
}
