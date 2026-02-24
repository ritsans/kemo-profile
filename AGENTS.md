# Repository Guidelines

## Project Structure & Module Organization
Core app code is under `src/`:
- `src/app/`: App Router pages, route handlers, and server actions.
- `src/components/`: shared UI/icons (use `src/components/ui/input.tsx` for form inputs).
- `src/lib/`: shared utilities, Supabase clients/types, env helpers, SNS platform definitions.

Static assets are in `public/`. Database changes go to `supabase/migrations/` as ordered SQL files. See `docs/spec.md` for requirements.

## Build, Test, and Development Commands
Use `pnpm`:
- `pnpm dev`: start local dev server (`http://localhost:3000`).
- `pnpm build`: production build.
- `pnpm start`: run built app.
- `pnpm test`: run Vitest test suite.
- `pnpm lint`: run Biome checks (lint + formatting diagnostics).
- `pnpm format`: auto-format with Biome.

## Coding Style & Naming Conventions
TypeScript is `strict`; keep server/client boundaries clear (server for fetch/mutation, client for UI).  
Biome enforces 2-space indentation, import organization, and Next.js/React rules.

Naming patterns used in this repo:
- File names: kebab-case (for example, `profile-edit-fields.tsx`, `x-username.ts`).
- React component exports: PascalCase.
- Functions/variables: camelCase.
- Route segments: Next.js conventions under `src/app/`.

Required implementation rules:
- Use `env()` helpers, not direct `process.env` access (`@/lib/env.server`, `@/lib/env.client`).
- Use shared `Input`/`Textarea`; avoid bare `<input>` and `<textarea>`.
- Add `aria-hidden="true"` to decorative SVGs (`<title>` for meaningful standalone icons).

## Testing Guidelines
Tests use Vitest. Place tests close to source files as `*.test.ts` (for example, `src/lib/utils/x-username.test.ts`).  
Add/extend tests for bug fixes and behavior changes.  
Run `pnpm test` before opening a PR. No hard coverage gate is configured; maintain meaningful coverage for changed code.

## Specification & MVP Guardrails
Before implementing new features or major behavior changes, confirm requirements in `docs/spec.md`.  
If a feature is not in spec, update spec first, then implement (bug fixes/refactors are exceptions).

MVP invariants to preserve:
- Public profile pages are viewable without login.
- Creating/editing owner profile requires authentication.
- Public URL format is `/p/{profile_id}` or `/p/@{slug}`.
- SNS links are managed via `social_links` (JSONB + `src/lib/social-platforms.ts`), not per-platform columns.

## Commit & Pull Request Guidelines
Recent history favors short, typed commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `add:`. Keep messages imperative and scoped to one logical change.

PRs should include:
- concise summary of user-visible and technical changes,
- linked issue/spec/doc when relevant,
- screenshots or short clips for UI changes (`src/app/*`),
- notes for schema/env updates (new migration files, required variables).

## Security & Configuration Tips
Never commit secrets in `.env.local`. Keep Supabase credentials in environment variables.  
For DB changes, add a new numbered migration file; never rewrite applied migrations.
