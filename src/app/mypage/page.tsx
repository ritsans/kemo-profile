import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { getOAuthErrorMessage } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/server";
import { generateSuggestedSlug } from "@/lib/utils/slug";
import { ProfileEditForm } from "./edit-form";
import { LinkedProvidersCard } from "./linked-providers-card";
import { ShareSection } from "./share-section";

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
      "profile_id, display_name, avatar_url, bio, x_username, slug, onboarding_completed",
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">
          マイページ
        </h1>

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
            xUsername={profile.x_username}
            slug={suggestedSlug}
            avatarUrl={profile.avatar_url}
            previewPath={profilePath}
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <ShareSection profileUrl={profileUrl} />
          </div>
          <LinkedProvidersCard identities={user.identities} />
        </div>

        {/* ログアウトボタン */}
        <form action={logout} className="flex justify-end">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
