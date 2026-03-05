# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT:** This document is written in English, but always make an effort to communicate with users in **Japanese**.

## Project Overview

kemono-profile is a digital business card exchange web app for doujin events and meetups. Users can create public profiles (digital business cards) and share them via URL/QR code. The MVP focuses on quick SNS (primarily X/Twitter) navigation from mobile devices.

## Documentation References
- **MVP Specs**: Refer to `docs/spec.md` for requirements and scope.
- **Task Management**: See `docs/todo.md` for remaining tasks and priorities.
- **Architecture**: Consult `docs/rolemap.md` for file structures under `src/app/` and their respective roles.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style, RSC enabled)
- **Linter/Formatter**: Biome *(not ESLint/Prettier)*
- **Database**: Supabase (Cloud project via Supabase CLI)

## Development Commands

- Use standard Next.js commands via `pnpm` (`dev`, `build`, `start`, `lint`).

## Rules for Implementation and Revision Proposals

### Specification-First Development

**CRITICAL**: Before implementing any new feature or significant behavior change:

1. **Check if the change is documented in `docs/spec.md`**
2. **If NOT documented, prompt the user to update `docs/spec.md` first**
3. **Only proceed with implementation after the specification is updated**

This ensures:
- All stakeholders understand what is being built
- The implementation matches the intended design
- Documentation stays synchronized with code

**Exception**: Bug fixes and code style improvements do not require spec updates.

### Step-by-Step Verification

* For complex flows (such as user authentication or data pipelines), explain each step sequentially, **pausing** before proceeding to the next step to confirm.

### Basic Principles

1. **Always state the reason for the change**: "Why this change is necessary"
2. **Clearly specify the scope of impact**: "Files/functions affected by this change"

### Task Management

* **MUST update `docs/todo.md` when tasks are completed**: Change `- [ ]` to `- [x]` for completed tasks
* This ensures progress tracking and visibility of what has been accomplished
* Update the todo list immediately after completing each task

### Prohibited Actions

* Refactoring existing code not requested
* Code style changes unrelated to the change request
* Rewrites for performance optimization (unless explicitly requested)

### When Creating New Files

* Explicitly mark as `[New File]`
* Explain the role and necessity of the file
* Present the complete file contents in diff format

## Code Style

**IMPORTANT**: This project uses Biome, not ESLint or Prettier.

Code formatting runs automatically via hooks. Run `pnpm lint` to check for issues.

Do not perform linter behavior. Delegate all linting to biome.

### Environment Variables

**IMPORTANT**: Always use the `env()` helper function to access environment variables.

- **For Server**: `import { env } from "@/lib/env.server"`
- **For Client**: `import { env } from "@/lib/env.client"`

```typescript
// ❌ BAD - Biome lint warning
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ GOOD (Server Component / Action / Route Handler)
import { env } from "@/lib/env.server";
const url = env("NEXT_PUBLIC_SUPABASE_URL");

**Exception**: Variables used only for comparison (e.g., `process.env.NODE_ENV === "value"`, `BYPASS_*`) do not need `env()`.

The `env()` helper throws an error at runtime if the variable is undefined, providing better error messages than silent undefined access.

### SVG Icons

All decorative SVG icons must include `aria-hidden="true"` to satisfy Biome's `a11y/noSvgWithoutTitle` rule.

- Decorative icons (icons with adjacent text labels): Add `aria-hidden="true"`
- Standalone meaningful icons: Add `<title>` element inside `<svg>`

### UI Components (shadcn/ui)

Use **shadcn/ui** components (`src/components/ui/`) instead of bare HTML elements. Never use raw `<button>` or `<label>`.

- Add components: `pnpm dlx shadcn@latest add <component> --overwrite`
- `src/components/ui/` is excluded from Biome checks.

### Form Input Components

**IMPORTANT**: Do NOT use bare `<input>` or `<textarea>` elements. Always use the shared components from `src/components/ui/input.tsx`.

`import { Input, Textarea } from "@/components/ui/input";`

To change the shared form style, edit `src/components/ui/input.tsx` — it applies to all forms at once.

## Architecture

### URL Structure

- Public profile pages: `/p/{profile_id}` or `/p/@{slug}`
  - `profile_id`: 15-character base62 random ID (cryptographically secure, not `Math.random()`)
  - `slug`: Optional custom URL (3-20 chars, lowercase letters, numbers, underscores, must start with lowercase letter)
  - Must be URL-safe and non-guessable

### Key Design Principles

#### Core Rules

##### Architecture

- Keep it simple; mirror existing patterns.
- Do NOT add DI, abstract base classes, plugin/provider architectures, or “future-proof” layers.

##### Boundaries (Server/Client + Routes)

- Server: fetch + server-only logic. Mutations must go through Server Actions or Route Handlers.
- Client: UI interaction only; keep logic thin.
- Routes/Actions flow: validation → auth → processing → response. If complex:
  - Route-local logic: extract to a `_lib/` directory co-located with the route (e.g., `app/auth/callback/_lib/`)
  - Shared logic reused across routes/actions: move to `lib/services/*`

##### Pragmatics

- State: server state > URL > component > Context. Avoid external state libs until clearly necessary.

- TypeScript: dedupe types only if used in 2+ places and same meaning; keep API DTOs separate from domain types.

##### Pragmatic Coding (no premature DRY)

- Tailwind: allow duplication; only extract when the exact class set appears 3+ times in one file.
- TypeScript: deduplicate types only if used in 2+ places AND they represent the same meaning.
  Keep API DTOs separate from internal domain types.

#### Project Rules

1. **Mobile-first**: All UI optimized for smartphone display
2. **No login required for viewing**: Public profiles accessible without authentication
3. **Login required for creating**: Profile owners must authenticate
4. **Local-first bookmarks**: Bookmarks always saved to IndexedDB, synced to cloud only when logged in
5. **No cloud sync for view history**: History stays local only
6. **Soft deletes**: Use `deleted_at` for bookmarks (both client and cloud)
