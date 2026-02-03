import Image from "next/image";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { updateDisplayName } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";

/**
 * マイページ
 * 認証済みユーザーのプロフィール管理画面
 */
export default async function MyPage() {
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
    .select("profile_id, display_name, avatar_url")
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
