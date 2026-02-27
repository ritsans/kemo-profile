"use client";

/**
 * SNSリンク追加/編集モーダル。
 * add モード: Step1（SNS選択）→ Step2（入力）の2ステップ。
 * edit モード: Step2（入力）のみ。
 */
import { useRef, useState, useTransition } from "react";
import { addSocialLink, updateSocialLink } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // 入力値を正規化して返す。正規化関数がなければ trim のみ
  function normalizeInput(): { ok: true; value: string } | null {
    if (!platform || !inputValue.trim()) return null;
    if (platform.normalize) {
      const result = platform.normalize(inputValue);
      return result.ok ? result : null;
    }
    return { ok: true, value: inputValue.trim() };
  }

  // URLプレビュー: 正規化済みの値からリンクURLを生成
  const normalized = normalizeInput();
  const urlPreview =
    normalized && platform?.profileUrl
      ? platform.profileUrl(normalized.value)
      : null;

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

      // 正規化済みの値をコールバックに渡す
      const saved = normalizeInput();
      onSaved(selectedKey, saved?.value ?? inputValue.trim());
      onClose();
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-sm" showCloseButton={false}>
        {/* Step 1: SNS選択 */}
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>SNSを選択</DialogTitle>
            </DialogHeader>
            {availablePlatforms.length === 0 ? (
              <p className="text-sm text-gray-500">追加できるSNSがありません</p>
            ) : (
              <ul className="space-y-2">
                {availablePlatforms.map((p) => (
                  <li key={p.key}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSelectPlatform(p.key)}
                      className="w-full justify-start"
                    >
                      {p.label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                キャンセル
              </Button>
            </div>
          </>
        )}

        {/* Step 2: 入力 */}
        {step === "input" && platform && (
          <>
            <DialogHeader>
              <DialogTitle>{platform.label}</DialogTitle>
            </DialogHeader>

            <div>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    disabled={isPending}
                  >
                    戻る
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isPending}
                >
                  キャンセル
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || !inputValue.trim()}
              >
                {isPending
                  ? "保存中..."
                  : mode === "add"
                    ? "保存して追加"
                    : "保存"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
