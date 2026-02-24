import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isUniqueViolation } from "@/lib/errors/supabase";
import { generateProfileId } from "@/lib/id";
import type { Database } from "@/lib/supabase/database.types";
import type { ProfileResult } from "./types";

/**
 * profilesテーブル上のユーザープロフィールを保証するモジュール。
 * 未作成時は自動作成し、unique競合時は再取得して race condition を吸収する。
 */
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<ProfileResult> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("profile_id")
    .eq("owner_user_id", user.id)
    .single();

  if (existingProfile) {
    return {
      profileId: existingProfile.profile_id,
      isNewUser: false,
    };
  }

  let profileId = generateProfileId();
  const provider = user.app_metadata.provider;
  const metadata = user.user_metadata;

  let displayName: string;
  let avatarUrl: string | null = null;
  const socialLinks: Record<string, string> = {};

  if (provider === "email" || !provider) {
    displayName = user.email?.split("@")[0] || "名無しのけもの";
  } else {
    displayName = metadata.full_name || metadata.name || "名無しのけもの";
    avatarUrl = metadata.avatar_url || metadata.picture || null;
    if (provider === "twitter" && metadata.user_name) {
      socialLinks.x = metadata.user_name;
    }
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    profile_id: profileId,
    owner_user_id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl,
    social_links: socialLinks,
  });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: racedProfile, error: racedProfileError } = await supabase
        .from("profiles")
        .select("profile_id")
        .eq("owner_user_id", user.id)
        .single();

      if (racedProfileError || !racedProfile) {
        console.error(
          "Failed to fetch existing profile after unique conflict:",
          racedProfileError,
        );
        throw new Error("profile_creation_failed");
      }

      profileId = racedProfile.profile_id;

      return {
        profileId,
        isNewUser: false,
      };
    }

    console.error("Failed to create profile:", insertError);
    throw new Error("profile_creation_failed");
  }

  return {
    profileId,
    isNewUser: true,
  };
}
