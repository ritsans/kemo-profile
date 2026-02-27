"use client";

/**
 * カスタムURL設定カード。
 * プロフィール編集フォームから独立した個別保存カード。
 * LinkedProvidersCard と同様の独立カードコンポーネント。
 */
import { useActionState, useEffect, useState } from "react";
import { updateSlug } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types/action";

interface SlugCardProps {
  /** 初期値（既存の slug、または候補値） */
  slug: string | null;
}

export function SlugCard({ slug }: SlugCardProps) {
  const [currentSlug, setCurrentSlug] = useState(slug ?? "");
  const [savedMessage, setSavedMessage] = useState(false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateSlug, null);

  // 保存成功時: 2秒間「保存しました」メッセージを表示
  useEffect(() => {
    if (state?.success) {
      setSavedMessage(true);
      const timer = setTimeout(() => setSavedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const errorMessage = state && !state.success ? state.error : null;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">カスタムURL</h2>
        {savedMessage && <p className="text-sm text-green-600">保存しました</p>}
      </div>

      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="slug" className="mb-1">
            URL スラッグ
          </Label>
          <Input
            type="text"
            id="slug"
            name="slug"
            value={currentSlug}
            onChange={(e) => setCurrentSlug(e.target.value)}
            maxLength={20}
            disabled={isPending}
            placeholder="my_name"
          />
          <p className="mt-1 text-xs text-gray-400">
            英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
          </p>
          {errorMessage && (
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        <div className="flex">
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中..." : "保存する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
