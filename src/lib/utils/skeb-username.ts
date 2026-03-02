type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Skeb ユーザー名として有効な文字列パターン */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,50}$/;

/** skeb.jp の URL からユーザー名を抽出するパターン */
const SKEB_URL_REGEX =
  /^https?:\/\/(?:www\.)?skeb\.jp\/@([a-zA-Z0-9_]{1,50})\/?(?:\?.*)?$/;

/**
 * Skeb ユーザー名を正規化する
 *
 * 対応する入力形式:
 * - プレーンなユーザー名: "username"
 * - @ プレフィックス: "@username"
 * - skeb.jp URL: "https://skeb.jp/@username"
 */
export function normalizeSkebUsername(input: string): NormalizeResult {
  const trimmed = input.trim();

  // URL 形式
  const urlMatch = SKEB_URL_REGEX.exec(trimmed);
  if (urlMatch) {
    return { ok: true, value: urlMatch[1] };
  }

  // URL っぽいが対応外ドメインの場合はエラー
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      ok: false,
      error: "skeb.jp のURLを入力してください",
    };
  }

  // @ プレフィックスを除去
  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  // 空文字チェック
  if (username.length === 0) {
    return { ok: false, error: "ユーザー名を入力してください" };
  }

  // 使用可能文字チェック
  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      error: "Skebのユーザー名は英数字・アンダースコアのみ使用できます",
    };
  }

  return { ok: true, value: username };
}
