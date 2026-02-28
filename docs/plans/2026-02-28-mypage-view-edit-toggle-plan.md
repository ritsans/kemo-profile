# 13.3 プロフィールページの BASIC 表示と編集状態切替

## Context

現在のマイページは常に編集モード（2ペイン: 編集フォーム + プレビュー）が表示される。
13.3 では「まず確認できる閲覧状態」と「必要時に入る編集状態」の切替を追加する。

この計画では、モックアップにあった過剰機能（絵文字ピッカー、ハンドル編集、テーマ変更、リボン編集など）は対象外とし、
**プロフィール確認と編集インターフェース**に集中する。色・ビジュアルテーマ設計も対象外。

## スコープ

### 対象

- BASIC 閲覧モード（avatar / display name / bio の確認）
- 「プロフィールを編集」押下で編集モードへ切替
- 編集状態の「キャンセル」「保存」導線
- 未保存変更時の破棄確認

### 非対象

- アバター編集機能の追加
- ユーザーネーム/slug の新規編集導線
- 配色やブランドトーンの再設計
- 13.4（バッジリボン）に関わる UI

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/mypage/edit-form.tsx` | `mode` ステート追加、閲覧/編集の分岐、切替ハンドラ追加 |
| `src/app/mypage/profile-edit-fields.tsx` | `onCancel` prop 追加、保存導線を `キャンセル + 保存` に変更 |
| `src/app/mypage/basic-profile-view.tsx` (新規) | BASIC 閲覧専用UI（avatar / display name / bio のみ） |

## 実装詳細

### 1. `edit-form.tsx` — 表示モード管理

```ts
const [mode, setMode] = useState<"view" | "edit">("view");
```

#### 閲覧→編集

```ts
function handleStartEditing() {
  setMode("edit");
  setMobilePane("edit");
}
```

#### 編集→閲覧（キャンセル）

```ts
function handleCancelEditing() {
  if (isDirty) {
    if (!window.confirm("未保存の変更があります。破棄してもよろしいですか？")) return;
    setCurrentDisplayName(savedDisplayName);
    setCurrentBio(savedBio);
  }
  setMode("view");
  setMobilePane("preview");
}
```

#### 保存成功時

既存の `state.success` 監視 `useEffect` 内で保存基準値更新後に閲覧モードへ戻す。

```ts
setMode("view");
setMobilePane("preview");
```

### 2. `basic-profile-view.tsx`（新規）

- 表示要素は avatar / display name / bio のみ
- SNSリンク、プレースホルダー文言、編集フォーム要素は含めない
- 下部に「プロフィールを編集」ボタンを配置（`onEdit` を受け取る）

### 3. `edit-form.tsx` — JSX 分岐

**閲覧モード (`mode === "view"`):**

- `BasicProfileView` を中央寄せで表示
- モバイルの編集/プレビュータブは非表示

**編集モード (`mode === "edit"`):**

- 現在の2ペイン構成を維持
- `ProfileEditFields` へ `onCancel={handleCancelEditing}` を渡す

### 4. `profile-edit-fields.tsx` — 操作導線の明確化

Props に `onCancel: () => void` を追加し、アクション行を以下に変更:

```tsx
<div className="flex gap-3 pt-2">
  <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="flex-1">
    キャンセル
  </Button>
  <Button type="submit" disabled={isPending} className="flex-1">
    {isPending ? "保存中..." : "保存する"}
  </Button>
</div>
```

## 設計メモ

- `isDirty` は既存どおり `displayName` / `bio` のみを対象にする
- SNSリンク操作は既存仕様どおり即時保存（キャンセル対象外）
- 追加するのは「表示状態の切替」と「編集導線の整理」に限定する

## 検証手順

1. `/mypage` 初期表示で BASIC 閲覧モード（avatar / display name / bio + 編集ボタン）が表示される
2. 「プロフィールを編集」押下で編集モード（既存2ペイン）へ切り替わる
3. 未編集で「キャンセル」すると確認なしで閲覧モードに戻る
4. Name/Bio を変更後「キャンセル」で確認ダイアログが表示され、OKで変更破棄される
5. Name/Bio を変更して「保存する」で保存成功後、閲覧モードに戻って更新値が表示される
6. 未保存変更ありでページ離脱（再読み込み/タブを閉じる等）時に警告が発生する
