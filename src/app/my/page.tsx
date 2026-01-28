import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * マイページ
 * 認証済みユーザーを自分のプロフィールページへリダイレクト
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

  // 自分のプロフィールを検索
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_id")
    .eq("owner_user_id", user.id)
    .single();

  if (profile) {
    redirect(`/p/${profile.profile_id}`);
  }

  // プロフィールが見つからない場合(エッジケース)は /login へ
  redirect("/login");
}
