# SNSリンク追加（ステップ式）実装プラン

## 1. 目的

プロフィール編集画面に、ユーザーが後からSNSリンクを追加できるオプション機能を導入する。

本機能は以下を満たす:

1. 入口は `+ リンクを追加` ボタン 1つのみ
2. 追加操作はステップ式（SNS選択 → ユーザー名入力 → 保存）
3. 保存成功時はモーダルを自動で閉じる
4. 同一SNSの複数登録は許可しない（1SNS=1リンク）

---

## 2. 対象範囲 / 非対象

### 2.1 対象

- 対応SNS: `X`, `Instagram`, `Pixiv`
- マイページ編集UIでのSNS追加
- 追加時の正規化・バリデーション・保存

### 2.2 非対象

- `LINE` の実装（今回は対象外）
- ユーザー定義SNS（自由入力でSNS定義そのものを追加）
- 同一SNSの複数アカウント登録

---

## 3. UX設計

## 3.1 入口

- 編集フォーム下部に `+ リンクを追加` ボタンを常設
- クリックで `AddSocialLinkModal` を開く

## 3.2 ステップ構成

### Step 1: SNS選択

- 未追加SNSのみ一覧表示
- 表示例: `X`, `Instagram`, `Pixiv`
- 選択時に Step 2 へ遷移

### Step 2: アカウント入力

- 選択済みSNSに対応した入力フィールドを1つ表示
- プレースホルダーはSNS別（例: `@username または URL`）
- 補助表示として「変換後URLプレビュー」を表示（可能な場合）

### 操作ボタン

- `保存して追加`（主ボタン）
- `戻る`（前のStepへ）
- `キャンセル`（モーダルを閉じる）

## 3.3 成功・失敗時の挙動

- 成功: 保存完了メッセージ表示後、モーダルを閉じる。編集画面のSNS一覧に反映。
- 失敗: エラーメッセージを表示し、モーダルは閉じない（再入力可能）。

---

## 4. データと制約

## 4.1 データ保存先

- 既存の `profiles.social_links`（JSONB）を利用
- 保存形式:

```json
{
  "x": "username",
  "instagram": "username",
  "pixiv": "12345678"
}
```

## 4.2 制約

1. キーは `SOCIAL_PLATFORMS` 定義済みのもののみ
2. 空文字は保存しない
3. 同一キーが既に存在する場合は追加不可
4. 保存値は必ず正規化済み識別子（URLそのものは保存しない）

---

## 5. 正規化ルール（初期案）

## 5.1 X

- 許容入力: `username`, `@username`, `https://x.com/username`, `https://twitter.com/username`
- 保存値: `username`
- 公開URL: `https://x.com/{username}`

## 5.2 Instagram

- 許容入力: `username`, `@username`, `https://instagram.com/username`, `https://www.instagram.com/username`
- 保存値: `username`
- 公開URL: `https://instagram.com/{username}`

## 5.3 Pixiv

- 許容入力: `12345678`, `https://www.pixiv.net/users/12345678`
- 保存値: `12345678`（数値ID）
- 公開URL: `https://www.pixiv.net/users/{id}`

---

## 6. 実装方針

## 6.1 プラットフォーム定義

`src/lib/social-platforms.ts` に `instagram`, `pixiv` を追加する。

各定義に以下を持たせる:

- `key`
- `label`
- `normalize`
- `profileUrl`
- `placeholder`
- `icon`（任意）
- `buttonClass`（任意）

## 6.2 UIコンポーネント

新規: `src/app/mypage/add-social-link-modal.tsx`

- モーダル内部で2ステップを管理
- Props:
  - `existingKeys: string[]`
  - `onClose: () => void`
  - `onAdded: () => void`（保存成功後の再取得/再描画）

既存編集フォームへ統合:

- `+ リンクを追加` ボタンの設置
- 追加済みSNS行の表示維持
- 各行に `削除` を配置（既存の削除フローを踏襲）

## 6.3 Server Action

`src/app/actions/profile.ts` に追加用Actionを実装:

- `addSocialLink`
  - 入力: `platformKey`, `value`
  - 処理:
    1. 認証確認
    2. `platformKey` が定義済みか検証
    3. `normalize` で検証・正規化
    4. 現在の `social_links` を取得
    5. 既存キー重複ならエラー
    6. `social_links` を更新
    7. `revalidatePath("/mypage")`

---

## 7. 状態遷移（モーダル）

1. `closed`
2. `select_platform`
3. `input_value`
4. `submitting`
5. `success`（短時間表示後 `closed`）
6. `error`（`input_value` に留まる）

`success` 時は必ず `onClose()` を呼び、開きっぱなしにしない。

---

## 8. 受け入れ条件

1. 入口が `+ リンクを追加` の1つに統一されている
2. 追加フローが「選択→入力→保存」の2ステップで完結する
3. 追加成功時にモーダルが閉じる
4. 未追加SNSのみ選択候補に出る
5. 同一SNSを2回追加できない
6. URL入力でも保存値は正規化され、公開ページリンクが正しい
7. エラー時に再入力できる（誘導が途切れない）

---

## 9. 実装タスク

1. `docs/spec.md` を本仕様に合わせて更新
2. `social-platforms.ts` に Instagram/Pixiv を追加
3. 正規化ユーティリティ（Instagram/Pixiv）を追加
4. `add-social-link-modal.tsx` を作成
5. `addSocialLink` Server Action を追加
6. `mypage` 編集画面に統合
7. ユニットテスト（normalize）追加
8. Actionテスト（成功/重複/不正入力）追加

---

## 10. リスクと対策

1. SNSごとに入力仕様が異なる
   - 対策: normalize関数をSNS単位で分離しテストを追加
2. 既存プロフィール編集の状態と競合する可能性
   - 対策: 追加専用Actionを分け、フル保存処理と責務分離
3. 将来のSNS追加時にUIが複雑化
   - 対策: Step 1の候補リストを `SOCIAL_PLATFORMS` 駆動で自動化
