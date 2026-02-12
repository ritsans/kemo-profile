# オンボーディング機能 実装ドキュメント

## 概要

初回ログイン後のユーザーが最低限のプロフィール設定をスムーズに行えるよう、3ステップのオンボーディングウィザードを実装しました。モバイルファースト設計で、各ステップはスキップ可能です。

## 機能仕様

### ユーザーフロー

```mermaid
graph TD
    A[初回OAuth認証] --> B{プロフィール存在?}
    B -->|NO| C[プロフィール自動作成]
    B -->|YES| D[/mypage へ]
    C --> E[/onboarding へリダイレクト]
    E --> F[Step 1: ユーザー名確認]
    F --> G[Step 2: 自己紹介入力]
    G --> H[Step 3: カスタムURL設定]
    H --> I[onboarding_completed = true]
    I --> D

    F -.スキップ全体.-> I
    G -.スキップ全体.-> I
    H -.スキップ.-> I
```

### 3ステップの詳細

#### Step 1: ユーザー名確認
- **目的**: OAuthプロバイダーから取得した表示名を確認・編集
- **入力**: `display_name`（必須、50文字以内）
- **デフォルト値**: OAuth メタデータから自動入力
- **操作**: [次へ] ボタンのみ（必須ステップ）

#### Step 2: 自己紹介入力
- **目的**: プロフィールに表示する自己紹介文を設定
- **入力**: `bio`（任意、160文字以内）
- **placeholder**: "例: イラストレーター / 猫好き / コミケ参加者"
- **操作**: [次へ] または [スキップ]

#### Step 3: カスタムURL設定
- **目的**: `/p/@{slug}` 形式の短縮URLを設定
- **入力**: `slug`（任意、3-20文字）
- **形式**: 英小文字で始まり、英小文字・数字・アンダースコアのみ
- **例**: `my_name` → `/p/@my_name`
- **操作**: [設定する] または [スキップ]

### 共通機能

- **プログレスインジケーター**: 1-2-3 の丸数字でステップ表示
- **グローバルスキップ**: 全ステップ下部に「スキップしてマイページへ」リンク
- **即座保存**: 各ステップの保存は即座に反映（部分完了を保持）
- **完了フラグ**: 最終ステップ完了またはスキップ時に `onboarding_completed = true`

## データベーススキーマ

### 追加カラム

```sql
-- profiles テーブルに追加
ALTER TABLE public.profiles
  ADD COLUMN slug TEXT,
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- CHECK 制約: 英小文字開始、3-20文字
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_slug_format
  CHECK (slug ~ '^[a-z][a-z0-9_]{2,19}$');

-- 部分ユニークインデックス（NULL は除外）
CREATE UNIQUE INDEX profiles_slug_unique
  ON public.profiles (slug)
  WHERE slug IS NOT NULL;
```

### RPC 関数

```sql
-- slug からプロフィールを公開取得
CREATE OR REPLACE FUNCTION public.public_get_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
  profile_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  x_username TEXT,
  bio TEXT,
  slug TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.profile_id,
    p.display_name,
    p.avatar_url,
    p.x_username,
    p.bio,
    p.slug
  FROM public.profiles p
  WHERE p.slug = p_slug;
$$;
```

### 既存ユーザー対応

マイグレーション時に既存ユーザーは自動的にオンボーディング済みとして扱われます。

```sql
UPDATE public.profiles SET onboarding_completed = true;
```

## ファイル構成

### 新規ファイル

