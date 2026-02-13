# プロフィールタグ（称号/バッジ）機能 設計書

## 概要

プロフィールにタグ（称号）を追加できる機能。ゲームのアチーブメントやSNSのハッシュタグのように、「イラストレーター」「ゲーマー」「推し活」など自分の属性や趣味を表現する。同人イベントで会った相手の特徴が一目でわかるようにする。

## 要件

- **ハイブリッド方式**: 定義済みタグ（運営が用意）+ カスタムタグ（ユーザー自由入力）
- **用途**: 表示のみ（検索・フィルター機能はMVP外）
- **表示位置**: 公開プロフィールの名前のすぐ下
- **上限**: 1ユーザー最大5個
- **カテゴリ**: 創作活動 + 趣味・属性の混合

## データモデル

### DBカラム追加

```sql
ALTER TABLE profiles ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
-- バリデーション: 配列、最大5要素
ALTER TABLE profiles ADD CONSTRAINT tags_max_length CHECK (jsonb_array_length(tags) <= 5);
```

### タグの保存形式

```jsonc
// 定義済みタグ → slug のみ
// カスタムタグ → "custom:" プレフィックス付き
["illustrator", "gamer", "custom:推し活", "custom:FGO"]
```

### 定義済みタグマスターリスト（フロントエンド定数）

```typescript
// lib/constants/tags.ts
export const PRESET_TAGS = [
  // 創作活動
  { slug: "illustrator", label: "イラストレーター" },
  { slug: "writer", label: "小説書き" },
  { slug: "cosplayer", label: "コスプレイヤー" },
  { slug: "vtuber", label: "VTuber" },
  { slug: "musician", label: "音楽制作" },
  { slug: "youtuber", label: "YouTuber" },
  // 趣味・属性
  { slug: "gamer", label: "ゲーマー" },
  { slug: "anime", label: "アニメ好き" },
  { slug: "manga", label: "漫画好き" },
  { slug: "quiz", label: "クイズ好き" },
  { slug: "camera", label: "カメラ" },
  { slug: "figure", label: "フィギュア" },
] as const;
```

- 定義済みタグ: `slug` で保存、表示時にフロントエンドで `label` に変換
- カスタムタグ: `"custom:テキスト"` 形式で保存、表示時にプレフィックスを除去
- カスタムタグは最大20文字

## 公開プロフィールでの表示

### レイアウト

名前のすぐ下、自己紹介の上にチップとして表示:

```
┌─────────────────────────────┐
│        [アバター画像]          │
│      ハンドルネーム             │
│  [イラストレーター] [ゲーマー]   │  ← タグ（チップ）
│  [推し活]                     │
│  自己紹介テキスト...            │
│  [  X (Twitter) で見る  ]      │
└─────────────────────────────┘
```

### チップスタイル

- 小さめの角丸ピル（`rounded-full`）
- 背景: `bg-gray-100`、テキスト: `text-gray-700`
- `flex-wrap` で自然に折り返し、中央揃え
- 定義済みとカスタムで見た目の区別なし
- タグ未設定時: タグセクション自体を非表示

## マイページの編集UI

### レイアウト

```
┌─────────────────────────────┐
│  タグ（最大5個）               │
│                               │
│  [選択済み]                    │
│  [✕ イラストレーター] [✕ 推し活]│
│                               │
│  [定義済みタグ一覧]             │
│  (イラストレーター) (小説書き)   │
│  (コスプレイヤー) (VTuber) ...  │
│                               │
│  カスタムタグを追加              │
│  [入力欄________] [追加]       │
│                               │
│  [保存する]                    │
└─────────────────────────────┘
```

### 動作

- 定義済みタグ: タップでトグル（選択/解除）。選択中は色が変わる
- カスタムタグ: テキスト入力 + 「追加」ボタンで追加
- 5個に達したら: 定義済みタグはグレーアウト、入力欄は無効化
- 保存: Server Action で `tags` カラムを更新

## コンポーネント構成

### 新規ファイル

| ファイル | 種別 | 役割 |
|---------|------|------|
| `src/lib/constants/tags.ts` | 定数 | 定義済みタグのマスターリスト |
| `src/app/mypage/tag-editor.tsx` | Client Component | タグ編集UI（チップ選択 + カスタム入力） |

### 既存ファイルの変更

| ファイル | 変更内容 |
|---------|---------|
| `src/app/actions/profile.ts` | `updateTags` Server Action を追加 |
| `src/app/mypage/page.tsx` | TagEditor コンポーネントの配置、tags データの取得 |
| `src/app/p/[profile_id]/page.tsx` | タグチップの表示を追加 |

## バリデーション

- 合計タグ数: 最大5個
- カスタムタグ文字数: 最大20文字
- カスタムタグの禁止文字: 特になし（ただし前後の空白はトリム）
- 重複チェック: 同じタグの二重登録を防ぐ
- DB側制約: `jsonb_array_length(tags) <= 5`

## 実装ステップ

1. DBマイグレーション: `tags` JSONB カラム追加
2. TypeScript 型定義の更新
3. `lib/constants/tags.ts` 定義済みタグリスト作成
4. `updateTags` Server Action 作成
5. `tag-editor.tsx` Client Component 作成
6. `mypage/page.tsx` にタグ編集セクション配置
7. `p/[profile_id]/page.tsx` にタグ表示追加
8. Biome lint チェック

## スコープ外

- タグによる検索・フィルター機能
- タグの利用統計（何人が使っているか）
- タグのアイコン・絵文字付き表示
- タグの並び替え（ドラッグ&ドロップ）
- 定義済みタグのカテゴリ分け表示
