"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * プロフィール更新 Server Action
 * display_name を更新
 */
export async function updateDisplayName(formData: FormData) {
  const displayName = formData.get("display_name");

  // バリデーション
  if (!displayName || typeof displayName !== "string") {
    return { error: "表示名を入力してください" };
  }

  const trimmedName = displayName.trim();
  if (trimmedName.length === 0) {
    return { error: "表示名を入力してください" };
  }
  if (trimmedName.length > 50) {
    return { error: "表示名は50文字以内で入力してください" };
  }

  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  // プロフィール更新
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmedName })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: "更新に失敗しました" };
  }

  // キャッシュをリフレッシュ
  revalidatePath("/mypage");

  return { success: true };
}
