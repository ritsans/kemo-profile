# アワードリボン（Award Ribbon）コンポーネント 実装プラン

元仕様書: `docs/ribbon.md`

---

## 1. 概要

ネームタグ下に連結される「アワードリボン（ロゼットリボン）」をReactコンポーネントとして実装する。
ユーザーの役割（Artist, DJ, Sponsorなど）を視覚的に表示し、公開プロフィールページ・マイページの両方で使用する。

---

## 2. 決定事項（ブレインストーミング済み）

| 項目 | 決定内容 |
|---|---|
| 表示場所 | 公開プロフィールページ（`/p/{id}`）とマイページ（`/mypage`）の両方 |
| データ管理者 | プロフィール所有者が自分で設定 |
| リボン最大数 | 上限あり（3〜5個程度） |
| データ保存場所 | 未定 |
| テキスト | 自由入力 |
| 色 | プリセットから選択（4色ベース、後から調整可） |

---

## 3. コンポーネント設計

### 3.1. ファイル配置

```
src/components/ui/award-ribbon.tsx   # [New File] RibbonStack + AwardRibbon
```

### 3.2. コンポーネント構造

```tsx
// 単体リボン
<AwardRibbon color="green" text="ARTIST" />

// 複数積み重ね
<RibbonStack>
  <AwardRibbon color="green" text="ARTIST" />
  <AwardRibbon color="yellow" text="DJ" />
</RibbonStack>
```

### 3.3. Props

**`AwardRibbon`**
```ts
type RibbonColor = "green" | "yellow" | "black" | "white";

interface AwardRibbonProps {
  color: RibbonColor;
  text: string;
}
```

**`RibbonStack`**
```ts
interface RibbonStackProps {
  children: React.ReactNode;
}
```

### 3.4. 技術的注意点

- `clip-path: polygon()` は Tailwind で表現不可 → インラインスタイルで記述
- `box-shadow` は `clip-path` 適用要素に効かない → `filter: drop-shadow()` を使用
- z-index は CSS `:nth-child` ではなく `style={{ zIndex: total - index }}` で動的付与（仕様書 5.3）
- 箔押しテキスト効果: `background-clip: text` + `linear-gradient` でゴールド/シルバー表現

---

## 4. カラープリセット

| クラス名 | カラーコード | テキスト |
|---|---|---|
| `green`  | `#92c04e` | ゴールド |
| `yellow` | `#eebb22` | ゴールド |
| `black`  | `#222222` | シルバー |
| `white`  | `#fdfdfd` | ゴールド（影強め） |

---

## 5. データ保存方式（未定・検討事項）

以下の2案を実装時に検討すること：

### 案A: `profiles` テーブルに JSON カラムとして追加
```sql
ALTER TABLE profiles ADD COLUMN ribbons JSONB DEFAULT '[]';
-- 例: [{"color": "green", "text": "ARTIST"}, {"color": "yellow", "text": "DJ"}]
```
- メリット: シンプル、`social_links` と同じ実装パターン
- デメリット: リボンに関するクエリが複雑になる

### 案B: 新規 `ribbons` テーブルを作成
```sql
CREATE TABLE ribbons (
  id SERIAL PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(profile_id),
  color TEXT NOT NULL,
  text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
```
- メリット: 拡張性が高い
- デメリット: テーブル追加・RLS設定が必要

**推奨**: `social_links` と一貫性を持たせるため **案A（JSONB）** を推奨。

---

## 6. マイページ編集UI（実装時に設計）

- リボンの追加・削除・並べ替えができるフォームUI
- 上限: 5個
- 各リボン: テキスト入力 + 色選択（4色）
- プレビュー表示あり

---

## 7. 参照

- 元仕様書（HTML/CSS リファレンス実装）: `docs/ribbon.md`
- `social_links` の実装パターン参照: `src/lib/social-platforms.ts`, `src/app/mypage/profile-edit-fields.tsx`
