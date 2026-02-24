type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Pixiv ユーザーID（数値のみ）パターン */
const PIXIV_ID_REGEX = /^\d+$/;

/** pixiv.net の URL からユーザーIDを抽出するパターン */
const PIXIV_URL_REGEX =
  /^https?:\/\/(?:www\.)?pixiv\.net\/(?:en\/)?users\/(\d+)\/?(?:\?.*)?$/;

/**
 * Pixiv ユーザーIDを正規化する
 *
 * 対応する入力形式:
 * - 数値ID: "12345678"
 * - pixiv.net URL: "https://www.pixiv.net/users/12345678"
 * - 英語URL: "https://www.pixiv.net/en/users/12345678"
 */
export function normalizePixivUserId(input: string): NormalizeResult {
  // URL 形式
  const urlMatch = PIXIV_URL_REGEX.exec(input);
  if (urlMatch) {
    return { ok: true, value: urlMatch[1] };
  }

  // URL っぽいが対応外ドメインの場合はエラー
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return {
      ok: false,
      error: "pixiv.net のURLを入力してください",
    };
  }

  const trimmed = input.trim();

  // 空文字チェック
  if (trimmed.length === 0) {
    return { ok: false, error: "ユーザーIDを入力してください" };
  }

  // 数値のみチェック
  if (!PIXIV_ID_REGEX.test(trimmed)) {
    return {
      ok: false,
      error: "PixivのユーザーIDは数値のみで入力してください",
    };
  }

  return { ok: true, value: trimmed };
}
