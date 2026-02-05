"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * プロバイダー定義
 */
const PROVIDERS = [
  { id: "google", label: "Google", supabaseProvider: "google" },
  { id: "twitter", label: "X (Twitter)", supabaseProvider: "twitter" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

/**
 * Supabase Auth の Identity 型（必要な部分のみ）
 */
interface UserIdentity {
  provider: string;
}

interface LinkedProvidersCardProps {
  identities: UserIdentity[] | undefined;
}

/**
 * Google アイコン
 */
function GoogleIcon() {
  return (
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
  );
}

/**
 * X (Twitter) アイコン
 */
function XIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}


/**
 * チェックマークアイコン
 */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * プロバイダーアイコンを取得
 */
function ProviderIcon({ provider }: { provider: ProviderId }) {
  switch (provider) {
    case "google":
      return <GoogleIcon />;
    case "twitter":
      return <XIcon />;
  }
}

/**
 * エラーメッセージを日本語化
 */
function getErrorMessage(errorMessage: string): string {
  if (errorMessage.includes("already exists")) {
    return "このアカウントは既に別のユーザーに連携されています";
  }
  if (errorMessage.includes("not enabled")) {
    return "このログイン方法は現在利用できません";
  }
  return "連携に失敗しました。もう一度お試しください";
}

/**
 * 外部ログイン連携カード
 * 連携済みのOAuthプロバイダーを表示し、未連携のプロバイダーへの連携を誘導する
 */
export function LinkedProvidersCard({ identities }: LinkedProvidersCardProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // プロバイダーが連携済みかチェック
  const isLinked = (provider: string): boolean => {
    return identities?.some((i) => i.provider === provider) ?? false;
  };

  // 連携処理
  const handleLink = async (provider: "google" | "twitter") => {
    setError(null);
    setIsLoading((prev) => ({ ...prev, [provider]: true }));

    const { origin } = window.location;
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=/mypage`,
      },
    });

    if (linkError) {
      setError(getErrorMessage(linkError.message));
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
    // 成功時はリダイレクトされるため、ローディング状態はリセット不要
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        外部ログイン連携
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
          >
            <div className="flex items-center gap-3">
              <ProviderIcon provider={provider.id} />
              <span className="font-medium text-gray-700">
                {provider.label}
              </span>
            </div>

            {isLinked(provider.supabaseProvider) ? (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckIcon />
                連携済み
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handleLink(provider.supabaseProvider as "google" | "twitter")
                }
                disabled={isLoading[provider.id]}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading[provider.id] ? "連携中..." : "連携する"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
