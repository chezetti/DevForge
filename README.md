# DevForge

DevForge is a modern developer toolbox built with Next.js and React.
It provides many browser-based utilities for formatting, conversion, code generation, and quick data transformations.

## Highlights

- Category-based tool catalog (JSON, TypeScript, API, Security, Date/Time, Text, MongoDB, PostgreSQL, CSS, HTML, Converters, Media, Dev Utils)
- Fast client-side UI with reusable tool shell and editors
- Dynamic tool routing via `/tools/{category}/{tool}`
- Searchable navigation and command palette (Ctrl+K)
- Static generation for tool pages
- Light / Dark theme support
- Export / Import settings between devices
- Keyboard shortcuts (Ctrl+Enter to run, Ctrl+S to copy)

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui + Radix UI
- Zustand (with persist middleware)
- Monaco Editor
- pnpm

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Run locally

```bash
pnpm dev
```

### 3) Build for production

```bash
pnpm build
pnpm start
```

## Project Structure

- `app/` — Next.js app router pages, layouts, and API routes
- `components/` — shared UI, layout, and tool building blocks
- `config/` — tool registry (`tool-registry.ts`) and component mapping (`tool-components.tsx`)
- `features/tools/` — tool implementations organized by category
- `hooks/` — shared React hooks (`useToolState`, `useKeyboardShortcuts`, etc.)
- `store/` — Zustand application state
- `utils/` — conversion, parsing, and helper logic
- `lib/` — utility functions and Monaco theme

## Adding a New Tool

1. **Register** the tool in `config/tool-registry.ts` — add a `ToolMetadata` entry to the `tools` array.
2. **Implement** the component in `features/tools/{category}/{tool-id}.tsx`.
3. **Map** it in `config/tool-components.tsx` — add a `React.lazy` import and an entry in `TOOL_COMPONENTS`.
4. The tool automatically gets its own route at `/tools/{category}/{tool-id}`, a sidebar entry, command palette support, and SSG.

If you skip step 2–3, the tool still renders via the generic fallback workspace with basic input/output functionality.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MEDIA_API_URL` | Custom Cobalt-compatible media API endpoint | No |

## Notes

- This project is configured for local development without vendor analytics integration.
- Media tools use server-side API routes and depend on third-party services.
- Static assets are in `public/`.

## License

This project is provided as-is for development and learning purposes.
