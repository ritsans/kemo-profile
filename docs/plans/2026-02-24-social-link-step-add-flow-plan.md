# SNSリンクCRUD（ステップ式追加 + 個別編集/削除）実装プラン

## 1. 目的

プロフィール編集画面で、ユーザーがSNSリンクを後から管理できるCRUD機能を導入する。

本機能は以下を満たす:

1. 入口は `+ リンクを追加` ボタン 1つのみ
2. 追加操作はステップ式（SNS選択 → ユーザー名入力 → 保存）
3. 既存リンクを個別に編集できる
4. 既存リンクを個別に削除できる
5. 同一SNSの複数登録は許可しない（1SNS=1リンク）
6. 保存成功時はモーダルを自動で閉じる

---

## 2. 対象範囲 / 非対象

### 2.1 対象

- 対応SNS: `X`, `Instagram`, `Pixiv`
- マイページ編集UIでのSNS追加・編集・削除
- 追加/編集時の正規化・バリデーション・保存
- 削除時の `social_links` キー除去

### 2.2 非対象

- `LINE` の実装（今回は対象外）
- ユーザー定義SNS（自由入力でSNS定義そのものを追加）
- 同一SNSの複数アカウント登録
- 並び順のドラッグ&ドロップ編集

---

## 3. UX設計

## 3.1 入口

- 編集フォーム下部に `+ リンクを追加` ボタンを常設
- クリックで `AddSocialLinkModal` を開く

## 3.2 リンク一覧操作

- 各SNS行に `編集` と `削除` を配置
- `編集` は `AddSocialLinkModal` を `edit` モードで開く
- `削除` は確認ダイアログ後に即時反映

## 3.3 追加/編集モーダル構成

### Step 1: SNS選択（addモードのみ）

- 未追加SNSのみ一覧表示
- 表示例: `X`, `Instagram`, `Pixiv`
- 選択時に Step 2 へ遷移

### Step 2: アカウント入力（add/edit共通）

- 対象SNSに対応した入力フィールドを1つ表示
- プレースホルダーはSNS別（例: `@username または URL`）
- 補助表示として「変換後URLプレビュー」を表示（可能な場合）

### 操作ボタン（add/edit共通）

- `保存`（主ボタン。add時ラベルは `保存して追加`）
- `戻る`（addモードのStep 2のみ）
- `キャンセル`（モーダルを閉じる）

## 3.4 成功・失敗時の挙動

- 成功: 保存完了メッセージ表示後、モーダルを閉じる。編集画面のSNS一覧に反映。
- 失敗: エラーメッセージを表示し、モーダルは閉じない（再入力可能）。
- 削除成功: 一覧から即時に消える。未追加SNS候補に戻る。
- 削除失敗: エラーメッセージ表示。画面状態は維持。

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
3. 同一キーが既に存在する場合は追加不可（updateは同一キー上書き）
4. 保存値は必ず正規化済み識別子（URLそのものは保存しない）
5. X OAuthで自動設定された `x` は更新/削除不可（表示のみ）

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

- モーダル内部で `add/edit` モードを管理
- Props:
  - `existingKeys: string[]`
  - `mode: "add" | "edit"`
  - `initialPlatformKey?: string`（edit時は必須）
  - `initialValue?: string`（edit時の初期値）
  - `onClose: () => void`
  - `onSaved: () => void`（保存成功後の再取得/再描画）

既存編集フォームへ統合:

- `+ リンクを追加` ボタンの設置
- 追加済みSNS行の表示維持（各行に `編集` / `削除`）
- 削除確認ダイアログを追加

## 6.3 Server Action

`src/app/actions/profile.ts` にCRUD用Actionを実装:

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
- `updateSocialLink`
  - 入力: `platformKey`, `value`
  - 処理:
    1. 認証確認
    2. `platformKey` が定義済みか検証
    3. X OAuth自動設定値（`x`）の編集禁止チェック
    4. `normalize` で検証・正規化
    5. 現在の `social_links` を取得
    6. 対象キーが未登録ならエラー
    7. 対象キーを上書き更新
    8. `revalidatePath("/mypage")`
