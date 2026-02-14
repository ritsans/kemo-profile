# TODO: 認証・ユーザー登録 MVP

`docs/spec.md` に基づく、認証機能とマイページアクセスの実装タスク。

---

## 7. マイページアクセス

- [x] マイページルート (`/my`) の作成
  - 認証ガード: 未ログインの場合は `/login` へリダイレクト
  - ログイン済みの場合は自分の `/p/{profile_id}` へリダイレクト
- [ ] ヘッダー/ナビゲーションにマイページリンクを追加（認証状態に応じて表示切替）

## 8. オンボーディング

- [x] DBマイグレーション: `slug` カラム + `onboarding_completed` フラグ追加
- [x] `public_get_profile_by_slug` 関数作成
- [x] Server Actions: `updateSlug`, `completeOnboarding` 追加
- [x] Auth Callback: 初回ログイン → `/onboarding` リダイレクト
- [x] オンボーディングページ作成（4ステップウィザード）
  - Step 1: ユーザー名確認
  - Step 2: 自己紹介入力（スキップ可）
  - Step 3: カスタムURL設定（スキップ可）
  - Step 4: 完了画面（紙吹雪演出）
- [x] 完了演出: `canvas-confetti` による紙吹雪エフェクト（1.2秒）
- [x] MyPage: オンボーディング未完了ガード追加
- [x] 公開プロフィール: slug 解決（`/p/@slug` 対応）
- [x] MyPage 編集フォーム: slug 編集セクション追加

## 9. プロフィール共有機能

設計書: `docs/plans/2026-02-13-profile-share-design.md`

- [ ] `qrcode.react` パッケージをインストール
- [ ] `share-section.tsx` Client Component を作成
  - QRコード表示ボタン（メイン、大きいボタン）
  - URLコピーリンク（補助、控えめなテキストリンク）
  - QRモーダル（フルスクリーン、QRコード + URL表示 + URLコピー + Web Share API）
  - QRコード画像はQRCodeSVGで生成
- [ ] `mypage/page.tsx` を更新
  - プロフィールURL構築（origin + path）
  - ShareSection コンポーネントの配置（「公開プロフィールを見る」の上）
- [ ] Biome lint チェック通過
- [ ] 動作確認（QR表示、URLコピー、Web Share）

## 10. マイページ情報表示・編集インターフェース

設計書: `docs/plans/2026-02-14-mypage-edit-interface-design.md`

### 10.1 Server Action: `updateProfile`（一括保存）

- [ ] x_username 正規化ユーティリティ関数の作成（`lib/utils/x-username.ts`）
  - `@username` → `username`（@を削除）
  - `https://x.com/username` → `username`（URLから抽出）
  - `https://twitter.com/username` → `username`（URLから抽出）
  - 不正な入力にはエラーを返す
- [ ] `updateProfile` Server Action の作成（`app/actions/profile.ts`）
  - FormData から全項目を取得（display_name, bio, x_username, slug）
  - サーバー側で全項目をバリデーション
  - x_username の正規化処理を適用
  - 1回の Supabase update で全項目を更新
  - slug 変更時は `revalidatePath("/p/[profile_id]", "page")` でキャッシュリフレッシュ
  - エラーは項目ごとにまとめて返す

### 10.2 マイページ表示モードの実装

- [ ] `mypage/page.tsx` を更新
  - 公開プロフィールと同じビジュアルに変更（アバター120x120、表示名、bio、Xリンクボタン）
  - x_username を DB から取得するよう select を更新
  - ページ右上に「編集」ボタンを配置
  - OAuth連携カード・公開プロフィールリンク・ログアウトボタンはカード外に配置

### 10.3 マイページ編集モードの実装

- [ ] `mypage/profile-edit-form.tsx` を編集モード対応にリファクタリング
  - 表示モード ⇔ 編集モードの切り替え state 管理
  - 編集モード時のフォームレイアウト（縦並び）
    - アバター表示（編集不可）+「※アバター変更は今後対応予定」テキスト
    - display_name 入力（必須、最大50文字）
    - bio テキストエリア（任意、最大160文字、文字カウンター）
    - x_username 入力（任意、プレースホルダー：「username または https://x.com/username」）
    - slug 入力（任意、3〜20文字、説明テキスト付き）
  - 下部に「保存する」ボタン（青色）+「キャンセル」ボタン（グレー）
  - `useActionState` で `updateProfile` Server Action を呼び出し
  - 保存成功時：表示モードに切り替え + トースト通知（2秒間）
  - エラー時：該当フォーム直下に赤文字でエラーメッセージ表示

### 10.4 未保存変更の保護

- [ ] Dirty state tracking の実装
  - 初期値と現在値を比較して変更を検知
- [ ] キャンセルボタン押下時の保護
  - 変更がある場合：`window.confirm()` で確認ダイアログ表示
  - 変更がない場合：確認なしで表示モードに戻る
- [ ] ブラウザの戻る・ページ遷移時の保護
  - `beforeunload` イベントで dirty state がある場合にブラウザ標準ダイアログを表示

### 10.5 既存コードの修正

- [ ] `updateSlug` Server Action のキャッシュリフレッシュ修正
  - `revalidatePath("/p/[profile_id]", "page")` を追加

### 10.6 検証

- [ ] Biome lint チェック通過
- [ ] 動作確認
  - 表示モード：公開プロフィールと同じビジュアルで情報が表示される
  - 編集モード：全項目の編集・一括保存ができる
  - x_username：柔軟な入力形式が正規化される
  - 未保存変更の保護：キャンセル・ブラウザバック時に確認ダイアログが出る
  - slug 変更時：公開プロフィールのキャッシュがリフレッシュされる

---

## 完了条件

- [ ] ユーザーがGoogle/X OAuthでログインできる
- [ ] 初回ログイン時にプロフィールが自動作成される
- [ ] ログイン済みユーザーがマイページ (`/my`) から自分のプロフィールにアクセスできる
- [ ] 未ログインユーザーがマイページにアクセスすると `/login` にリダイレクトされる
