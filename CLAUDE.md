# DevForge — guide for Claude Code

DevForge is a browser-based developer toolbox (formatters, converters, generators, code generation) built on Next.js 16 + React 19. All data processing happens client-side; server routes exist only for the media tools.

> Talk to the user in **Russian**. Keep code, identifiers, in-code comments, and commit messages in English, matching the existing codebase.

## Stack

- **Next.js 16** (App Router, RSC, static generation of tool pages)
- **React 19** + TypeScript 5.7 (`strict: true`)
- **Tailwind CSS 4** (CSS-variable themes; config lives in `app/globals.css`, not `tailwind.config`)
- **shadcn/ui** (`new-york` style) on top of **Radix UI** — primitives in `components/ui/`
- **Zustand** + `persist` middleware — single store `store/app-store.ts` (key `devforge-storage`)
- **Monaco Editor** (`@monaco-editor/react`) — code editors
- **Zod** — validation (including API route request bodies)
- **Vitest** — unit tests (for `utils/` only)
- **pnpm** — package manager (always `pnpm`, never npm/yarn)

## Commands

```bash
pnpm dev          # dev server (localhost:3000)
pnpm build        # production build
pnpm start        # run production build
pnpm lint         # eslint .
pnpm test         # vitest run (unit tests for utils/)
pnpm test:watch   # vitest in watch mode
```

The dev environment is **Windows / PowerShell**. Use PowerShell syntax in scripts (`$env:VAR`, `$null`), not bash idioms.

## Architecture

Data flow for a single tool:

```
app/tools/[category]/[tool]/page.tsx   (SSG page, metadata)
  └─ components/tools/tool-renderer.tsx ("recent" tracking, component selection)
       └─ config/tool-components.tsx    (lazy map: id → React component)
            └─ features/tools/{category}/{tool}.tsx  (UI implementation)
                 ├─ components/tools/tool-shell.tsx  (header, favorites, history, share, settings)
                 ├─ components/tools/editor-panel.tsx / output-panel.tsx
                 ├─ utils/**                          (pure transform logic)
                 └─ store/app-store.ts                (drafts, history, autoRun)
```

If a component is not registered in `tool-components.tsx`, a **generic fallback workspace** renders (`getToolComponent` → `ToolFallbackWorkspace` + `buildFallbackOutput`). So a tool present in the registry "works" even without a full implementation.

### Directories

- `app/` — App Router: pages, layout, API routes (`app/api/media/*`)
- `config/` — **source of truth** for the tool set: registry + component map
- `features/tools/{category}/` — tool implementations (one file per tool)
- `features/pipelines/` — tool-chaining builder
- `components/ui/` — shadcn/ui primitives (don't edit without good reason)
- `components/layout/` — app shell (sidebar, top-bar, command palette, mobile nav)
- `components/tools/` — reusable tool building blocks (shell, editor, output, diff)
- `hooks/` — shared hooks (`use-tool-state`, `use-keyboard-shortcuts`, `use-toast`, `use-mobile`)
- `store/` — single Zustand store
- `utils/` — pure transform functions + tests in `utils/__tests__/`
- `lib/` — `utils.ts` (`cn()`), `monaco-theme.ts`

## Adding a new tool (CRITICAL: 3 places)

Tool registration is spread across three files — skipping any one breaks the integration. Details in `config/CLAUDE.md` and `features/tools/CLAUDE.md`.

1. **Registry** — add a `ToolMetadata` entry to the `tools` array in [config/tool-registry.ts](config/tool-registry.ts). This yields the route, sidebar entry, command palette, and SSG.
2. **Implementation** — create `features/tools/{category}/{tool-id}.tsx` (named export, `'use client'`).
3. **Map** — in [config/tool-components.tsx](config/tool-components.tsx) add a `lazy` import and a `TOOL_COMPONENTS` entry.

Steps 2–3 are optional: without them the tool renders via the fallback.

## Key conventions

- **`'use client'`** is required at the top of every tool file and any component with state/hooks.
- **Path alias** `@/*` → project root (`@/components`, `@/utils`, `@/config`, ...). Don't use relative `../../` imports.
- **Pure logic → `utils/`**, UI → `features/`. Move parsing/conversion into `utils/` and cover it with tests rather than keeping it in the component.
- **The store is the only persistence mechanism.** Input drafts (`toolDrafts`), history (`toolHistory`), favorites, autoRun, panel orientation. Don't reach for `localStorage` directly.
- **autoRun**: when enabled, the transform runs on every input change; otherwise it runs on a button/Ctrl+Enter. Respect the flag in the input handler.
- **History**: entries with `source: 'example'` are NOT saved (see `addToolHistory`). Pass the initial demo-example run with `'example'`.
- **Icons** — `lucide-react`. Toasts — `sonner` (`import { toast } from 'sonner'`).
- **Theming** — only via CSS variables from `app/globals.css` (`bg-background`, `text-muted-foreground`, `border-border`, `--surface`, `--success`, etc.). Don't hardcode colors; dark theme is the default.
- **Keyboard shortcuts**: Ctrl/Cmd+Enter — run, Ctrl/Cmd+S — copy output (`use-keyboard-shortcuts`).

## UI/UX & accessibility conventions

Backed by the `ui-ux-pro-max` skill (`.claude/skills/`); a reference design system is persisted at `design-system/MASTER.md`. The **canonical** token source is still `app/globals.css` — do not repaint to the skill's generic palette; DevForge's OLED-black identity is intentional.

- **Live transforms must be debounced.** Wrap the `autoRun` transform with `useDebouncedCallback` (`hooks/use-debounced-callback.ts`, ~200ms) so heavy work (Monaco, large JSON) doesn't run on every keystroke. Manual run (button / Ctrl+Enter) and the mount example run stay immediate. Reference: `features/tools/json/json-beautifier.tsx`.
- **Glassmorphism** uses the `.glass-surface` (translucent + blur) and `.glass-panel` (+ border + shadow) utilities and `--glass-*` tokens in `globals.css`. Applied to chrome/overlays: top-bar, sidebar, mobile-nav (bar + sheet), command palette, dropdowns, tool-shell header, editor/output panel toolbars, home cards. **Never** behind body text or the Monaco editor body where it would drop contrast below 4.5:1.
- **Lava-lamp background** (`.lava-lamp` + `.lava-blob-*` in `globals.css`) is home-only ([app/page.tsx](app/page.tsx)), `fixed inset-0 z-0` so glass surfaces refract it. Chrome sits above via `z-30` (see app-shell). Motion is intentionally slow (52–72s) and freezes under reduced-motion.
- **Focus** must stay visible (2px ring via global `:focus-visible`); never `outline-none` without a replacement.
- **Reduced motion** is handled globally via `@media (prefers-reduced-motion: reduce)` — don't add motion that ignores it.
- **Form inputs** need a programmatic label: `<Label htmlFor="x">` + matching `id` (visible label alone is not enough), or `aria-label` for icon-only controls.
- **Don't convey meaning by color alone** — pair it with text/icon (see password-strength label + bar).

## Tests

Vitest only picks up `**/__tests__/**/*.test.ts` (see `vitest.config.ts`), `node` environment. Tests are written for pure functions in `utils/`. Run `pnpm test` before committing changes to `utils/`.

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `MEDIA_API_URL` | Custom Cobalt-compatible media endpoint (first in the resolver chain) | No |

## What NOT to do

- Don't edit `components/ui/*` for a single tool — these are shared shadcn primitives.
- Don't commit or push without the user explicitly asking.
- Don't add npm/yarn commands — the project uses pnpm.
- Don't hardcode colors and don't bypass the store for persistence.
