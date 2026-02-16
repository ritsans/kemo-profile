/**
 * クライアントサイド専用の環境変数ヘルパー
 * NEXT_PUBLIC_* プレフィックスのみ許可
 *
 * NOTE: Next.js はビルド時に process.env.NEXT_PUBLIC_* を文字列置換する。
 * Client側のコードは最終的にブラウザで実行されるため、そもそもprocess.envというNode.js専用の
 * オブジェクトは存在しません。そのため、Next.jsはビルド時に値をハードコードする必要があります。
 * そのため、switch文で各変数を直接参照する必要があるんですね。
 */
export function env(name: string): string {
  if (!name.startsWith("NEXT_PUBLIC_")) {
    throw new Error(
      `Client env() only accepts NEXT_PUBLIC_* variables, got: ${name}`,
    );
  }

  // Next.js のビルド時置換のため、直接参照が必要。
  // 今後、新たな環境変数を追加する場合は、ここに**ケースを追加**してください。

  let value: string | undefined;
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      value = process.env.NEXT_PUBLIC_SUPABASE_URL;
      break;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      break;
    default:
      throw new Error(`Unknown client environment variable: ${name}`);
  }

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
