"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { sendMagicLink } from "@/app/actions/magic-link";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/types/action";

export function EmailLoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(sendMagicLink, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/login/check-email");
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        type="email"
        name="email"
        placeholder="メールアドレス"
        required
        disabled={isPending}
      />
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
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
