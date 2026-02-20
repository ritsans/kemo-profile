type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** X (Twitter) のユーザー名として有効な文字列パターン (1〜15文字) */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,15}$/;

/** x.com / twitter.com の URL からユーザー名を抽出するパターン */
const X_URL_REGEX =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/@?([a-zA-Z0-9_]{1,15})\/?$/;

/**
 * X (Twitter) ユーザー名を正規化する
 *
 * 対応する入力形式:
 * - プレーンなユーザー名: "username"
 * - @ プレフィックス: "@username"
 * - x.com URL: "https://x.com/username" / "https://x.com/@username"
 * - twitter.com URL: "https://twitter.com/username"
 */
export function normalizeXUsername(input: string): NormalizeResult {
  // URL 形式
  const urlMatch = X_URL_REGEX.exec(input);
  if (urlMatch) {
    return { ok: true, value: urlMatch[1] };
  }

  // URL っぽいが対応外ドメインの場合はエラー
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return {
      ok: false,
      error: "x.com または twitter.com のURLを入力してください",
    };
  }

  // @ プレフィックスを除去
  const username = input.startsWith("@") ? input.slice(1) : input;

  // 空文字チェック
  if (username.length === 0) {
    return { ok: false, error: "ユーザー名を入力してください" };
  }

  // 文字数チェック
  if (username.length > 15) {
    return {
      ok: false,
      error: "Xのユーザー名は15文字以内で入力してください",
    };
  }

  // 使用可能文字チェック
  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      error: "Xのユーザー名は英数字とアンダースコアのみ使用できます",
    };
  }

  return { ok: true, value: username };
}
