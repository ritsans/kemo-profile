import { redirect } from "next/navigation";
import { getOAuthErrorMessage } from "@/lib/errors/supabase";
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

  // もし未ログイン場合は searchParamsからエラーメッセージ取得、表示
  const params = await searchParams;
  const errorCode = params.error;
  const errorDescription = params.error_description;

  const errorMessage = getOAuthErrorMessage(errorCode, errorDescription);

  // ログイン済みでなければ、ログインページのUIを返す処理ここから
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
