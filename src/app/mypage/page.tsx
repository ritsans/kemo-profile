import Image from "next/image";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { updateBio, updateDisplayName } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { LinkedProvidersCard } from "./linked-providers-card";

/**
 * エラーメッセージを日本語化
 */
function getErrorMessage(
  error: string | undefined,
  description: string | undefined,
): string | null {
  if (!error) return null;

  if (description?.includes("already linked to another user")) {
    return "このアカウントは既に別のユーザーに連携されています";
  }
  if (error === "access_denied") {
    return "連携がキャンセルされました";
  }
  return "連携に失敗しました。もう一度お試しください";
}

interface MyPageProps {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}

/**
 * マイページ
 * 認証済みユーザーのプロフィール管理画面
 */
export default async function MyPage({ searchParams }: MyPageProps) {
  const { error, error_description } = await searchParams;
  const errorMessage = getErrorMessage(error, error_description);
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
    .select("profile_id, display_name, avatar_url, bio")
    .eq("owner_user_id", user.id)
    .single();

  if (!profile) {
    // プロフィールが見つからない場合(エッジケース)は /login へ
    redirect("/login");
  }

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

          {/* 表示名変更フォーム */}
          <form action={updateDisplayName} className="mb-6">
            <label
              htmlFor="display_name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              表示名
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="display_name"
                name="display_name"
                defaultValue={profile.display_name}
                required
                maxLength={50}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                保存
              </button>
            </div>
          </form>

          {/* 自己紹介変更フォーム */}
          <form action={updateBio} className="mb-6">
            <label
              htmlFor="bio"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              自己紹介
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={160}
              rows={3}
              placeholder="自己紹介を入力してください（160文字以内）"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {profile.bio?.length ?? 0} / 160
              </span>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                保存
              </button>
            </div>
          </form>

          {/* 外部ログイン連携 */}
          <div className="mb-6">
            <LinkedProvidersCard identities={user.identities} />
          </div>

          {/* プロフィールページへのリンク */}
          <div className="mb-6">
            <a
              href={`/p/${profile.profile_id}`}
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
