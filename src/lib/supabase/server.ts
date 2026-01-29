import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * サーバーサイドのSupabaseクライアントを作成
 * Server Components、Route Handlers、Server Actionsで使用する
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // サーバーコンポーネントからのsetエラーは無視
            // middlewareで処理される
          }
        },
      },
    },
  );
}
