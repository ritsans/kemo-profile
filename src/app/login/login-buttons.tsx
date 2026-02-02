"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { EmailLoginForm } from "./email-login-form";

/**
 * OAuth ログインボタン (Client Component)
 * Google と X (Twitter) の SSO ログインボタンを表示
 */
export function LoginButtons() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<{
    google: boolean;
    twitter: boolean;
  }>({ google: false, twitter: false });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading((prev) => ({ ...prev, google: true }));

      const { origin } = window.location;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (authError) {
        setError("Google ログインに失敗しました。もう一度お試しください。");
        console.error("Google OAuth error:", authError);
      }
    } catch (err) {
      setError("予期しないエラーが発生しました。");
      console.error("Google login error:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const handleXLogin = async () => {
    try {
      setError(null);
      setIsLoading((prev) => ({ ...prev, twitter: true }));

      const { origin } = window.location;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "x",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (authError) {
        setError("X (Twitter) ログインに失敗しました。もう一度お試しください。");
        console.error("X OAuth error:", authError);
      }
    } catch (err) {
      setError("予期しないエラーが発生しました。");
      console.error("Twitter login error:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, twitter: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* エラーメッセージ表示 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Google OAuth ボタン */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading.google || isLoading.twitter}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading.google ? "ログイン中..." : "Google でログイン"}
      </button>

      {/* X (Twitter) OAuth ボタン */}
      <button
        type="button"
        onClick={handleXLogin}
        disabled={isLoading.google || isLoading.twitter}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {isLoading.twitter ? "ログイン中..." : "X (Twitter) でログイン"}
      </button>

      {/* 区切り線 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">または</span>
        </div>
      </div>

      {/* Email Magic Link - 控えめな配置 */}
      <div className="pt-2">
        <p className="mb-3 text-center text-xs text-gray-500">
          メールアドレスでログイン
        </p>
        <EmailLoginForm />
      </div>
    </div>
  );
}
