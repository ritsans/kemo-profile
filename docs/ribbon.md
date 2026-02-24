# アワードリボン（Award Ribbon）UIコンポーネント 設計書・仕様書

## 1. 概要

### 1.1. 目的
本コンポーネントは、リアルなイベントでネームタグの下に連結される「アワードリボン（ロゼットリボン）」をウェブ上で再現するUI要素である。
ユーザーの属性、役割（Artist, DJ, Sponsorなど）、実績、チケット種別などを視覚的に分かりやすく表示し、プロフィール画面やユーザーアイコン周辺でのステータス表現、およびコミュニケーションの活性化を目的とする。

### 1.2. 特徴
- **リアルな質感**: 左右のギザギザカットと箔押し風のテキストで、物理的な布リボンの質感を表現。
- **スタック（連結）機能**: 複数のリボンを縦に重ねて表示できる。
- **高いカスタマイズ性**: CSS変数を利用し、背景色やテキスト色を容易に変更可能。

---

## 2. UIデザイン仕様

### 2.1. 形状・サイズ
- **基本サイズ**: 幅 `280px` × 高さ `50px`（※親コンテナに応じてレスポンシブ調整可能とする）
- **エッジ（端）**: 左右の端は、ピンキング鋏でカットしたようなジグザグ形状とする。

### 2.2. スタック（重なり）表現
- 複数のリボンを配置した場合、上部にあるリボンが手前（上層）にくるように重ねる。
- 各リボンは上方向へわずかに（`-2px`程度）ネガティブマージンを取り、物理的に連結しているように見せる。
- 各リボンにドロップシャドウを適用し、重なりの立体感を強調する。

### 2.3. タイポグラフィと装飾（箔押し表現）
- **フォント**: 視認性の高い太字のサンセリフ体（`Arial Black` 等）を使用。
- **文字間隔（Letter Spacing）**: `2px` を設定し、重厚感を持たせる。
- **箔押し効果**:
  - 文字色に線形グラデーション（`linear-gradient`）を適用し、ゴールドやシルバーの金属光沢を再現。
  - テキスト自体に微小なドロップシャドウを落とし、布地にプレスされたような立体感を出す。

---

## 3. 技術仕様

### 3.1. 実装方針
- HTMLタグと純粋なCSSのみで構築し、画像ファイル（SVG含む）は使用しない。
- ギザギザの形状はCSSの `clip-path: polygon()` を用いて描画する。
- 配色の変更は CSS Custom Properties（CSS変数）で行う。

### 3.2. クラス設計
- `.ribbon-stack`: リボンの束を内包する親コンテナ。Flexboxで縦並びを制御する。
- `.ribbon`: リボン本体のベースクラス。形状、影、ベースのレイアウトを定義。
- `.ribbon-text`: テキスト要素。タイポグラフィと箔押し風の装飾を定義。
- `.ribbon.{color-name}`: 色のバリエーションを定義する修飾子クラス（例: `.green`, `.yellow`）。

### 3.3. 重なり（z-index）の制御
- CSSの `nth-child` 疑似クラスを用いて、先頭の要素ほど `z-index` が高くなるように設定する。
- （※動的に数が変動する場合は、JavaScript側でインラインスタイルとして `z-index` を付与する、もしくはCSSの設計を見直す必要がある）

### 3.4. 影の描画に関する注意点
- `clip-path` で切り抜かれた要素に対して `box-shadow` は適用されない（切り抜かれる前の矩形に影がつく）ため、影の表現には必ず `filter: drop-shadow()` を使用すること。

---

## 4. 実装コード（リファレンス）

### 4.1. HTML構造

```html
<div class="ribbon-stack">
  <div class="ribbon green">
    <div class="ribbon-text">MEMBER</div>
  </div>
  <div class="ribbon yellow">
    <div class="ribbon-text">SPONSOR</div>
  </div>
  <div class="ribbon black">
    <div class="ribbon-text">SUPER SPONSOR</div>
  </div>
</div>
```

### 4.2. CSS

