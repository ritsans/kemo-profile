import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * クライアントサイドのSupabaseクライアントを作成
 * ブラウザ環境で使用する
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
