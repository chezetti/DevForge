# features/tools/ — tool implementations

One file = one tool, grouped by category: `features/tools/{category}/{tool-id}.tsx`. The export is **named** (PascalCase), and the file starts with `'use client'`.

> Note: folder names don't always match the `category` in the registry. Text tools live in both `text/` and `string/`; colors are in `colors/` even though the category is `devutils`/`css`. Follow the import path in `config/tool-components.tsx`, not the `category` field.

## Standard pattern (single-input)

The reference is [json/json-beautifier.tsx](json/json-beautifier.tsx). Structure:

1. `const tool = getToolById('<id>')!`
2. From the store: `const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()`
3. Local state: `input`, `output`, `status: 'idle'|'success'|'error'`, `errorMessage`, plus tool options.
4. `processX(value, source: 'user'|'example' = 'user')` — pure run: validates, calls a `utils/` function, sets `output`/`status`, and on success calls `addToolHistory({ toolId, input, output }, { source })`.
5. `handleInputChange(value)` — `setInput` + `setToolDraft(tool.id, value)` + (if `autoRun`) `processX(value)`.
6. `useEffect` on mount: loads the draft (`getToolDraft`) or the default example, runs once with `source: 'example'`.
7. Render: `<ToolShell tool={tool} onHistorySelect={...} actions={...}>` wraps `<EditorPanel>` + `<OutputPanel>` in `grid grid-cols-1 lg:grid-cols-2 gap-4 h-full`.

Alternative to the boilerplate: the `@/hooks/use-tool-state` hook (`useToolState`) encapsulates draft/history/autoRun. Some tools use it, some access the store directly; both are valid — follow neighboring files in the same category.

## Variants by inputType

- **dual** — two editors: `DualEditorPanel` or a manual pair of `EditorPanel`. The second input is stored in `toolDraftsSecondary` (`setToolDraftSecondary`/`getToolDraftSecondary`).
- **form** — custom controls from `components/ui/` instead of Monaco; output usually in `OutputPanel`.
- **none** — generators (UUID, ObjectId): the action lives in a header `actions` button, no input.
- **diff / tree / preview** — special output: `components/tools/diff-viewer.tsx`, or a custom render inside `OutputPanel`/a container.

## Rules

- Keep transform logic in `utils/**`, not in the component. The component is state + util calls + markup. Add a new pure function to `utils/` and cover it with a test.
- The mount demo run is always `source: 'example'` (otherwise the example pollutes history).
- Respect `autoRun`: when disabled, run on the Format/Run button or Ctrl+Enter.
- Don't touch `localStorage` directly — only through the store.
- Icons — `lucide-react`, toasts — `sonner`.
