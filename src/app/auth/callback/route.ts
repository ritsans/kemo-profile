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

  // クエリパラメータから code と error を取得する処理
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const errorDescription = searchParams.get("error_description");

  // もしOAuth プロバイダーからのエラーがあればログイン画面へ戻る (ユーザーがキャンセルした場合など)
  if (error) {
    console.error("OAuth provider error:", error, errorDescription);
    const params = new URLSearchParams({
      error: error === "access_denied" ? "access_denied" : "auth",
      ...(errorDescription && { error_description: errorDescription }),
    });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (!code) {
    // codeがない場合リダイレクトしてエラーとして扱う
    return NextResponse.redirect(`${origin}/login?error=code_missing`);
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

  // codeの中身:
  // codeはOAuth 2.0の「認可コード」(Authorization Code)
  // 具体的には、「/auth/callback?code=abc123xyz789...」
  // これはGoogleなどのProviderが発行した一時的な引換券のようなものです。
  // codeは「Googleがこのユーザーを認証した」という証明書であり、それ自体ではログインできず、
  // サーバー側で検証・交換して初めてセッションが確立されます。

  try {
    // code → session 交換してセッションをログイン状態にする
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("Failed to exchange code for session:", exchangeError);
      throw new Error("exchange_failed");
    }

    // ユーザー情報取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      throw new Error("user_not_found");
    }

    // 初回ログイン検出: profiles テーブルをチェック
    // profiles テーブルに owner_user_id が存在しなければ初回ログインとして確定
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
      // 初回ログイン → プロフィールID自動作成
      profileId = generateProfileId();

      // OAuth プロバイダー別のメタデータ取得
      const provider = user.app_metadata.provider;
      const metadata = user.user_metadata;

      // Email ログインユーザーはOAuthメタデータがないため、メールアドレスから名前を生成
      let displayName: string;
      let avatarUrl: string | null = null;
      let xUsername: string | null = null;

      if (provider === "email" || !provider) {
        // Magic Link ユーザー
        displayName = user.email?.split("@")[0] || "名無しのけもの";
      } else {
        // OAuth ユーザー
        displayName = metadata.full_name || metadata.name || "名無しのけもの";
        avatarUrl = metadata.avatar_url || metadata.picture || null;
        xUsername = provider === "twitter" ? metadata.user_name || null : null;
      }

      // profiles テーブルにユーザー新規登録レコード挿入
      const { error: insertError } = await supabase.from("profiles").insert({
        profile_id: profileId,
        owner_user_id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        x_username: xUsername,
      });

      if (insertError) {
        console.error("Failed to create profile:", insertError);
        throw new Error("profile_creation_failed");
      }
    }

    // マイページへリダイレクト
    const redirectUrl = `${origin}/mypage`;
    const response = NextResponse.redirect(redirectUrl);

    // cookie転写: request.cookies に保持された cookie を response に適用
    for (const cookie of request.cookies.getAll()) {
      response.cookies.set(cookie);
    }

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);

    // エラーメッセージの抽出
    let errorCode = "auth";
    let errorDescription: string | undefined;

    if (error instanceof Error) {
      // カスタムエラーメッセージ
      if (
        error.message === "exchange_failed" ||
        error.message === "user_not_found" ||
        error.message === "profile_creation_failed"
      ) {
        errorCode = error.message;
      } else {
        errorDescription = error.message;
      }
    }

    const params = new URLSearchParams({
      error: errorCode,
      ...(errorDescription && { error_description: errorDescription }),
    });

    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }
}
