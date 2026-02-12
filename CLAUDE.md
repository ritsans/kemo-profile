# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT:** This document is written in English, but always make an effort to communicate with users in **Japanese**.

## Project Overview

kemono-profile is a digital business card exchange web app for doujin events and meetups. Users can create public profiles (digital business cards) and share them via URL/QR code. The MVP focuses on quick SNS (primarily X/Twitter) navigation from mobile devices.

See `docs/spec.md` for complete MVP specification. for the TODOs to be addressed, refer to `docs/todo.md`.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Linter/Formatter**: Biome *(not ESLint/Prettier)*
- **Database**: Supabase (Cloud project via Supabase CLI)

## Development Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint and check code
pnpm lint
```

## Rules for Implementation and Revision Proposals

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

**IMPORTANT**: Always use the `env()` helper function from `@/lib/env` to access environment variables.

- **DO NOT use** `process.env.XXX!` (non-null assertion operator) - violates Biome's `noNonNullAssertion` rule
- **DO use** `env("XXX")` from `@/lib/env`

```typescript
// ❌ BAD - Biome lint error
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ GOOD
import { env } from "@/lib/env";
const url = env("NEXT_PUBLIC_SUPABASE_URL");
```

The `env()` helper throws an error at runtime if the variable is undefined, providing better error messages than silent undefined access.

### SVG Icons

 All decorative SVG icons must include `aria-hidden="true"` to satisfy Biome's `a11y/noSvgWithoutTitle` rule.

- Decorative icons (icons with adjacent text labels): Add `aria-hidden="true"`
- Standalone meaningful icons: Add `<title>` element inside `<svg>`

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
- Routes/Actions flow: validation → auth → processing → response. If complex, move logic to `lib/services/*`.

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

### Profile Requirements

**Required fields:**
- `display_name`: Handle name (mandatory)
- `avatar`: Avatar image (required, placeholder allowed until complete)

**Optional fields:**
- `x_username`: X (Twitter) username (normalized from URL or @username input)
  - Auto-populated for X OAuth users
  - Null for Google OAuth users (can be added later via `/edit`)
- `bio`: Self-introduction text (max 160 chars)
- `slug`: Custom URL identifier for `/p/@{slug}` format (3-20 chars, unique)

**First-view priority**: Display these three elements immediately on profile load with large, tappable X link button (X link hidden/disabled if `x_username` is null).

## Out of Scope for MVP

- Event mode (lightweight routing, PWA optimization)
- Bookmark expiration/cleanup
- Mutual exchange/approval/auto-follow features
- Cloud sync for view history
