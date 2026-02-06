import { webcrypto } from "node:crypto";

/**
 * 暗号論的に安全なランダムなプロフィールIDを生成
 * base62エンコード、15文字、URL安全
 */
export function generateProfileId(): string {
  const base62Chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const length = 15;

  // 暗号論的に安全な乱数を生成
  const randomBytes = new Uint8Array(length);
  webcrypto.getRandomValues(randomBytes);

  // base62エンコード
  let result = "";
  for (let i = 0; i < length; i++) {
    result += base62Chars[randomBytes[i] % 62];
  }

  return result;
}
