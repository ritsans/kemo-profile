import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MypageHeader } from "@/components/profile/mypage-header";
import { getOAuthErrorMessage } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/server";
import { generateSuggestedSlug } from "@/lib/utils/slug";
import { ProfileEditForm } from "./edit-form";
import { LinkedProvidersCard } from "./linked-providers-card";
import { ShareSection } from "./share-section";
import { SlugCard } from "./slug-card";

interface MyPageProps {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}

/**
 * マイページ
 * 認証済みユーザーのプロフィール管理画面
 */
export default async function MyPage({ searchParams }: MyPageProps) {
  const { error, error_description } = await searchParams;
  const errorMessage = getOAuthErrorMessage(error, error_description);
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // profileテーブルから自分のプロフィールを取得（user.id に依存するため直列実行）
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "profile_id, display_name, avatar_url, bio, social_links, social_links_order, slug, onboarding_completed",
    )
    .eq("owner_user_id", user.id)
    .single();

  if (!profile) {
    // プロフィールが見つからない場合(エッジケース)は /login へ
    redirect("/login");
  }

  // オンボーディング未完了 → オンボーディングへリダイレクト
  if (!profile.onboarding_completed) {
    redirect("/first-step");
  }

  const profilePath = profile.slug
    ? `/p/${profile.slug}`
    : `/p/${profile.profile_id}`;

  // origin を構築してプロフィールの絶対URLを生成
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const profileUrl = profile.slug
    ? `${origin}/p/@${profile.slug}`
    : `${origin}/p/${profile.profile_id}`;

  // slug の初期値候補を生成（既存の slug がない場合）
  const suggestedSlug = profile.slug || generateSuggestedSlug(user);

  // X OAuth 連携済みの場合は X 欄を編集不可にする
  const lockedSocialKeys = user.identities?.some(
    (i) => i.provider === "twitter",
  )
    ? ["x"]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <MypageHeader publicPath={profilePath} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {/* プレビュー + 編集（PC 2ペイン / mobile 1画面切り替え） */}
        <div className="mb-6">
          <ProfileEditForm
            displayName={profile.display_name}
            bio={profile.bio}
            socialLinks={(profile.social_links ?? {}) as Record<string, string>}
            socialLinksOrder={profile.social_links_order ?? null}
            avatarUrl={profile.avatar_url}
            lockedSocialKeys={lockedSocialKeys}
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <ShareSection profileUrl={profileUrl} />
          </div>
          <LinkedProvidersCard identities={user.identities} />
        </div>

        <div className="mb-6">
          <SlugCard slug={suggestedSlug} />
        </div>
      </div>
    </div>
  );
}
