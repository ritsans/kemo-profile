type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Instagram ユーザー名として有効な文字列パターン (1〜30文字) */
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{1,30}$/;

/** instagram.com の URL からユーザー名を抽出するパターン */
const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/@?([a-zA-Z0-9_.]{1,30})\/?(?:\?.*)?$/;

/**
 * Instagram ユーザー名を正規化する
 *
 * 対応する入力形式:
 * - プレーンなユーザー名: "username"
 * - @ プレフィックス: "@username"
 * - instagram.com URL: "https://instagram.com/username"
 * - www.instagram.com URL: "https://www.instagram.com/username"
 */
export function normalizeInstagramUsername(input: string): NormalizeResult {
  // URL 形式
  const urlMatch = INSTAGRAM_URL_REGEX.exec(input);
  if (urlMatch) {
    return { ok: true, value: urlMatch[1] };
  }

  // URL っぽいが対応外ドメインの場合はエラー
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return {
      ok: false,
      error: "instagram.com のURLを入力してください",
    };
  }

  // @ プレフィックスを除去
  const username = input.startsWith("@") ? input.slice(1) : input;

  // 空文字チェック
  if (username.length === 0) {
    return { ok: false, error: "ユーザー名を入力してください" };
  }

  // 文字数チェック
  if (username.length > 30) {
    return {
      ok: false,
      error: "Instagramのユーザー名は30文字以内で入力してください",
    };
  }

  // 使用可能文字チェック
  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      error:
        "Instagramのユーザー名は英数字・ピリオド・アンダースコアのみ使用できます",
    };
  }

  return { ok: true, value: username };
}
