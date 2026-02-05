import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hardenCookieOptions } from "./cookies";
import type { Database } from "./database.types";

/**
 * サーバーサイドのSupabaseクライアントを作成
 * Server Components、Route Handlers、Server Actionsで使用する
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, hardenCookieOptions(options));
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
