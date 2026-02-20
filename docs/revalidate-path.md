# revalidatePath について

## revalidatePath とは

Next.js App Router が持つ**サーバーサイドキャッシュ（Full Route Cache）を手動で破棄**する関数。

Server Action や Route Handler の中で呼ぶことで、指定したパスのキャッシュを無効化し、次回アクセス時に最新データで再生成させる。

```ts
import { revalidatePath } from "next/cache";

revalidatePath("/mypage");
revalidatePath("/p/[profile_id]", "page"); // 動的セグメントは "page" を指定
```

---

## Full Route Cache が有効になる条件

Next.js はデフォルトで静的レンダリング（Static Rendering）を使う。しかし以下の Dynamic API を呼ぶと**そのルートは Dynamic Rendering に切り替わり、Full Route Cache の対象外**になる。

| Dynamic API | 代表的な使用箇所 |
|---|---|
| `cookies()` | `createClient()` (Supabase SSR) |
| `headers()` | ミドルウェア |
| `searchParams` | ページ props |

**Dynamic Rendering のルートへの `revalidatePath` は no-op**（何も起きない）。

---

## このプロジェクトでの扱い

### `/mypage`

認証必須ページ。`createClient()` → `cookies()` を呼ぶため Dynamic Rendering。
`revalidatePath("/mypage")` は理論上 no-op だが、**将来の変更に備えて残している**。

### `/p/[profile_id]`（公開プロフィール）

`createClient()` → `cookies()` を呼ぶため Dynamic Rendering。
リクエストのたびに必ず DB から最新データを取得するため、`revalidatePath` は**不要**。
→ **このプロジェクトでは呼ばない**（削除済み）。

```ts
// ❌ 不要（Dynamic Rendering のため no-op）
revalidatePath("/p/[profile_id]", "page");

// ✅ 現在の実装
revalidatePath("/mypage"); // 将来の Static 化に備えて残す
```

---

## 将来 `/p/[profile_id]` を Static Rendering にする場合

公開プロフィールのパフォーマンスを上げるために `cookies()` を使わない anon アクセスに切り替えると、Full Route Cache が有効になる。その場合は `revalidatePath("/p/[profile_id]", "page")` を復活させる必要がある。

```ts
// Static Rendering 化したときに追加する
revalidatePath("/p/[profile_id]", "page");
```

---

## 参考

- [Next.js 公式: revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 公式: Full Route Cache](https://nextjs.org/docs/app/building-your-application/caching#full-route-cache)
