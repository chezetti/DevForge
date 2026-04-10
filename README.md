# DevForge

DevForge is a modern developer toolbox built with Next.js and React.
It provides many browser-based utilities for formatting, conversion, code generation, and quick data transformations.

## Highlights

- Category-based tool catalog (JSON, TypeScript, API, Security, Date/Time, Text, MongoDB, PostgreSQL, NestJS, Dev Utils)
- Fast client-side UI with reusable tool shell and editors
- Dynamic tool routing via `/tools/{category}/{tool}`
- Searchable navigation and command palette
- Static generation for tool pages

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Zustand
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

- `app/` - Next.js app router pages and layouts
- `components/` - shared UI/layout/tool building blocks
- `config/` - tool registry and component mapping
- `features/tools/` - tool implementations by category
- `store/` - application state
- `utils/` - conversion/parsing/helper logic

## Notes

- This project is configured for local development without vendor analytics integration.
- Static assets were cleaned up to include only project-relevant files.

## License

This project is provided as-is for development and learning purposes.
