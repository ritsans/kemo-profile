import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButtons } from "./login-buttons";

/**
 * ログインページ
 * 認証済みの場合は /my へリダイレクト
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証済みの場合は /my へリダイレクト
  if (user) {
    redirect("/my");
  }

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
          <LoginButtons />
        </div>
      </div>
    </div>
  );
}
