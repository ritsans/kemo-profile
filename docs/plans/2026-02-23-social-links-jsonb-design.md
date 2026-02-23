# SNSリンク JSONB 設計書

## 1. 背景と動機

### 現状の問題

現在、SNSリンクは `profiles.x_username` という**専用カラム**で管理している。この方式では、新しいSNSプラットフォーム（Pixiv、Bluesky、Discord等）を追加するたびに以下の作業が必要になる:

1. Supabase で ALTER TABLE（カラム追加）
2. `database.types.ts` の型更新
3. RPC 関数の修正
4. Server Action のバリデーション追加
5. 編集フォームに入力欄を追加
6. プレビューカードに表示を追加
7. 公開プロフィールに表示を追加
8. 差分検知ロジックの更新
9. action 型定義の更新

**1プラットフォーム追加あたり約7〜9ファイルの変更**が発生し、スケールしない。

### 目指す姿

**プラットフォーム定義ファイルに1行追加するだけ**で、フォーム・表示・バリデーションすべてが自動的に対応する構造にする。

---

## 2. 設計方針

### 採用: JSONB カラム + プラットフォーム定義ファイル

`profiles` テーブルに `social_links JSONB DEFAULT '{}'` カラムを1つ追加し、すべてのSNSリンクをこのカラムに格納する。プラットフォームの定義（表示名、URL生成ルール、バリデーション、アイコン）は `src/lib/social-platforms.ts` に集約する。

### 検討した代替案と却下理由

| 案 | メリット | 却下理由 |
|---|---|---|
| プラットフォームごとに専用カラム | 型安全、SQLでフィルタしやすい | スケールしない（上記の問題そのもの） |
| `social_links` テーブル（正規化） | 正規化として正しい、インデックスしやすい | JOIN増加、MVP には過剰な複雑性 |
| **JSONB カラム（採用）** | **1カラムで完結、追加が容易** | JSONBはSQLフィルタが少し冗長（現時点では不要） |

JSONB の弱点（SQLで特定SNSのユーザーを検索しにくい）は、現在の要件では不要なため問題にならない。将来的に「Xアカウントで検索」等が必要になった場合は、JSONB の GIN インデックスまたは generated column で対応可能。

---

## 3. データモデル

### 3.1 DB カラム

```sql
ALTER TABLE profiles
  ADD COLUMN social_links JSONB NOT NULL DEFAULT '{}';
```

### 3.2 JSONB のスキーマ

```typescript
// プラットフォームキー → 正規化されたユーザー識別子
type SocialLinks = Record<string, string>;

// 具体例
{
  "x": "kemono_taro",        // X (Twitter) のユーザー名
  "pixiv": "12345678",        // Pixiv のユーザーID
  "bluesky": "kemono.bsky.social"  // Bluesky のハンドル
}
```

**ルール:**
- キーは `social-platforms.ts` の `key` と一致するもののみ有効
- 値は常に正規化済みのユーザー識別子（URLやプレフィックスは含まない）
- 空文字の値は保存しない（キーごと削除する）
- 未対応のキーはバリデーション時に無視（削除）する

### 3.3 x_username からの移行

```sql
-- データ移行
UPDATE profiles
SET social_links = jsonb_set(
  social_links,
  '{x}',
  to_jsonb(x_username)
)
WHERE x_username IS NOT NULL;

-- 移行確認後にカラム削除（別マイグレーション）
-- ALTER TABLE profiles DROP COLUMN x_username;
```

移行は2段階で行う:
1. `social_links` カラム追加 + データコピー + アプリケーション側を `social_links` に切り替え
2. 動作確認後、`x_username` カラムを削除

---

## 4. プラットフォーム定義ファイル

### 4.1 ファイル: `src/lib/social-platforms.ts`

