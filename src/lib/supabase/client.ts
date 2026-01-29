import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * クライアントサイドのSupabaseクライアントを作成
 * ブラウザ環境で使用する
 */
export function createClient() {
  return createBrowserClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
