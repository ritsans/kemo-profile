"use server";

import { revalidatePath } from "next/cache";
import { isUniqueViolation } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/action";

const SLUG_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

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

/**
 * プロフィール更新 Server Action
 * slug（カスタムURL）を更新
 */
export async function updateSlug(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const slug = formData.get("slug");

  // バリデーション: 空文字は null として扱う（slug 未設定）
  if (slug !== null && typeof slug !== "string") {
    return { success: false, error: "無効な入力です" };
  }

  const trimmedSlug = typeof slug === "string" ? slug.trim() : "";

  // 空文字の場合は slug を null にクリア
  if (trimmedSlug.length === 0) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "ログインが必要です" };
    }
    const { error } = await supabase
      .from("profiles")
      .update({ slug: null })
      .eq("owner_user_id", user.id);
    if (error) {
      console.error("Slug clear error:", error);
      return {
        success: false,
        error: "更新に失敗しました。もう一度お試しください",
      };
    }
    revalidatePath("/mypage");
    return { success: true, data: undefined };
  }

  // 形式チェック
  if (!SLUG_REGEX.test(trimmedSlug)) {
    return {
      success: false,
      error:
        "英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字で入力してください",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ slug: trimmedSlug })
    .eq("owner_user_id", user.id);

  if (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "このURLは既に使用されています" };
    }
    console.error("Slug update error:", error);
    return {
      success: false,
      error: "更新に失敗しました。もう一度お試しください",
    };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

/**
 * オンボーディング完了フラグを設定
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("owner_user_id", user.id);

  if (error) {
    console.error("Complete onboarding error:", error);
    return {
      success: false,
      error: "更新に失敗しました。もう一度お試しください",
    };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}
