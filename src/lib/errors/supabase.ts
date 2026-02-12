/**
 * Supabase エラーの型定義
 */
export type SupabaseError = {
  code?: string;
  message: string;
  status?: number;
};

/**
 * エラーコードの定数定義
 */
export const SupabaseErrorCode = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
} as const;

/**
 * エラーコードに基づいて判定
 */
export function isUniqueViolation(error: SupabaseError | null): boolean {
  return error?.code === SupabaseErrorCode.UNIQUE_VIOLATION;
}

export function isRateLimitError(error: SupabaseError): boolean {
  return error.message.toLowerCase().includes("rate");
}

/**
 * OAuth/Auth エラーメッセージを日本語化
 * login/page.tsx と mypage/page.tsx の統合版
 */
export function getOAuthErrorMessage(
  errorCode?: string,
  errorDescription?: string,
): string | null {
  if (!errorCode) return null;

  switch (errorCode) {
    case "auth":
      return "ログインに失敗しました。もう一度お試しください。";
    case "code_missing":
      return "認証コードが見つかりません。もう一度ログインしてください。";
    case "exchange_failed":
      return "認証処理に失敗しました。しばらく時間をおいて再度お試しください。";
    case "profile_creation_failed":
      return "プロフィールの作成に失敗しました。サポートにお問い合わせください。";
    case "access_denied":
      return "アクセスが拒否されました。認証をキャンセルした可能性があります。";
    default:
      return (
        errorDescription ||
        "ログイン中にエラーが発生しました。もう一度お試しください。"
      );
  }
}

/**
 * linkIdentity エラーメッセージを日本語化
 * linked-providers-card.tsx の統合版
 */
export function getLinkIdentityErrorMessage(error: SupabaseError): string {
  const message = error.message;

  if (
    message.includes("already exists") ||
    message.includes("already linked to another user")
  ) {
    return "このアカウントは既に別のユーザーに連携されています";
  }
  if (message.includes("not enabled")) {
    return "このログイン方法は現在利用できません";
  }

  return "連携に失敗しました。もう一度お試しください";
}
