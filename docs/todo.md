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

## 11. SNSリンク JSONB 移行

Design doc: `docs/plans/2026-02-23-social-links-jsonb-design.md`

### 11.1 プラットフォーム定義

- [x] `src/lib/social-platforms.ts` 作成
  - `SocialPlatform` インターフェース定義
  - `SOCIAL_PLATFORMS` 配列（X のみ初期登録）
  - `getPlatform(key)` ヘルパー関数

### 11.2 DB マイグレーション（手動）

- [x] `profiles.social_links JSONB NOT NULL DEFAULT '{}'` カラム追加
- [x] `x_username` → `social_links.x` データ移行
- [x] `public_get_profile` RPC の戻り値を `social_links jsonb` に更新
- [x] `public_get_profile_by_slug` RPC の戻り値を `social_links jsonb` に更新

### 11.3 型定義・アクション

- [x] `src/lib/supabase/database.types.ts` 更新（`social_links: Json` 追加）
- [x] `src/lib/types/action.ts` 更新（`fieldErrors` から `x_username` 固定キー削除）
- [x] `src/app/actions/profile.ts` 更新（`x_username` 処理 → `SOCIAL_PLATFORMS` ループ）
- [x] `src/app/auth/callback/_lib/profile.ts` 更新（`social_links` で insert）

### 11.4 UI

- [x] `src/app/mypage/edit-form.tsx` 更新（状態を `socialLinks` に置き換え）
- [x] `src/app/mypage/profile-edit-fields.tsx` 更新（入力フィールドをループ描画）
- [x] `src/app/mypage/profile-preview-card.tsx` 更新（プレビューをループ描画）
- [x] `src/app/mypage/page.tsx` 更新（`social_links` を SELECT・prop に変更）
- [x] `src/app/p/[profile_id]/page.tsx` 更新（SNSリンクをループ描画）

### 11.5 残作業（フェーズ2）

- [x] `x_username` カラム DROP（アプリ動作確認後）
  - `database.types.ts` から `x_username` を削除
  - `profiles.Update` / `Insert` / `Row` の `x_username` を削除

---

## 12. SNSリンク追加（ステップ式フロー）

Design doc: `docs/plans/2026-02-24-social-link-step-add-flow-plan.md`

### 12.1 正規化ユーティリティ

- [x] `src/lib/utils/instagram-username.ts` 作成 [New]
  - 許容入力: `username`, `@username`, `https://instagram.com/username`
  - 保存値: `username`
- [x] `src/lib/utils/pixiv-user-id.ts` 作成 [New]
  - 許容入力: `12345678`, `https://www.pixiv.net/users/12345678`
  - 保存値: `12345678`（数値IDのみ）

### 12.2 プラットフォーム定義拡張

- [x] `src/lib/social-platforms.ts` に Instagram / Pixiv 定義を追加
  - `key`, `label`, `normalize`, `profileUrl`, `placeholder`, `buttonClass` を設定

### 12.3 Server Actions 再設計（責務分離）

- [x] `src/app/actions/profile.ts` — `updateProfile` から `social_links` 処理を削除
  - `socialLinksNew` の抽出・正規化ループを削除
  - `originalSocialLinks` の差分検知を削除
  - `update.social_links` の設定を削除
- [x] `addSocialLink(platformKey, rawValue)` Server Action 追加
  - 認証 → platform 定義確認 → normalize → 重複チェック → DB更新 → revalidatePath
- [x] `updateSocialLink(platformKey, rawValue)` Server Action 追加
  - 認証 → X保護 → normalize → 既存チェック → DB更新 → revalidatePath
- [x] `removeSocialLink(platformKey)` Server Action 追加
  - 認証 → X保護 → 既存 social_links 取得 → キー削除 → DB更新 → revalidatePath

### 12.4 モーダルコンポーネント

