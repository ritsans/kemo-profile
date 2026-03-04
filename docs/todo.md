# TODO: Auth & User Registration MVP

Implementation tasks for authentication and My Page access based on `docs/spec.md`.

---

## Now（今すぐ）

### 13.3 プロフィールページのBASIC表示と編集状態切替
- [x] プロフィールページの BASIC 状態を閲覧モードとして実装
  - 現在のアバター・表示名・プロフィール文章を平文でそのまま表示
- [x] 「プロフィールを編集」ボタン押下で編集可能状態へ切替
  - 閲覧モードから編集用レイアウトへ切り替える
  - 入力しやすいフォーム構成（項目間余白・操作導線）に変更する
- [x] 編集状態で「キャンセル」「保存」ボタンを表示
  - キャンセルで閲覧モードに戻る（未保存変更時は確認導線を検討）
  - 保存で更新処理を実行し、成功後は閲覧モードへ戻す

### 13.5 マイページUI簡略化（autosave・↑↓並び替え）
- [x] name / bio を autosave（1秒debounce）に変更し、閲覧モード・保存ボタンを廃止
- [x] SNSリンク並び替えをdrag&drop（dnd-kit）から ↑↓ ボタンに変更
- [x] @dnd-kit/* パッケージを依存関係から削除

### 13.4 バッジリボン機能（最大3つ選択）
- [ ] 仕様追加: バッジリボン機能を `docs/spec.md` に反映
  - 用途: 自己属性タグ（例: `ARTIST`, `VTUBER`, `STREAMER`）
  - 制約: 定義済み候補から任意選択、最大3件まで
- [ ] バッジ候補定義を追加
  - 候補一覧を定数化（`ARTIST`, `VTUBER`, `STREAMER` ほか追加候補）
  - 表示ラベル/内部値の管理方針を統一
- [ ] プロフィール編集UIに選択機能を追加
  - BASIC セクション内（Bio の直下、SNS Links の手前）に配置する
  - 定義済み候補をチップで表示し、クリックで選択/解除する
  - 追加UIは使わず、チップ直接トグルで完結させる
  - 選択中件数を `n/3` 形式で表示する
  - 4件目選択時は無効化またはエラー表示
  - 3件選択済み時は未選択チップを disabled 表示にする
  - 選択値の表記ゆれを防ぐため、内部値は候補定義の enum 相当値のみ許可する
  - 保存時に `badge` を更新
- [ ] 表示UIにリボン描画を追加
  - 公開プロフィールカード下部に、選択済みバッジの文字入りリボンを表示
  - マイページの編集確認プレビューにも同様の表示を反映
  - マイページの BASIC 閲覧モードにも選択済みバッジを表示
- [ ] 検証
  - 最大3件制約が UI/Server/DB の全層で守られる
  - 未選択時はリボン非表示
  - 既存ユーザーでの後方互換（null/空配列）を確認

---

## Must（MVP必須）— 完了

### 7. My Page Access
- [x] Add My Page link to header/navigation (toggle based on auth state)
  - 公開プロフィールページはヘッダーなし（シンプルさ優先）
  - マイページには既存の MypageHeader が存在する

### Completion Criteria
- [x] Users can log in via Google/X OAuth
- [x] Profile is auto-created on first login
- [x] Logged-in users can access their profile from My Page (`/my`)
- [x] Unauthenticated users accessing My Page are redirected to `/login`

---

## Could（余裕があれば）

### 13.0 SNSリンク編集UIをLinktree風に改善
- [ ] SNS行をカード化してその場編集
  - 変更先: `src/app/mypage/profile-edit-fields.tsx`
  - 各行で `Input` を表示（または1タップ展開）し、入力・削除を行内で完結
- [ ] 追加導線を簡略化
  - 変更先: `src/app/mypage/add-social-link-modal.tsx`
  - 候補選択後に即1行追加し、編集画面上で入力
- [ ] 保存体験を即時反映化
  - 変更先: `src/app/mypage/edit-form.tsx`
  - 楽観更新 + デバウンス保存 + 行単位エラー表示
  - ロック済みSNSの削除ボタンは表示されない

### 13.2 オプション画面の新設（設定の整理）
- [ ] オプション画面を新設し、プロフィール編集と設定系機能を分離
- [ ] 「外部ログイン連携」をプロフィール編集画面からオプション画面へ移動
- [ ] 「カスタムURL」をプロフィール編集画面からオプション画面へ移動
- [ ] マイページからオプション画面への導線を追加

### 13.4 バッジリボン — オンボーディング対応
- [ ] オンボーディング（ステップ4）にバッジリボン選択を追加
  - 既存のステップ4のフォームに選択UIを追加する
  - スキップ可能（未選択のまま次のステップへ進める）

---

## 完了済み（参考）

### 13.1 公開プロフィールにハンバーガーメニュー追加
- [x] 公開プロフィール右上に固定配置のハンバーガーメニューを追加（`public-menu.tsx`）
- [x] DropdownMenu: QRコード表示・URLコピー・Web Share メニュー項目
- [x] QRコードを Dialog で表示（`qrcode.react`）
- [x] モバイル/PC共通で動作確認

### 9. Profile Share — 動作確認
- [x] Verify behavior (QR display, URL copy, Web Share)

### 10.6 My Page Edit — 動作確認
- [x] Display mode / Edit mode / x_username正規化 / 未保存変更保護 / 変更なし保存スキップ

### 12.6 SNSリンク追加フロー — 動作確認
- [x] 追加モーダル・未追加SNSフィルタ・重複防止・URL正規化・削除 の全動作確認

### 12.8 SNS即時保存と公開反映の整合
- [x] `social_links_order` の整合維持（追加/削除/更新）
- [x] 公開ページ (`/p/{id}`, `/p/@{slug}`) への即時反映確認
- [x] 運用ルールを仕様/実装コメントに明記

### 7. My Page Access
- [x] Create My Page route (`/my`)
  - Auth guard: redirect to `/login` if not logged in
  - Redirect to own `/p/{profile_id}` if logged in

### 9. Profile Share Feature
Design doc: `docs/plans/2026-02-13-profile-share-design.md`
- [x] Install `qrcode.react` package
- [x] Create `share-section.tsx` Client Component
- [x] Update `mypage/page.tsx`
- [x] Pass Biome lint check

### 10. My Page Info Display & Edit Interface
Design doc: `docs/plans/2026-02-14-mypage-edit-interface-design.md`
- [x] Create x_username normalization utility (`lib/utils/x-username.ts`)
- [x] Create `updateProfile` Server Action (`app/actions/profile.ts`)
- [x] Update `mypage/page.tsx` (display mode)
- [x] Refactor `mypage/profile-edit-form.tsx` to support edit mode
- [x] Divide `edit-form.tsx` responsibilities into sub-components
- [x] Create shared form input components (`src/components/ui/input.tsx`)
- [x] Implement dirty state tracking
- [x] Protect Cancel button press
- [x] Protect browser back / page navigation
- [x] ~~Fix cache refresh in `updateSlug` Server Action~~
- [x] Pass Biome lint check (10.6)

### 11. SNSリンク JSONB 移行
Design doc: `docs/plans/2026-02-23-social-links-jsonb-design.md`
- [x] `src/lib/social-platforms.ts` 作成
- [x] `profiles.social_links JSONB NOT NULL DEFAULT '{}'` カラム追加
- [x] `x_username` → `social_links.x` データ移行
- [x] RPC 戻り値を `social_links jsonb` に更新（2関数）
- [x] `database.types.ts` 更新
- [x] `action.ts` 更新
- [x] `profile.ts` Server Action 更新
- [x] `auth/callback/_lib/profile.ts` 更新
- [x] UI 各ファイル更新（edit-form / profile-edit-fields / profile-preview-card / page.tsx × 2）
- [x] `x_username` カラム DROP

### 12. SNSリンク追加（ステップ式フロー）
Design doc: `docs/plans/2026-02-24-social-link-step-add-flow-plan.md`
- [x] `instagram-username.ts` / `pixiv-user-id.ts` 正規化ユーティリティ作成
- [x] `social-platforms.ts` に Instagram / Pixiv 定義を追加
- [x] Server Actions 再設計（`addSocialLink` / `updateSocialLink` / `removeSocialLink`）
- [x] `add-social-link-modal.tsx` 作成
- [x] `profile-edit-fields.tsx` / `edit-form.tsx` 改修
- [x] Biome lint チェックを通過
- [x] `SlugCard` を独立カードへ分離

### 12.7 SNSリンク並び替え・マイページUI調整
- [x] `social_links_order` 対応を追加
- [x] `reorderSocialLinks` Server Action 追加
- [x] 編集画面で DnD 並び替えを実装
- [x] プレビュー/公開表示で並び順を反映
- [x] マイページヘッダーを追加しログアウト導線を整理

### 13.4 バッジリボン — DBスキーマ
- [x] `badge` カラム追加（`text[]`、最大3件 CHECK 制約、デフォルト空配列）
- [x] Supabase 型定義 (`database.types.ts`) を更新