```
src/app/onboarding/
├── page.tsx                    # Server Component（認証チェック、データ取得）
└── onboarding-wizard.tsx       # Client Component（ウィザードUI）
```

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/supabase/database.types.ts` | `slug`, `onboarding_completed` の型定義追加 |
| `src/app/actions/profile.ts` | `updateSlug`, `completeOnboarding` Server Actions 追加 |
| `src/app/auth/callback/route.ts` | 新規ユーザー → `/onboarding` リダイレクト |
| `src/app/mypage/page.tsx` | オンボーディング未完了ガード + slug 対応 |
| `src/app/mypage/profile-edit-form.tsx` | slug 編集フォーム追加 |
| `src/app/p/[profile_id]/page.tsx` | slug 解決（`@slug` 対応） |

## 実装詳細

### 1. Server Actions

#### updateSlug

```typescript
export async function updateSlug(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

- **バリデーション**: 正規表現 `/^[a-z][a-z0-9_]{2,19}$/`
- **空文字処理**: slug を `null` にクリア
- **エラーハンドリング**: unique violation → 「このURLは既に使用されています」

#### completeOnboarding

```typescript
export async function completeOnboarding(): Promise<ActionResult>
```

- `onboarding_completed = true` に更新
- スキップ時・最終ステップ完了時に呼ばれる

### 2. 認証フロー変更

**src/app/auth/callback/route.ts**

```typescript
let isNewUser = false;

if (!existingProfile) {
  // プロフィール作成処理
  // ...
  isNewUser = true;
}

// race condition 時は既存ユーザーとして扱う
const defaultPath = isNewUser ? "/onboarding" : "/mypage";
```

### 3. オンボーディングページ

**src/app/onboarding/page.tsx** (Server Component)

```typescript
// 認証チェック
if (!user) redirect("/login");

// オンボーディング完了済み → マイページへ
if (profile.onboarding_completed) redirect("/mypage");

// ウィザードにデータを渡す
<OnboardingWizard
  displayName={profile.display_name}
  bio={profile.bio}
  slug={profile.slug}
/>
```

**src/app/onboarding/onboarding-wizard.tsx** (Client Component)

- `useState` でステップ管理
- `useActionState` で各フォームの状態管理
- `useEffect` で成功時のステップ遷移
- `useCallback` で完了処理（メモ化）

### 4. MyPage ガード

**src/app/mypage/page.tsx**

```typescript
// オンボーディング未完了ガード
if (!profile.onboarding_completed) {
  redirect("/onboarding");
}

// slug 対応プロフィールリンク
const profilePath = profile.slug
  ? `/p/@${profile.slug}`
  : `/p/${profile.profile_id}`;
```

### 5. 公開プロフィール slug 解決

**src/app/p/[profile_id]/page.tsx**

```typescript
let profile: ProfileData;

if (profile_id.startsWith("@")) {
  const slug = profile_id.slice(1);
  const { data } = await supabase.rpc("public_get_profile_by_slug", {
    p_slug: slug,
  });
  profile = data[0];
} else {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("profile_id", profile_id)
    .single();
  profile = data;
}
```

## URL構造

| パターン | 解決方法 | 例 |
|---------|---------|-----|
| `/p/{profile_id}` | profile_id で直接検索 | `/p/aBcDeFgHiJkLmNo` |
| `/p/@{slug}` | `public_get_profile_by_slug` RPC | `/p/@my_name` |

## バリデーションルール

### slug

- **形式**: `^[a-z][a-z0-9_]{2,19}$`
- **文字数**: 3〜20文字
- **開始文字**: 英小文字のみ
- **使用可能文字**: 英小文字、数字、アンダースコア
- **一意性**: データベースレベルでユニーク制約

### display_name

- **文字数**: 1〜50文字
- **必須**: ✅

### bio

- **文字数**: 0〜160文字
- **必須**: ❌（空文字は `null` として保存）

## エラーハンドリング

### slug 重複エラー

```typescript
if (isUniqueViolation(error)) {
  return { success: false, error: "このURLは既に使用されています" };
}
```

### 形式エラー

```typescript
if (!SLUG_REGEX.test(trimmedSlug)) {
  return {
    success: false,
    error: "英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字で入力してください",
  };
}
```

## Biome Lint 対応

実装時に対応した主要な lint ルール：

### noInvalidUseBeforeDeclaration

`useCallback` は `useEffect` の依存配列で参照される前に宣言する必要があります。

```typescript
// ❌ BAD
useEffect(() => {
  handleComplete();
}, [handleComplete]);

const handleComplete = useCallback(...);

// ✅ GOOD
const handleComplete = useCallback(...);

useEffect(() => {
  handleComplete();
}, [handleComplete]);
```

### noImplicitAnyLet

`let` 変数は型を明示する必要があります。

```typescript
// ❌ BAD
let profile;

// ✅ GOOD
let profile: ProfileData;
```

## 今後の拡張可能性

### 追加ステップ候補

- **Step 4**: アバター画像アップロード
- **Step 5**: SNSリンク追加（Discord, Pixiv など）
- **Step 6**: プライバシー設定

### カスタマイズ可能な項目

- ステップ数（`TOTAL_STEPS` 定数）
- プログレスインジケーターのスタイル
- スキップボタンの表示/非表示（ステップごと）

### A/Bテスト項目

- オンボーディングの有無による完遂率比較
- ステップ数の違いによる離脱率分析
- デフォルト値の有無による入力率比較

## テスト項目

### 機能テスト

- [ ] 初回ログイン → `/onboarding` へ遷移
- [ ] Step 1 でユーザー名保存 → Step 2 へ遷移
- [ ] Step 2 でスキップ → Step 3 へ遷移
- [ ] Step 3 で slug 保存 → `/mypage` へ遷移
- [ ] グローバルスキップ → `/mypage` へ遷移、`onboarding_completed = true`
- [ ] 既存ユーザーはオンボーディングをスキップ
- [ ] オンボーディング途中でブラウザを閉じて再訪 → `/onboarding` へリダイレクト
- [ ] `/p/@my_name` でプロフィール表示
- [ ] slug 重複時にエラーメッセージ表示

### エッジケース

- [ ] race condition（同時プロフィール作成）→ 既存ユーザーとして扱う
- [ ] slug に無効な文字入力 → バリデーションエラー
- [ ] 2文字の slug 入力 → バリデーションエラー
- [ ] 21文字の slug 入力 → バリデーションエラー
- [ ] 数字で始まる slug → バリデーションエラー

### パフォーマンステスト

- [ ] `pnpm build` でビルドエラーなし
- [ ] `pnpm lint` でlintエラーなし
- [ ] オンボーディングページの初期表示速度

## トラブルシューティング

### オンボーディングが表示されない

**原因**: `onboarding_completed` が既に `true`

**対処**: Supabase Dashboard で該当ユーザーの `onboarding_completed` を `false` に変更

### slug が保存できない

**原因1**: 形式エラー（英小文字で始まらない、使用不可文字）

**対処**: バリデーションメッセージに従って修正

**原因2**: 既に使用されている slug

**対処**: 別の slug を試す

### `/p/@slug` でページが見つからない

**原因**: `public_get_profile_by_slug` 関数が存在しない、またはRLSポリシー不足

**対処**: マイグレーションが正しく適用されているか確認

## 参考リンク

- [Next.js App Router - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React useActionState](https://react.dev/reference/react/useActionState)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Biome Lint Rules](https://biomejs.dev/linter/rules/)
