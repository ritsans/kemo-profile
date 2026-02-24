"use client";

/**
 * マイページ編集エリアの親コンテナ。
 * 状態管理（保存・差分・離脱保護）と、プレビュー/編集ペインのレイアウトを担当する。
 */
import { useActionState, useEffect, useState, useTransition } from "react";
import { removeSocialLink, updateProfile } from "@/app/actions/profile";
import type { ProfileUpdateResult } from "@/lib/types/action";
import { AddSocialLinkModal } from "./add-social-link-modal";
import { ProfileEditFields } from "./profile-edit-fields";
import { ProfilePreviewCard } from "./profile-preview-card";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  socialLinks: Record<string, string>;
  avatarUrl: string | null;
  previewPath: string;
  lockedSocialKeys: string[];
}

export function ProfileEditForm({
  displayName,
  bio,
  socialLinks,
  avatarUrl,
  previewPath,
  lockedSocialKeys,
}: ProfileEditFormProps) {
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("preview");
  const [savedMessage, setSavedMessage] = useState(false);

  // フォーム内の現在値
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentSocialLinks, setCurrentSocialLinks] =
    useState<Record<string, string>>(socialLinks);

  // 差分検知用の基準値（最後に保存された値）
  const [originalDisplayName, setOriginalDisplayName] = useState(displayName);
  const [originalBio, setOriginalBio] = useState(bio ?? "");

  // モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalKey, setEditModalKey] = useState<string | null>(null);

  // 削除処理中のキー
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<
    ProfileUpdateResult | null,
    FormData
  >(updateProfile, null);

  // 保存成功時: 基準値更新＆保存完了メッセージ表示
  useEffect(() => {
    if (state?.success) {
      const nextDisplayName = currentDisplayName.trim();
      const nextBio = currentBio.trim();

      setCurrentDisplayName(nextDisplayName);
      setCurrentBio(nextBio);

      setOriginalDisplayName(nextDisplayName);
      setOriginalBio(nextBio);

      setSavedMessage(true);
      const timer = setTimeout(() => setSavedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, currentDisplayName, currentBio]);

  // dirty チェック（social_links, slug は Server Action で個別保存のため除外）
  const isDirty =
    currentDisplayName !== originalDisplayName || currentBio !== originalBio;

  // ブラウザ離脱保護（未保存の場合）
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // SNSリンク追加成功後: ローカル状態を更新
  function handleSocialLinkSaved(key: string, value: string) {
    setCurrentSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  // SNSリンク削除
  function handleRemoveSocialLink(key: string) {
    if (!window.confirm("このSNSリンクを削除しますか？")) return;
    setRemovingKey(key);
    startRemoveTransition(async () => {
      const result = await removeSocialLink(key);
      setRemovingKey(null);
      if (!result.success) {
        window.alert(result.error);
        return;
      }
      setCurrentSocialLinks((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    });
  }

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
            previewSocialLinks={currentSocialLinks}
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
            currentDisplayName={currentDisplayName}
            setCurrentDisplayName={setCurrentDisplayName}
            currentBio={currentBio}
            setCurrentBio={setCurrentBio}
            currentSocialLinks={currentSocialLinks}
            lockedSocialKeys={lockedSocialKeys}
            onRemoveSocialLink={handleRemoveSocialLink}
            onAddSocialLinkClick={() => setIsAddModalOpen(true)}
            onEditSocialLinkClick={(key) => setEditModalKey(key)}
            fieldErrors={fieldErrors}
            removingKey={removingKey}
          />
        </section>
      </div>

      {/* 追加モーダル */}
      {isAddModalOpen && (
        <AddSocialLinkModal
          existingKeys={Object.keys(currentSocialLinks)}
          mode="add"
          onClose={() => setIsAddModalOpen(false)}
          onSaved={handleSocialLinkSaved}
        />
      )}

      {/* 編集モーダル */}
      {editModalKey && (
        <AddSocialLinkModal
          existingKeys={Object.keys(currentSocialLinks)}
          mode="edit"
          initialPlatformKey={editModalKey}
          initialValue={currentSocialLinks[editModalKey] ?? ""}
          onClose={() => setEditModalKey(null)}
          onSaved={(key, value) => {
            handleSocialLinkSaved(key, value);
            setEditModalKey(null);
          }}
        />
      )}
    </div>
  );
}
