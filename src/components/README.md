# Components Architecture

This folder follows a domain-first structure inspired by enterprise Next.js projects while staying compatible with the current Vite React app.

## Folders

- `auth`: authentication screens and auth-facing types.
- `layout`: shell-level UI such as sidebar and command palette.
- `features`: business domains, grouped by admin workflow.
- `shared/ui`: reusable low-level UI components with no domain ownership.

## Import Rules

- App-level files should import from `src/components`.
- Feature files should import shared UI from `../../shared/ui`.
- Shared UI should stay domain-agnostic and should not import from `features`.
- Prefer adding a local `index.ts` when a folder becomes a stable public boundary.
