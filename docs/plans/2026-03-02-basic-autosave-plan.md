# BASIC即時保存化の実装計画（デバウンス+blur、保存ボタン廃止）

## Summary
`display_name` / `bio` を「保存ボタン確定」から「即時保存」に変更する。  
保存トリガーは `600ms` デバウンス + `blur` 時即送信。  
UI上の `保存する` ボタンは削除し、BASICもSNSと同じ即時保存体験に統一する。  
競合防止のため、BASIC保存は「単一実行 + 最新値のみ後追い送信（coalescing）」で順序保証する。

## 変更対象
- `src/app/mypage/edit-form.tsx`
- `src/app/mypage/profile-edit-fields.tsx`
- `src/app/actions/profile.ts`
- `src/lib/types/action.ts`（必要なら新規Result型追加）
- `docs/spec.md` / `docs/todo.md`（運用ルール明記）

## 実装詳細

### 1. Server Actionを即時保存向けに追加
`src/app/actions/profile.ts` に、Form送信依存の `updateProfile` とは別で、直接呼び出し向けActionを追加。

- 追加例: `saveBasicProfile(input: { displayName: string; bio: string }): Promise<BasicSaveResult>`
- サーバー側で実施:
  - `display_name` バリデーション（必須、<=50）
  - `bio` バリデーション（<=160、空は `null`）
  - 認証チェック
  - 差分なしなら更新スキップ
  - `profiles` 更新
  - `revalidatePath("/mypage")` / `revalidatePath("/p", "layout")`
- 戻り値:
  - `success: true`（必要なら正規化後値も返す）
  - `success: false` で `fieldErrors.display_name` / `fieldErrors.bio` を返す

### 2. `edit-form.tsx` をフォーム送信型から自動保存型へ変更
現状の `useActionState(updateProfile)` と `<form action={formAction}>` を廃止し、`saveBasicProfile` を直接呼ぶ構成に変更。

- 追加状態:
  - `basicErrors`（表示名/自己紹介ごとのエラー）
  - `isSavingBasic`
  - `lastSavedDisplayName` / `lastSavedBio`
- 保存オーケストレーション:
  - 入力変更時に `setTimeout(600ms)` で保存予約
  - `blur` 発生時はタイマーをフラッシュして即保存
  - 保存実行中に新変更が来たら「pending snapshot」を保持し、完了後に1回だけ再送
  - これによりリクエスト順序逆転で古い値が最終保存される事故を防止
- 成功時:
  - `lastSaved*` 更新
  - エラークリア
- 失敗時:
  - `basicErrors` 更新
  - ローカル入力値は保持（再入力可能）

### 3. `profile-edit-fields.tsx` のUI変更
- `formAction` / hidden `original_*` / `type="submit"` ボタンを削除
- `Input` / `Textarea` に以下を追加
  - `onBlur` で親から渡された `onBasicBlur(field)` を呼ぶ
- `fieldErrors` は引き続き受け取り表示
- セクション内の文言を明確化（例: 「BASICは自動保存されます」）

### 4. 離脱保護ロジックの調整
現状 `isDirty` は手動保存前提のため再定義。

- 新しい判定:
  - `currentDisplayName.trim() !== lastSavedDisplayName`
  - `currentBio.trim() !== lastSavedBio`
  - または `isSavingBasic === true`
- `beforeunload` は上記が真の時のみ有効化

### 5. 既存 `updateProfile` の扱い
- 互換のため残す（他導線があれば維持）
- `mypage/edit-form.tsx` からの利用のみ停止
- コメントを「BASIC即時保存導線では未使用」に更新

## Public APIs / Types 変更
- 新規Server Action:
  - `saveBasicProfile(input: { displayName: string; bio: string })`
- 新規型（必要時）:
  - `BasicSaveResult = { success: true } | { success: false; fieldErrors: Partial<Record<"display_name" | "bio", string>> }`
- `ProfileEditFieldsProps` 変更:
  - 削除: `formAction`, `originalDisplayName`, `originalBio`, `isPending`（BASIC由来）
  - 追加: `onBasicBlur`, `isSavingBasic`, `fieldErrors`

## テスト計画

### Server Actionテスト
- `display_name` 空文字でエラー
- `display_name` 51文字でエラー
- `bio` 161文字でエラー
- 正常系でDB更新 + revalidate呼び出し
- 差分なしでDB更新スキップ

### UI/状態遷移テスト（可能な範囲）
- 入力後600msで1回保存が走る
- 連続入力時に保存呼び出しがデバウンスされる
- `blur` で即保存される
- 保存中に再入力しても最終値が保存される（coalescing）
- エラー時に該当フィールド下へ表示される
- 未保存/保存中のみ離脱警告が出る

## 受け入れ基準
- BASICの保存ボタンが存在しない
- BASIC変更はデバウンスまたはblurで自動保存される
- SNS Linkと同じく「操作→即DB反映」になる
- 公開ページ `/p/{profile_id}` と `/p/@{slug}` で更新が反映される
- 競合入力時でも最終入力値がDBに残る

## Assumptions
- 保存方式は `600msデバウンス + blur即保存` を採用
- BASICの `保存する` ボタンは削除
- 即時保存導線は `/mypage` のBASICセクション限定（Slug/SNSは既存個別導線を維持）