- `removeSocialLink`
  - 入力: `platformKey`
  - 処理:
    1. 認証確認
    2. `platformKey` が定義済みか検証
    3. X OAuth自動設定値（`x`）の削除禁止チェック
    4. 現在の `social_links` を取得
    5. 対象キーが未登録ならエラー
    6. 対象キーを削除して更新
    7. `revalidatePath("/mypage")`

---

## 7. 状態遷移

### 7.1 モーダル（add）
1. `closed`
2. `select_platform`
3. `input_value`
4. `submitting`
5. `success`（短時間表示後 `closed`）
6. `error`（`input_value` に留まる）

`success` 時は必ず `onClose()` を呼び、開きっぱなしにしない。

### 7.2 モーダル（edit）
1. `closed`
2. `input_value`
3. `submitting`
4. `success`（短時間表示後 `closed`）
5. `error`（`input_value` に留まる）

### 7.3 削除
1. `idle`
2. `confirming`
3. `deleting`
4. `done` または `error`

---

## 8. 受け入れ条件

1. 入口が `+ リンクを追加` の1つに統一されている
2. 追加フローが「選択→入力→保存」の2ステップで完結する
3. 追加/編集成功時にモーダルが閉じる
4. 未追加SNSのみ選択候補に出る
5. 既存SNSを個別に編集できる
6. 既存SNSを個別に削除できる
7. 同一SNSを2回追加できない
8. URL入力でも保存値は正規化され、公開ページリンクが正しい
9. エラー時に再入力できる（誘導が途切れない）
10. X OAuth自動設定値（`x`）は更新/削除できない

---

## 9. 実装タスク

1. `docs/spec.md` を本仕様に合わせて更新
2. `social-platforms.ts` に Instagram/Pixiv を追加
3. 正規化ユーティリティ（Instagram/Pixiv）を追加
4. `add-social-link-modal.tsx` を作成（`add/edit` モード対応）
5. `addSocialLink` / `updateSocialLink` / `removeSocialLink` Server Action を追加
6. `mypage` 編集画面に統合（一覧の `編集` / `削除` を含む）
7. ユニットテスト（normalize）追加
8. Actionテスト（追加/更新/削除の成功・重複・未登録・不正入力・権限）追加

---

## 10. 実装進行ルール（同期・逐次）

本実装は**同期処理を守り、1ステップずつ逐次実行**する。並列実装・並列マージは行わない。

1. Step 1: 仕様確定
   - 対象: `docs/spec.md` と本Planの整合を取る
   - 完了条件: 受け入れ条件と制約がCRUD前提で一致している
2. Step 2: ドメイン層確定
   - 対象: `social-platforms.ts` と正規化ユーティリティ
   - 完了条件: 対応SNSの `normalize` / `profileUrl` / `placeholder` が揃う
3. Step 3: サーバー層実装
   - 対象: `addSocialLink` / `updateSocialLink` / `removeSocialLink`
   - 完了条件: 認証・バリデーション・重複制約・X保護・revalidate を満たす
4. Step 4: UI層実装
   - 対象: モーダル（add/edit）と編集画面統合、削除確認
   - 完了条件: 追加/更新/削除の導線が画面上で成立する
5. Step 5: テスト実装
   - 対象: normalizeユニットテスト、Actionテスト
   - 完了条件: 主要正常系/異常系のケースが網羅される
6. Step 6: 検証
   - 対象: `pnpm test` と `pnpm lint`
   - 完了条件: 失敗なし

進行制約:
- 前ステップの完了条件を満たすまで次ステップへ進まない
- 仕様変更が発生した場合は、必ずStep 1に戻って再同期する
- 各ステップ完了時に差分レビューを実施してから次へ進む

---

## 11. リスクと対策

1. SNSごとに入力仕様が異なる
   - 対策: normalize関数をSNS単位で分離しテストを追加
2. 既存プロフィール編集の状態と競合する可能性
   - 対策: CRUD Actionを分け、フル保存処理と責務分離
3. 将来のSNS追加時にUIが複雑化
   - 対策: Step 1の候補リストを `SOCIAL_PLATFORMS` 駆動で自動化
4. 誤削除によるユーザー操作ミス
   - 対策: 削除前に確認ダイアログを必須化
5. OAuth自動設定値の誤編集
   - 対策: UIで編集不可 + Server Actionで防御的に拒否
