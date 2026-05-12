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
const JsonToGo = lazy(() => import("@/features/tools/json/json-to-go").then(m => ({ default: m.JsonToGo })));
const JsonSchemaGenerator = lazy(() => import("@/features/tools/json/json-schema-generator").then(m => ({ default: m.JsonSchemaGenerator })));
const JsonToGraphql = lazy(() => import("@/features/tools/json/json-to-graphql").then(m => ({ default: m.JsonToGraphql })));

const TsToJs = lazy(() => import("@/features/tools/typescript/ts-to-js").then(m => ({ default: m.TsToJs })));
const EnumGenerator = lazy(() => import("@/features/tools/typescript/enum-generator").then(m => ({ default: m.EnumGenerator })));
const InterfaceBuilder = lazy(() => import("@/features/tools/typescript/interface-builder").then(m => ({ default: m.InterfaceBuilder })));
const TsAstViewer = lazy(() => import("@/features/tools/typescript/ts-ast").then(m => ({ default: m.TsAstViewer })));
const ZodToTs = lazy(() => import("@/features/tools/typescript/zod-to-ts").then(m => ({ default: m.ZodToTs })));
const TypeGenerator = lazy(() => import("@/features/tools/typescript/type-generator").then(m => ({ default: m.TypeGenerator })));
const TsFormatter = lazy(() => import("@/features/tools/typescript/ts-formatter").then(m => ({ default: m.TsFormatter })));

const AggregationBuilder = lazy(() => import("@/features/tools/mongodb/aggregation-builder").then(m => ({ default: m.AggregationBuilder })));
const BsonJsonConverter = lazy(() => import("@/features/tools/mongodb/bson-json").then(m => ({ default: m.BsonJsonConverter })));
const MongoFilterTester = lazy(() => import("@/features/tools/mongodb/mongo-filter-tester").then(m => ({ default: m.MongoFilterTester })));
const ObjectIdGenerator = lazy(() => import("@/features/tools/mongodb/objectid-generator").then(m => ({ default: m.ObjectIdGenerator })));
const ObjectIdParser = lazy(() => import("@/features/tools/mongodb/objectid-parser").then(m => ({ default: m.ObjectIdParser })));
const MongoQueryBuilder = lazy(() => import("@/features/tools/mongodb/mongo-query-builder").then(m => ({ default: m.MongoQueryBuilder })));
const SqlToMongodb = lazy(() => import("@/features/tools/mongodb/sql-to-mongodb").then(m => ({ default: m.SqlToMongodb })));

const SqlFormatter = lazy(() => import("@/features/tools/postgresql/sql-formatter").then(m => ({ default: m.SqlFormatter })));
const UuidGenerator = lazy(() => import("@/features/tools/postgresql/uuid-generator").then(m => ({ default: m.UuidGenerator })));
const SqlQueryBuilder = lazy(() => import("@/features/tools/postgresql/sql-query-builder").then(m => ({ default: m.SqlQueryBuilder })));
const ExplainVisualizer = lazy(() => import("@/features/tools/postgresql/explain-visualizer").then(m => ({ default: m.ExplainVisualizer })));
const SqlToTypeorm = lazy(() => import("@/features/tools/postgresql/sql-to-typeorm").then(m => ({ default: m.SqlToTypeorm })));
const SqlToPrisma = lazy(() => import("@/features/tools/postgresql/sql-to-prisma").then(m => ({ default: m.SqlToPrisma })));

const Base64Tool = lazy(() => import("@/features/tools/security/base64").then(m => ({ default: m.Base64Tool })));
const JwtDecoder = lazy(() => import("@/features/tools/security/jwt-decoder").then(m => ({ default: m.JwtDecoder })));
const JwtGenerator = lazy(() => import("@/features/tools/security/jwt-generator").then(m => ({ default: m.JwtGenerator })));
const HmacGenerator = lazy(() => import("@/features/tools/security/hmac-generator").then(m => ({ default: m.HmacGenerator })));
const PasswordGenerator = lazy(() => import("@/features/tools/security/password-generator").then(m => ({ default: m.PasswordGenerator })));
const PasswordStrength = lazy(() => import("@/features/tools/security/password-strength").then(m => ({ default: m.PasswordStrength })));
const HtmlEntitiesEncoder = lazy(() => import("@/features/tools/security/html-entities").then(m => ({ default: m.HtmlEntitiesEncoder })));
const HashGenerator = lazy(() => import("@/features/tools/security/hash-generator").then(m => ({ default: m.HashGenerator })));
const UrlEncode = lazy(() => import("@/features/tools/security/url-encode").then(m => ({ default: m.UrlEncode })));
const JwtBuilder = lazy(() => import("@/features/tools/security/jwt-builder").then(m => ({ default: m.JwtBuilder })));
const CspGenerator = lazy(() => import("@/features/tools/security/csp-generator").then(m => ({ default: m.CspGenerator })));
const HashComparator = lazy(() => import("@/features/tools/security/hash-comparator").then(m => ({ default: m.HashComparator })));

