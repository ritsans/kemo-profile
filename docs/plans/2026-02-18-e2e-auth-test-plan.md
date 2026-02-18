# E2Eテスト計画：ユーザー登録・ログイン

## 概要

ユーザー登録（Magic Link / OAuth）およびログインの一連フローに対するE2Eテストを導入する。
テストフレームワークとして **Playwright** を使用し、Supabase Admin API を活用してメール受信に依存しないテストを実現する。

## 対象と非対象

### 対象
- Magic Link によるメールログイン（新規・既存ユーザー）
- OAuth コールバック処理（Google / X）
- 認証ガード（未認証リダイレクト・認証済みリダイレクト）
- オンボーディングウィザード（新規ユーザー初回フロー）
- ログアウト

### 非対象
- プロフィール編集（`/mypage` 内のフォーム）
- 公開プロフィールページ（`/p/{id}`, `/p/@{slug}`）
- ブックマーク・閲覧履歴
- パフォーマンス・負荷テスト

## 技術選定

| 項目 | 選定 | 理由 |
|------|------|------|
| フレームワーク | Playwright | Next.js 公式推奨、ネットワークインターセプト対応 |
| パッケージ | `@playwright/test` | devDependency として追加 |
| 設定ファイル | `playwright.config.ts` | プロジェクトルートに配置 |

## テストシナリオ

### 1. Magic Link ログイン（新規ユーザー）

**優先度: 高**

```
前提: テスト用メールアドレスのユーザーが存在しない
手順:
  1. /login にアクセス
  2. メールアドレスを入力して送信
  3. /login/check-email に遷移することを確認
  4. Supabase Admin API で OTP リンクを取得
  5. OTP リンク（/auth/callback?code=xxx）にアクセス
  6. /first-step にリダイレクトされることを確認
  7. profiles テーブルに新規レコードが作成されていることを確認
後処理: テストユーザーを Admin API で削除
```

### 2. Magic Link ログイン（既存ユーザー）

**優先度: 高**

```
前提: テスト用ユーザーが登録済み・onboarding_completed = true
手順:
  1. /login にアクセス
  2. メールアドレスを入力して送信
  3. /login/check-email に遷移することを確認
  4. Supabase Admin API で OTP リンクを取得
  5. OTP リンクにアクセス
  6. /mypage にリダイレクトされることを確認（/first-step ではない）
後処理: なし（既存ユーザーはフィクスチャで管理）
```

### 3. OAuth コールバック（Google / X）

**優先度: 低（モック実装コスト高）**

OAuth はプロバイダーの認証画面を経由するため、直接的なE2Eテストが困難。
以下の2つのアプローチのいずれかを検討する。

#### アプローチ A: コールバックURLの直接テスト
```
手順:
  1. Supabase Admin API でテストユーザーを作成
  2. Admin API でセッショントークンを取得
  3. ブラウザにセッション Cookie をセット
  4. /mypage にアクセスして認証済み状態を確認
```

#### アプローチ B: ネットワークインターセプト
```
手順:
  1. /login でOAuthボタンをクリック
  2. page.route() でプロバイダーへのリダイレクトをインターセプト
  3. /auth/callback?code=xxx にリダイレクト（モックレスポンス）
  4. 遷移先を確認
```

**推奨**: まずはアプローチ A で認証済み状態のテストを行い、OAuth ボタンの表示確認は UI テストに留める。

### 4. 認証ガード

**優先度: 高**

| テストケース | 条件 | 期待結果 |
|-------------|------|---------|
| 未認証で `/mypage` アクセス | セッションなし | `/login` にリダイレクト |
| 認証済みで `/login` アクセス | セッションあり | `/mypage` にリダイレクト |
| onboarding 未完了で `/mypage` アクセス | `onboarding_completed = false` | `/first-step` にリダイレクト |

### 5. オンボーディングウィザード

**優先度: 高**