- [x] `src/app/mypage/add-social-link-modal.tsx` 作成 [New]
  - Step 1: 未追加SNS選択（`SOCIAL_PLATFORMS` から `existingKeys` を除外した一覧）
  - Step 2: ユーザー名/ID入力 + URLプレビュー表示
  - ボタン: `保存して追加` / `戻る` / `キャンセル`
  - 保存成功後: `onSaved(key, value)` 呼び出し → `onClose()` でモーダルを閉じる
  - エラー時: フィールド下にメッセージ表示、モーダルは閉じない
  - edit モード対応（Step1 をスキップ）

### 12.5 編集UIの改修

- [x] `src/app/mypage/profile-edit-fields.tsx` 変更
  - `SOCIAL_PLATFORMS.map()` の全プラットフォーム入力ループを削除
  - 追加済みSNSのみ表示するループに置き換え（各行に編集・削除ボタン）
  - ロック済み（`lockedSocialKeys`）は削除ボタンを非表示
  - フォーム下部に `+ リンクを追加` ボタン追加（0件でも常に表示）
  - 0件の場合は「SNSリンクはまだ登録されていません」を表示
  - Props から `originalSocialLinks`, `setSocialLinkValue` を削除、`onRemoveSocialLink`, `onAddSocialLinkClick`, `onEditSocialLinkClick` を追加
- [x] `src/app/mypage/edit-form.tsx` 変更
  - `initSocialLinksState`（全プラットフォーム初期化）を削除
  - `currentSocialLinks` を `socialLinks` prop から直接初期化
  - `isDirty` から social_links の差分チェックを削除
  - `previewSocialLinks` を `currentSocialLinks` からそのまま渡すよう変更
  - `isAddModalOpen` / `editModalKey` 状態と各ハンドラを追加
  - `AddSocialLinkModal` をレンダリング（add/edit 両モード）

### 12.6 検証

- [x] Biome lint チェックを通過
- [x] カスタムURL設定をプロフィール編集フォームから独立カード（`SlugCard`）へ分離
  - `src/app/mypage/slug-card.tsx` 新規作成
  - `profile-edit-fields.tsx`, `edit-form.tsx` から slug 関連削除
  - `updateProfile` から slug バリデーション・差分検知・DB更新を削除
  - `page.tsx` に `<SlugCard slug={suggestedSlug} />` を配置
- [ ] 動作確認
  - `+ リンクを追加` ボタンでモーダルが開く
  - 未追加SNSのみ選択肢に表示される
  - 同一SNSを2回追加できない
  - URL入力でも保存値が正規化される
  - 追加成功後にモーダルが閉じ、編集画面に反映される
  - 削除ボタンでSNSが削除される

---

## 13. SNSリンク編集UIをLinktree風に改善

- [ ] SNS行をカード化してその場編集
  - 変更先: `src/app/mypage/profile-edit-fields.tsx`
  - 各行で `Input` を表示（または1タップ展開）し、入力・削除を行内で完結
- [ ] 追加導線を簡略化
  - 変更先: `src/app/mypage/add-social-link-modal.tsx`
  - 候補選択後に即1行追加し、編集画面上で入力
- [ ] 保存体験を即時反映化
  - 変更先: `src/app/mypage/edit-form.tsx`
  - 楽観更新 + デバウンス保存 + 行単位エラー表示
  - ロック済みSNSの削除ボタンは表示されない

### 12.7 SNSリンク並び替え・マイページUI調整

- [x] `social_links_order` 対応を追加
  - `profiles` SELECT/RPC の取得項目に `social_links_order` を追加
  - `src/lib/supabase/database.types.ts` に `social_links_order` を反映
- [x] SNSリンク並び替え保存アクションを追加
  - `src/app/actions/profile.ts` に `reorderSocialLinks(order: string[])` を追加
  - 並び替え後に `social_links_order` を更新し `revalidatePath("/mypage")` を実行
