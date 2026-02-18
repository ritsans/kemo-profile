import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 認可コード交換とユーザー取得を担当するモジュール。
 * callback固有の失敗を既存エラーコード（exchange_failed / user_not_found）へ正規化する。
 */
export async function establishSessionFromCodeOrThrow(
  supabase: SupabaseClient<Database>,
  code: string,
) {
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Failed to exchange code for session:", exchangeError);
    throw new Error("exchange_failed");
  }
}

export async function fetchUserOrThrow(
  supabase: SupabaseClient<Database>,
): Promise<User> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Failed to get user:", userError);
    throw new Error("user_not_found");
  }

  return user;
}
