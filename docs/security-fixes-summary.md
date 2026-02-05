# 認証まわりの指摘対応まとめ（2026-02-05）

## 背景
- 指摘1: リダイレクトURL生成に未信頼ヘッダが使われている
- 指摘2: 初回プロフィール作成でレースコンディションがある
- 指摘3: 公開プロフィール取得で `select("*")` が過剰

本ドキュメントは、会話で合意した修正内容と理由を一つにまとめたものです。

## 1. 未信頼ヘッダ由来のリダイレクトURL問題

### 問題
- `src/app/actions/magic-link.ts` で `origin` / `x-forwarded-host` 由来の値を `emailRedirectTo` に使用していた。
- `src/app/auth/callback/route.ts` で `request.url` 由来の `origin` をリダイレクト先生成に使用していた。
- これらは外部入力に影響されるため、意図しないドメインへのリダイレクトURL生成リスクがある。

### 対応
- `src/lib/url.ts` を新規追加し、`getTrustedAppOrigin()` を実装。
- `APP_URL`（代替: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`）のみを信頼する方式に統一。
- 開発時のみ `http://localhost:3000` をフォールバック、本番で未設定なら例外を投げる。

### 反映箇所
- `src/app/actions/magic-link.ts`
  - 未信頼ヘッダ参照を削除
  - `getTrustedAppOrigin()` で `emailRedirectTo` を生成
- `src/app/auth/callback/route.ts`
  - `new URL(request.url)` の `origin` 利用を廃止
  - `getTrustedAppOrigin()` を利用

### 理由
- 安全な origin 取得ルールを1箇所へ集約し、再発を防ぐため。
- 複数箇所の実装差分をなくし、将来変更の漏れを防ぐため。

## 2. 初回プロフィール作成のレースコンディション

### 問題
- 同一ユーザーで `/auth/callback` が同時実行されると、両方が「未作成」と判断し、両方 `insert` を試みる。
- `profiles.owner_user_id` にはユニーク制約があるため、後続リクエストが失敗する可能性がある。

### 対応
- `src/app/auth/callback/route.ts` に重複エラー判定関数 `isUniqueViolation()`（`code === "23505"`）を追加。
- `insert` が重複エラーの場合は失敗にせず、`owner_user_id` で既存プロフィールを再取得して継続するよう変更。

### 理由
- 競合時も正常系に寄せることで、同時ログイン時の不必要な失敗を避けるため。

## 3. `select("*")` 過剰取得の指摘

### 指摘内容
- `src/app/p/[profile_id]/page.tsx:22` の `select("*")` は必要以上のカラムを取得している。

### 妥当性
- 指摘は妥当。
- 現在の表示に必要なのは `display_name`, `avatar_url`, `x_username`。
- `owner_user_id`, `created_at`, `updated_at` はこの画面では不要。

### 推奨（次の修正候補）
- `select("*")` を `select("display_name, avatar_url, x_username")` に変更。
- 公開用データアクセスの一貫性を上げるなら、既存の `public_get_profile` 関数利用も検討。

## 検証メモ
- 変更ファイル単位の `biome check` は通過。
- リポジトリ全体の `pnpm lint` は、今回の変更外ファイルの既存フォーマット差分で失敗している状態。

## 運用メモ
- 本番環境では `APP_URL`（または代替環境変数）を必ず設定すること。