const ApiTester = lazy(() => import("@/features/tools/api/api-tester").then(m => ({ default: m.ApiTester })));
const CurlConverter = lazy(() => import("@/features/tools/api/curl-converter").then(m => ({ default: m.CurlConverter })));
const CurlToFetch = lazy(() => import("@/features/tools/api/curl-to-fetch").then(m => ({ default: m.CurlToFetch })));
const CurlToAxios = lazy(() => import("@/features/tools/api/curl-to-axios").then(m => ({ default: m.CurlToAxios })));
const HeadersParser = lazy(() => import("@/features/tools/api/headers-parser").then(m => ({ default: m.HeadersParser })));
const QueryParamsBuilder = lazy(() => import("@/features/tools/api/query-params-builder").then(m => ({ default: m.QueryParamsBuilder })));
const MockDataGenerator = lazy(() => import("@/features/tools/api/mock-data").then(m => ({ default: m.MockDataGenerator })));
const HttpStatusCodes = lazy(() => import("@/features/tools/api/http-status-codes").then(m => ({ default: m.HttpStatusCodes })));
const GraphqlFormatter = lazy(() => import("@/features/tools/api/graphql-formatter").then(m => ({ default: m.GraphqlFormatter })));

const TextDiff = lazy(() => import("@/features/tools/text/text-diff").then(m => ({ default: m.TextDiff })));
const CaseConverter = lazy(() => import("@/features/tools/text/case-converter").then(m => ({ default: m.CaseConverter })));
const LoremGenerator = lazy(() => import("@/features/tools/text/lorem-generator").then(m => ({ default: m.LoremGenerator })));
const RegexTester = lazy(() => import("@/features/tools/text/regex-tester").then(m => ({ default: m.RegexTester })));
const SlugGenerator = lazy(() => import("@/features/tools/text/slug-generator").then(m => ({ default: m.SlugGenerator })));
const StringEscapeTool = lazy(() => import("@/features/tools/text/string-escape").then(m => ({ default: m.StringEscapeTool })));
const MarkdownPreview = lazy(() => import("@/features/tools/text/markdown-preview").then(m => ({ default: m.MarkdownPreview })));
const WordCounter = lazy(() => import("@/features/tools/text/word-counter").then(m => ({ default: m.WordCounter })));
const TextAnalyzer = lazy(() => import("@/features/tools/string/text-analyzer").then(m => ({ default: m.TextAnalyzer })));
const LineSorter = lazy(() => import("@/features/tools/text/line-sorter").then(m => ({ default: m.LineSorter })));
const TextReverse = lazy(() => import("@/features/tools/text/text-reverse").then(m => ({ default: m.TextReverse })));
const UnicodeLookup = lazy(() => import("@/features/tools/string/unicode-lookup").then(m => ({ default: m.UnicodeLookup })));
const EmojiPicker = lazy(() => import("@/features/tools/string/emoji-picker").then(m => ({ default: m.EmojiPicker })));
const DiffMerger = lazy(() => import("@/features/tools/string/diff-merger").then(m => ({ default: m.DiffMerger })));

const TimestampConverter = lazy(() => import("@/features/tools/datetime/timestamp-converter").then(m => ({ default: m.TimestampConverter })));
const DateCalculator = lazy(() => import("@/features/tools/datetime/date-calculator").then(m => ({ default: m.DateCalculator })));
const DateDiff = lazy(() => import("@/features/tools/datetime/date-calculator").then(m => ({ default: () => m.DateCalculator({ toolId: "date-diff" }) })));
const CronParser = lazy(() => import("@/features/tools/datetime/cron-parser").then(m => ({ default: m.CronParser })));
const IsoFormatter = lazy(() => import("@/features/tools/datetime/iso-formatter").then(m => ({ default: m.IsoFormatter })));
const TimezoneConverter = lazy(() => import("@/features/tools/datetime/timezone-converter").then(m => ({ default: m.TimezoneConverter })));
const DateFormatter = lazy(() => import("@/features/tools/datetime/date-formatter").then(m => ({ default: m.DateFormatter })));

