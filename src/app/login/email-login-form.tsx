"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { type MagicLinkResult, sendMagicLink } from "@/app/actions/magic-link";

export function EmailLoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    MagicLinkResult | null,
    FormData
  >(sendMagicLink, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/login/check-email");
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="email"
        name="email"
        placeholder="メールアドレス"
        required
        disabled={isPending}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                   focus:border-gray-400 focus:outline-none disabled:bg-gray-100"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium
                   text-white transition hover:bg-gray-700 disabled:bg-gray-400"
      >
        {isPending ? "送信中..." : "ログインリンクを送信"}
      </button>
    </form>
  );
}
