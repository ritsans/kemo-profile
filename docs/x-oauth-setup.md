# X (Twitter) OAuth 2.0 設定ガイド

このドキュメントは、Supabase で X (Twitter) OAuth 2.0 認証を設定する際の手順とトラブルシューティングをまとめたものです。

## 概要

- **使用するプロバイダー**: X / Twitter (OAuth 2.0)
- **プロバイダー名（コード内）**: `"x"` （`"twitter"` ではない）
- **非推奨プロバイダー**: Twitter (Deprecated) - OAuth 1.0a版

## 1. X Developer Portal の設定

### 1.1 アプリの作成

1. **X Developer Portal** にアクセス
   - URL: https://developer.twitter.com/en/portal/dashboard
   - X アカウントでログイン

2. **新しいプロジェクトとアプリを作成**
   - "Projects & Apps" > "Overview" > "+ Create App"
   - アプリ名を入力（例: `kemono-profile`）

3. **API キーを保存**
   - アプリ作成後、以下をコピーして保存：
     - **API Key** (Client ID)
     - **API Secret Key** (Client Secret)
   - ⚠️ これらは後で確認できない場合があるため、必ず保存してください

### 1.2 User authentication settings の設定

1. **設定画面を開く**
   - アプリの "Settings" タブ
   - "User authentication settings" セクション
   - **"Set up"** をクリック（初回）または **"Edit"** をクリック（編集時）

2. **App permissions**
   - 最低でも **"Read"** を選択
   - 推奨: **"Read and Write"**

3. **Type of App**
   - **"Web App, Automated App or Bot"** を選択

4. **Request email from users**
   - ✅ **必ずオンにする**
   - これがオフの場合、認証が失敗します

5. **App info の入力**

   すべての項目を入力してください：

   | 項目 | 値 |
   |------|-----|
   | **Callback URI / Redirect URL** | `https://sghmdallnsffwnuljwmg.supabase.co/auth/v1/callback` |
   | **Website URL** | `http://localhost:3000` (開発時) または本番URL |
   | **Terms of service** | 利用規約のURL（例: `http://localhost:3000/terms`） |
   | **Privacy policy** | プライバシーポリシーのURL（例: `http://localhost:3000/privacy`） |

   ⚠️ **重要な注意点:**
   - Callback URL にスペースや改行が入っていないか確認
   - 末尾に余分なスラッシュ `/` がついていないか確認
   - コピー&ペーストする際は、前後の空白に注意

6. **保存**
   - すべての項目を入力したら **"Save"** をクリック
   - 設定画面が閉じることを確認

### 1.3 OAuth 2.0 の確認

- "User authentication settings" で **"OAuth 2.0"** が有効になっていることを確認
- Client ID と Client Secret が表示されていることを確認（"Keys and tokens" タブ）

## 2. Supabase の設定

### 2.1 プロバイダーの有効化

1. **Supabase ダッシュボード** にアクセス
   - URL: https://supabase.com/dashboard/project/sghmdallnsffwnuljwmg/auth/providers

2. **X / Twitter (OAuth 2.0) を有効化**
   - "Social Providers" セクションで **"X / Twitter (OAuth 2.0)"** を探す
   - ⚠️ "Twitter (Deprecated)" ではなく、**"X / Twitter (OAuth 2.0)"** を選択

3. **認証情報を入力**
   - **X / Twitter (OAuth 2.0) Enabled**: オンにする
   - **OAuth Client ID**: X Developer Portal の API Key を入力
   - **OAuth Client Secret**: X Developer Portal の API Secret Key を入力
   - ⚠️ 前後にスペースが入っていないか確認

4. **保存**
   - **"Save"** ボタンをクリック
   - ページをリロードして、設定が保持されていることを確認

### 2.2 コード側の設定

プロバイダー名は **`"x"`** を使用します：

```typescript
// ✅ 正しい
await supabase.auth.signInWithOAuth({
  provider: 'x',
})

// ❌ 間違い（古いプロバイダー）
await supabase.auth.signInWithOAuth({
  provider: 'twitter',
})
```