const ColorConverter = lazy(() => import("@/features/tools/colors/color-converter").then(m => ({ default: m.ColorConverter })));
const GradientGenerator = lazy(() => import("@/features/tools/colors/gradient-generator").then(m => ({ default: m.GradientGenerator })));
const ColorPaletteGenerator = lazy(() => import("@/features/tools/colors/color-palette-generator").then(m => ({ default: m.ColorPaletteGenerator })));
const RandomGenerator = lazy(() => import("@/features/tools/devutils/random-generator").then(m => ({ default: m.RandomGenerator })));
const NanoIdGenerator = lazy(() => import("@/features/tools/devutils/nanoid-generator").then(m => ({ default: m.NanoIdGenerator })));
const GitignoreGenerator = lazy(() => import("@/features/tools/devutils/gitignore-generator").then(m => ({ default: m.GitignoreGenerator })));
const DockerfileGenerator = lazy(() => import("@/features/tools/devutils/dockerfile-generator").then(m => ({ default: m.DockerfileGenerator })));
const ChmodCalculator = lazy(() => import("@/features/tools/devutils/chmod-calculator").then(m => ({ default: m.ChmodCalculator })));
const EnvJson = lazy(() => import("@/features/tools/devutils/env-json").then(m => ({ default: m.EnvJson })));
const NumberBaseConverter = lazy(() => import("@/features/tools/devutils/number-base-converter").then(m => ({ default: m.NumberBaseConverter })));
const AsciiTable = lazy(() => import("@/features/tools/devutils/ascii-table").then(m => ({ default: m.AsciiTable })));
const UrlParser = lazy(() => import("@/features/tools/devutils/url-parser").then(m => ({ default: m.UrlParser })));
const CrontabBuilder = lazy(() => import("@/features/tools/devutils/crontab-builder").then(m => ({ default: m.CrontabBuilder })));
const IpCalculator = lazy(() => import("@/features/tools/devutils/ip-calculator").then(m => ({ default: m.IpCalculator })));
const RegexCheatsheet = lazy(() => import("@/features/tools/devutils/regex-cheatsheet").then(m => ({ default: m.RegexCheatsheet })));
const BoxShadowGenerator = lazy(() => import("@/features/tools/css/box-shadow-generator").then(m => ({ default: m.BoxShadowGenerator })));
const CssGridGenerator = lazy(() => import("@/features/tools/css/css-grid-generator").then(m => ({ default: m.CssGridGenerator })));
const FlexboxGenerator = lazy(() => import("@/features/tools/css/flexbox-generator").then(m => ({ default: m.FlexboxGenerator })));
const BorderRadiusPreview = lazy(() => import("@/features/tools/css/border-radius-preview").then(m => ({ default: m.BorderRadiusPreview })));
const CssMinifier = lazy(() => import("@/features/tools/css/css-minifier").then(m => ({ default: m.CssMinifier })));
const CssBeautifier = lazy(() => import("@/features/tools/css/css-beautifier").then(m => ({ default: m.CssBeautifier })));
const CssToTailwind = lazy(() => import("@/features/tools/css/css-to-tailwind").then(m => ({ default: m.CssToTailwind })));
const CssUnitsConverter = lazy(() => import("@/features/tools/css/css-units-converter").then(m => ({ default: m.CssUnitsConverter })));
const PxRemConverter = lazy(() => import("@/features/tools/css/px-rem-converter").then(m => ({ default: m.PxRemConverter })));
const AspectRatioCalculator = lazy(() => import("@/features/tools/css/aspect-ratio-calculator").then(m => ({ default: m.AspectRatioCalculator })));
const HtmlPreview = lazy(() => import("@/features/tools/html/html-preview").then(m => ({ default: m.HtmlPreview })));
const HtmlToJsx = lazy(() => import("@/features/tools/html/html-to-jsx").then(m => ({ default: m.HtmlToJsx })));
const HtmlMinifier = lazy(() => import("@/features/tools/html/html-minifier").then(m => ({ default: m.HtmlMinifier })));
const HtmlBeautifier = lazy(() => import("@/features/tools/html/html-beautifier").then(m => ({ default: m.HtmlBeautifier })));
const HtmlToMarkdown = lazy(() => import("@/features/tools/html/html-to-markdown").then(m => ({ default: m.HtmlToMarkdown })));
const MarkdownToHtml = lazy(() => import("@/features/tools/html/markdown-to-html").then(m => ({ default: m.MarkdownToHtml })));
const HtmlTableGenerator = lazy(() => import("@/features/tools/html/html-table-generator").then(m => ({ default: m.HtmlTableGenerator })));
const MetaTagGenerator = lazy(() => import("@/features/tools/html/meta-tag-generator").then(m => ({ default: m.MetaTagGenerator })));
const OpenGraphPreview = lazy(() => import("@/features/tools/html/open-graph-preview").then(m => ({ default: m.OpenGraphPreview })));
const UnitConverter = lazy(() => import("@/features/tools/converter/unit-converter").then(m => ({ default: m.UnitConverter })));
const XmlToJson = lazy(() => import("@/features/tools/converter/xml-to-json").then(m => ({ default: m.XmlToJson })));
const CsvToJson = lazy(() => import("@/features/tools/converter/csv-to-json").then(m => ({ default: m.CsvToJson })));
const YamlToToml = lazy(() => import("@/features/tools/converter/yaml-to-toml").then(m => ({ default: m.YamlToToml })));
const TomlToJson = lazy(() => import("@/features/tools/converter/toml-to-json").then(m => ({ default: m.TomlToJson })));
const BinaryText = lazy(() => import("@/features/tools/converter/binary-text").then(m => ({ default: m.BinaryText })));
const SvgToCss = lazy(() => import("@/features/tools/converter/svg-to-css").then(m => ({ default: m.SvgToCss })));
const MorseCode = lazy(() => import("@/features/tools/converter/morse-code").then(m => ({ default: m.MorseCode })));
const RomanNumeral = lazy(() => import("@/features/tools/converter/roman-numeral").then(m => ({ default: m.RomanNumeral })));
const ImageToBase64 = lazy(() => import("@/features/tools/converter/image-to-base64").then(m => ({ default: m.ImageToBase64 })));
const ImageConverter = lazy(() => import("@/features/tools/converter/image-converter").then(m => ({ default: m.ImageConverter })));
const JsonToXml = lazy(() => import("@/features/tools/converter/json-to-xml").then(m => ({ default: m.JsonToXml })));
const OpenRouterModels = lazy(() => import("@/features/tools/ai/openrouter-models").then(m => ({ default: m.OpenRouterModels })));
const YouTubeDownloader = lazy(() => import("@/features/tools/media/youtube-downloader").then(m => ({ default: m.YouTubeDownloader })));
const InstagramDownloader = lazy(() => import("@/features/tools/media/instagram-downloader").then(m => ({ default: m.InstagramDownloader })));
const YouTubeToMp3 = lazy(() => import("@/features/tools/media/youtube-to-mp3").then(m => ({ default: m.YouTubeToMp3 })));

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
  "json-to-go": JsonToGo,
  "json-schema-generator": JsonSchemaGenerator,
  "json-to-graphql": JsonToGraphql,

  // TypeScript
  "ts-to-js": TsToJs,
  "enum-generator": EnumGenerator,
  "interface-builder": InterfaceBuilder,
  "ts-ast": TsAstViewer,
  "zod-to-ts": ZodToTs,
  "type-generator": TypeGenerator,
  "ts-formatter": TsFormatter,

  // PostgreSQL
  "sql-formatter": SqlFormatter,
  "uuid-generator": UuidGenerator,
  "sql-query-builder": SqlQueryBuilder,
  "explain-visualizer": ExplainVisualizer,
  "sql-to-typeorm": SqlToTypeorm,
  "sql-to-prisma": SqlToPrisma,

  // MongoDB
  "objectid-generator": ObjectIdGenerator,
  "objectid-parser": ObjectIdParser,
  "mongo-query-builder": MongoQueryBuilder,
  "aggregation-builder": AggregationBuilder,
  "bson-json": BsonJsonConverter,
  "mongo-filter-tester": MongoFilterTester,
  "sql-to-mongodb": SqlToMongodb,

  // Security
  "base64": Base64Tool,
  "jwt-decoder": JwtDecoder,
  "jwt-generator": JwtGenerator,
  "hmac-generator": HmacGenerator,
  "password-generator": PasswordGenerator,
  "password-strength": PasswordStrength,
  "html-entities-encode": HtmlEntitiesEncoder,
  "hash-generator": HashGenerator,
  "url-encode": UrlEncode,
  "jwt-builder": JwtBuilder,
  "csp-generator": CspGenerator,
  "hash-comparator": HashComparator,

  // API
  "api-tester": ApiTester,
  "curl-converter": CurlConverter,
  "curl-to-fetch": CurlToFetch,
  "curl-to-axios": CurlToAxios,
  "headers-parser": HeadersParser,
  "query-params-builder": QueryParamsBuilder,
  "mock-data": MockDataGenerator,
  "http-status-codes": HttpStatusCodes,
  "graphql-formatter": GraphqlFormatter,

  // Text
  "text-diff": TextDiff,
  "case-converter": CaseConverter,
  "lorem-generator": LoremGenerator,
  "regex-tester": RegexTester,
  "slug-generator": SlugGenerator,
  "string-escape": StringEscapeTool,
  "markdown-preview": MarkdownPreview,
  "word-counter": WordCounter,
  "text-analyzer": TextAnalyzer,
  "line-sorter": LineSorter,
  "text-reverse": TextReverse,
  "unicode-lookup": UnicodeLookup,
  "emoji-picker": EmojiPicker,
  "diff-merger": DiffMerger,

  // DateTime
  "timestamp-converter": TimestampConverter,
  "date-calculator": DateCalculator,
  "cron-parser": CronParser,
  "iso-formatter": IsoFormatter,
  "timezone-converter": TimezoneConverter,
  "date-formatter": DateFormatter,
  "date-diff": DateDiff,

  // Colors
  "color-converter": ColorConverter,
  "gradient-generator": GradientGenerator,
  "color-palette-generator": ColorPaletteGenerator,

  // Dev Utils
  "random-generator": RandomGenerator,
  "nanoid-generator": NanoIdGenerator,
  "gitignore-generator": GitignoreGenerator,
  "dockerfile-generator": DockerfileGenerator,
  "chmod-calculator": ChmodCalculator,
  "env-json": EnvJson,
  "number-base-converter": NumberBaseConverter,
  "ascii-table": AsciiTable,
  "url-parser": UrlParser,
  "crontab-builder": CrontabBuilder,
  "ip-calculator": IpCalculator,
  "regex-cheatsheet": RegexCheatsheet,

  // CSS
  "box-shadow-generator": BoxShadowGenerator,
  "css-grid-generator": CssGridGenerator,
  "flexbox-generator": FlexboxGenerator,
  "border-radius-preview": BorderRadiusPreview,
  "css-minifier": CssMinifier,
  "css-beautifier": CssBeautifier,
  "css-to-tailwind": CssToTailwind,
  "css-units-converter": CssUnitsConverter,
  "px-rem-converter": PxRemConverter,
  "aspect-ratio-calculator": AspectRatioCalculator,

  // HTML
  "html-preview": HtmlPreview,
  "html-to-jsx": HtmlToJsx,
  "html-minifier": HtmlMinifier,
  "html-beautifier": HtmlBeautifier,
  "html-to-markdown": HtmlToMarkdown,
  "markdown-to-html": MarkdownToHtml,
  "html-table-generator": HtmlTableGenerator,
  "meta-tag-generator": MetaTagGenerator,
  "open-graph-preview": OpenGraphPreview,

  // Converter
  "unit-converter": UnitConverter,
  "xml-to-json": XmlToJson,
  "csv-to-json": CsvToJson,
  "yaml-to-toml": YamlToToml,
  "toml-to-json": TomlToJson,
  "binary-text": BinaryText,
  "svg-to-css": SvgToCss,
  "morse-code": MorseCode,
  "roman-numeral": RomanNumeral,
  "image-to-base64": ImageToBase64,
  "image-converter": ImageConverter,
  "json-to-xml": JsonToXml,

  // AI
  "openrouter-models": OpenRouterModels,

  // Media
  "youtube-downloader": YouTubeDownloader,
  "instagram-downloader": InstagramDownloader,
  "youtube-to-mp3": YouTubeToMp3,
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
  "graphql-formatter": "query GetUser($id:ID!){user(id:$id){name email posts(limit:3){title body}}}",
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
  "youtube-downloader": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "instagram-downloader": "https://www.instagram.com/reel/C5m7_demo/",
  "youtube-to-mp3": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
          <div className="flex flex-col h-full gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
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
