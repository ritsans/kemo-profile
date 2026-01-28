import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { generateProfileId } from "@/lib/id";
import type { Database } from "@/lib/supabase/database.types";

/**
 * OAuth コールバック処理
 * code を session に交換し、初回ログインの場合はプロフィールを自動作成
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Route Handler用のSupabaseクライアント作成
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // cookie転写用の保持
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  try {
    // code → session 交換
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    // ユーザー情報取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error("User not found");

    // 初回ログイン検出: profiles テーブルをチェック
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("profile_id")
      .eq("owner_user_id", user.id)
      .single();

    let profileId: string;

    if (existingProfile) {
      // 既存ユーザー
      profileId = existingProfile.profile_id;
    } else {
      // 初回ログイン → プロフィール自動作成
      profileId = generateProfileId();

      // OAuth プロバイダー別のメタデータ取得
      const metadata = user.user_metadata;
      const displayName =
        metadata.full_name || metadata.name || "名無しのけもの";
      const avatarUrl = metadata.avatar_url || metadata.picture || null;
      const xUsername = null; // Google OAuth では x_username は null

      const { error: insertError } = await supabase.from("profiles").insert({
        profile_id: profileId,
        owner_user_id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        x_username: xUsername,
      });

      if (insertError) throw insertError;
    }

    // /p/{profile_id} へリダイレクト
    const redirectUrl = `${origin}/p/${profileId}`;
    const response = NextResponse.redirect(redirectUrl);

    // cookie転写: request.cookies に保持された cookie を response に適用
    for (const cookie of request.cookies.getAll()) {
      response.cookies.set(cookie);
    }

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
