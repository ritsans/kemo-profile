import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

/**
 * オンボーディングページ（Server Component）
 * 初回ログイン後のプロフィール設定ガイド
 */
export default async function OnboardingPage() {
  const supabase = await createClient();

  // 認証チェック
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <OnboardingWizard
          displayName={profile.display_name}
          bio={profile.bio}
          slug={profile.slug}
        />
      </div>
    </div>
  );
}
