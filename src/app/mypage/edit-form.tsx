"use client";

/**
 * マイページ編集エリアの親コンテナ。
 * 状態管理（保存・差分・離脱保護）と、プレビュー/編集ペインのレイアウトを担当する。
 */
import { useActionState, useEffect, useMemo, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import type { ProfileUpdateResult } from "@/lib/types/action";
import { ProfileEditFields } from "./profile-edit-fields";
import { ProfilePreviewCard } from "./profile-preview-card";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  socialLinks: Record<string, string>;
  slug: string | null;
  avatarUrl: string | null;
  previewPath: string;
  lockedSocialKeys: string[];
}

function initSocialLinksState(socialLinks: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const p of SOCIAL_PLATFORMS) {
    result[p.key] = socialLinks[p.key] ?? "";
  }
  return result;
}

export function ProfileEditForm({
  displayName,
  bio,
  socialLinks,
  slug,
  avatarUrl,
  previewPath,
  lockedSocialKeys,
}: ProfileEditFormProps) {
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("preview");
  const [savedMessage, setSavedMessage] = useState(false);

  // フォーム内の現在値
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentSocialLinks, setCurrentSocialLinks] = useState(() =>
    initSocialLinksState(socialLinks),
  );
  const [currentSlug, setCurrentSlug] = useState(slug ?? "");

  // 差分検知用の基準値（最後に保存された値）
  const [originalDisplayName, setOriginalDisplayName] = useState(displayName);
  const [originalBio, setOriginalBio] = useState(bio ?? "");
  const [originalSocialLinks, setOriginalSocialLinks] = useState(() =>
    initSocialLinksState(socialLinks),
  );
  const [originalSlug, setOriginalSlug] = useState(slug ?? "");

  const [state, formAction, isPending] = useActionState<
    ProfileUpdateResult | null,
    FormData
  >(updateProfile, null);

  // プレビュー用: 正規化済み social_links（バリデーション失敗はスキップ）
  const previewSocialLinks = useMemo(() => {
    const result: Record<string, string> = {};
    for (const platform of SOCIAL_PLATFORMS) {
      const input = currentSocialLinks[platform.key]?.trim() ?? "";
      if (!input) continue;
      if (platform.normalize) {
        const normalized = platform.normalize(input);
        if (normalized.ok) result[platform.key] = normalized.value;
      } else {
        result[platform.key] = input;
      }
    }
    return result;
  }, [currentSocialLinks]);

  function setSocialLinkValue(key: string, value: string) {
    setCurrentSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  // 保存成功時: 基準値更新＆保存完了メッセージ表示
  useEffect(() => {
    if (state?.success) {
      const nextDisplayName = currentDisplayName.trim();
      const nextBio = currentBio.trim();
      const nextSlug = currentSlug.trim();

      // social_links: 正規化して保存
      const nextSocialLinks: Record<string, string> = {};
      for (const platform of SOCIAL_PLATFORMS) {
        const input = currentSocialLinks[platform.key]?.trim() ?? "";
        if (!input) continue;
        if (platform.normalize) {
          const r = platform.normalize(input);
          nextSocialLinks[platform.key] = r.ok ? r.value : input;
        } else {
          nextSocialLinks[platform.key] = input;
        }
      }

      setCurrentDisplayName(nextDisplayName);
      setCurrentBio(nextBio);
      setCurrentSocialLinks(nextSocialLinks);
      setCurrentSlug(nextSlug);

      setOriginalDisplayName(nextDisplayName);
      setOriginalBio(nextBio);
      setOriginalSocialLinks(nextSocialLinks);
      setOriginalSlug(nextSlug);

      setSavedMessage(true);
      const timer = setTimeout(() => setSavedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, currentDisplayName, currentBio, currentSocialLinks, currentSlug]);

  // dirty チェック
  const isDirty =
    currentDisplayName !== originalDisplayName ||
    currentBio !== originalBio ||
    currentSlug !== originalSlug ||
    SOCIAL_PLATFORMS.some(
      (p) =>
        (currentSocialLinks[p.key] ?? "") !==
        (originalSocialLinks[p.key] ?? ""),
    );

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
    setCurrentSocialLinks(originalSocialLinks);
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
            previewSocialLinks={previewSocialLinks}
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
            originalSocialLinks={originalSocialLinks}
            originalSlug={originalSlug}
            currentDisplayName={currentDisplayName}
            setCurrentDisplayName={setCurrentDisplayName}
            currentBio={currentBio}
            setCurrentBio={setCurrentBio}
            currentSocialLinks={currentSocialLinks}
            setSocialLinkValue={setSocialLinkValue}
            currentSlug={currentSlug}
            setCurrentSlug={setCurrentSlug}
            fieldErrors={fieldErrors}
            handleReset={handleReset}
            lockedSocialKeys={lockedSocialKeys}
          />
        </section>
      </div>
    </div>
  );
}
