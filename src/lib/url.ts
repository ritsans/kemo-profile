/**
 * 信頼可能なアプリケーションのOriginを返す。
 * 本番では環境変数必須、開発では localhost をフォールバックする。
 */
export function getTrustedAppOrigin(): string {
  const rawUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!rawUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3000";
    }
    throw new Error(
      "Missing APP_URL (or NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL)",
    );
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    throw new Error("Invalid APP_URL format");
  }
}
