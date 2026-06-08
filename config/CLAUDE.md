# config/ — tool registry (source of truth)

Two files define the entire tool set. They are linked by the string `id`, which must match byte-for-byte everywhere.

## tool-registry.ts

Declarative metadata. The `tools: ToolMetadata[]` array is the primary source. From it are generated: routes (`generateStaticParams`), sidebar, command palette, search.

`ToolMetadata`:
- `id` — kebab-case, **globally unique** (not just within a category). Used as the route key, the component-map key, and the store key for history/drafts.
- `category` — one of `ToolCategory` (the union at the top of the file). A new category = extend the union + `categoryLabels` + `categoryIcons` (lucide icon name as a string).
- `inputType`: `text | json | code | dual | form | none` — drives the default example and fallback behavior.
- `outputType`: `text | json | code | diff | tree | preview`.
- `supportsLiveTransform / FileUpload / History / Share` — flags for the header (`ToolShell`) and behavior.
- `implemented` — currently `true` for all; NOT an indicator that a real component exists.

The helpers at the bottom (`getToolById`, `getToolBySlug`, `searchTools`, `getToolRegistry`, `TOOL_REGISTRY`, `FEATURED_TOOLS`, `getToolUrl`) should be reused — don't duplicate the filtering.

`FEATURED_TOOLS` — list of ids for the home page; update it manually when adding a flagship tool.

## tool-components.tsx (`'use client'`)

Maps `id` → lazy React component.

1. `const Xyz = lazy(() => import("@/features/tools/{cat}/{file}").then(m => ({ default: m.NamedExport })))` — the export is always **named**, wrapped in `{ default: ... }`.
2. An entry in `TOOL_COMPONENTS: Record<string, ComponentType>` keyed by the same `id` as in the registry.

`getToolComponent(id)`:
- if present in `TOOL_COMPONENTS` → wraps in `<Suspense>` with a spinner;
- otherwise → `ToolFallbackWorkspace`: a default example from `TOOL_EXAMPLES[id]` (or by `inputType`) + output from `buildFallbackOutput(id, input)`.

`TOOL_EXAMPLES` and `buildFallbackOutput` provide a working demo for not-yet-implemented tools. Once a full component exists, the fallback logic can be left (it won't be called) or cleaned up.

## Common mistakes

- `id` in the registry ≠ key in `TOOL_COMPONENTS` → loads the fallback instead of the component, silently.
- Default export instead of named → `.then(m => ({ default: m.Name }))` returns `undefined`.
- Forgot the registry entry but added the map entry → no route/sidebar (page 404s).
