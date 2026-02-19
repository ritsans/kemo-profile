# TDD実装計画：x_username 正規化ユーティリティ

## 概要

`x_username` 入力の正規化処理を純粋関数としてTDDで実装する。
ユーザーが様々な形式でX（Twitter）ユーザー名を入力しても、DBに保存する前に統一された形式へ変換する。

## 対象と非対象

### 対象

- `lib/utils/x-username.ts` — 正規化ユーティリティ本体
- `lib/utils/__tests__/x-username.test.ts` — Vitestによるユニットテスト

### 非対象

- `updateProfile` Server Action（本ユーティリティを呼び出す側）
- UI コンポーネント（プレースホルダーや文字カウンターなど）

## 技術選定

| 項目 | 選定 | 理由 |
|------|------|------|
| フレームワーク | Vitest | プロジェクト既存方針 |
| テスト種別 | ユニットテスト | 純粋関数、外部依存なし |

## 関数仕様

### シグネチャ

```typescript
type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function normalizeXUsername(input: string): NormalizeResult;
```

### 正規化ルール

| 入力形式 | 出力 |
|----------|------|
| `username` | `"username"` |
| `@username` | `"username"` |
| `https://x.com/username` | `"username"` |
| `https://twitter.com/username` | `"username"` |

### エラーケース

| 入力 | エラー理由 |
|------|----------|
| 空文字・空白のみ | 入力なし |
| `https://x.com/` | パス部分にユーザー名がない |
| 不正なURL文字列 | URLとしてパースできない |

## TDD手順

### Step 1: テストファイルだけ作成（RED）

`lib/utils/__tests__/x-username.test.ts` を書く。
実装は空関数（常に `{ ok: false, error: "not implemented" }` を返す）にして
テストが全て失敗することを確認する。

### Step 2: 最小実装でテストを通す（GREEN）

`lib/utils/x-username.ts` を実装し、全テストがパスする最小限のコードを書く。

### Step 3: リファクタリング（REFACTOR）

重複削除・可読性向上を行いつつ、テストが引き続きグリーンであることを確認する。

## テストケース一覧

```typescript
// 正常系
normalizeXUsername("username")                       // { ok: true, value: "username" }
normalizeXUsername("@username")                      // { ok: true, value: "username" }
normalizeXUsername("https://x.com/username")         // { ok: true, value: "username" }
normalizeXUsername("https://twitter.com/username")   // { ok: true, value: "username" }
normalizeXUsername("  @username  ")                  // { ok: true, value: "username" }（前後空白除去）

// エラー系
normalizeXUsername("")                               // { ok: false, error: "ユーザー名を入力してください" }
normalizeXUsername("   ")                            // { ok: false, error: "ユーザー名を入力してください" }
normalizeXUsername("https://x.com/")                // { ok: false, error: "URLにユーザー名が含まれていません" }
normalizeXUsername("not a valid input@@")            // { ok: false, error: "入力形式が正しくありません" }
```

## 実装後の統合

本ユーティリティは `updateProfile` Server Action（Task 10.1）から呼び出す：

```typescript
const result = normalizeXUsername(formData.get("x_username") as string);
if (!result.ok) {
  return { errors: { x_username: result.error } };
}
// result.value をDBに保存
```
