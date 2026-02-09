"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/action";

/**
 * プロフィール更新 Server Action
 * display_name を更新
 */
export async function updateDisplayName(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const displayName = formData.get("display_name");

  // バリデーション
  if (!displayName || typeof displayName !== "string") {
    return { success: false, error: "表示名を入力してください" };
  }

  const trimmedName = displayName.trim();
  if (trimmedName.length === 0) {
    return { success: false, error: "表示名を入力してください" };
  }
  if (trimmedName.length > 50) {
    return { success: false, error: "表示名は50文字以内で入力してください" };
  }

  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  // プロフィール更新
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmedName })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: "更新に失敗しました。もう一度お試しください",
    };
  }

  // キャッシュをリフレッシュ
  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

/**
 * プロフィール更新 Server Action
 * bio（自己紹介）を更新
 */
export async function updateBio(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const bio = formData.get("bio");

  // バリデーション: bio は空文字を許容（null に変換）
  if (bio !== null && typeof bio !== "string") {
    return { success: false, error: "無効な入力です" };
  }

  const trimmedBio = typeof bio === "string" ? bio.trim() : "";
  if (trimmedBio.length > 160) {
    return { success: false, error: "自己紹介は160文字以内で入力してください" };
  }

  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  // プロフィール更新（空文字は null として保存）
  const { error } = await supabase
    .from("profiles")
    .update({ bio: trimmedBio.length > 0 ? trimmedBio : null })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Bio update error:", error);
    return {
      success: false,
      error: "更新に失敗しました。もう一度お試しください",
    };
  }

  // キャッシュをリフレッシュ
  revalidatePath("/mypage");
  return { success: true, data: undefined };
}
