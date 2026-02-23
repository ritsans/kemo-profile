"use client";

/**
 * マイページ編集エリアの親コンテナ。
 * 状態管理（保存・差分・離脱保護）と、プレビュー/編集ペインのレイアウトを担当する。
 */
import { useActionState, useEffect, useMemo, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import type { ProfileUpdateResult } from "@/lib/types/action";
import { normalizeXUsername } from "@/lib/utils/x-username";
import { ProfileEditFields } from "./profile-edit-fields";
import { ProfilePreviewCard } from "./profile-preview-card";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  xUsername: string | null;
  slug: string | null;
  avatarUrl: string | null;
  previewPath: string;
}

export function ProfileEditForm({
  displayName,
  bio,
  xUsername,
  slug,
  avatarUrl,
  previewPath,
}: ProfileEditFormProps) {
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("preview");
  const [savedMessage, setSavedMessage] = useState(false);

  // フォーム内の現在値
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentXUsername, setCurrentXUsername] = useState(xUsername ?? "");
  const [currentSlug, setCurrentSlug] = useState(slug ?? "");

  // 差分検知用の基準値（最後に保存された値）
  const [originalDisplayName, setOriginalDisplayName] = useState(displayName);
  const [originalBio, setOriginalBio] = useState(bio ?? "");
  const [originalXUsername, setOriginalXUsername] = useState(xUsername ?? "");
  const [originalSlug, setOriginalSlug] = useState(slug ?? "");

  const [state, formAction, isPending] = useActionState<
    ProfileUpdateResult | null,
    FormData
  >(updateProfile, null);

  const normalizedPreviewXUsername = useMemo(() => {
    const input = currentXUsername.trim();
    if (input.length === 0) return null;
    const normalized = normalizeXUsername(input);
    return normalized.ok ? normalized.value : null;
  }, [currentXUsername]);

  // 保存成功時: 基準値更新＆保存完了メッセージ表示
  useEffect(() => {
    if (state?.success) {
      const nextDisplayName = currentDisplayName.trim();
      const nextBio = currentBio.trim();
      const nextSlug = currentSlug.trim();
      const nextXInput = currentXUsername.trim();
      const nextXNormalized =
        nextXInput.length === 0
          ? ""
          : (() => {
              const normalized = normalizeXUsername(nextXInput);
              return normalized.ok ? normalized.value : nextXInput;
            })();

      setCurrentDisplayName(nextDisplayName);
      setCurrentBio(nextBio);
      setCurrentSlug(nextSlug);
      setCurrentXUsername(nextXNormalized);

      setOriginalDisplayName(nextDisplayName);
      setOriginalBio(nextBio);
      setOriginalSlug(nextSlug);
      setOriginalXUsername(nextXNormalized);

      setSavedMessage(true);
      const timer = setTimeout(() => setSavedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, currentDisplayName, currentBio, currentSlug, currentXUsername]);

  // dirty チェック
  const isDirty =
    currentDisplayName !== originalDisplayName ||
    currentBio !== originalBio ||
    currentXUsername !== originalXUsername ||
    currentSlug !== originalSlug;

  // ブラウザ離脱保護（未保存の場合）
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // リセットボタン: 未保存変更がある場合は確認ダイアログ
  const handleReset = () => {
    if (
      isDirty &&
      !window.confirm("保存していない変更があります。破棄しますか？")
    ) {
      return;
    }
    setCurrentDisplayName(originalDisplayName);
    setCurrentBio(originalBio);
    setCurrentXUsername(originalXUsername);
    setCurrentSlug(originalSlug);
  };

  // フィールドエラーの取り出し（型ガード付き）
  const fieldErrors = state && !state.success ? state.fieldErrors : {};
  const previewDisplayName =
    currentDisplayName.trim() || "表示名を入力してください";
  const previewBio = currentBio.trim();

  return (
    <div className="space-y-4">
      <div className="mb-4 rounded-xl bg-gray-100 p-1 lg:hidden">
        <div className="grid grid-cols-2 gap-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMobilePane("preview")}
            className={`rounded-lg px-3 py-2 transition ${
              mobilePane === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600"
            }`}
          >
            プレビュー
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("edit")}
            className={`rounded-lg px-3 py-2 transition ${
              mobilePane === "edit"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600"
            }`}
          >
            編集
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className={mobilePane === "preview" ? "block" : "hidden lg:block"}
        >
          <ProfilePreviewCard
            avatarUrl={avatarUrl}
            previewDisplayName={previewDisplayName}
            previewBio={previewBio}
            normalizedPreviewXUsername={normalizedPreviewXUsername}
            previewPath={previewPath}
          />
        </section>

        <section
          className={mobilePane === "edit" ? "block" : "hidden lg:block"}
        >
          <ProfileEditFields
            savedMessage={savedMessage}
            isDirty={isDirty}
            isPending={isPending}
            formAction={formAction}
            originalDisplayName={originalDisplayName}
            originalBio={originalBio}
            originalXUsername={originalXUsername}
            originalSlug={originalSlug}
            currentDisplayName={currentDisplayName}
            setCurrentDisplayName={setCurrentDisplayName}
            currentBio={currentBio}
            setCurrentBio={setCurrentBio}
            currentXUsername={currentXUsername}
            setCurrentXUsername={setCurrentXUsername}
            currentSlug={currentSlug}
            setCurrentSlug={setCurrentSlug}
            fieldErrors={fieldErrors}
            handleReset={handleReset}
          />
        </section>
      </div>
    </div>
  );
}
