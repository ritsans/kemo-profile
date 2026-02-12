import Image from "next/image";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { getOAuthErrorMessage } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/server";
import { generateSuggestedSlug } from "@/lib/utils/slug";
import { LinkedProvidersCard } from "./linked-providers-card";
import { ProfileEditForm } from "./profile-edit-form";

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

  // profileテーブルから自分のプロフィールを取得
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "profile_id, display_name, avatar_url, bio, slug, onboarding_completed",
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

  // slug の初期値候補を生成（既存の slug がない場合）
  const suggestedSlug = profile.slug || generateSuggestedSlug(user);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          マイページ
        </h1>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow">
          {/* アバター表示 */}
          <div className="mb-6 flex justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={96}
                height={96}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500">
                {profile.display_name[0]}
              </div>
            )}
          </div>

          {/* プロフィール編集フォーム */}
          <ProfileEditForm
            displayName={profile.display_name}
            bio={profile.bio}
            slug={suggestedSlug}
          />

          {/* 外部ログイン連携 */}
          <div className="mb-6">
            <LinkedProvidersCard identities={user.identities} />
          </div>

          {/* プロフィールページへのリンク */}
          <div className="mb-6">
            <a
              href={profilePath}
              className="block rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
            >
              公開プロフィールを見る
            </a>
          </div>

          {/* ログアウトボタン */}
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
