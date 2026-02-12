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
  isBypassMode?: boolean;
}

/* ───────────── SVG Icons ───────────── */

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* ───────────── Step Config ───────────── */

const STEPS = [
  { label: "ユーザー名設定", Icon: UserIcon },
  { label: "プロフィール設定", Icon: EditIcon },
  { label: "設定完了", Icon: LinkIcon },
] as const;

const STEP_HEADERS = [
  {
    title: "ユーザー名設定",
    subtitle: "プロフィールに表示される名前を設定してください",
  },
  {
    title: "プロフィール設定",
    subtitle: "あなたの情報を教えてください",
  },
  {
    title: "カスタムURL設定",
    subtitle: "プロフィールの短縮URLを設定できます",
  },
] as const;

/* ───────────── Stepper ───────────── */

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative mb-10 flex items-start justify-center">
      {STEPS.map((stepDef, i) => {
        const num = i + 1;
        const isActive = num === currentStep;
        const isCompleted = num < currentStep;
        const DisplayIcon = isCompleted ? CheckIcon : stepDef.Icon;

        return (
          <div key={stepDef.label} className="flex items-start">
            {/* 円 + ラベル */}
            <div className="flex flex-col items-center gap-2.5">
              {/* 外側リング（アクティブ時にグロー） */}
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.18)]"
                    : isCompleted
                      ? "bg-blue-600"
                      : "border-2 border-gray-300 bg-white"
                }`}
              >
                <DisplayIcon
                  className={`h-5 w-5 ${
                    isActive || isCompleted ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              {/* ラベル */}
              <span
                className={`whitespace-nowrap text-[11px] font-semibold tracking-wide ${
                  isActive || isCompleted ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {stepDef.label}
              </span>
            </div>

            {/* 接続線 */}
            {i < STEPS.length - 1 && (
              <div className="mx-1 mt-6 flex items-center">
                <div
                  className={`h-[2px] w-14 transition-colors duration-300 sm:w-20 ${
                    num < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Main Wizard ───────────── */

export function OnboardingWizard({
  displayName,
  bio,
  slug,
  isBypassMode = false,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  /* Server Action states */
  const [displayNameState, displayNameAction, isDisplayNamePending] =
    useActionState<ActionResult | null, FormData>(updateDisplayName, null);

  const [bioState, bioAction, isBioPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateBio, null);

  const [slugState, slugAction, isSlugPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateSlug, null);

  const handleComplete = useCallback(async () => {
    if (isBypassMode) {
      setPreviewMessage(
        "プレビューモード: 保存は行われません（画面遷移のみ確認できます）",
      );
      return;
    }
    await completeOnboarding();
    router.push("/mypage");
  }, [isBypassMode, router]);

  /* ステップ遷移 */
  useEffect(() => {
    if (displayNameState?.success && step === 1) setStep(2);
  }, [displayNameState, step]);

  useEffect(() => {
    if (bioState?.success && step === 2) setStep(3);
  }, [bioState, step]);

  useEffect(() => {
    if (isBypassMode) return;
    if (slugState?.success && step === 3) handleComplete();
  }, [isBypassMode, slugState, step, handleComplete]);

  const header = STEP_HEADERS[step - 1];

  /* ── 共通スタイル ── */
  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100";
  const primaryBtn =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400";
  const ghostBtn =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:bg-gray-100";

  return (
    <div>
      {/* ステッパー */}
      <Stepper currentStep={step} />

      {/* カード */}
      <div
        className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(239,246,255,0.5) 0%, transparent 120px)",
        }}
      >
        {/* 上部アクセントライン */}
        <div className="h-[3px] bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500" />

        <div className="px-6 pt-8 pb-8 sm:px-10">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h2 className="text-[22px] font-bold tracking-tight text-gray-900">
              {header.title}
            </h2>
            <p className="mt-2 text-sm text-blue-500/80">{header.subtitle}</p>
          </div>

          {/* プレビューバナー */}
          {previewMessage && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
              {previewMessage}
            </div>
          )}

          {/* ─── Step 1 : 表示名 ─── */}
          {step === 1 && (
            <form
              action={isBypassMode ? undefined : displayNameAction}
              onSubmit={
                isBypassMode
                  ? (e) => {
                      e.preventDefault();
                      setPreviewMessage(null);
                      setStep(2);
                    }
                  : undefined
              }
            >
              <label
                htmlFor="display_name"
                className="mb-2 block text-sm font-semibold text-gray-700"
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
                disabled={isBypassMode ? false : isDisplayNamePending}
                placeholder="例: ケモノ太郎"
                className={inputClass}
              />
              <p className="mt-1.5 mb-6 text-xs text-gray-400">
                あとから変更できます
              </p>

              {!isBypassMode &&
                displayNameState &&
                !displayNameState.success && (
                  <p className="-mt-3 mb-5 text-sm text-red-500">
                    {displayNameState.error}
                  </p>
                )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isBypassMode ? false : isDisplayNamePending}
                  className={primaryBtn}
                >
                  {isDisplayNamePending && !isBypassMode ? "保存中..." : "次へ"}
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5-5 5M6 12h12"
                    />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* ─── Step 2 : 自己紹介 ─── */}
          {step === 2 && (
            <form
              action={isBypassMode ? undefined : bioAction}
              onSubmit={
                isBypassMode
                  ? (e) => {
                      e.preventDefault();
                      setPreviewMessage(null);
                      setStep(3);
                    }
                  : undefined
              }
            >
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                自己紹介
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={bio ?? ""}
                maxLength={160}
                rows={3}
                disabled={isBypassMode ? false : isBioPending}
                placeholder="例: イラストレーター / 猫好き / コミケ参加者"
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1.5 mb-6 text-xs text-gray-400">
                160文字以内・あとから変更できます
              </p>

              {!isBypassMode && bioState && !bioState.success && (
                <p className="-mt-3 mb-5 text-sm text-red-500">
                  {bioState.error}
                </p>
              )}

              {/* ナビゲーション */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isBypassMode ? false : isBioPending}
                  className={ghostBtn}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 17l-5-5 5-5M18 12H6"
                    />
                  </svg>
                  戻る
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isBypassMode ? false : isBioPending}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    スキップ
                  </button>
                  <button
                    type="submit"
                    disabled={isBypassMode ? false : isBioPending}
                    className={primaryBtn}
                  >
                    {isBioPending && !isBypassMode ? "保存中..." : "次へ"}
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5-5 5M6 12h12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─── Step 3 : カスタムURL ─── */}
          {step === 3 && (
            <form
              action={isBypassMode ? undefined : slugAction}
              onSubmit={
                isBypassMode
                  ? (e) => {
                      e.preventDefault();
                      void handleComplete();
                    }
                  : undefined
              }
            >
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                カスタムURL
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                defaultValue={slug ?? ""}
                maxLength={20}
                disabled={isBypassMode ? false : isSlugPending}
                placeholder="例: my_name"
                className={inputClass}
              />
              <p className="mt-1.5 mb-6 text-xs text-gray-400">
                英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
              </p>

              {!isBypassMode && slugState && !slugState.success && (
                <p className="-mt-3 mb-5 text-sm text-red-500">
                  {slugState.error}
                </p>
              )}

              {/* ナビゲーション */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isBypassMode ? false : isSlugPending}
                  className={ghostBtn}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 17l-5-5 5-5M18 12H6"
                    />
                  </svg>
                  戻る
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isBypassMode ? false : isSlugPending}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    スキップ
                  </button>
                  <button
                    type="submit"
                    disabled={isBypassMode ? false : isSlugPending}
                    className={primaryBtn}
                  >
                    {isSlugPending && !isBypassMode ? "保存中..." : "設定完了"}
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5-5 5M6 12h12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* スキップリンク */}
      <p className="mt-7 text-center text-[13px] text-gray-400">
        <button
          type="button"
          onClick={handleComplete}
          className="cursor-pointer text-gray-400 transition-colors hover:text-blue-500"
        >
          スキップして
          <span className="font-semibold text-blue-500 hover:text-blue-600">
            マイページへ
          </span>
        </button>
      </p>
    </div>
  );
}
