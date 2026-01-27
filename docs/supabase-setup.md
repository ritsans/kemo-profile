# Supabaseプロジェクトのセットアップ手順

このドキュメントでは、kemono-profileで使用するSupabaseプロジェクトの作成と設定手順を説明します。

## 1. Supabaseプロジェクトの作成

### 1.1 Supabaseアカウントへのサインアップ/ログイン

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. GitHubアカウントでログイン（または新規アカウント作成）

### 1.2 新規プロジェクトの作成

1. ダッシュボード右上の「New project」ボタンをクリック
2. 以下の情報を入力:
   - **Name**: `kemono-profile` (任意の名前)
   - **Database Password**: 強力なパスワードを設定（必ずメモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本の場合）
   - **Pricing Plan**: `Free` を選択
3. 「Create new project」をクリック
4. プロジェクトの初期化完了まで1-2分待つ

## 2. APIキーの取得

### 2.1 プロジェクト設定ページへ移動

1. 左サイドバーの「Project Settings」（⚙️アイコン）をクリック
2. 「API」タブをクリック

### 2.2 APIキーのコピー

以下の2つの値をコピーしてメモしておきます:

- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` の形式
- **anon public**: `eyJh...` で始まる長い文字列

### 2.3 環境変数ファイルの更新

プロジェクトルートの `.env.local` ファイルを開き、以下のように更新します:

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...（取得したanon publicキー）
```

## 3. データベーススキーマの作成

### 3.1 SQL Editorへ移動

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」ボタンをクリック

### 3.2 マイグレーションSQLの実行

1. `supabase/migrations/00001_initial_schema.sql` ファイルの内容をコピー
2. SQL Editorにペースト
3. 右下の「Run」ボタン（または `Cmd + Enter`）をクリックして実行
4. 「Success. No rows returned」と表示されれば成功

### 3.3 テーブルの確認

1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認:
   - `profiles`
   - `bookmarks`

## 4. OAuth認証プロバイダーの設定

### 4.1 認証設定ページへ移動

1. 左サイドバーの「Authentication」をクリック
2. 「Providers」タブをクリック

### 4.2 Google OAuthの設定

1. プロバイダー一覧から「Google」を探す
2. 右側のトグルスイッチをONにする
3. **一旦保存せず、次の手順でGoogle Cloud Consoleの設定を完了させます**

#### 4.2.1 Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成（または既存プロジェクトを選択）
3. 「APIとサービス」→「認証情報」へ移動
4. 「認証情報を作成」→「OAuthクライアントID」をクリック
5. 以下を設定:
   - **アプリケーションの種類**: Webアプリケーション
   - **名前**: `kemono-profile` (任意)
   - **承認済みのリダイレクトURI**:
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     ※ `xxxxxxxxxxxxx` は自分のプロジェクトURLに置き換え
6. 「作成」をクリック
7. 表示された「クライアントID」と「クライアントシークレット」をコピー

#### 4.2.2 SupabaseにGoogle認証情報を設定

1. Supabaseの「Authentication」→「Providers」→「Google」に戻る
2. 以下を入力:
   - **Client ID**: Google Cloud ConsoleでコピーしたクライアントID
   - **Client Secret**: Google Cloud Consoleでコピーしたクライアントシークレット
3. 「Save」をクリック

### 4.3 X (Twitter) OAuthの設定

1. プロバイダー一覧から「Twitter」を探す
2. 右側のトグルスイッチをONにする
3. **一旦保存せず、次の手順でX Developer Portalの設定を完了させます**

#### 4.3.1 X Developer Portalでの設定

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) にアクセス
2. 新規アプリを作成（または既存アプリを選択）
3. 「User authentication settings」セクションへ移動
4. 「Set up」ボタンをクリック
5. 以下を設定:
   - **App permissions**: Read
   - **Type of App**: Web App
   - **Callback URI / Redirect URL**:
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     ※ `xxxxxxxxxxxxx` は自分のプロジェクトURLに置き換え
   - **Website URL**: `http://localhost:3000` (開発時) または本番URL
6. 「Save」をクリック
7. 表示された「API Key」と「API Secret Key」をコピー

#### 4.3.2 SupabaseにX認証情報を設定

1. Supabaseの「Authentication」→「Providers」→「Twitter」に戻る
2. 以下を入力:
   - **API Key**: X Developer PortalでコピーしたAPI Key
   - **API Secret Key**: X Developer PortalでコピーしたAPI Secret Key
3. 「Save」をクリック

### 4.4 コールバックURLの確認

OAuth設定が完了したら、以下のコールバックURLが正しく設定されているか確認します:

```
https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
```

このURLは、各OAuthプロバイダー（Google、X）の管理画面でリダイレクトURIとして登録されている必要があります。

## 5. 開発サーバーの起動と動作確認

### 5.1 開発サーバーの起動

```bash
pnpm dev
```

### 5.2 ブラウザでアクセス

```
http://localhost:3000
```

### 5.3 Supabase接続の確認

開発者ツールのコンソールでエラーが出ていないことを確認します。

## 次のステップ

以上でSupabaseプロジェクトのセットアップは完了です。次は以下の実装に進みます:

- [ ] ログインページ (`/login`) の作成
- [ ] 認証コールバック処理 (`/auth/callback/route.ts`)
- [ ] 初回ログイン時のプロフィール自動作成ロジック
- [ ] マイページルート (`/my`) の作成

詳細は `docs/todo.md` を参照してください。

## トラブルシューティング

### 環境変数が読み込まれない

1. `.env.local` ファイルがプロジェクトルートに存在することを確認
2. 開発サーバーを再起動 (`Ctrl + C` で停止 → `pnpm dev` で再起動)

### OAuth認証エラー

1. コールバックURLが正しく設定されているか確認
2. Google Cloud Console / X Developer Portal の設定を再確認
3. Supabaseダッシュボードで「Authentication」→「URL Configuration」を確認

### RLSポリシーエラー

1. SQL Editorで `00001_initial_schema.sql` が正しく実行されたか確認
2. Table Editorで `profiles` と `bookmarks` テーブルのRLSが有効になっているか確認
