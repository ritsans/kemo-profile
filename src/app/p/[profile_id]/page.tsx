import Image from "next/image";
import { notFound } from "next/navigation";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/server";

interface ProfileData {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: Record<string, string>;
  slug: string | null;
}

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

  // profile_id（15文字の base62）か slug かを形式で判別
  const isProfileId = /^[a-zA-Z0-9]{15}$/.test(profile_id);

  // slug の場合、URL の @ プレフィックスを除去（/p/@myslug → myslug）
  const slugValue = profile_id.startsWith("@")
    ? profile_id.slice(1)
    : profile_id;

  // Promise を先に開始（await を遅延させてウォーターフォールを回避）
  const profilePromise = isProfileId
    ? supabase
        .from("profiles")
        .select("profile_id, display_name, avatar_url, bio, social_links, slug")
        .eq("profile_id", profile_id)
        .single()
    : supabase.rpc("public_get_profile_by_slug", {
        p_slug: slugValue,
      });

  // ここで await（Promise はすでに開始している）
  const { data, error } = await profilePromise;

  if (error || !data) {
    notFound();
  }

  // RPC の場合は配列の最初の要素、direct query の場合はそのまま
  const profile: ProfileData = isProfileId
    ? (data as ProfileData)
    : (data as ProfileData[])[0];

  // slug 経由で空配列の場合も notFound
  if (!isProfileId && (!Array.isArray(data) || data.length === 0)) {
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

          {/* 自己紹介 */}
          {profile.bio && (
            <p className="mt-3 whitespace-pre-wrap text-center text-sm text-gray-600">
              {profile.bio}
            </p>
          )}

          {/* SNS リンクボタン */}
          {SOCIAL_PLATFORMS.some((p) => profile.social_links[p.key]) ? (
            <div className="mt-8 space-y-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const value = profile.social_links[platform.key];
                if (!value) return null;
                const url = platform.profileUrl?.(value) ?? null;
                const Icon = platform.icon;
                return (
                  <div key={platform.key}>
                    <p className="mb-2 text-center text-sm text-gray-500">
                      @{value}
                    </p>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-lg font-medium text-white transition ${platform.buttonClass ?? "bg-gray-700 hover:bg-gray-600"}`}
                      >
                        {Icon && <Icon className="h-6 w-6" />}
                        {platform.label} へ移動
                      </a>
                    ) : (
                      <p className="text-center text-base font-medium text-gray-700">
                        {value}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-gray-500">
              SNSリンクは未設定です
            </div>
          )}
        </div>

        {/* プロフィールURL表示 */}
        <div className="text-center text-xs text-gray-400">
          {profile.slug || `ID: ${profile.profile_id}`}
        </div>
      </div>
    </div>
  );
}
