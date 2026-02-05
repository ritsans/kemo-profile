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
    return;
  }

  const trimmedName = displayName.trim();
  if (trimmedName.length === 0 || trimmedName.length > 50) {
    return;
  }

  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // プロフィール更新
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmedName })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return;
  }

  // キャッシュをリフレッシュ
  revalidatePath("/mypage");
}

/**
 * プロフィール更新 Server Action
 * bio（自己紹介）を更新
 */
export async function updateBio(formData: FormData) {
  const bio = formData.get("bio");

  // バリデーション: bio は空文字を許容（null に変換）
  if (bio !== null && typeof bio !== "string") {
    return;
  }

  const trimmedBio = typeof bio === "string" ? bio.trim() : "";
  if (trimmedBio.length > 160) {
    return;
  }

  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // プロフィール更新（空文字は null として保存）
  const { error } = await supabase
    .from("profiles")
    .update({ bio: trimmedBio.length > 0 ? trimmedBio : null })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Bio update error:", error);
    return;
  }

  // キャッシュをリフレッシュ
  revalidatePath("/mypage");
}