- [x] 編集画面で DnD 並び替えを実装
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` を追加
  - `src/app/mypage/profile-edit-fields.tsx` でドラッグ＆ドロップ並び替え UI を実装
  - `src/app/mypage/edit-form.tsx` で並び順状態と保存処理を実装
- [x] プレビュー/公開表示で並び順を反映
  - `ProfileCardView` に `socialLinksOrder` prop を追加して表示順制御
  - `profile-preview-card.tsx` / `p/[profile_id]/page.tsx` から順序を渡すよう更新
- [x] マイページヘッダーを追加しログアウト導線を整理
  - `src/components/profile/mypage-header.tsx` を追加
  - モバイル: ハンバーガーメニュー、PC: 右上ログアウトボタン

## 13. 実装予定（次スプリント）

### 13.1 公開プロフィールのQR導線をヘッダーへ移動

- [ ] 公開プロフィールのヘッダーに「QRコード表示」ボタンを追加
- [ ] プロフィールカード内のQRコード表示ボタンを削除
- [ ] モバイル/PCでヘッダー導線の表示・操作性を確認

### 13.2 オプション画面の新設（設定の整理）

- [ ] オプション画面を新設し、プロフィール編集と設定系機能を分離
- [ ] 「外部ログイン連携」をプロフィール編集画面からオプション画面へ移動
- [ ] 「カスタムURL」をプロフィール編集画面からオプション画面へ移動
- [ ] マイページからオプション画面への導線を追加

### 13.3 プロフィールページのBASIC表示と編集状態切替

- [ ] プロフィールページの BASIC 状態を閲覧モードとして実装
  - 現在のアバター・表示名・プロフィール文章を平文でそのまま表示
- [ ] 「プロフィールを編集」ボタン押下で編集可能状態へ切替
  - 閲覧モードから編集用レイアウトへ切り替える
  - 入力しやすいフォーム構成（項目間余白・操作導線）に変更する
- [ ] 編集状態で「キャンセル」「保存」ボタンを表示
  - キャンセルで閲覧モードに戻る（未保存変更時は確認導線を検討）
  - 保存で更新処理を実行し、成功後は閲覧モードへ戻す

### 13.4 バッジリボン機能（最大3つ選択）

- [ ] 仕様追加: バッジリボン機能を `docs/spec.md` に反映
  - 用途: 自己属性タグ（例: `ARTIST`, `VTUBER`, `STREAMER`）
  - 制約: 定義済み候補から任意選択、最大3件まで
- [x] DBスキーマ追加（profiles）
  - `badge` カラムを追加（候補: `text[]` または enum 配列）
  - 最大3件制約の追加（CHECK制約）
  - 既存プロフィール向けデフォルト値を設定（空配列）
  - Supabase 型定義 (`database.types.ts`) を更新
- [ ] バッジ候補定義を追加
  - 候補一覧を定数化（`ARTIST`, `VTUBER`, `STREAMER` ほか追加候補）
  - 表示ラベル/内部値の管理方針を統一
- [ ] プロフィール編集UIに選択機能を追加
  - BASIC セクション内（Bio の直下、SNS Links の手前）に配置する
  - 定義済み候補をチップで表示し、クリックで選択/解除する
  - 追加UIは使わず、チップ直接トグルで完結させる
  - 選択中件数を `n/3` 形式で表示する
  - 4件目選択時は無効化またはエラー表示
  - 3件選択済み時は未選択チップを disabled 表示にする
  - 選択値の表記ゆれを防ぐため、内部値は候補定義の enum 相当値のみ許可する
  - 保存時に `badge` を更新
- [ ] 表示UIにリボン描画を追加
  - 公開プロフィールカード下部に、選択済みバッジの文字入りリボンを表示
  - マイページの編集確認プレビューにも同様の表示を反映
  - マイページの BASIC 閲覧モードにも選択済みバッジを表示
- [ ] オンボーディング（ステップ4）にバッジリボン選択を追加
  - 既存のステップ4にフォームに選択UIに新しく追加する。
  - スキップ可能（未選択のまま次のステップへ進める）
- [ ] 検証
  - 最大3件制約が UI/Server/DB の全層で守られる
  - 未選択時はリボン非表示
  - 既存ユーザーでの後方互換（null/空配列）を確認

---

## Completion Criteria

- [ ] Users can log in via Google/X OAuth
- [ ] Profile is auto-created on first login
- [ ] Logged-in users can access their profile from My Page (`/my`)
- [ ] Unauthenticated users accessing My Page are redirected to `/login`
