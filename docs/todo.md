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

- [x] Install `qrcode.react` package
- [x] Create `share-section.tsx` Client Component
  - QR code display button (main, large button)
  - URL copy link (secondary, subtle text link)
  - QR modal (fullscreen: QR code + URL display + URL copy + Web Share API)
  - QR code image generated with QRCodeSVG
- [x] Update `mypage/page.tsx`
  - Build profile URL (origin + path)
  - Place ShareSection component (above "View public profile" link)
- [x] Pass Biome lint check
- [ ] Verify behavior (QR display, URL copy, Web Share)

## 10. My Page Info Display & Edit Interface

Design doc: `docs/plans/2026-02-14-mypage-edit-interface-design.md`

### 10.1 Server Action: `updateProfile` (bulk save)

- [x] Create x_username normalization utility (`lib/utils/x-username.ts`)
  - `@username` → `username` (strip @)
  - `https://x.com/username` → `username` (extract from URL)
  - `https://twitter.com/username` → `username` (extract from URL)
  - Return error for invalid input
- [x] Create `updateProfile` Server Action (`app/actions/profile.ts`)
  - Extract all fields from FormData (display_name, bio, x_username, slug)
  - Validate all fields server-side
  - Apply x_username normalization
  - Diff detection: only update changed fields (hidden fields carry original values)
  - Early return when no fields changed (skip DB update and revalidate)
  - Return per-field errors in aggregate
  - Note: `revalidatePath("/p/[profile_id]")` は不要（Dynamic Rendering のため no-op）

### 10.2 My Page Display Mode

- [x] Update `mypage/page.tsx`
  - Change to same visual as public profile (avatar 120x120, display name, bio, X link button)
  - Update select to fetch x_username from DB
  - Place "Edit" button at top-right of page
    - ※ 仕様変更: 編集ボタン方式ではなく左右2ペイン（PC）/ タブ切替（モバイル）方式に変更
  - Place OAuth card, public profile link, and logout button outside the card

### 10.3 My Page Edit Mode

- [x] Refactor `mypage/profile-edit-form.tsx` to support edit mode
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
- [x] Divide `edit-form.tsx` responsibilities into sub-components
  - `profile-edit-fields.tsx`: 入力フォームUI（右ペイン）
  - `profile-preview-card.tsx`: プレビュー表示（左ペイン）
  - `edit-form.tsx`: 状態管理・Server Action 呼び出しのオーケストレーターに特化
- [x] Create shared form input components (`src/components/ui/input.tsx`)
  - `Input` / `Textarea` コンポーネントを共通化、全フォームに適用

### 10.4 Unsaved Changes Protection

- [x] Implement dirty state tracking
  - Detect changes by comparing initial values with current values
- [x] Protect Cancel button press
  - If dirty: show `window.confirm()` dialog
  - If clean: return to display mode without confirmation
- [x] Protect browser back / page navigation
  - Show browser-native dialog via `beforeunload` event when dirty

### 10.5 Existing Code Fixes

- [x] ~~Fix cache refresh in `updateSlug` Server Action~~
  - `/p/[profile_id]` は `cookies()` 使用により Dynamic Rendering のため `revalidatePath` は no-op。対応不要と判断（`docs/revalidate-path.md` 参照）

### 10.6 Verification

- [ ] Pass Biome lint check
- [ ] Verify behavior
  - Display mode: same visual as public profile with correct data
  - Edit mode: all fields editable and bulk-saveable
  - x_username: flexible input formats normalized correctly
  - Unsaved changes protection: confirmation dialog on cancel / browser back
  - No-change save: DB update and revalidate are skipped

---

## Completion Criteria

- [ ] Users can log in via Google/X OAuth
- [ ] Profile is auto-created on first login
- [ ] Logged-in users can access their profile from My Page (`/my`)
- [ ] Unauthenticated users accessing My Page are redirected to `/login`
