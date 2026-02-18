import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env.server";
import {
  hardenCookieOptions,
  type SupabaseCookieOptions,
} from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";
import type { PendingCookie } from "./types";

/**
 * Auth callback専用のSupabaseクライアントを生成する。
 * Route Handlerで更新されたCookieを一時配列に集約し、最後にレスポンスへ反映できる形で返す。
 */
export function createCallbackSupabaseClient(
  request: NextRequest,
  pendingCookies: PendingCookie[],
) {
  return createServerClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            const hardenedOptions: SupabaseCookieOptions =
              hardenCookieOptions(options);

            pendingCookies.push({
              name,
              value,
              options: hardenedOptions,
            });

            request.cookies.set({ name, value, ...hardenedOptions });
          }
        },
      },
    },
  );
}