```typescript
import type { ComponentType, SVGProps } from "react";

export interface SocialPlatform {
  /** JSONB のキー名。DB に保存される識別子 */
  key: string;
  /** UI に表示するプラットフォーム名 */
  label: string;
  /** プロフィール URL を生成する関数。null の場合はリンクなし（テキスト表示のみ） */
  profileUrl: ((value: string) => string) | null;
  /** 入力値を正規化する関数。未定義の場合は trim のみ */
  normalize?: (input: string) => { ok: true; value: string } | { ok: false; error: string };
  /** プレースホルダーテキスト */
  placeholder: string;
  /** アイコンコンポーネント（省略可） */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** 公開プロフィールでのボタン背景色（Tailwind クラス） */
  buttonClass?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "x",
    label: "X (Twitter)",
    profileUrl: (v) => `https://x.com/${v}`,
    normalize: normalizeXUsername,  // 既存の正規化関数を再利用
    placeholder: "username または https://x.com/username",
    icon: XIcon,
    buttonClass: "bg-black hover:bg-gray-800 active:bg-gray-900",
  },
  // --- 追加例 ---
  // {
  //   key: "pixiv",
  //   label: "Pixiv",
  //   profileUrl: (v) => `https://pixiv.me/${v}`,
  //   placeholder: "ユーザーID（数字）",
  // },
];

/** キーから定義を引く便利関数 */
export function getPlatform(key: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}
```

### 4.2 新しいプラットフォームの追加手順

`SOCIAL_PLATFORMS` 配列に1エントリ追加するだけ。例:

```typescript
{
  key: "pixiv",
  label: "Pixiv",
  profileUrl: (v) => `https://pixiv.me/${v}`,
  placeholder: "ユーザーID（数字）",
},
```

これだけで:
- 編集フォームに入力欄が自動追加される
- 公開プロフィールにリンクボタンが自動追加される
- Server Action のバリデーションが自動適用される

**DBマイグレーション不要。Server Action の修正不要。コンポーネントの修正不要。**

---

## 5. Server Action の変更

### 5.1 `updateProfile` の改修

現在の `updateProfile` は `display_name`, `bio`, `x_username`, `slug` を個別にバリデーションしている。これを以下のように変更する:

```
updateProfile(formData):
  1. display_name, bio, slug のバリデーション（変更なし）
  2. social_links のバリデーション:
     - formData から "social_links.x", "social_links.pixiv" 等の
       "social_links.{key}" パターンのフィールドを収集
     - SOCIAL_PLATFORMS に定義されたキーのみ受け付ける
     - 各プラットフォームの normalize 関数を適用
     - 空文字のエントリはオブジェクトから除外
     - 結果を { "x": "username", "pixiv": "12345" } の形にまとめる
  3. 差分検知: original_social_links（hidden field, JSON文字列）と比較
  4. DB 更新: 変更があれば social_links カラムを丸ごと上書き
```

### 5.2 ProfileUpdateResult 型の変更

```typescript
export type ProfileUpdateResult =
  | { success: true }
  | {
      success: false;
      fieldErrors: Partial<
        Record<"display_name" | "bio" | "slug" | `social_links.${string}`, string>
      >;
    };
```

フィールドエラーのキーに `social_links.x`, `social_links.pixiv` 等のドット記法を使うことで、プラットフォームごとのエラーメッセージを返せる。

---

## 6. UI コンポーネントの変更

### 6.1 編集フォーム (`profile-edit-fields.tsx`)

現在の X ユーザー名の入力欄を、`SOCIAL_PLATFORMS` をループで描画する形に置き換える:

```tsx
{SOCIAL_PLATFORMS.map((platform) => (
  <div key={platform.key}>
    <label>{platform.label}</label>
    <Input
      name={`social_links.${platform.key}`}
      value={currentSocialLinks[platform.key] ?? ""}
      onChange={...}
      placeholder={platform.placeholder}
    />
    {fieldErrors[`social_links.${platform.key}`] && (
      <p className="text-red-600">...</p>
    )}
  </div>
))}
```

### 6.2 プレビューカード (`profile-preview-card.tsx`)

```tsx
{SOCIAL_PLATFORMS.map((platform) => {
  const value = socialLinks[platform.key];
  if (!value) return null;
  const Icon = platform.icon;
  return (
    <a key={platform.key} href={platform.profileUrl?.(value) ?? "#"}>
      {Icon && <Icon />}
      {platform.label} へ移動
    </a>
  );
})}
```

### 6.3 公開プロフィール (`/p/[profile_id]/page.tsx`)

プレビューカードと同じループ構造で描画する。

### 6.4 状態管理 (`edit-form.tsx`)

現在の `currentXUsername` / `originalXUsername` 等の個別ステートを、`currentSocialLinks: Record<string, string>` / `originalSocialLinks: Record<string, string>` にまとめる。

dirty 検知は `JSON.stringify(currentSocialLinks) !== JSON.stringify(originalSocialLinks)` でシンプルに判定する。

---

## 7. RPC 関数の変更

`public_get_profile` および `public_get_profile_by_slug` の戻り値に `social_links` を追加し、`x_username` を除去する。

```sql
-- public_get_profile
CREATE OR REPLACE FUNCTION public_get_profile(p_profile_id TEXT)
RETURNS TABLE(
  profile_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB,
  slug TEXT
) ...
```

---

## 8. 認証コールバックの変更

`src/app/auth/callback/_lib/profile.ts` の `ensureProfile` 関数を変更:

```typescript
// 変更前
let xUsername: string | null = null;
xUsername = provider === "twitter" ? metadata.user_name || null : null;
// insert時: x_username: xUsername

