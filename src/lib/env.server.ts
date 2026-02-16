/**
 * サーバーサイド専用の環境変数ヘルパー
 * 未定義の場合は明確なエラーメッセージで例外を投げる
 */
export function env(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(
      `環境変数が未定義です。Missing required environment variable: ${name}`,
    );
  }
  return value;
}
