"use client";

/**
 * SNSリンク追加/編集モーダル。
 * add モード: Step1（SNS選択）→ Step2（入力）の2ステップ。
 * edit モード: Step2（入力）のみ。
 */
import { useRef, useState, useTransition } from "react";
import { addSocialLink, updateSocialLink } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { getPlatform, SOCIAL_PLATFORMS } from "@/lib/social-platforms";

interface AddSocialLinkModalProps {
  /** 既に登録済みのプラットフォームキー一覧 */
  existingKeys: string[];
  mode: "add" | "edit";
  /** edit モード時は必須 */
  initialPlatformKey?: string;
  /** edit モード時の現在値 */
  initialValue?: string;
  onClose: () => void;
  /** 保存成功後に呼ばれる（キーと正規化済み値を渡す） */
  onSaved: (key: string, value: string) => void;
}

export function AddSocialLinkModal({
  existingKeys,
  mode,
  initialPlatformKey,
  initialValue = "",
  onClose,
  onSaved,
}: AddSocialLinkModalProps) {
  // add モード: "select" | "input"、edit モード: 常に "input"
  const [step, setStep] = useState<"select" | "input">(
    mode === "edit" ? "input" : "select",
  );
  const [selectedKey, setSelectedKey] = useState<string>(
    initialPlatformKey ?? "",
  );
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // 未追加のプラットフォーム一覧（add モード Step1 用）
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !existingKeys.includes(p.key),
  );

  const platform = getPlatform(selectedKey);

  // URLプレビュー: 入力値を正規化してリンクURLを生成
  const urlPreview = (() => {
    if (!platform?.profileUrl || !inputValue.trim()) return null;
    if (platform.normalize) {
      const result = platform.normalize(inputValue);
      if (!result.ok) return null;
      return platform.profileUrl(result.value);
    }
    return platform.profileUrl(inputValue.trim());
  })();

  function handleSelectPlatform(key: string) {
    setSelectedKey(key);
    setInputValue("");
    setError(null);
    setStep("input");
    // ステップ遷移後に input へフォーカス
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleBack() {
    setStep("select");
    setInputValue("");
    setError(null);
  }

  function handleSubmit() {
    if (!platform) return;
    setError(null);

    startTransition(async () => {
      const action = mode === "add" ? addSocialLink : updateSocialLink;
      const result = await action(selectedKey, inputValue);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // 正規化済みの値を取得してコールバック
      let savedValue = inputValue.trim();
      if (platform.normalize) {
        const r = platform.normalize(inputValue);
        if (r.ok) savedValue = r.value;
      }
      onSaved(selectedKey, savedValue);
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* バックドロップ（クリックで閉じる） */}
      <button
        type="button"
        aria-label="モーダルを閉じる"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        {/* Step 1: SNS選択 */}
        {step === "select" && (
          <>
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              SNSを選択
            </h2>
            {availablePlatforms.length === 0 ? (
              <p className="text-sm text-gray-500">追加できるSNSがありません</p>
            ) : (
              <ul className="space-y-2">
                {availablePlatforms.map((p) => (
                  <li key={p.key}>
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform(p.key)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          </>
        )}

        {/* Step 2: 入力 */}
        {step === "input" && platform && (
          <>
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              {platform.label}
            </h2>

            <div className="mb-4">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                placeholder={platform.placeholder}
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
              {/* URLプレビュー */}
              {urlPreview && (
                <p className="mt-1 truncate text-xs text-gray-400">
                  → {urlPreview}
                </p>
              )}
              {/* エラー表示 */}
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {mode === "add" && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isPending}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    戻る
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !inputValue.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isPending
                  ? "保存中..."
                  : mode === "add"
                    ? "保存して追加"
                    : "保存"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
