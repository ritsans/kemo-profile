# Auth Callback モジュール分割計画

## 概要

`src/app/auth/callback/route.ts` の煩雑化を解消するため、挙動を変えずに責務を分割する。
本計画は「機能追加」ではなく「内部構造の整理」に限定し、既存のリダイレクト・エラーコード・Cookie挙動を維持する。

## 対象と非対象

### 対象
- `src/app/auth/callback/route.ts` の関数分割
- `src/app/auth/callback/_lib/` 配下へのモジュール移動
- 最低限の型定義整理（callback専用の内部型）

### 非対象
- OAuthフロー仕様変更
- エラーメッセージ変更
- DBスキーマ変更
- middleware/proxy の仕様変更

## 完了条件

- `route.ts` が「処理の流れを組み立てる」責務だけを持つ
- 主要責務が `_lib` の小さな関数へ分離される
- 分割前後で以下が同一である
  - リダイレクト先判定
  - エラーコード（`auth`, `code_missing`, `exchange_failed`, `profile_creation_failed`, `access_denied`）
  - Cookie反映挙動

## 分割後の構成案

```text
src/app/auth/callback/
  route.ts
  _lib/
    params.ts
    supabase-client.ts
    session.ts
    profile.ts
    redirect.ts
    cookies.ts
    types.ts
```

## モジュール責務

1. `params.ts`
- `request.url` から `code/error/error_description/next` を抽出
- 最低限の値検証のみ実施

2. `supabase-client.ts`
- callback専用の `createServerClient` 初期化
- `pendingCookies` 収集ロジックを閉じ込める

3. `session.ts`
- `exchangeCodeForSession` 実行
- `getUser` 実行
- 失敗時は既存エラーコードに正規化

4. `profile.ts`
- 既存プロフィール確認
- 未作成時のプロフィール作成
- unique競合時の再取得（race condition対応）
- 戻り値を `{ profileId, isNewUser }` に統一

5. `redirect.ts`
- `next` 優先ルール
- 新規/既存ユーザーのデフォルト遷移先決定

6. `cookies.ts`
- `pendingCookies` を `NextResponse` に反映
- Cookie反映処理を単一箇所に集約

7. `types.ts`
- callback内部だけで使う型（params/result/pendingCookie）を定義

## 実施手順

1. 挙動固定の確認
- 現在の `route.ts` を基準として、以下の期待結果をメモ化する
  - provider error時のリダイレクト
  - code欠落時のリダイレクト
  - 新規ユーザー成功時遷移
  - 既存ユーザー成功時遷移
  - `next` 指定時遷移

2. 同一ファイル内で関数抽出
- まず `route.ts` の中だけで小関数化する
- import/export はまだ増やさず、挙動差分ゼロを最優先する

3. `_lib/types.ts` を作成
- 小関数間で受け渡す型だけを先に定義
- 型の責務境界を先に固定する

4. パラメータ・リダイレクト系を移動
- `params.ts` と `redirect.ts` を先に切り出す
- I/Oが少ない領域から分割し、リスクを抑える

5. SupabaseクライアントとCookie処理を移動
- `supabase-client.ts` と `cookies.ts` を切り出す
- Cookie転写順序を変更しない

6. セッション交換とプロフィール保証を移動
- `session.ts` と `profile.ts` を切り出す
- エラーコード変換とrace condition処理を維持する

7. `route.ts` をオーケストレーター化
- `GET()` は「呼び出し順の記述」だけにする
- try/catch は入口で一元化する

8. 検証
- 分割前に定義した期待結果と一致するか確認
- 既存lint/typecheckを通す

## リスクと対策

1. エラーコードの不一致
- 対策: 変換ロジックを `session.ts` と `route.ts` の境界で固定し、文字列定数を重複定義しない

2. Cookie反映漏れ
- 対策: Cookie反映を `cookies.ts` の1関数に集約し、`route.ts` 側で必ず1回呼ぶ

3. 新規ユーザー判定の崩れ
- 対策: `profile.ts` の戻り値を常に `{ profileId, isNewUser }` で返し、判定ロジックを外部に漏らさない

## 実装順序（小さく進める）

1. `params.ts` + `redirect.ts`
2. `types.ts`
3. `supabase-client.ts` + `cookies.ts`
4. `session.ts`
5. `profile.ts`
6. `route.ts` 最終整理

上から順に進めることで、認証の中核（session/profile）に触る前に周辺責務を安全に分離できる。
