# 公開プロフィール共有機能 設計書

## 概要

プロフィール所有者がマイページから「自分の名刺」を共有できる機能を実装する。
同人イベント会場での対面交換を主なユースケースとし、QRコード表示をメイン手段とする。

## 共有手段

| 手段 | 優先度 | 説明 |
|------|--------|------|
| QRコード表示 | メイン | ボタンタップでフルスクリーンモーダルにQRを大きく表示 |
| URLコピー | 補助 | クリップボードにプロフィールURLをコピー |
| Web Share API | 補助 | スマホのネイティブ共有メニュー（対応ブラウザのみ） |

## 配置

マイページ (`/mypage`) のみ。公開プロフィールページには配置しない。

## UIレイアウト

### マイページの共有セクション

既存の「公開プロフィールを見る」リンクの上に配置する。

```
┌─────────────────────────────┐
│  アバター                      │
│  プロフィール編集フォーム         │
│  外部ログイン連携                │
│                               │
│  ── プロフィールを共有 ──        │
│  [📱 QRコードを表示する]        │  ← メインボタン（大・目立つ）
│  🔗 URLをコピー                │  ← テキストリンク風（控えめ）
│                               │
│  [公開プロフィールを見る]         │
│  [ログアウト]                   │
└─────────────────────────────┘
```

- QRコード表示ボタン: プライマリスタイル、大きめ
- URLコピー: テキストリンク風、控えめな表示
- Web Share API: QRモーダル内に小さな「共有」ボタンとして配置

### QRコードモーダル

- フルスクリーンオーバーレイ（半透明の暗い背景）
- 中央に白いカード
  - QRコード（SVG、大サイズ）
  - プロフィールURL表示
  - 「URLをコピー」ボタン
  - 「共有」ボタン（Web Share API対応時のみ表示）
- 閉じる方法: ×ボタン、オーバーレイクリック、Escキー

## コンポーネント構成

### 新規ファイル

| ファイル | 種別 | 役割 |
|---------|------|------|
| `src/app/mypage/share-section.tsx` | Client Component | 共有セクション全体（QRボタン、URLコピー、QRモーダル） |

### 依存パッケージ

- `qrcode.react` — SVGベースのQRコード生成（React用、軽量）

### Props

```typescript
interface ShareSectionProps {
  profileUrl: string; // 完全なURL（origin + path）
}
```

### 状態管理

```typescript
const [isQrModalOpen, setIsQrModalOpen] = useState(false);
const [isCopied, setIsCopied] = useState(false);
```

### 機能詳細

1. **QRコード表示ボタン**
   - タップで `isQrModalOpen = true`
   - モーダルを開く

2. **QRモーダル**
   - `qrcode.react` の `QRCodeSVG` でSVG描画
   - QRサイズ: 256px（モバイルで読み取りやすいサイズ）
   - URL表示テキスト（読み取り確認用）
   - 「URLをコピー」→ `navigator.clipboard.writeText()`
   - 「共有」→ `navigator.share({ url, title })` （非対応ブラウザでは非表示）
   - 閉じる: ×ボタン、オーバーレイクリック、Escキー

3. **URLコピーリンク（メインページ）**
   - `navigator.clipboard.writeText()` でコピー
   - コピー成功時「コピーしました!」を2秒間表示

### URL構築（Server Component側）

```typescript
// mypage/page.tsx
import { headers } from "next/headers";

const headersList = await headers();
const host = headersList.get("host") ?? "localhost:3000";
const protocol = host.includes("localhost") ? "http" : "https";
const origin = `${protocol}://${host}`;

const profileUrl = profile.slug
  ? `${origin}/p/@${profile.slug}`
  : `${origin}/p/${profile.profile_id}`;
```

## 実装ステップ

1. `qrcode.react` パッケージをインストール
2. `share-section.tsx` Client Component を作成
3. `mypage/page.tsx` を更新（URL構築 + ShareSection配置）
4. Biome lint チェック
5. 動作確認

## スコープ外

- 公開プロフィールページへの共有ボタン配置
- QRコードのカスタマイズ（色、ロゴ埋め込み等）
- OGPメタタグ（別タスクで対応）
- QRコード画像のダウンロード機能
