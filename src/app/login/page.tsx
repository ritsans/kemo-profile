import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButtons } from "./login-buttons";

/**
 * ログインページ
 * 認証済みの場合は /mypage へリダイレクト
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証済みの場合は /mypage へリダイレクト
  if (user) {
    redirect("/mypage");
  }

  const params = await searchParams;
  const errorCode = params.error;
  const errorDescription = params.error_description;

  // エラーメッセージのマッピング
  const getErrorMessage = (code?: string, description?: string): string | null => {
    if (!code) return null;

    // エラーコード別のメッセージ
    switch (code) {
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
        // 詳細なエラー説明がある場合は表示
        return description || "ログイン中にエラーが発生しました。もう一度お試しください。";
    }
  };

  const errorMessage = getErrorMessage(errorCode, errorDescription);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            けものプロフィール
          </h1>
          <p className="mt-2 text-sm text-gray-600">デジタル名刺でつながろう</p>
        </div>

        <div className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
          {/* エラーメッセージ表示 */}
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {errorMessage}
            </div>
          )}
          <LoginButtons />
        </div>
      </div>
    </div>
  );
}
