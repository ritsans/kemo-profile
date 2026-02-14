import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSuggestedSlug } from "@/lib/utils/slug";

// 重いライブラリ（canvas-confetti, framer-motion）を含むため動的インポート
const OnboardingWizard = dynamic(
  () =>
    import("./onboarding-wizard").then((mod) => ({
      default: mod.OnboardingWizard,
    })),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    ),
  },
);

/**
 * オンボーディングページ（Server Component）
 * 初回ログイン後のプロフィール設定ガイド
 */
export default async function OnboardingPage() {
  // 開発用バイパス機能（環境変数で有効化）
  const bypassAuth = process.env.BYPASS_ONBOARDING_AUTH === "true";

  if (bypassAuth) {
    // バイパスモード: ダミーデータでレンダリング
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
        <div className="w-full max-w-lg">
          {/* 開発モード警告バナー */}
          <div className="mb-4 rounded-lg border-2 border-yellow-400 bg-yellow-100 px-4 py-3">
            <p className="text-sm font-bold text-yellow-800">
              開発モード（認証バイパス中）
            </p>
            <p className="text-xs text-yellow-700">
              BYPASS_ONBOARDING_AUTH=true が有効です
            </p>
          </div>

          <OnboardingWizard
            displayName="サンプルユーザー"
            bio="これはプレビュー用のダミーデータです"
            slug="sample_user"
            isBypassMode
          />
        </div>
      </div>
    );
  }

  // 通常モード: 認証チェック
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_id, display_name, bio, slug, onboarding_completed")
    .eq("owner_user_id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // オンボーディング完了済み → マイページへ
  if (profile.onboarding_completed) {
    redirect("/mypage");
  }

  // slug の初期値候補を生成（既存の slug がない場合）
  const suggestedSlug = profile.slug || generateSuggestedSlug(user);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-lg">
        <OnboardingWizard
          displayName={profile.display_name}
          bio={profile.bio}
          slug={suggestedSlug}
        />
      </div>
    </div>
  );
}
