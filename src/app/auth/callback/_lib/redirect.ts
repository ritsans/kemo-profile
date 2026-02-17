export function createProviderErrorRedirectUrl(
  origin: string,
  next: string | null,
  error: string,
  errorDescription: string | null,
): string {
  const params = new URLSearchParams({
    error: error === "access_denied" ? "access_denied" : "auth",
    ...(errorDescription && { error_description: errorDescription }),
  });
  const redirectPath = next?.startsWith("/") ? next : "/login";

  return `${origin}${redirectPath}?${params.toString()}`;
}

export function createCodeMissingRedirectUrl(origin: string): string {
  return `${origin}/login?error=code_missing`;
}

export function createAuthErrorRedirectUrl(
  origin: string,
  errorCode: string,
  errorDescription?: string,
): string {
  const params = new URLSearchParams({
    error: errorCode,
    ...(errorDescription && { error_description: errorDescription }),
  });

  return `${origin}/login?${params.toString()}`;
}

export function createSuccessRedirectUrl(
  origin: string,
  next: string | null,
  isNewUser: boolean,
): string {
  const defaultPath = isNewUser ? "/first-step" : "/mypage";

  return next?.startsWith("/") ? `${origin}${next}` : `${origin}${defaultPath}`;
}
