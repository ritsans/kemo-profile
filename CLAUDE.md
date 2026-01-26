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
- **Database**: Supabase (Cloud project via Supabase CLI) + IndexedDB for local data

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

### Basic Principles

1. **Present changes in diff format** (exception: new file creation)
2. **Always state the reason for the change**: "Why this change is necessary"
3. **Clearly specify the scope of impact**: "Files/functions affected by this change"

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

- Code rules are defined under the `"javascript"` key in `biome.json`.
Code formatting runs automatically via hooks. Run `pnpm lint` to check for issues. Biome enforces Next.js and React recommended rules.

Do not perform linter behavior. Delegate all linting to biome.

## Architecture

### URL Structure

- Public profile pages: `/p/{profile_id}`
  - `profile_id`: 15-character base62 random ID (cryptographically secure, not `Math.random()`)
  - Must be URL-safe and non-guessable

### Data Architecture (Planned)

**Cloud Database:**
- `profiles`: Contains `profile_id` (PK), `owner_user_id`, `display_name`, `avatar_url`, `x_username`, timestamps
- `bookmarks`: Contains `user_id`, `profile_id` (unique constraint on pair), `deleted_at` (soft delete), timestamps

**Client-side IndexedDB:**
- `view_history`: Auto-saved on profile view, max 300 items (old entries deleted on overflow)
  - Stores: `profile_id`, `last_viewed_at`, `display_name`, `x_username`
- `saved_local`: User bookmarks saved locally, synced to cloud only when logged in
  - Supports soft delete (`deleted_at`)

### Key Design Principles

#### Core Rules

- DRY (Don't Repeat Yourself)

    * Tailwind CSS: allow class duplication up to **two occurrences**.
    * TypeScript: consolidate identical type definitions from the first occurrence (`types/` or `lib/types`).
    * Validation: authorization, input validation, and ID generation must be implemented in a single centralized location from the start.

- **KISS** (Keep It Simple, Stupid)

    * Align with standard **Next.js patterns**.
    * Do not arbitrarily introduce custom DI containers or complex design patterns.
    * Do not add state management until it becomes necessary.

- **YAGNI** (You Ain't Gonna Need It)

    * **Do not create unused extension points.**
    * Do not add unused parameters, generic interfaces, configuration options, or abstract layers that suggest support for multiple providers.
    * If something appears necessary, stop at a *proposal* rather than an *implementation*, and ask for user instructions. At the same time, always verify whether it falls within the scope of `docs/spec.md` as justification.

### SOLID Principle

- **SRP** (Single Responsibility Principle)

    * Do not mix “presentation” and “data fetching / side effects” within components.
    * Keep Route Handlers as a simple single flow:
         “input validation → authorization → processing → response”. If they become complex, extract the logic into `lib/`.
    
- **OCP** (Open–Closed Principle)

    * **Limit to only what is confirmed to truly increase.**
    * Do not build generic plugin architectures or abstract base classes.
    * Do not introduce large-scale abstractions in anticipation of unknown future requirements.

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
- `x_username`: X (Twitter) username (**optional**, normalized from URL or @username input)
  - Auto-populated for X OAuth users
  - Null for Google OAuth users (can be added later via `/edit`)

**First-view priority**: Display these three elements immediately on profile load with large, tappable X link button (X link hidden/disabled if `x_username` is null).

### Authentication Flow

**OAuth Providers:**
- X (Twitter) OAuth 2.0
- Google OAuth 2.0

**First login auto-creation:**
- Auto-creates `profiles` record with random `profile_id` (base62, 15 chars, cryptographically secure)
- Sets `profiles.owner_user_id = user_id`
- Populates metadata from OAuth provider:
  - **X OAuth**: `display_name`, `avatar_url`, `x_username` (from `user_name`)
  - **Google OAuth**: `display_name`, `avatar_url` (from `name`, `picture`), `x_username` remains null
- Redirects to `/p/{profile_id}` (public profile page) after creation
- No automatic redirect to `/edit` - users navigate manually if needed

**Viewing & bookmarking:**
- Non-logged-in users can view profiles and save bookmarks locally
- Logged-in users get bookmark cloud sync via optimistic updates

## Path Aliases

Use `@/*` for imports from `src/`:

```typescript
import { Component } from "@/components/Component"
```

## Out of Scope for MVP

- Event mode (lightweight routing, PWA optimization)
- Bookmark expiration/cleanup
- Additional SNS links beyond X (Discord, Pixiv - architecture should support future addition)
- Mutual exchange/approval/auto-follow features
- Cloud sync for view history
