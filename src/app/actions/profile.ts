"use server";

import { revalidatePath } from "next/cache";
import { isUniqueViolation } from "@/lib/errors/supabase";
import { getPlatform } from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ProfileUpdateResult } from "@/lib/types/action";

const SLUG_REGEX = /^[a-z][a-z0-9_]{2,19}$/;
const UPDATE_ERROR_MESSAGE = "更新に失敗しました。もう一度お試しください";

type AuthContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
    }
  | {
      ok: false;
      result: Extract<ActionResult, { success: false }>;
    };

async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      result: { success: false, error: "ログインが必要です" },
    };
  }

  return { ok: true, supabase, userId: user.id };
}

async function updateProfileAndRevalidate(
  update: {
    display_name?: string;
    bio?: string | null;
    social_links?: Record<string, string> | null;
    slug?: string | null;
    onboarding_completed?: boolean;
  },
  logLabel: string,
  options?: {
    uniqueErrorMessage?: string;
  },
): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.result;
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update(update)
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error(logLabel, error);
    if (options?.uniqueErrorMessage && isUniqueViolation(error)) {
      return { success: false, error: options.uniqueErrorMessage };
    }
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

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

  const result = await updateProfileAndRevalidate(
    { display_name: trimmedName },
    "Profile update error:",
  );
  return result;
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

  const result = await updateProfileAndRevalidate(
    { bio: trimmedBio.length > 0 ? trimmedBio : null },
    "Bio update error:",
  );
  return result;
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
    const result = await updateProfileAndRevalidate(
      { slug: null },
      "Slug clear error:",
    );
    return result;
  }

  // 形式チェック
  if (!SLUG_REGEX.test(trimmedSlug)) {
    return {
      success: false,
      error:
        "英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字で入力してください",
    };
  }

  const result = await updateProfileAndRevalidate(
    { slug: trimmedSlug },
    "Slug update error:",
    { uniqueErrorMessage: "このURLは既に使用されています" },
  );
  return result;
}

/**
 * オンボーディング完了フラグを設定
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const result = await updateProfileAndRevalidate(
    { onboarding_completed: true },
    "Complete onboarding error:",
  );
  return result;
}

/**
 * プロフィール一括更新 Server Action
 * display_name, bio, social_links, slug を一度に更新する
 */
export async function updateProfile(
  _prevState: ProfileUpdateResult | null,
  formData: FormData,
): Promise<ProfileUpdateResult> {
  const fieldErrors: Record<string, string> = {};

  // --- display_name バリデーション ---
  const displayNameRaw = formData.get("display_name");
  const displayName =
    typeof displayNameRaw === "string" ? displayNameRaw.trim() : "";
  if (displayName.length === 0) {
    fieldErrors.display_name = "表示名を入力してください";
  } else if (displayName.length > 50) {
    fieldErrors.display_name = "表示名は50文字以内で入力してください";
  }

  // --- bio バリデーション ---
  const bioRaw = formData.get("bio");
  const bioTrimmed = typeof bioRaw === "string" ? bioRaw.trim() : "";
  if (bioTrimmed.length > 160) {
    fieldErrors.bio = "自己紹介は160文字以内で入力してください";
  }

  // バリデーションエラーがあれば一括返却
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // 認証確認
  const auth = await requireUser();
  if (!auth.ok) {
    return {
      success: false,
      fieldErrors: { display_name: auth.result.error },
    };
  }

  // --- 差分検知: 保存前の元の値と比較して変更フィールドだけ特定 ---
  const originalDisplayName =
    (formData.get("original_display_name") as string) ?? "";
  const originalBio = (formData.get("original_bio") as string) ?? "";

  const update: Partial<{
    display_name: string;
    bio: string | null;
  }> = {};

  if (displayName !== originalDisplayName) update.display_name = displayName;
  if ((bioTrimmed || null) !== (originalBio || null)) {
    update.bio = bioTrimmed.length > 0 ? bioTrimmed : null;
  }

  // 変更なし → DB更新・revalidate不要
  if (Object.keys(update).length === 0) {
    return { success: true };
  }

  // DB 更新（変更フィールドのみ）
  const { error } = await auth.supabase
    .from("profiles")
    .update(update)
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error("Profile bulk update error:", error);
    return {
      success: false,
      fieldErrors: { display_name: UPDATE_ERROR_MESSAGE },
    };
  }

  revalidatePath("/mypage");
  return { success: true };
}

