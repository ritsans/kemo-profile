import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

interface PageProps {
  params: Promise<{
    profile_id: string;
  }>;
}

/**
 * 公開プロフィールページ
 * 誰でも閲覧可能（ログイン不要）
 */
export default async function ProfilePage({ params }: PageProps) {
  const { profile_id } = await params;
  const supabase = await createClient();

  // プロフィール取得
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("profile_id", profile_id)
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* プロフィールカード */}
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {/* アバター */}
          <div className="flex justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={120}
                height={120}
                className="rounded-full object-cover"
                unoptimized={!profile.avatar_url.startsWith("http")}
              />
            ) : (
              <div className="flex h-30 w-30 items-center justify-center rounded-full bg-gray-200 text-4xl text-gray-400">
                👤
              </div>
            )}
          </div>

          {/* 表示名 */}
          <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
            {profile.display_name}
          </h1>

          {/* X (Twitter) リンクボタン */}
          {profile.x_username && (
            <div className="mt-8">
              <a
                href={`https://x.com/${profile.x_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 text-lg font-medium text-white transition hover:bg-gray-800 active:bg-gray-900"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter) で見る
              </a>
            </div>
          )}

          {/* x_usernameがnullの場合の表示 */}
          {!profile.x_username && (
            <div className="mt-8 text-center text-sm text-gray-500">
              SNSリンクは未設定です
            </div>
          )}
        </div>

        {/* プロフィールID表示（開発用） */}
        <div className="text-center text-xs text-gray-400">
          ID: {profile_id}
        </div>
      </div>
    </div>
  );
}
