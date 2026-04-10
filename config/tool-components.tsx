"use client";

import { lazy, Suspense, ComponentType } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getToolById } from "@/config/tool-registry";

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

const TsToJs = lazy(() => import("@/features/tools/typescript/ts-to-js").then(m => ({ default: m.TsToJs })));
const EnumGenerator = lazy(() => import("@/features/tools/typescript/enum-generator").then(m => ({ default: m.EnumGenerator })));
const InterfaceBuilder = lazy(() => import("@/features/tools/typescript/interface-builder").then(m => ({ default: m.InterfaceBuilder })));
const TsAstViewer = lazy(() => import("@/features/tools/typescript/ts-ast").then(m => ({ default: m.TsAstViewer })));

const DecoratorPlayground = lazy(() => import("@/features/tools/nestjs/decorator-playground").then(m => ({ default: m.DecoratorPlayground })));

const AggregationBuilder = lazy(() => import("@/features/tools/mongodb/aggregation-builder").then(m => ({ default: m.AggregationBuilder })));
const BsonJsonConverter = lazy(() => import("@/features/tools/mongodb/bson-json").then(m => ({ default: m.BsonJsonConverter })));
const MongoFilterTester = lazy(() => import("@/features/tools/mongodb/mongo-filter-tester").then(m => ({ default: m.MongoFilterTester })));

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

const TextDiff = lazy(() => import("@/features/tools/text/text-diff").then(m => ({ default: m.TextDiff })));
const CaseConverter = lazy(() => import("@/features/tools/text/case-converter").then(m => ({ default: m.CaseConverter })));
const LoremGenerator = lazy(() => import("@/features/tools/text/lorem-generator").then(m => ({ default: m.LoremGenerator })));
const RegexTester = lazy(() => import("@/features/tools/text/regex-tester").then(m => ({ default: m.RegexTester })));

const TimestampConverter = lazy(() => import("@/features/tools/datetime/timestamp-converter").then(m => ({ default: m.TimestampConverter })));
const DateCalculator = lazy(() => import("@/features/tools/datetime/date-calculator").then(m => ({ default: m.DateCalculator })));
const CronParser = lazy(() => import("@/features/tools/datetime/cron-parser").then(m => ({ default: m.CronParser })));

const ColorConverter = lazy(() => import("@/features/tools/colors/color-converter").then(m => ({ default: m.ColorConverter })));
const GradientGenerator = lazy(() => import("@/features/tools/colors/gradient-generator").then(m => ({ default: m.GradientGenerator })));

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

  // TypeScript
  "ts-to-js": TsToJs,
  "enum-generator": EnumGenerator,
  "interface-builder": InterfaceBuilder,
  "ts-ast": TsAstViewer,

  // NestJS
  "decorator-playground": DecoratorPlayground,

  // PostgreSQL
  "sql-formatter": SqlFormatter,
  "uuid-generator": UuidGenerator,
  "sql-query-builder": SqlQueryBuilder,
  "explain-visualizer": ExplainVisualizer,

  // MongoDB
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
  "curl-to-fetch": CurlConverter,
  "curl-to-axios": CurlConverter,
  "headers-parser": ApiTester,
  "query-params-builder": ApiTester,
  "mock-data": ApiTester,

  // Text
  "text-diff": TextDiff,
  "case-converter": CaseConverter,
  "lorem-generator": LoremGenerator,
  "regex-tester": RegexTester,

  // DateTime
  "timestamp-converter": TimestampConverter,
  "date-calculator": DateCalculator,
  "cron-parser": CronParser,
  "iso-formatter": TimestampConverter,
  "timezone-converter": TimestampConverter,
  "date-diff": DateCalculator,

  // Colors
  "color-converter": ColorConverter,
  "gradient-generator": GradientGenerator,
  "slug-generator": CaseConverter,
  "string-escape": CaseConverter,
};

function ToolLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function getToolComponent(toolId: string): ComponentType | null {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) {
    const tool = getToolById(toolId);
    if (!tool) return null;
    return function ToolPlaceholder() {
      return (
        <div className="h-full p-6">
          <h1 className="text-xl font-semibold">{tool.title}</h1>
          <p className="text-muted-foreground mt-2">{tool.description}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Tool UI for this route is not connected yet, but the route is valid.
          </p>
        </div>
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