```
前提: 新規登録直後の状態（onboarding_completed = false）
手順:
  1. /first-step にアクセス
  2. Step 1: display_name が表示されていることを確認 → 「次へ」
  3. Step 2: bio を入力（またはスキップ）→ 「次へ」
  4. Step 3: slug を入力（またはスキップ）→ 「完了」
  5. /mypage にリダイレクトされることを確認
  6. DB で onboarding_completed = true を確認
```

### 6. バリデーション

**優先度: 中**

| テストケース | 入力 | 期待結果 |
|-------------|------|---------|
| 空メール送信 | `""` | エラーメッセージ表示 |
| 不正なメール形式 | `"abc"` | エラーメッセージ表示 |
| 不正なメール形式 | `"@example.com"` | エラーメッセージ表示 |

### 7. ログアウト

**優先度: 中**

```
前提: 認証済み状態
手順:
  1. /mypage にアクセス
  2. ログアウトボタンをクリック
  3. /login にリダイレクトされることを確認
  4. 再度 /mypage にアクセスして /login にリダイレクトされることを確認
```

## メールアドレスの扱い

アプリ側のバリデーション（`magic-link.ts`）は `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` のみ。
Supabase側にもドメイン制限は未設定。

テストでは Supabase Admin API（`/auth/v1/admin/generate_link`）で OTP リンクを直接取得するため、
**メールが実際に届く必要がない**。以下のいずれも使用可能：

- エイリアス: `user+e2e@gmail.com`
- 捨てアド: `test@mailinator.com`
- 架空アドレス: `e2e-test@example.com`（推奨）

## Magic Link テストの仕組み

```
テストコード
  → POST /auth/v1/admin/generate_link
    { "type": "magiclink", "email": "e2e-test@example.com" }
  ← レスポンスに OTP リンク URL が含まれる
  → ブラウザで OTP リンクにアクセス
  → /auth/callback が通常通り処理
  → リダイレクト先を検証
```

これにより、メール配信に依存せず高速・安定なテストが可能。

## ファイル構成

```
tests/
  e2e/
    auth/
      magic-link-signup.spec.ts    # Magic Link 新規登録
      magic-link-login.spec.ts     # Magic Link 既存ユーザーログイン
      auth-guards.spec.ts          # 認証ガード（リダイレクト）
      logout.spec.ts               # ログアウト
    onboarding/
      wizard.spec.ts               # オンボーディングウィザード
    validation/
      email-validation.spec.ts     # メール入力バリデーション
    fixtures/
      auth.ts                      # 認証ヘルパー（Admin API ログイン）
      user.ts                      # テストユーザー作成・削除
playwright.config.ts
```

## セットアップ手順

### 1. Playwright インストール

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

### 2. playwright.config.ts 作成

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 認証テストは順次実行
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

### 3. package.json にスクリプト追加

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 4. .gitignore 追記

```
test-results/
playwright-report/
```

## テストユーザー管理

### フィクスチャ: テストユーザー作成

```typescript
// tests/e2e/fixtures/user.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin権限
);

export async function createTestUser(email: string) {
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  return data.user;
}

export async function deleteTestUser(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function generateMagicLink(email: string) {
  const { data } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  return data.properties?.action_link;
}
```

### フィクスチャ: 認証済み状態のセットアップ

```typescript
// tests/e2e/fixtures/auth.ts
import { test as base } from "@playwright/test";

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Admin API でセッショントークン取得 → Cookie 設定
    // 認証済み状態の page を渡す
    await use(page);
  },
});
```

## 環境変数

テスト実行に必要な環境変数（`.env.local` または `.env.test`）:

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開 Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API 用（テストのみ） |

## 実装優先順

| 順序 | 内容 | 理由 |
|------|------|------|
| 1 | セットアップ（Playwright + fixtures） | 全テストの基盤 |
| 2 | 認証ガード | 最もシンプルで基盤的 |
| 3 | Magic Link 新規登録 + オンボーディング | コアフロー |
| 4 | Magic Link 既存ユーザーログイン | コアフロー |
| 5 | バリデーション | 低コストで追加可能 |
| 6 | ログアウト | 低コストで追加可能 |
