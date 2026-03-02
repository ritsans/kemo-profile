"use client";

// アカウント連携するプロバイダーを表示し、連携処理を行うコンポーネント

import { useMemo, useState } from "react";
import { XIcon } from "@/components/icons/x-icon";
import { Button } from "@/components/ui/button";
import { getLinkIdentityErrorMessage } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/client";

/** プロバイダー定義 */
const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "twitter", label: "X (Twitter)" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

interface LinkedProvidersCardProps {
  identities: { provider: string }[] | undefined;
}

/** Google アイコン */
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

/** チェックマークアイコン */
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

/** プロバイダーアイコンを返す */
function ProviderIcon({ provider }: { provider: ProviderId }) {
  switch (provider) {
    case "google":
      return <GoogleIcon />;
    case "twitter":
      return <XIcon className="h-5 w-5" />;
  }
}

/**
 * 外部ログイン連携カード
 * 連携済みのOAuthプロバイダーを表示し、未連携のプロバイダーへの連携を誘導する
 */
export function LinkedProvidersCard({ identities }: LinkedProvidersCardProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  /** プロバイダーが連携済みかチェック */
  function isLinked(providerId: string): boolean {
    return identities?.some((i) => i.provider === providerId) ?? false;
  }

  /** 連携処理 */
  async function handleLink(providerId: ProviderId): Promise<void> {
    setError(null);
    setIsLoading((prev) => ({ ...prev, [providerId]: true }));

    const { origin } = window.location;
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: providerId,
      options: {
        redirectTo: `${origin}/auth/callback?next=/mypage`,
      },
    });

    if (linkError) {
      setError(getLinkIdentityErrorMessage(linkError));
      setIsLoading((prev) => ({ ...prev, [providerId]: false }));
    }
    // 成功時はリダイレクトされるため、ローディング状態はリセット不要
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
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
            <div className="flex min-w-0 items-center gap-3">
              <ProviderIcon provider={provider.id} />
              <span className="truncate font-medium text-gray-700">
                {provider.label}
              </span>
            </div>

            {isLinked(provider.id) ? (
              <span className="flex shrink-0 items-center gap-1 text-sm text-green-600">
                <CheckIcon />
                連携済み
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => handleLink(provider.id)}
                disabled={isLoading[provider.id]}
                className="shrink-0"
              >
                {isLoading[provider.id] ? "連携中..." : "連携する"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