// 変更後
const socialLinks: Record<string, string> = {};
if (provider === "twitter" && metadata.user_name) {
  socialLinks.x = metadata.user_name;
}
// insert時: social_links: socialLinks
```

---

## 9. マイグレーション計画

### フェーズ1: 追加と移行（1回のデプロイ）

1. `social_links JSONB NOT NULL DEFAULT '{}'` カラム追加
2. `x_username` → `social_links.x` にデータコピー
3. アプリケーション側を `social_links` に全面切り替え
4. `x_username` カラムは残すが、アプリケーションからは参照しない

### フェーズ2: クリーンアップ（動作確認後）

1. `x_username` カラムを DROP
2. `database.types.ts` から `x_username` を完全削除

---

## 10. 影響範囲

| ファイル | 変更内容 |
|---|---|
| **Supabase** | ALTER TABLE + データ移行 + RPC更新 |
| `database.types.ts` | `social_links: Json` 追加、`x_username` 維持→後で削除 |
| `lib/social-platforms.ts` | **[新規]** プラットフォーム定義 |
| `lib/utils/x-username.ts` | 変更なし（`social-platforms.ts` から参照される） |
| `lib/types/action.ts` | `ProfileUpdateResult` の fieldErrors キー変更 |
| `app/actions/profile.ts` | `social_links` のバリデーション・差分検知に書き換え |
| `app/mypage/edit-form.tsx` | 個別SNSステート → `socialLinks` オブジェクトに統合 |
| `app/mypage/profile-edit-fields.tsx` | X 入力欄 → ループ描画に変更 |
| `app/mypage/profile-preview-card.tsx` | X 表示 → ループ描画に変更 |
| `app/mypage/page.tsx` | `xUsername` props → `socialLinks` props に変更 |
| `app/p/[profile_id]/page.tsx` | X 表示 → ループ描画に変更 |
| `app/auth/callback/_lib/profile.ts` | `x_username` → `social_links` に変更 |

### 初回移行は12ファイル程度の変更だが、以降の追加は1ファイル1行のみ。

---

## 11. 実装順序

1. `src/lib/social-platforms.ts` を作成（プラットフォーム定義）
2. Supabase マイグレーション（カラム追加 + データ移行 + RPC更新）
3. `database.types.ts` 更新
4. `lib/types/action.ts` の型更新
5. `app/actions/profile.ts` の Server Action 書き換え
6. `app/auth/callback/_lib/profile.ts` の認証コールバック修正
7. `app/mypage/edit-form.tsx` の状態管理リファクタ
8. `app/mypage/profile-edit-fields.tsx` のフォームUI変更
9. `app/mypage/profile-preview-card.tsx` のプレビュー変更
10. `app/mypage/page.tsx` の props 修正
11. `app/p/[profile_id]/page.tsx` の公開プロフィール変更
12. 動作確認 + Biome lint
13. （後日）`x_username` カラム DROP
