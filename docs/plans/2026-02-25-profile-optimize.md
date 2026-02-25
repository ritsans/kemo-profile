### 共通プロフィールカードUI化プラン（プレビューと公開ページの見た目同期）

  #### Summary

  /mypage のプレビューと /p/[profile_id] の公開ページで重複しているカード描画を src/components 配下の共通UIに統合する。
  データ取得・ページ固有導線は各ページに残し、カード本体の見た目と描画分岐だけを共通化する。
  公開ページの空状態は最小表示、プレビューではガイド文言を表示する（今回決定）。

  #### Scope

  - In scope:
      - 共通カード表示コンポーネント新規作成
      - ProfilePreviewCard を薄いラッパー化
      - 公開ページのカード描画を共通UIへ置換
      - 共通UIの単体テスト追加（Vitest）
  - Out of scope:
      - データ取得ロジック変更（Supabase query/RPC）
      - ルーティング仕様変更
      - アニメーション強化・見た目の大幅刷新

  ———

  ### 1) 追加・変更ファイル

  1. 新規: src/components/profile/profile-card-view.tsx
  2. 新規: src/components/profile/types.ts（必要なら。型を分離しない場合は不要）
  3. 変更: src/app/mypage/profile-preview-card.tsx
  4. 変更: src/app/p/[profile_id]/page.tsx
  5. 新規: src/components/profile/profile-card-view.test.tsx

  補足:

  - 現在 src/app/mypage/edit-form.tsx に既存差分があるため、今回の実装では最小変更（既存import維持）に留める。
  - src/components/profile/ が未存在のため新規ディレクトリ作成。

  ———

  ### 2) 共通UIのインターフェース設計（決定済み）

  ProfileCardView の props を以下で固定:

  type ProfileCardViewProps = {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    socialLinks: Record<string, string>;

    // 表示ポリシー（ページ差分）
    showBioPlaceholder?: boolean;      // default: false
    bioPlaceholderText?: string;       // default: "自己紹介を入力するとここに表示されます"
    showSocialEmptyState?: boolean;    // default: false
    socialEmptyStateText?: string;     // default: "SNSリンクは未設定です"

    // 見た目調整フック
    className?: string;                // outer card class merge
    avatarSize?: 120 | 96 | 72;        // default: 120
  };

  設計意図:

  - 「見た目共通 + 差分は最小のフラグ」で管理。
  - 公開ページの空状態最小表示を props で実現。
  - 将来のカードUI作り込み時に調整点を共通UIへ集約。

  ———

  ### 3) 実装詳細

  1. ProfileCardView に以下を移設:

  - アバター表示（next/image、fallbackの丸アイコン）
  - 表示名
  - bio表示
  - SNS一覧 (SOCIAL_PLATFORMS.map) と URL生成ロジック
  - SNS空状態表示（フラグ制御）

  2. ProfilePreviewCard の責務を縮小:

  - 見出し「プロフィールプレビュー」
  - 「公開ページで確認」リンク
  - 下段本体として ProfileCardView をレンダリング
  - プレビュー専用の値:
      - showBioPlaceholder: true
      - showSocialEmptyState: true

  3. src/app/p/[profile_id]/page.tsx のカード本体を置換:

  - 既存のSupabase取得ロジックは維持
  - カード内部JSXを ProfileCardView に差し替え
  - 公開ページは以下で固定:
      - showBioPlaceholder: false
      - showSocialEmptyState: false
  - ページ下部の profile.slug || ID 表示はそのまま維持

  4. className方針:

  - カード外枠（rounded, bg, shadow, p-*）は ProfileCardView に統一
  - ページ側で必要なら className で追加調整
  - 既存の配色・タイポは初回移行では変更しない

  ———

  ### 4) テスト計画（今回決定: 共通UI単体のみ）

  profile-card-view.test.tsx で最低限以下を検証:

  1. socialLinks あり:

  - SNSラベル/リンクが出る
  - profileUrl 生成できる項目が <a> になる

  2. socialLinks なし:

  - showSocialEmptyState=true なら空文言表示
  - showSocialEmptyState=false なら空文言非表示

  3. bio なし:

  - showBioPlaceholder=true なら文言表示
  - showBioPlaceholder=false なら何も表示しない

  4. avatarUrl なし:

  - fallback表示が出る

  - pnpm lint（書き換えはしないチェックのみ）

  ———

  ### 5) 受け入れ基準（Acceptance Criteria）

  1. /mypage プレビューと /p/[profile_id] のカード見た目が同一実装由来になる（重複描画ロジックが消える）。
  2. 公開ページでは空状態ガイド文言が出ない（最小表示）。
  3. プレビューでは未入力時ガイド文言が出る。
  4. 既存機能（プロフィール取得、表示、SNSリンク遷移、公開ページ導線）が回帰しない。
  5. 新規テストが通り、既存テストも失敗しない。

  ———

  ### 6) 重要なインターフェース/型変更

  - 追加される公開コンポーネント:
      - ProfileCardView（src/components/profile/profile-card-view.tsx）
  - 既存コンポーネントの責務変更:
      - ProfilePreviewCard: 表示ラッパー化（内部ロジック縮小）
  - サーバーアクション/API/DBスキーマ変更: なし

  ———

  ### 7) Assumptions / Defaults

  1. 既存差分 src/app/mypage/edit-form.tsx はユーザー作業中の変更として保持し、今回の共通UI化では競合最小で扱う。
  2. デザイン刷新ではなく、まず重複排除と同期性向上を優先する。
  3. 公開ページは「入力を促す文言」を出さない方針を継続する。
  4. テストは共通UIの表示分岐に限定し、ページ統合テストは今回追加しない。