/**
 * SNSリンク追加 Server Action
 * 同一キーが既に存在する場合はエラー（1SNS=1リンク）
 */
export async function addSocialLink(
  platformKey: string,
  rawValue: string,
): Promise<ActionResult> {
  // プラットフォーム定義確認
  const platform = getPlatform(platformKey);
  if (!platform) {
    return { success: false, error: "対応していないSNSです" };
  }

  // 正規化
  const normalized = platform.normalize
    ? platform.normalize(rawValue)
    : rawValue.trim().length > 0
      ? { ok: true as const, value: rawValue.trim() }
      : { ok: false as const, error: "入力してください" };

  if (!normalized.ok) {
    return { success: false, error: normalized.error };
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.result;

  // 現在の social_links を取得
  const { data: profile, error: fetchError } = await auth.supabase
    .from("profiles")
    .select("social_links")
    .eq("owner_user_id", auth.userId)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  const current = (profile.social_links as Record<string, string>) ?? {};

  // 重複チェック
  if (current[platformKey] !== undefined) {
    return {
      success: false,
      error: `${platform.label} は既に登録されています`,
    };
  }

  const updated = { ...current, [platformKey]: normalized.value };

  const { error } = await auth.supabase
    .from("profiles")
    .update({ social_links: updated })
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error("addSocialLink error:", error);
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

/**
 * SNSリンク更新 Server Action
 * X OAuth自動設定値（`x`）は更新不可
 */
export async function updateSocialLink(
  platformKey: string,
  rawValue: string,
): Promise<ActionResult> {
  // X OAuth保護
  if (platformKey === "x") {
    return {
      success: false,
      error: "X (Twitter) はOAuth連携で設定されているため変更できません",
    };
  }

  // プラットフォーム定義確認
  const platform = getPlatform(platformKey);
  if (!platform) {
    return { success: false, error: "対応していないSNSです" };
  }

  // 正規化
  const normalized = platform.normalize
    ? platform.normalize(rawValue)
    : rawValue.trim().length > 0
      ? { ok: true as const, value: rawValue.trim() }
      : { ok: false as const, error: "入力してください" };

  if (!normalized.ok) {
    return { success: false, error: normalized.error };
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.result;

  // 現在の social_links を取得
  const { data: profile, error: fetchError } = await auth.supabase
    .from("profiles")
    .select("social_links")
    .eq("owner_user_id", auth.userId)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  const current = (profile.social_links as Record<string, string>) ?? {};

  // 未登録チェック
  if (current[platformKey] === undefined) {
    return {
      success: false,
      error: `${platform.label} はまだ登録されていません`,
    };
  }

  const updated = { ...current, [platformKey]: normalized.value };

  const { error } = await auth.supabase
    .from("profiles")
    .update({ social_links: updated })
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error("updateSocialLink error:", error);
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

/**
 * SNSリンク順序保存 Server Action
 */
export async function reorderSocialLinks(
  order: string[],
): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth.result;

  const { error } = await auth.supabase
    .from("profiles")
    .update({ social_links_order: order })
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error("reorderSocialLinks error:", error);
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}

/**
 * SNSリンク削除 Server Action
 * X OAuth自動設定値（`x`）は削除不可
 */
export async function removeSocialLink(
  platformKey: string,
): Promise<ActionResult> {
  // X OAuth保護
  if (platformKey === "x") {
    return {
      success: false,
      error: "X (Twitter) はOAuth連携で設定されているため削除できません",
    };
  }

  // プラットフォーム定義確認
  const platform = getPlatform(platformKey);
  if (!platform) {
    return { success: false, error: "対応していないSNSです" };
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.result;

  // 現在の social_links を取得
  const { data: profile, error: fetchError } = await auth.supabase
    .from("profiles")
    .select("social_links")
    .eq("owner_user_id", auth.userId)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  const current = (profile.social_links as Record<string, string>) ?? {};

  // 未登録チェック
  if (current[platformKey] === undefined) {
    return {
      success: false,
      error: `${platform.label} はまだ登録されていません`,
    };
  }

  const updated = { ...current };
  delete updated[platformKey];

  const { error } = await auth.supabase
    .from("profiles")
    .update({ social_links: updated })
    .eq("owner_user_id", auth.userId);

  if (error) {
    console.error("removeSocialLink error:", error);
    return { success: false, error: UPDATE_ERROR_MESSAGE };
  }

  revalidatePath("/mypage");
  return { success: true, data: undefined };
}
