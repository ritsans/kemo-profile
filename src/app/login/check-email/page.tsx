import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* メールアイコン */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>メール</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          メールを確認してください
        </h1>

        <p className="text-gray-600">
          ログインリンクを送信しました。
          <br />
          メール内のリンクをクリックしてログインしてください。
        </p>

        <p className="text-sm text-gray-500">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>

        <Link
          href="/login"
          className="inline-block text-sm text-gray-500 underline hover:text-gray-700"
        >
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}