## 3. よくあるエラーと対処法

### エラー 1: "Unsupported provider: provider is not enabled"

**原因:**
- Supabase で X / Twitter (OAuth 2.0) が有効化されていない
- Client ID または Client Secret が入力されていない
- コード側で間違ったプロバイダー名を使用している

**対処法:**
1. Supabase ダッシュボードで "X / Twitter (OAuth 2.0)" が有効になっているか確認
2. Client ID と Client Secret が正しく入力されているか確認
3. コード側で `provider: 'x'` を使用しているか確認
4. 設定を保存した後、ブラウザのキャッシュをクリア

### エラー 2: "You weren't able to give access to the App"

**原因:**
- X Developer Portal の設定が不完全
- Callback URL が間違っている
- "Request email from users" がオフになっている
- Terms of service または Privacy policy URL が未入力

**対処法:**
1. X Developer Portal > User authentication settings を確認
2. すべての必須項目（Callback URI, Website URL, Terms of service, Privacy policy）が入力されているか確認
3. "Request email from users" がオンになっているか確認
4. Callback URL が正確に `https://sghmdallnsffwnuljwmg.supabase.co/auth/v1/callback` になっているか確認
5. 設定を保存して、再度ログインを試す

### エラー 3: 認証画面に遷移しない

**原因:**
- コード側でエラーが発生している
- Supabase の設定が保存されていない

**対処法:**
1. ブラウザのコンソールでエラーを確認
2. Supabase ダッシュボードで設定が保存されているか確認
3. ブラウザのキャッシュをクリアして再試行

## 4. 確認チェックリスト

### X Developer Portal

- [ ] アプリが作成されている
- [ ] API Key (Client ID) を保存している
- [ ] API Secret Key (Client Secret) を保存している
- [ ] User authentication settings で "Set up" が完了している（"Edit" ボタンが表示されている）
- [ ] OAuth 2.0 が有効になっている
- [ ] App permissions が設定されている（最低 "Read"）
- [ ] Type of App が "Web App..." になっている
- [ ] Request email from users がオンになっている
- [ ] Callback URI に `https://sghmdallnsffwnuljwmg.supabase.co/auth/v1/callback` が設定されている
- [ ] Website URL が入力されている
- [ ] Terms of service URL が入力されている
- [ ] Privacy policy URL が入力されている
- [ ] すべての設定を保存している

### Supabase

- [ ] "X / Twitter (OAuth 2.0)" プロバイダーを有効にしている
- [ ] OAuth Client ID を入力している
- [ ] OAuth Client Secret を入力している
- [ ] 設定を保存している
- [ ] ページをリロードして設定が保持されていることを確認している

### コード

- [ ] `provider: 'x'` を使用している（`'twitter'` ではない）
- [ ] ブラウザのキャッシュをクリアしている

## 5. テスト手順

1. **ブラウザのキャッシュをクリア**
   - または、シークレット/プライベートウィンドウを使用

2. **ログインページにアクセス**
   - `http://localhost:3000/login`

3. **X (Twitter) でログイン ボタンをクリック**
   - X の認証画面に遷移することを確認

4. **X で認証を許可**
   - アプリへのアクセスを許可

5. **リダイレクトを確認**
   - `/mypage` にリダイレクトされることを確認

6. **プロフィールの確認**
   - ユーザー情報が正しく取得されているか確認
   - X のユーザー名、アバター、表示名が設定されているか確認

## 6. 参考リンク

- [Supabase - Login with X / Twitter](https://supabase.com/docs/guides/auth/social-login/auth-twitter)
- [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- [Supabase Auth Providers](https://supabase.com/dashboard/project/sghmdallnsffwnuljwmg/auth/providers)

## 7. トラブルシューティング用ログ確認

エラーが発生した場合、以下でログを確認できます：

```bash
# Supabase Auth ログを確認
# MCP ツールを使用
mcp__plugin_supabase_supabase__get_logs({
  project_id: "sghmdallnsffwnuljwmg",
  service: "auth"
})
```

ブラウザのコンソールでもエラーを確認してください。
