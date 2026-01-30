/**
 * NEXT_PUBLIC_* 環境変数の静的マッピング
 * Next.jsはビルド時にこれらの参照を実際の値に置換する
 * 動的アクセス（process.env[name]）はクライアントサイドで動作しないため必要
 */
const publicEnvVars: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function env(name: string): string {
  // NEXT_PUBLIC_ プレフィックスの場合は静的マッピングから取得
  const value = name.startsWith("NEXT_PUBLIC_")
    ? publicEnvVars[name]
    : process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
