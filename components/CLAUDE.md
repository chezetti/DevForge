# components/ — UI building blocks

Three zones with different responsibilities:

## ui/ — shadcn/ui primitives (style: new-york)

Generated Radix-UI components (~57 files: button, dialog, select, dropdown-menu, switch, tabs, ...). Aliases are set in `components.json`.

- **Don't edit for a single tool.** This is the shared base; changes here ripple across the whole app.
- Add new primitives via the shadcn CLI, not by hand.
- Styling — Tailwind classes + theme CSS variables; icons — `lucide-react`.
- Class-merge helper — `cn()` from `@/lib/utils`.

## layout/ — app shell

- `app-shell.tsx` — the frame: top-bar + sidebar (desktop) / mobile-nav + command-palette. Wraps page content.
- `sidebar.tsx` — category navigation (from `getToolRegistry()`), favorites, recents.
- `command-palette.tsx` — Ctrl+K search (`cmdk`), uses `searchTools`.
- `top-bar.tsx`, `mobile-nav.tsx` — desktop/mobile headers.

State (sidebar/palette open, recents, favorites) lives in `store/app-store.ts`.

## tools/ — reusable tool building blocks

Building blocks for `features/tools/**`:

- `tool-shell.tsx` — header wrapper: title/description, favorites, history dropdown, share, settings (autoRun, panel orientation, export/import). Accepts `tool` (or `toolId`), `actions` (a node in the header), `onHistorySelect`. Every tool renders inside `ToolShell`.
- `editor-panel.tsx` — Monaco editor with a toolbar (copy/upload/download/clear/format), file drag-and-drop, placeholder. The `devforge-dark` theme is registered via `lib/monaco-theme.ts`.
- `output-panel.tsx` — output pane with `status` and `errorMessage`.
- `dual-editor-panel.tsx` — two `EditorPanel`s side by side (for `inputType: 'dual'`).
- `diff-viewer.tsx` — diff rendering (for `outputType: 'diff'`).
- `tool-renderer.tsx` — page entry point: tracks "recents" and resolves the component via `getToolComponent`.

When building a tool, reuse these blocks rather than re-building editors from scratch.
