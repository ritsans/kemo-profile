"use server";

import { isRateLimitError } from "@/lib/errors/supabase";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/action";
import { getTrustedAppOrigin } from "@/lib/url";

export async function sendMagicLink(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, error: "有効なメールアドレスを入力してください" };
  }

  const supabase = await createClient();
  const origin = getTrustedAppOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  // セキュリティ: アカウント列挙防止のため常に成功を返す
  if (error) {
    console.error("Magic link error:", error.message);
    if (isRateLimitError(error)) {
      return { success: false, error: "しばらく待ってから再試行してください" };
    }
  }

  return { success: true, data: undefined };
}
