type CookieSameSite = "lax" | "strict" | "none" | boolean;
type CookiePriority = "low" | "medium" | "high";

export type SupabaseCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: CookieSameSite;
  secure?: boolean;
  priority?: CookiePriority;
  partitioned?: boolean;
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Cookie属性の欠落でセキュリティが劣化しないよう、最小限の安全な既定値を補う。
 */
export function hardenCookieOptions(
  options?: SupabaseCookieOptions,
): SupabaseCookieOptions {
  const hardened: SupabaseCookieOptions = {
    ...options,
    path: options?.path ?? "/",
    sameSite: options?.sameSite ?? "lax",
    secure: options?.secure ?? IS_PRODUCTION,
  };

  if (hardened.sameSite === "none") {
    hardened.secure = true;
  }

  return hardened;
}
