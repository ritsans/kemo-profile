# Magic Link セキュリティ対策

## 概要

Magic Link認証のメール検証を強化し、無効な入力がSupabase APIに送信されることを防止しました。

**対象ファイル:** `src/app/actions/magic-link.ts`
**実施日:** 2026-02-16

## 改善内容

### Before (脆弱な実装)

```typescript
const email = formData.get("email") as string;

if (!email || !email.includes("@")) {
  return { success: false, error: "有効なメールアドレスを入力してください" };
}

const { error } = await supabase.auth.signInWithOtp({ email });
```

**問題点:**
- ❌ `@@@` が通過
- ❌ `test@` が通過
- ❌ `@example.com` が通過
- ❌ ` test@example.com ` (前後に空白) が通過
- ❌ 型安全性なし (`as string` で強制変換)

### After (強化した実装)

```typescript
const email = formData.get("email");

// 1. 型チェック
if (!email || typeof email !== "string") {
  return { success: false, error: "有効なメールアドレスを入力してください" };
}

// 2. 空白除去
const trimmedEmail = email.trim();

// 3. 正規表現検証
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
  return { success: false, error: "有効なメールアドレスを入力してください" };
}

// 4. 整形済みデータを使用
const { error } = await supabase.auth.signInWithOtp({ email: trimmedEmail });
```

## 4つの防御層

### 🛡️ 1. 型安全性の確保

```typescript
if (!email || typeof email !== "string") {
  return { success: false, error: "有効なメールアドレスを入力してください" };
}
```

- `FormData.get()` は `string | File | null` を返す
- `as string` での強制変換を排除
- ランタイムで型を明示的に検証

### 🛡️ 2. 空白の正規化

```typescript
const trimmedEmail = email.trim();
```

- ` test@example.com ` → `test@example.com`
- コピペ時の意図しない空白を除去
- Supabase APIに整形済みデータを送信

### 🛡️ 3. 正規表現による構造検証

```typescript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

| パターン | 意味 |
|---------|------|
| `^` | 文字列の開始 |
| `[^\s@]+` | ローカル部（空白・@以外の1文字以上） |
| `@` | @ 必須 |
| `[^\s@]+` | ドメイン名（空白・@以外の1文字以上） |
| `\.` | ドット必須 |
| `[^\s@]+` | TLD（空白・@以外の1文字以上） |
| `$` | 文字列の終了 |

**ブロックされる例:**
- ❌ `@@@` → ローカル部なし
- ❌ `test@` → ドメイン/TLDなし
- ❌ `@example.com` → ローカル部なし
- ❌ `test @example.com` → 空白を含む
- ❌ `test@@example.com` → 連続した@

### 🛡️ 4. Supabase APIへの安全な送信

```typescript
email: trimmedEmail  // 検証・整形済み
```

- 無効なメールでAPIコールしない
- レート制限の無駄遣いを防止
- ログに無意味なエラーが残らない

## 既存のセキュリティ機能（変更なし）

### ✅ アカウント列挙攻撃への対策

```typescript
// セキュリティ: アカウント列挙防止のため常に成功を返す
if (error) {
  console.error("Magic link error:", error.message);
  if (isRateLimitError(error)) {
    return { success: false, error: "しばらく待ってから再試行してください" };
  }
}
return { success: true, data: undefined };
```

- メール未登録でも「送信しました」と表示
- 攻撃者が登録済みアドレスを推測できない
- レート制限エラーのみ明示的に通知

### ✅ Supabase側のレート制限

- 同一IPから短時間に大量送信を防止
- `isRateLimitError()` で検出してユーザーに通知

## セキュリティレベルの向上

| 攻撃シナリオ | Before | After |
|------------|--------|-------|
| 無効メール送信でAPI負荷増大 | ❌ 脆弱 | ✅ 防御 |
| 空白によるバイパス試行 | ❌ 脆弱 | ✅ 防御 |
| 型の不整合による例外 | ❌ 脆弱 | ✅ 防御 |
| アカウント列挙攻撃 | ✅ 防御済み | ✅ 防御済み |
| レート制限回避 | ✅ 防御済み | ✅ 防御済み |

## なぜサーバー側検証が重要か

```
ブラウザ (HTML5 type="email")
    ↓ バイパス可能
Server Action ← ここが防御の本体
    ↓
Supabase API
```

- ブラウザのフォーム検証は**DevToolsで無効化可能**
- Server Actionは**直接呼び出せる**（fetchで任意のデータ送信可能）
- **サーバー側の検証だけが信頼できる防御**

## Zodバリデーションを採用しなかった理由

### 不要と判断した根拠

1. **単一フィールドの単純な検証**
   - 検証対象は `email` の1つだけ
   - 正規表現1行で十分

2. **依存関係を増やさない**
   - プロジェクトにZodが未導入
   - 新規依存を追加するメリットがない

3. **CLAUDE.mdの原則に従う**
   - "Keep it simple; mirror existing patterns"
   - 過剰な設計を避ける

### Zod導入を検討すべきケース

以下の条件に当てはまる場合はZod導入を検討:

✅ **複数フィールドの複雑な検証**
```typescript
// プロフィール編集など
const schema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(160).optional(),
  xUsername: z.string().regex(/^[a-zA-Z0-9_]{1,15}$/).optional(),
  slug: z.string().regex(/^[a-z][a-z0-9_]{2,19}$/).optional(),
});
```

✅ **フィールド間の依存関係**
```typescript
const schema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate);
```

✅ **型安全性が重要**
```typescript
// Zodからバリデーション済みの型を生成
type ProfileInput = z.infer<typeof profileSchema>;
```

## テスト項目

以下のケースで動作確認を推奨:

| 入力値 | 期待結果 |
|-------|---------|
| `test@example.com` | ✅ 送信成功 |
| `user+tag@domain.co.jp` | ✅ 送信成功 |
| ` test@example.com ` | ✅ trim後に送信成功 |
| `@@@` | ❌ エラー表示 |
| `test@` | ❌ エラー表示 |
| `@example.com` | ❌ エラー表示 |
| `test @example.com` | ❌ エラー表示 |
| `test@@example.com` | ❌ エラー表示 |
| `testexample.com` | ❌ エラー表示 |

## まとめ

今回の改善で、Magic Link機能は:

- ✅ 無効なメール形式をブロック
- ✅ 型安全性を確保
- ✅ 入力を正規化
- ✅ API負荷を軽減
- ✅ アカウント列挙攻撃に対応（既存）
- ✅ レート制限に対応（既存）

**シンプルかつ堅牢な実装**で、Zod等の追加依存なしにセキュリティを強化できました。

## 関連ファイル

- 実装: `src/app/actions/magic-link.ts`
- UIコンポーネント: `src/components/auth/MagicLinkForm.tsx`
- エラーハンドリング: `src/lib/errors/supabase.ts`
