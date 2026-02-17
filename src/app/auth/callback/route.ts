import { type NextRequest, NextResponse } from "next/server";
import { getTrustedAppOrigin } from "@/lib/url";
import { applyPendingCookies } from "./_lib/cookies";
import { parseCallbackParams } from "./_lib/params";
import { ensureProfile } from "./_lib/profile";
import {
  createAuthErrorRedirectUrl,
  createCodeMissingRedirectUrl,
  createProviderErrorRedirectUrl,
  createSuccessRedirectUrl,
} from "./_lib/redirect";
import {
  establishSessionFromCodeOrThrow,
  fetchUserOrThrow,
} from "./_lib/session";
import { createCallbackSupabaseClient } from "./_lib/supabase-client";
import type { PendingCookie } from "./_lib/types";

/**
 * OAuth コールバック処理
 * code を session に交換し、初回ログインの場合はプロフィールを自動作成
 */
export async function GET(request: NextRequest) {
  const origin = getTrustedAppOrigin();
  const pendingCookies: PendingCookie[] = [];
  const { code, error, errorDescription, next } = parseCallbackParams(
    request.url,
  );

  if (error) {
    console.error("OAuth provider error:", error, errorDescription);
    return NextResponse.redirect(
      createProviderErrorRedirectUrl(origin, next, error, errorDescription),
    );
  }

  if (!code) {
    return NextResponse.redirect(createCodeMissingRedirectUrl(origin));
  }

  const supabase = createCallbackSupabaseClient(request, pendingCookies);

  try {
    await establishSessionFromCodeOrThrow(supabase, code);
    const user = await fetchUserOrThrow(supabase);
    const { isNewUser } = await ensureProfile(supabase, user);
    const redirectUrl = createSuccessRedirectUrl(origin, next, isNewUser);
    const response = NextResponse.redirect(redirectUrl);
    applyPendingCookies(response, pendingCookies);
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);

    let errorCode = "auth";
    let finalErrorDescription: string | undefined;

    if (error instanceof Error) {
      if (
        error.message === "exchange_failed" ||
        error.message === "user_not_found" ||
        error.message === "profile_creation_failed"
      ) {
        errorCode = error.message;
      } else {
        finalErrorDescription = error.message;
      }
    }

    return NextResponse.redirect(
      createAuthErrorRedirectUrl(origin, errorCode, finalErrorDescription),
    );
  }
}
