import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { hardenCookieOptions } from "@/lib/supabase/cookies";

/**
 * Middleware (名前はproxyだが実態はMiddleware)
 * Supabase認証セッション管理用のProxy
 * すべてのリクエストでセッション状態を更新し常にセッションが最新に保たれる仕組み
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({
              name,
              value,
              ...hardenCookieOptions(options),
            });
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(
              name,
              value,
              hardenCookieOptions(options),
            );
          }
        },
      },
    },
  );

  // セッション状態を更新（重要: これにより認証状態が更新される）
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (faviconファイル)
     * - public配下のファイル (拡張子付きファイル)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
