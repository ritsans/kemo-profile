# TODO: 認証・ユーザー登録 MVP

`docs/spec.md` に基づく、認証機能とマイページアクセスの実装タスク。

---

## 1. Supabase環境設定

- [x] Supabaseクライアント初期化用のユーティリティを作成（`lib/supabase/client.ts`, `lib/supabase/server.ts`）
- [x] 環境変数の設定（`.env.local`に`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- [x] Supabase Middlewareの設定（認証セッション管理用）

## 2. 認証プロバイダー設定（Supabase Dashboard）

- [ ] Google OAuth プロバイダーの有効化と設定
- [ ] X (Twitter) OAuth プロバイダーの有効化と設定
- [ ] コールバックURLの設定（`/auth/callback`）

## 3. データベーススキーマ

- [x] `profiles` テーブルの作成
  - `profile_id` (TEXT, PK): base62、15文字のランダムID
  - `owner_user_id` (UUID, FK → auth.users): プロフィール所有者
  - `display_name` (TEXT, NOT NULL): ハンドルネーム
  - `avatar_url` (TEXT): アバター画像URL
  - `x_username` (TEXT): X (Twitter) ユーザー名（任意）
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- [x] `profiles` テーブルのRLSポリシー設定
  - 全ユーザー: SELECT（公開プロフィールの閲覧）
  - 所有者のみ: UPDATE（自分のプロフィールの編集）
- [x] `owner_user_id` へのユニークインデックス（1ユーザー1プロフィール）
- [x] マイグレーション適用（Supabase MCP経由で完了）
- [x] TypeScript型定義生成（`lib/supabase/database.types.ts`）

## 4. ユーティリティ関数

- [x] `generateProfileId()`: 暗号学的に安全なbase62ランダムID生成関数（15文字）
  - `crypto.getRandomValues()` を使用（`Math.random()` 不可）
  - 文字セット: `0-9`, `a-z`, `A-Z`（62文字）

## 5. 認証UI・フロー

- [x] ログインページ (`/login`) の作成
  - Google OAuth ログインボタン
  - X OAuth ログインボタン
- [x] 認証コールバック処理 (`/auth/callback/route.ts`)
  - 認証コード交換
  - セッション確立
- [x] ログアウト機能

## 6. 初回ログイン時のプロフィール自動作成

- [x] 初回ログイン検出ロジック（`profiles` テーブルに該当レコードがあるか確認）
- [x] OAuthメタデータの取得
  - X OAuth: `user_name`, `name`, `profile_image_url` → `x_username`, `display_name`, `avatar_url`
  - Google OAuth: `name`, `picture` → `display_name`, `avatar_url`（`x_username` は null）
- [x] `profiles` テーブルへの自動INSERT
- [x] プロフィール作成後 `/p/{profile_id}` へリダイレクト

## 7. マイページアクセス

- [x] マイページルート (`/my`) の作成
  - 認証ガード: 未ログインの場合は `/login` へリダイレクト
  - ログイン済みの場合は自分の `/p/{profile_id}` へリダイレクト
- [ ] ヘッダー/ナビゲーションにマイページリンクを追加（認証状態に応じて表示切替）

## 8. オンボーディング

- [x] DBマイグレーション: `slug` カラム + `onboarding_completed` フラグ追加
- [x] `public_get_profile_by_slug` 関数作成
- [x] Server Actions: `updateSlug`, `completeOnboarding` 追加
- [x] Auth Callback: 初回ログイン → `/onboarding` リダイレクト
- [x] オンボーディングページ作成（3ステップウィザード）
  - Step 1: ユーザー名確認
  - Step 2: 自己紹介入力（スキップ可）
  - Step 3: カスタムURL設定（スキップ可）
- [x] MyPage: オンボーディング未完了ガード追加
- [x] 公開プロフィール: slug 解決（`/p/@slug` 対応）
- [x] MyPage 編集フォーム: slug 編集セクション追加

---

## 完了条件

- [ ] ユーザーがGoogle/X OAuthでログインできる
- [ ] 初回ログイン時にプロフィールが自動作成される
- [ ] ログイン済みユーザーがマイページ (`/my`) から自分のプロフィールにアクセスできる
- [ ] 未ログインユーザーがマイページにアクセスすると `/login` にリダイレクトされる
