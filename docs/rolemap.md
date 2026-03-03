# Role Map for `src/app`

This document summarizes the roles of files under `src/app`.

## 1. Root-level files
- `layout.tsx`: Defines the global app layout and `metadata`.
- `page.tsx`: Top page for `/` (currently close to a placeholder).
- `globals.css`: Global Tailwind theme tokens, typography, and base styling.
- `favicon.ico`: App favicon.

## 2. Server Actions (`src/app/actions`)
- `auth.ts`: Logout action (Supabase `signOut` then redirect to `/login`).
- `magic-link.ts`: Sends email OTP magic link, validates input, handles rate-limit errors.
- `profile.ts`: Core profile mutation actions:
  - display name / bio / slug updates
  - onboarding completion
  - bulk profile save
  - social link add / update / delete / reorder

## 3. Auth callback (`src/app/auth/callback`)
- `route.ts`: OAuth callback entry point. Exchanges `code`, fetches user, ensures profile exists, and controls redirects.
- `_lib/session.ts`: Wraps session exchange + user fetch and normalizes auth errors.
- `_lib/profile.ts`: Ensures a row exists in `profiles`; creates one for first login; handles race/unique conflicts.
- `_lib/supabase-client.ts`: Callback-specific Supabase client with cookie staging support.
- `_lib/cookies.ts`: Applies staged cookies to the response.
- `_lib/params.ts`: Parses callback query parameters.
- `_lib/redirect.ts`: Builds success/error redirect URLs.
- `_lib/types.ts`: Internal callback-related shared types.

## 4. Login pages (`src/app/login`)
- `page.tsx`: Login page shell; redirects authenticated users to `/mypage`.
- `login-method.tsx`: Login method panel (Google/X OAuth + email login).
- `email-login-form.tsx`: Magic link email form.
- `check-email/page.tsx`: Confirmation page instructing users to check email.

## 5. First-step onboarding (`src/app/first-step`)
- `page.tsx`: Onboarding entry. Checks auth/profile state and routes only incomplete users.
- `onboarding-wizard.tsx`: 4-step onboarding UI (name -> bio -> slug -> complete) with action integration and animations.

## 6. My Page (`src/app/mypage`)
- `page.tsx`: Main profile management page. Loads profile, validates onboarding completion, composes card sections.
- `edit-form.tsx`: Parent editor container. Manages form state, dirty checks, leave-guard, responsive pane switching.
- `profile-edit-fields.tsx`: Basic profile editor + social links list with drag-and-drop reordering.
- `add-social-link-modal.tsx`: Modal for adding/editing social links.
- `profile-preview-card.tsx`: Live preview card for in-progress edits.
- `share-section.tsx`: Sharing utilities (QR code, copy URL, Web Share API).
- `linked-providers-card.tsx`: Shows linked OAuth identities and supports linking more providers.
- `slug-card.tsx`: Dedicated card for slug save/update.

## 7. Public profile (`src/app/p/[profile_id]`)
- `page.tsx`: Public profile page (no login required), supports both:
  - `/p/{profile_id}`
  - `/p/@{slug}`

## 8. Main dependency modules used by `src/app`
- Supabase client/types:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/database.types.ts`
- Social platform definitions and normalization logic:
  - `src/lib/social-platforms.ts`
  - `src/lib/utils/*`
- Shared UI and profile rendering:
  - `src/components/ui/*`
  - `src/components/profile/*`
  - `src/components/icons/*`
