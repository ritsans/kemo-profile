"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkResult = {
  success: boolean;
  error?: string;
};

export async function sendMagicLink(
  _prevState: MagicLinkResult | null,
  formData: FormData,
): Promise<MagicLinkResult> {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, error: "有効なメールアドレスを入力してください" };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get("origin") || headersList.get("x-forwarded-host") || "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  // セキュリティ: アカウント列挙防止のため常に成功を返す
  if (error) {
    console.error("Magic link error:", error.message);
    if (error.message.includes("rate")) {
      return { success: false, error: "しばらく待ってから再試行してください" };
    }
  }

  return { success: true };
}
