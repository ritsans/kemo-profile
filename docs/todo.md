# TODO: Auth & User Registration MVP

Implementation tasks for authentication and My Page access based on `docs/spec.md`.

---

## 7. My Page Access

- [x] Create My Page route (`/my`)
  - Auth guard: redirect to `/login` if not logged in
  - Redirect to own `/p/{profile_id}` if logged in
- [ ] Add My Page link to header/navigation (toggle based on auth state)

## 9. Profile Share Feature

Design doc: `docs/plans/2026-02-13-profile-share-design.md`

- [ ] Install `qrcode.react` package
- [ ] Create `share-section.tsx` Client Component
  - QR code display button (main, large button)
  - URL copy link (secondary, subtle text link)
  - QR modal (fullscreen: QR code + URL display + URL copy + Web Share API)
  - QR code image generated with QRCodeSVG
- [ ] Update `mypage/page.tsx`
  - Build profile URL (origin + path)
  - Place ShareSection component (above "View public profile" link)
- [ ] Pass Biome lint check
- [ ] Verify behavior (QR display, URL copy, Web Share)

## 10. My Page Info Display & Edit Interface

Design doc: `docs/plans/2026-02-14-mypage-edit-interface-design.md`

### 10.1 Server Action: `updateProfile` (bulk save)

- [ ] Create x_username normalization utility (`lib/utils/x-username.ts`)
  - `@username` → `username` (strip @)
  - `https://x.com/username` → `username` (extract from URL)
  - `https://twitter.com/username` → `username` (extract from URL)
  - Return error for invalid input
- [ ] Create `updateProfile` Server Action (`app/actions/profile.ts`)
  - Extract all fields from FormData (display_name, bio, x_username, slug)
  - Validate all fields server-side
  - Apply x_username normalization
  - Update all fields in a single Supabase update call
  - On slug change: call `revalidatePath("/p/[profile_id]", "page")` to refresh cache
  - Return per-field errors in aggregate

### 10.2 My Page Display Mode

- [ ] Update `mypage/page.tsx`
  - Change to same visual as public profile (avatar 120x120, display name, bio, X link button)
  - Update select to fetch x_username from DB
  - Place "Edit" button at top-right of page
  - Place OAuth card, public profile link, and logout button outside the card

### 10.3 My Page Edit Mode

- [ ] Refactor `mypage/profile-edit-form.tsx` to support edit mode
  - State management for display ⇔ edit mode toggle
  - Edit mode form layout (vertical stack)
    - Avatar display (read-only) + "Avatar editing coming soon" note
    - display_name input (required, max 50 chars)
    - bio textarea (optional, max 160 chars, character counter)
    - x_username input (optional, placeholder: "username or https://x.com/username")
    - slug input (optional, 3–20 chars, with description text)
  - Bottom: "Save" button (blue) + "Cancel" button (gray)
  - Call `updateProfile` Server Action via `useActionState`
  - On save success: switch to display mode + toast notification (2 seconds)
  - On error: show red error message directly below the relevant field

### 10.4 Unsaved Changes Protection

- [ ] Implement dirty state tracking
  - Detect changes by comparing initial values with current values
- [ ] Protect Cancel button press
  - If dirty: show `window.confirm()` dialog
  - If clean: return to display mode without confirmation
- [ ] Protect browser back / page navigation
  - Show browser-native dialog via `beforeunload` event when dirty

### 10.5 Existing Code Fixes

- [ ] Fix cache refresh in `updateSlug` Server Action
  - Add `revalidatePath("/p/[profile_id]", "page")`

### 10.6 Verification

- [ ] Pass Biome lint check
- [ ] Verify behavior
  - Display mode: same visual as public profile with correct data
  - Edit mode: all fields editable and bulk-saveable
  - x_username: flexible input formats normalized correctly
  - Unsaved changes protection: confirmation dialog on cancel / browser back
  - On slug change: public profile cache refreshed

---

## Completion Criteria

- [ ] Users can log in via Google/X OAuth
- [ ] Profile is auto-created on first login
- [ ] Logged-in users can access their profile from My Page (`/my`)
- [ ] Unauthenticated users accessing My Page are redirected to `/login`
