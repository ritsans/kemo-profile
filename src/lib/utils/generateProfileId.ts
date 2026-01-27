/**
 * base62文字セット (0-9, a-z, A-Z)
 * 62文字でURLセーフな文字列を生成する
 */
const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * 暗号学的に安全なbase62ランダムIDを生成
 * @param length - 生成するIDの文字数（デフォルト: 15）
 * @returns base62形式のランダムID
 *
 * @example
 * const profileId = generateProfileId(); // "3kTyBn9mQpR5xYz"
 */
export function generateProfileId(length = 15): string {
  // ブラウザ環境とNode.js環境の両方に対応
  const randomValues =
    typeof window !== "undefined"
      ? window.crypto.getRandomValues(new Uint8Array(length))
      : crypto.getRandomValues(new Uint8Array(length));

  // 各バイトをbase62文字にマッピング
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS[randomValues[i] % 62];
  }

  return result;
}
