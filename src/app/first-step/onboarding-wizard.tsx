"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
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

/* ───────────── Step Config ───────────── */

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
  {
    title: "設定完了！",
    subtitle: "プロフィールの準備ができました",
  },
] as const;

/* ───────────── Main Wizard ───────────── */

export function OnboardingWizard({
  displayName,
  bio,
  slug,
  isBypassMode = false,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

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

  const triggerConfetti = useCallback(() => {
    try {
      const duration = 1200; // 1.2秒
      const animationEnd = Date.now() + duration;

      const runAnimation = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
          disableForReducedMotion: true,
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(runAnimation);
        }
      };

      runAnimation();
    } catch (error) {
      // canvas-confetti が失敗しても遷移は継続
      console.error("Confetti animation failed:", error);
    }
  }, []);

  /* Step 4 から マイページへ（即座に遷移） */
  const handleGoToMyPage = useCallback(async () => {
    if (isBypassMode) {
      router.push("/mypage");
      return;
    }

    setIsCompletingOnboarding(true);

    try {
      await completeOnboarding();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }

    router.push("/mypage");
  }, [isBypassMode, router]);

  /* ステップ遷移ヘルパー */
  const goToStep = useCallback(
    (nextStep: number) => {
      if (nextStep > step) {
        setDirection(1);
      } else if (nextStep < step) {
        setDirection(-1);
      }
      setStep(nextStep);
    },
    [step],
  );

  /* ステップ遷移 */
  useEffect(() => {
    if (displayNameState?.success && step === 1) goToStep(2);
  }, [displayNameState, step, goToStep]);

  useEffect(() => {
    if (bioState?.success && step === 2) goToStep(3);
  }, [bioState, step, goToStep]);

  useEffect(() => {
    if (isBypassMode) return;
    if (slugState?.success && step === 3) {
      goToStep(4);
    }
  }, [isBypassMode, slugState, step, goToStep]);

  /* Step 4 で紙吹雪を自動開始 */
  useEffect(() => {
    if (step === 4 && !isCompletingOnboarding) {
      triggerConfetti();
    }
  }, [step, isCompletingOnboarding, triggerConfetti]);

  const header = STEP_HEADERS[step - 1];

  /* ── アニメーションバリアント ── */
  const variants = {
    enter: (dir: 1 | -1) => ({
      x: dir * 300,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: 1 | -1) => ({
      x: dir * -300,
      opacity: 0,
      scale: 0.98,
    }),
  };

  /* ── 共通スタイル ── */
  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100";
  const primaryBtn =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400";
  const ghostBtn =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 disabled:bg-gray-100";

  return (
    <div>
      {/* ステッパーは廃止しました */}

      {/* カード（アニメーション対応） */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 40,
              mass: 0.8,
            }}
            className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="px-6 pt-8 pb-8 sm:px-10">
              {/* ヘッダー */}
              <div className="mb-8 text-center">
                <h2 className="text-[22px] font-bold tracking-tight text-gray-900">
                  {header.title}
                </h2>
                <p className="mt-2 text-sm text-blue-500/80">
                  {header.subtitle}
                </p>
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
                          goToStep(2);
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
                      {isDisplayNamePending && !isBypassMode
                        ? "保存中..."
                        : "次へ"}
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
                          goToStep(3);
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
                      onClick={() => goToStep(1)}
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
                        onClick={() => goToStep(3)}
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
                          setPreviewMessage(null);
                          goToStep(4);
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
                      onClick={() => goToStep(2)}
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
                        onClick={() => goToStep(4)}
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
                        {isSlugPending && !isBypassMode ? "保存中..." : "完了"}
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

              {/* ─── Step 4 : 完了画面 ─── */}
              {step === 4 && (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                      <svg
                        aria-hidden="true"
                        className="h-10 w-10 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="mb-8 text-gray-600">
                    プロフィールの設定が完了しました
                    <br />
                    マイページで確認できます
                  </p>

                  <button
                    type="button"
                    onClick={handleGoToMyPage}
                    disabled={isCompletingOnboarding}
                    className={primaryBtn}
                  >
                    マイページへ
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
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* スキップリンク（Step 4 では非表示） */}
      {step < 4 && (
        <p className="mt-7 text-center text-[13px] text-gray-400">
          <button
            type="button"
            onClick={() => {
              setPreviewMessage(null);
              goToStep(4);
            }}
            disabled={isCompletingOnboarding}
            className="cursor-pointer text-gray-400 transition-colors hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-blue-500 hover:text-blue-600">
              すべてスキップする
            </span>
          </button>
        </p>
      )}
    </div>
  );
}
