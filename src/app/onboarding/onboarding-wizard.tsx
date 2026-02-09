"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import {
  completeOnboarding,
  updateBio,
  updateDisplayName,
  updateSlug,
} from "@/app/actions/profile";
import type { ActionResult } from "@/lib/types/action";

interface OnboardingWizardProps {
  displayName: string;
  bio: string | null;
  slug: string | null;
}

const TOTAL_STEPS = 3;

export function OnboardingWizard({
  displayName,
  bio,
  slug,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: 表示名
  const [displayNameState, displayNameAction, isDisplayNamePending] =
    useActionState<ActionResult | null, FormData>(updateDisplayName, null);

  // Step 2: 自己紹介
  const [bioState, bioAction, isBioPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateBio, null);

  // Step 3: カスタムURL
  const [slugState, slugAction, isSlugPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateSlug, null);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    router.push("/mypage");
  }, [router]);

  // 成功時のステップ遷移
  useEffect(() => {
    if (displayNameState?.success && step === 1) {
      setStep(2);
    }
  }, [displayNameState, step]);

  useEffect(() => {
    if (bioState?.success && step === 2) {
      setStep(3);
    }
  }, [bioState, step]);

  useEffect(() => {
    if (slugState?.success && step === 3) {
      handleComplete();
    }
  }, [slugState, step, handleComplete]);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      {/* プログレスインジケーター */}
      <div className="mb-8 flex items-center justify-center gap-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          return (
            <div
              key={stepNum}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isCompleted
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-200 text-gray-400"
              }`}
            >
              {stepNum}
            </div>
          );
        })}
      </div>

      {/* Step 1: 表示名 */}
      {step === 1 && (
        <div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            ユーザー名を確認
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            プロフィールに表示される名前です。あとから変更できます。
          </p>
          <form action={displayNameAction}>
            <label
              htmlFor="display_name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              表示名
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              defaultValue={displayName}
              required
              maxLength={50}
              disabled={isDisplayNamePending}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {displayNameState && !displayNameState.success && (
              <p className="mb-4 text-sm text-red-600">
                {displayNameState.error}
              </p>
            )}
            <button
              type="submit"
              disabled={isDisplayNamePending}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {isDisplayNamePending ? "保存中..." : "次へ"}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: 自己紹介 */}
      {step === 2 && (
        <div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            自己紹介を追加
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            あなたのことを簡単に紹介してください。あとから変更できます。
          </p>
          <form action={bioAction}>
            <label
              htmlFor="bio"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              自己紹介
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={bio ?? ""}
              maxLength={160}
              rows={3}
              disabled={isBioPending}
              placeholder="例: イラストレーター / 猫好き / コミケ参加者"
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {bioState && !bioState.success && (
              <p className="mb-4 text-sm text-red-600">{bioState.error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isBioPending}
                className="flex-1 rounded-md border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                スキップ
              </button>
              <button
                type="submit"
                disabled={isBioPending}
                className="flex-1 rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
              >
                {isBioPending ? "保存中..." : "次へ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: カスタムURL */}
      {step === 3 && (
        <div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            カスタムURLを設定
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            プロフィールの短縮URLを設定できます。あとから変更できます。
          </p>
          <form action={slugAction}>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              カスタムURL
            </label>
            <div className="mb-4">
              <input
                type="text"
                id="slug"
                name="slug"
                defaultValue={slug ?? ""}
                maxLength={20}
                disabled={isSlugPending}
                placeholder="my_name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <p className="mb-4 text-xs text-gray-400">
              英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
            </p>
            {slugState && !slugState.success && (
              <p className="mb-4 text-sm text-red-600">{slugState.error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSlugPending}
                className="flex-1 rounded-md border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                スキップ
              </button>
              <button
                type="submit"
                disabled={isSlugPending}
                className="flex-1 rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
              >
                {isSlugPending ? "保存中..." : "設定する"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* グローバルスキップリンク */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleComplete}
          className="text-sm text-gray-400 underline hover:text-gray-600"
        >
          スキップしてマイページへ
        </button>
      </div>
    </div>
  );
}
