import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileCardView } from "@/components/profile/profile-card-view";
import { PublicMenu } from "@/components/profile/public-menu";
import { createClient } from "@/lib/supabase/server";

interface ProfileData {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: Record<string, string>;
  social_links_order: string[] | null;
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
        .select(
          "profile_id, display_name, avatar_url, bio, social_links, social_links_order, slug",
        )
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

  // origin を構築してプロフィールの絶対URLを生成
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const profileUrl = profile.slug
    ? `${origin}/p/@${profile.slug}`
    : `${origin}/p/${profile.profile_id}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      {/* ハンバーガーメニュー（QR/コピー/共有） */}
      <PublicMenu profileUrl={profileUrl} />

      <div className="w-full max-w-md space-y-6">
        {/* プロフィールカード */}
        <ProfileCardView
          displayName={profile.display_name}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          socialLinks={profile.social_links}
          socialLinksOrder={profile.social_links_order ?? undefined}
          showBioPlaceholder={false}
          showSocialEmptyState={false}
        />

        {/* プロフィールURL表示 */}
        <div className="text-center text-xs text-gray-400">
          {profile.slug || `ID: ${profile.profile_id}`}
        </div>
      </div>
    </div>
  );
}