```css
:root {
  /* 箔押しカラー定義 */
  --gold-text: linear-gradient(to bottom, #f9e17d 0%, #d4af37 50%, #b8860b 100%);
  --silver-text: linear-gradient(to bottom, #f5f5f5 0%, #a9a9a9 50%, #808080 100%);
}

/* 親コンテナ */
.ribbon-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* リボン本体 */
.ribbon {
  --ribbon-color: #cccccc; /* フォールバックカラー */
  position: relative;
  width: 280px;
  height: 50px;
  background-color: var(--ribbon-color);
  margin-top: -2px; /* 連結のためのネガティブマージン */
  display: flex;
  justify-content: center;
  align-items: center;

  /* 立体感のための影 */
  filter: drop-shadow(0 3px 2px rgba(0,0,0,0.15));

  /* 左右のギザギザ形状 */
  clip-path: polygon(
    0% 0%, 2% 5%, 0% 10%, 2% 15%, 0% 20%, 2% 25%, 0% 30%, 2% 35%, 0% 40%, 2% 45%,
    0% 50%, 2% 55%, 0% 60%, 2% 65%, 0% 70%, 2% 75%, 0% 80%, 2% 85%, 0% 90%, 2% 95%, 0% 100%,
    100% 100%, 98% 95%, 100% 90%, 98% 85%, 100% 80%, 98% 75%, 100% 70%, 98% 65%, 100% 60%, 98% 55%,
    100% 50%, 98% 45%, 100% 40%, 98% 35%, 100% 30%, 98% 25%, 100% 20%, 98% 15%, 100% 10%, 98% 5%, 100% 0%
  );
}

/* z-indexの制御（最大10個程度を想定） */
.ribbon:nth-child(1) { z-index: 10; margin-top: 0; }
.ribbon:nth-child(2) { z-index: 9; }
.ribbon:nth-child(3) { z-index: 8; }
.ribbon:nth-child(4) { z-index: 7; }
.ribbon:nth-child(5) { z-index: 6; }
/* 必要に応じて追加 */

/* テキスト（箔押し） */
.ribbon-text {
  font-family: "Arial Black", sans-serif;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 2px;

  /* ゴールドテキスト設定 */
  background: var(--gold-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* fallback */

  filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));
}

/* --- カラーバリエーション --- */
.ribbon.green  { --ribbon-color: #92c04e; }
.ribbon.yellow { --ribbon-color: #eebb22; }
.ribbon.black  { --ribbon-color: #222222; }
.ribbon.white  { --ribbon-color: #fdfdfd; }

/* 個別調整: 白背景時のテキスト影調整 */
.ribbon.white .ribbon-text {
  filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.4));
}

/* 個別調整: シルバースポンサー等 */
.ribbon.black .ribbon-text {
  background: var(--silver-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 5. 運用・拡張ガイド

### 5.1. 新しいリボン色の追加
新しい役割を追加する場合、CSSに新しいクラスを1行追加し、`--ribbon-color` を指定するだけで対応可能である。

```css
/* 例：STAFF用の青いリボンを追加 */
.ribbon.blue { --ribbon-color: #1e90ff; }
```

### 5.2. React / Vue 等のフレームワークでのコンポーネント化
フロントエンドフレームワークで実装する場合、`color` と `text` を Props として受け取るコンポーネントを作成することを推奨する。

**実装イメージ（React例）:**
```jsx
const AwardRibbon = ({ colorClass, text }) => (
  <div className={`ribbon ${colorClass}`}>
    <div className="ribbon-text">{text}</div>
  </div>
);

// 呼び出し側
<div className="ribbon-stack">
  <AwardRibbon colorClass="green" text="MEMBER" />
  <AwardRibbon colorClass="blue" text="STAFF" />
</div>
```

### 5.3. 動的に数が変わる場合の z-index 対応
サーバーから取得したデータに基づいてリボンをレンダリングする際、数が不確定な場合はCSSの `:nth-child` では対応しきれない場合がある。
その場合は、レンダリング時にインラインスタイルで動的に `z-index` を付与する（例：`style={{ zIndex: items.length - index }}`）アプローチを採用すること。
